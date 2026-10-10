import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendAlertEmail, sendAlertEmailBatch, tcoAlertEmail } from '../lib/alertEmail';

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
  it('builds an attributable TCO alert with unsubscribe support', () => {
    const alert = tcoAlertEmail({
      email: 'persona@example.com',
      cutoffDate: '2 de octubre de 2026',
      tco: 'Bs 12,00',
      change: '+Bs 0,10',
      totalUsd: 'USD 30,2 M',
      leadingBank: 'Mercantil Santa Cruz',
      leadingShare: '19,8%',
      explanation: 'El movimiento fue conjunto.',
      detailUrl: 'https://dolarparalelohoy.com/#bancos-tco-title',
      sourceUrl: 'https://www.bcb.gob.bo/',
      unsubscribeUrl: 'https://dolarparalelohoy.com/api/alerts/unsubscribe?token=test'
    });

    expect(alert.subject).toContain('+Bs 0,10');
    expect(alert.html).toContain('Banco Central de Bolivia');
    expect(alert.text).toContain('Darme de baja');
  });

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
