'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type FormStatus = 'idle' | 'submitting' | 'sent' | 'queued' | 'error';

export function AlertSubscriptionForm() {
  const [frequency, setFrequency] = useState<'DAILY' | 'THRESHOLD'>('DAILY');
  const [status, setStatus] = useState<FormStatus>('idle');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          frequency,
          thresholdPct: form.get('threshold_pct'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
          source: 'share_page'
        })
      });
      const data = (await response.json()) as { ok?: boolean; delivery?: string };
      if (!response.ok || !data.ok) throw new Error('subscription_failed');

      setStatus(data.delivery === 'sent' ? 'sent' : 'queued');
      const analyticsWindow = window as typeof window & {
        gtag?: (...args: unknown[]) => void;
      };
      analyticsWindow.gtag?.('event', 'sign_up', {
        method: 'email',
        content_type: 'rate_alert',
        alert_frequency: frequency.toLowerCase()
      });
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="alert-email" className="text-sm font-semibold">
          Tu correo
        </label>
        <input
          id="alert-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="tu@correo.com"
          className="min-h-12 rounded-xl border border-ink/20 bg-white px-4 py-3 outline-none focus:border-ink focus:ring-2 focus:ring-ink/15"
        />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">¿Cuándo quieres recibirla?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-xl border border-ink/15 bg-white p-4">
            <input
              type="radio"
              name="frequency"
              value="DAILY"
              checked={frequency === 'DAILY'}
              onChange={() => setFrequency('DAILY')}
            />
            <span>
              <strong className="block">Resumen diario</strong>
              <span className="text-sm text-ink/60">Una cotización por día.</span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-ink/15 bg-white p-4">
            <input
              type="radio"
              name="frequency"
              value="THRESHOLD"
              checked={frequency === 'THRESHOLD'}
              onChange={() => setFrequency('THRESHOLD')}
            />
            <span>
              <strong className="block">Solo cambios importantes</strong>
              <span className="text-sm text-ink/60">Cuando supere tu umbral diario.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {frequency === 'THRESHOLD' ? (
        <label className="grid gap-2 text-sm font-semibold" htmlFor="threshold-pct">
          Avisarme cuando cambie al menos
          <select
            id="threshold-pct"
            name="threshold_pct"
            defaultValue="3"
            className="min-h-12 rounded-xl border border-ink/20 bg-white px-4 py-3 font-normal"
          >
            {[1, 2, 3, 5, 10].map((value) => (
              <option key={value} value={value}>{value}% en un día</option>
            ))}
          </select>
        </label>
      ) : null}

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label className="flex gap-3 text-sm text-ink/70">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          Acepto recibir la cotización seleccionada. Puedo darme de baja desde cualquier correo.
          Consulta la{' '}
          <Link href="/privacidad" className="underline underline-offset-4">
            política de privacidad
          </Link>.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="min-h-12 justify-self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === 'submitting' ? 'Guardando…' : 'Quiero recibir la cotización'}
      </button>

      <div aria-live="polite" className="text-sm">
        {status === 'sent' ? (
          <p className="text-moss">Revisa tu correo y confirma la suscripción.</p>
        ) : null}
        {status === 'queued' ? (
          <p className="text-ink/70">
            Guardamos tu solicitud. Te enviaremos la confirmación cuando el servicio de correo quede activo.
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="text-red-700">No pudimos guardar la suscripción. Intenta nuevamente.</p>
        ) : null}
      </div>
    </form>
  );
}
