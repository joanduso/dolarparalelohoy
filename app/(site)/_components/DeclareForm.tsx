'use client';

import { useState } from 'react';

type DeclareFormProps = {
  triggerLabel?: string;
  defaultKind?: 'PARALELO' | 'OFICIAL';
};

const MIN_VALUE = 3;
const MAX_VALUE = 30;

export function DeclareForm({ triggerLabel = 'Reportar precio', defaultKind = 'PARALELO' }: DeclareFormProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const value = Number(form.get('value'));

    if (!Number.isFinite(value) || value <= 0) {
      setLoading(false);
      setError('Ingresa un valor válido.');
      return;
    }

    if (value < MIN_VALUE || value > MAX_VALUE) {
      setLoading(false);
      setError(`El valor debe estar entre ${MIN_VALUE} y ${MAX_VALUE} Bs.`);
      return;
    }

    const payload = {
      kind: form.get('kind'),
      side: form.get('side'),
      value,
      city: form.get('city'),
      source_type: form.get('source_type')
    };

    const res = await fetch('/api/declared-rates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      setStatus('Reporte recibido. Gracias por aportar.');
      event.currentTarget.reset();
    } else if (res.ok) {
      setStatus('Reporte recibido. Quedó en revisión.');
    } else if (data?.error === 'rate_limited') {
      setError('Ya enviaste un reporte recientemente. Intenta más tarde.');
    } else {
      setError('No se pudo enviar el reporte. Intenta más tarde.');
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-ink text-white px-4 py-2 text-sm"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl">Reportar precio</h3>
                <p className="text-sm text-ink/60">
                  Se valida contra la tasa base y se filtran valores atípicos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-ink/70">
                  Mercado
                  <select
                    name="kind"
                    defaultValue={defaultKind}
                    className="mt-1 w-full rounded-lg border border-black/10 p-2"
                  >
                    <option value="PARALELO">Paralelo</option>
                    <option value="OFICIAL">Oficial</option>
                  </select>
                </label>
                <label className="text-sm text-ink/70">
                  Operación
                  <select name="side" className="mt-1 w-full rounded-lg border border-black/10 p-2">
                    <option value="SELL">Compré USD (venta)</option>
                    <option value="BUY">Vendí USD (compra)</option>
                  </select>
                </label>
                <label className="text-sm text-ink/70">
                  Precio en Bs
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-lg border border-black/10 p-2"
                  />
                </label>
                <label className="text-sm text-ink/70">
                  Ciudad (opcional)
                  <input name="city" className="mt-1 w-full rounded-lg border border-black/10 p-2" />
                </label>
                <label className="text-sm text-ink/70">
                  Fuente
                  <select name="source_type" className="mt-1 w-full rounded-lg border border-black/10 p-2">
                    <option value="P2P">P2P</option>
                    <option value="CasaCambio">Casa de cambio</option>
                    <option value="Calle">Calle</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-ink text-white px-4 py-2 text-sm"
                >
                  {loading ? 'Enviando...' : 'Enviar reporte'}
                </button>
                <span className="text-xs text-ink/60">
                  Rango esperado: {MIN_VALUE} a {MAX_VALUE} Bs.
                </span>
              </div>

              {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
