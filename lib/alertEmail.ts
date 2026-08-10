type EmailMessage = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type EmailDeliveryResult =
  | { sent: true; id?: string }
  | { sent: false; reason: 'not_configured' | 'provider_error' };

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL;
  return apiKey && from ? { apiKey, from } : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character] ?? character);
}

export function confirmationEmail(input: {
  email: string;
  confirmUrl: string;
  frequencyLabel: string;
}) {
  const safeUrl = escapeHtml(input.confirmUrl);
  return {
    to: input.email,
    subject: 'Confirma tus alertas del dólar en Bolivia',
    text: `Confirma tu suscripción (${input.frequencyLabel}): ${input.confirmUrl}\n\nSi no hiciste esta solicitud, ignora este correo.`,
    html: `<h1>Confirma tus alertas</h1><p>Elegiste: <strong>${escapeHtml(input.frequencyLabel)}</strong>.</p><p><a href="${safeUrl}">Confirmar suscripción</a></p><p>Si no hiciste esta solicitud, ignora este correo.</p>`,
    idempotencyKey: `confirm-${input.confirmUrl.split('token=').at(-1)?.slice(0, 32) ?? 'alert'}`
  };
}

export function dailyAlertEmail(input: {
  email: string;
  buy: string;
  sell: string;
  variation: string;
  gap: string;
  updatedAt: string;
  shareUrl: string;
  unsubscribeUrl: string;
}) {
  const safeShareUrl = escapeHtml(input.shareUrl);
  const safeUnsubscribeUrl = escapeHtml(input.unsubscribeUrl);
  const summary = `Compra ${input.buy} · Venta ${input.sell} · Variación ${input.variation} · Brecha ${input.gap}`;
  return {
    to: input.email,
    subject: `Dólar paralelo hoy: venta ${input.sell}`,
    text: `${summary}\nActualizado ${input.updatedAt}.\n\nVer y compartir: ${input.shareUrl}\nDarme de baja: ${input.unsubscribeUrl}`,
    html: `<h1>Dólar paralelo en Bolivia hoy</h1><p><strong>Compra:</strong> ${escapeHtml(input.buy)}<br><strong>Venta:</strong> ${escapeHtml(input.sell)}</p><p><strong>Variación:</strong> ${escapeHtml(input.variation)}<br><strong>Brecha:</strong> ${escapeHtml(input.gap)}</p><p>Actualizado ${escapeHtml(input.updatedAt)}.</p><p><a href="${safeShareUrl}">Ver y compartir la cotización</a></p><hr><p><a href="${safeUnsubscribeUrl}">Darme de baja</a></p>`,
    idempotencyKey: `daily-${input.email}-${input.updatedAt}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 250)
  };
}

export async function sendAlertEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
  const config = emailConfig();
  if (!config) return { sent: false, reason: 'not_configured' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': message.idempotencyKey
      },
      body: JSON.stringify({
        from: message.from ?? config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      })
    });

    if (!response.ok) {
      console.error('[alerts/email] provider rejected email', { status: response.status });
      return { sent: false, reason: 'provider_error' };
    }

    const data = (await response.json()) as { id?: string };
    return { sent: true, id: data.id };
  } catch (error) {
    console.error('[alerts/email] provider unavailable', String(error));
    return { sent: false, reason: 'provider_error' };
  }
}

export async function sendAlertEmailBatch(messages: EmailMessage[]): Promise<EmailDeliveryResult> {
  if (messages.length === 0) return { sent: true };
  const config = emailConfig();
  if (!config) return { sent: false, reason: 'not_configured' };

  try {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `alerts-${messages[0].idempotencyKey}`.slice(0, 256)
      },
      body: JSON.stringify(messages.slice(0, 100).map((message) => ({
        from: message.from ?? config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      })))
    });

    if (!response.ok) {
      console.error('[alerts/email] provider rejected batch', { status: response.status });
      return { sent: false, reason: 'provider_error' };
    }
    return { sent: true };
  } catch (error) {
    console.error('[alerts/email] batch provider unavailable', String(error));
    return { sent: false, reason: 'provider_error' };
  }
}
