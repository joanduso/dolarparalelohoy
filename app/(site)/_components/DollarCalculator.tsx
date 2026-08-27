'use client';

import { useMemo, useState } from 'react';

type DollarCalculatorProps = {
  parallelBuy: number | null;
  parallelSell: number | null;
  officialBuy: number | null;
  officialSell: number | null;
};

const numberFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function DollarCalculator({
  parallelBuy,
  parallelSell,
  officialBuy,
  officialSell
}: DollarCalculatorProps) {
  const parallelAvailable = parallelBuy !== null && parallelSell !== null;
  const officialAvailable = officialBuy !== null && officialSell !== null;
  const [market, setMarket] = useState<'parallel' | 'official'>(parallelAvailable ? 'parallel' : 'official');
  const [direction, setDirection] = useState<'usd-bob' | 'bob-usd'>('usd-bob');
  const [operation, setOperation] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('100');

  const rates = market === 'parallel'
    ? { buy: parallelBuy, sell: parallelSell }
    : { buy: officialBuy, sell: officialSell };
  const rate = operation === 'buy' ? rates.sell : rates.buy;
  const numericAmount = Number(amount.replace(',', '.'));
  const result = useMemo(() => {
    if (!rate || !Number.isFinite(numericAmount) || numericAmount <= 0) return null;
    return direction === 'usd-bob' ? numericAmount * rate : numericAmount / rate;
  }, [direction, numericAmount, rate]);

  if (!parallelAvailable && !officialAvailable) {
    return <div className="card p-5 text-sm text-ink/70">Las cotizaciones están temporalmente fuera de línea. Intenta nuevamente en unos minutos.</div>;
  }

  return (
    <section className="card grid gap-5 p-6" aria-labelledby="calculadora-dolar">
      <div className="grid gap-1">
        <p className="kicker">Conversor actualizado</p>
        <h2 id="calculadora-dolar" className="font-serif text-2xl">Calculadora USD ↔ BOB</h2>
        <p className="text-sm text-ink/65">Elige mercado, operación y sentido de conversión. El resultado es informativo.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Mercado de referencia">
        <button type="button" disabled={!parallelAvailable} onClick={() => setMarket('parallel')} className={`rounded-full px-4 py-2 text-sm font-medium ${market === 'parallel' ? 'bg-ink text-white' : 'bg-black/5'} disabled:cursor-not-allowed disabled:opacity-40`}>Paralelo P2P</button>
        <button type="button" disabled={!officialAvailable} onClick={() => setMarket('official')} className={`rounded-full px-4 py-2 text-sm font-medium ${market === 'official' ? 'bg-ink text-white' : 'bg-black/5'} disabled:cursor-not-allowed disabled:opacity-40`}>Oficial BCB</button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Sentido de conversión">
        <button type="button" onClick={() => setDirection('usd-bob')} className={`rounded-full px-4 py-2 text-sm ${direction === 'usd-bob' ? 'bg-sun font-semibold' : 'bg-black/5'}`}>Dólares a bolivianos</button>
        <button type="button" onClick={() => setDirection('bob-usd')} className={`rounded-full px-4 py-2 text-sm ${direction === 'bob-usd' ? 'bg-sun font-semibold' : 'bg-black/5'}`}>Bolivianos a dólares</button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Tipo de operación">
        <button type="button" onClick={() => setOperation('buy')} className={`rounded-full px-4 py-2 text-sm ${operation === 'buy' ? 'border border-ink font-semibold' : 'border border-transparent bg-black/5'}`}>Quiero comprar USD</button>
        <button type="button" onClick={() => setOperation('sell')} className={`rounded-full px-4 py-2 text-sm ${operation === 'sell' ? 'border border-ink font-semibold' : 'border border-transparent bg-black/5'}`}>Quiero vender USD</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <label className="grid gap-2 text-sm font-medium">
          Monto en {direction === 'usd-bob' ? 'USD' : 'BOB'}
          <input inputMode="decimal" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="rounded-xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:border-ink" />
        </label>
        <div className="rounded-xl bg-sand/50 px-5 py-3">
          <p className="text-xs uppercase tracking-wide text-ink/50">Resultado estimado</p>
          <p className="mt-1 text-2xl font-semibold">{result === null ? '—' : `${direction === 'usd-bob' ? 'Bs ' : 'USD '}${numberFormatter.format(result)}`}</p>
          <p className="mt-1 text-xs text-ink/60">Tasa usada: Bs {rate ? numberFormatter.format(rate) : '—'} por USD</p>
        </div>
      </div>
    </section>
  );
}
