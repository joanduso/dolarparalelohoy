import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendAlertEmail, sendAlertEmailBatch } from '../lib/alertEmail';

const message = {
  to: 'persona@example.com',
  subject: 'Alerta de prueba',
  html: '<p>Contenido</p>',
  text: 'Contenido',
  idempotencyKey: 'alerta-prueba'
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('alert email providers', () => {
  it('uses Brevo first and maps sender and content to its API', async () => {
    vi.stubEnv('BREVO_API_KEY', 'brevo-key');
    vi.stubEnv('RESEND_API_KEY', 'resend-key');
    vi.stubEnv('ALERTS_FROM_EMAIL', 'Dólar Paralelo Hoy <alertas@dolarparalelohoy.com>');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ messageId: 'brevo-id' }), { status: 201 })
    );

    await expect(sendAlertEmail(message)).resolves.toEqual({ sent: true, id: 'brevo-id' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request?.headers).toMatchObject({ 'api-key': 'brevo-key' });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      sender: { name: 'Dólar Paralelo Hoy', email: 'alertas@dolarparalelohoy.com' },
      to: [{ email: 'persona@example.com' }],
      htmlContent: '<p>Contenido</p>',
      textContent: 'Contenido'
    });
  });

  it('sends personalized Brevo batches with one API request', async () => {
    vi.stubEnv('BREVO_API_KEY', 'brevo-key');
    vi.stubEnv('ALERTS_FROM_EMAIL', 'alertas@dolarparalelohoy.com');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ messageIds: ['one', 'two'] }), { status: 201 })
    );

    await expect(sendAlertEmailBatch([
      message,
      { ...message, to: 'otra@example.com', html: '<p>Otro</p>', idempotencyKey: 'otra' }
    ])).resolves.toEqual({ sent: true });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    const body = JSON.parse(String(request?.body));
    expect(body.messageVersions).toHaveLength(2);
    expect(body.messageVersions[1]).toMatchObject({
      to: [{ email: 'otra@example.com' }],
      htmlContent: '<p>Otro</p>'
    });
  });

  it('keeps Resend as fallback while Brevo is not configured', async () => {
    vi.stubEnv('BREVO_API_KEY', '');
    vi.stubEnv('RESEND_API_KEY', 'resend-key');
    vi.stubEnv('ALERTS_FROM_EMAIL', 'alertas@dolarparalelohoy.com');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend-id' }), { status: 200 })
    );

    await expect(sendAlertEmail(message)).resolves.toEqual({ sent: true, id: 'resend-id' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
  });
});
