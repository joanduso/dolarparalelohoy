'use client';

import { useState } from 'react';

export function DeclareForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      side: form.get('side'),
      value: form.get('value'),
      city: form.get('city'),
      source_type: form.get('source_type'),
      website: form.get('website')
    };

    const res = await fetch('/api/declare', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.ok) {
      setStatus('Reporte recibido. Gracias por aportar.');
      event.currentTarget.reset();
    } else {
      setStatus('No se pudo aceptar el reporte. Intenta mas tarde.');
    }

    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl">Comparte tu precio</h3>
        <span className="text-xs text-ink/60">Validado vs base</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink/70">
          Tipo
          <select name="side" className="mt-1 w-full rounded-lg border border-black/10 p-2">
            <option value="SELL">Compre USD (venta)</option>
            <option value="BUY">Vendi USD (compra)</option>
          </select>
        </label>
        <label className="text-sm text-ink/70">
          Precio en BOB
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
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-ink text-white px-4 py-2 text-sm self-start"
      >
        {loading ? 'Enviando...' : 'Enviar reporte'}
      </button>
      {status && <p className="text-sm text-ink/60">{status}</p>}
    </form>
  );
}
