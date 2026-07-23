'use client';

import { useMemo, useState } from 'react';

type P2PCalculatorProps = {
  buy: number | null;
  sell: number | null;
  assetLabel?: string;
};

const amountFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function P2PCalculator({
  buy,
  sell,
  assetLabel = 'USD / USDT'
}: P2PCalculatorProps) {
  const [amount, setAmount] = useState('100');
  const [operation, setOperation] = useState<'buy' | 'sell'>('buy');

  const numericAmount = Number(amount.replace(',', '.'));
  const rate = operation === 'buy' ? sell ?? 0 : buy ?? 0;
  const result = useMemo(
    () => Number.isFinite(numericAmount) && numericAmount > 0 && rate > 0 ? numericAmount * rate : null,
    [numericAmount, rate]
  );

  if (buy === null || sell === null) {
    return (
      <div className="card p-5 text-sm text-ink/70">
        La calculadora estará disponible cuando vuelva la cotización P2P.
      </div>
    );
  }

  const operationLabel = operation === 'buy' ? `Comprar ${assetLabel}` : `Vender ${assetLabel}`;

  return (
    <section className="card p-6 grid gap-5" aria-labelledby="calculadora-p2p">
      <div className="grid gap-1">
        <p className="kicker">Herramienta rápida</p>
        <h2 id="calculadora-p2p" className="font-serif text-2xl">Calculadora {assetLabel} a bolivianos</h2>
        <p className="text-sm text-ink/65">
          Estimación referencial con la cotización P2P actual. La tasa final puede variar por monto,
          método de pago y comisión.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Tipo de operación">
        <button
          type="button"
          onClick={() => setOperation('buy')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            operation === 'buy' ? 'bg-ink text-white' : 'bg-black/5 text-ink'
          }`}
        >
          Quiero comprar
        </button>
        <button
          type="button"
          onClick={() => setOperation('sell')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            operation === 'sell' ? 'bg-ink text-white' : 'bg-black/5 text-ink'
          }`}
        >
          Quiero vender
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Monto en {assetLabel}
          <input
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:border-ink"
          />
        </label>
        <div className="rounded-xl bg-sand/50 px-5 py-3 sm:min-w-64">
          <p className="text-xs uppercase tracking-wide text-ink/50">{operationLabel}</p>
          <p className="mt-1 text-2xl font-semibold">
            {result === null ? '—' : `Bs ${amountFormatter.format(result)}`}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Tasa usada: Bs {amountFormatter.format(rate)} por unidad
          </p>
        </div>
      </div>
    </section>
  );
}
