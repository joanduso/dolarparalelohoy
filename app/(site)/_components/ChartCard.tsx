'use client';

import { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { computeParallelBenchmarks } from '@/lib/parallelBenchmarks';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

type SeriesPoint = { date: string; value: number };

type SeriesKey = 'paralelo' | 'oficial' | 'brecha';

export type ChartPayload = {
  paralelo: SeriesPoint[];
  oficial: SeriesPoint[];
  brecha: SeriesPoint[];
};

const ranges = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
  { label: 'Todo', days: 0 }
];

function signedNumber(value: number, digits = 1) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)}`;
}

function calendarDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

export function ChartCard({
  data,
  title,
  initialSeries = 'paralelo',
  initialRange = 30
}: {
  data: ChartPayload;
  title?: string;
  initialSeries?: SeriesKey;
  initialRange?: number;
}) {
  const availableSeries = (['paralelo', 'oficial', 'brecha'] as const).filter(
    (option) => data[option].length > 0
  );
  const startingSeries = availableSeries.includes(initialSeries)
    ? initialSeries
    : (availableSeries[0] ?? initialSeries);
  const [series, setSeries] = useState<SeriesKey>(startingSeries);
  const [range, setRange] = useState(initialRange);
  const latestParallelBenchmarks = useMemo(
    () => computeParallelBenchmarks(data.paralelo, data.oficial),
    [data.oficial, data.paralelo]
  );
  const [benchmarkDate, setBenchmarkDate] = useState(
    latestParallelBenchmarks?.parallel.date.slice(0, 10) ?? ''
  );
  const parallelBenchmarks = useMemo(
    () => computeParallelBenchmarks(data.paralelo, data.oficial, benchmarkDate || undefined),
    [benchmarkDate, data.oficial, data.paralelo]
  );
  const benchmarkBounds = useMemo(() => {
    const days = data.paralelo
      .filter((point) => Number.isFinite(point.value) && point.value > 0)
      .map((point) => point.date.slice(0, 10))
      .sort();
    return { min: days[0] ?? '', max: days.at(-1) ?? '' };
  }, [data.paralelo]);

  const selected = data[series];

  const filtered = useMemo(() => {
    const uniqueByDay = new Map<string, SeriesPoint>();
    [...selected]
      .filter((point) => Number.isFinite(point.value) && !Number.isNaN(new Date(point.date).getTime()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((point) => uniqueByDay.set(point.date.slice(0, 10), point));

    const normalized = Array.from(uniqueByDay.values());
    if (range === 0) return normalized;
    const from = new Date();
    from.setDate(from.getDate() - range);
    return normalized.filter((point) => new Date(point.date) >= from);
  }, [selected, range]);

  const yBounds = useMemo(() => {
    if (filtered.length === 0) return undefined;
    const values = filtered.map((point) => point.value);
    const lowest = Math.min(...values);
    const highest = Math.max(...values);
    const spread = highest - lowest;
    const minimumPadding = series === 'brecha' ? 1 : 0.25;
    const padding = Math.max(spread * 0.15, minimumPadding);

    return {
      min: series === 'brecha' ? lowest - padding : Math.max(0, lowest - padding),
      max: highest + padding
    };
  }, [filtered, series]);

  const coverage = useMemo(() => {
    if (filtered.length === 0) return null;
    const first = calendarDate(filtered[0].date);
    const last = calendarDate(filtered[filtered.length - 1].date);
    return `${filtered.length} días · ${format(first, 'd MMM yyyy', { locale: es })} – ${format(last, 'd MMM yyyy', { locale: es })}`;
  }, [filtered]);

  const handleDownloadCsv = () => {
    const header = 'Fecha,Valor (BOB)';
    const rows = filtered.map(
      (point) => `${format(new Date(point.date), 'yyyy-MM-dd')},${point.value}`
    );
    const csvContent = [header, ...rows].join('\r\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tendencia-${series}-${range}d.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chartData = useMemo(() => {
    return {
      labels: filtered.map((point) =>
        format(calendarDate(point.date), 'd MMM', { locale: es })
      ),
      datasets: [
        {
          data: filtered.map((point) => point.value),
          borderColor: series === 'brecha' ? '#2f5d50' : '#0f172a',
          backgroundColor: 'rgba(15, 23, 42, 0.08)',
          tension: 0.3,
          pointRadius: filtered.map((point) => (
            series === 'paralelo' && point.date.slice(0, 10) === benchmarkDate ? 5 : 2
          )),
          pointBackgroundColor: filtered.map((point) => (
            series === 'paralelo' && point.date.slice(0, 10) === benchmarkDate ? '#f5b82e' : '#0f172a'
          ))
        }
      ]
    };
  }, [benchmarkDate, filtered, series]);

  const selectBenchmarkDate = (day: string) => {
    if (!day) return;
    setBenchmarkDate(day);
    const ageInDays = Math.max(0, Math.ceil((Date.now() - calendarDate(day).getTime()) / 86_400_000));
    const smallestRange = ranges.find((option) => option.days > 0 && ageInDays <= option.days);
    setRange(smallestRange?.days ?? 0);
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      {title ? <h2 className="font-serif text-2xl">{title}</h2> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {availableSeries.length > 1 ? (
          <div className="flex gap-2">
            {availableSeries.map((option) => (
              <button
                key={option}
                onClick={() => setSeries(option)}
                className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${
                  series === option ? 'bg-ink text-white' : 'bg-black/5'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs uppercase tracking-wide text-ink/50">{series}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {ranges.map((option) => (
            <button
              key={option.label}
              onClick={() => setRange(option.days)}
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${
                range === option.days ? 'bg-sun text-ink' : 'bg-black/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleDownloadCsv}
          disabled={filtered.length === 0}
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wide bg-black/5 hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Descargar CSV
        </button>
      </div>
      {coverage ? (
        <p className="text-xs text-ink/50">Cobertura visible: {coverage}</p>
      ) : null}
      {filtered.length < 2 ? (
        <p className="text-sm text-ink/60">Sin datos suficientes para el rango seleccionado.</p>
      ) : (
        <Line
          data={chartData}
          options={{
            responsive: true,
            onClick: (_event, elements) => {
              const clicked = elements[0];
              const point = clicked ? filtered[clicked.index] : null;
              if (series === 'paralelo' && point) setBenchmarkDate(point.date.slice(0, 10));
            },
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, ticks: { maxTicksLimit: 8 } },
              y: {
                display: true,
                min: yBounds?.min,
                max: yBounds?.max,
                ticks: {
                  callback: (value) => {
                    const rounded = Number(value).toFixed(2);
                    return series === 'brecha' ? `${rounded}%` : `Bs ${rounded}`;
                  }
                }
              }
            }
          }}
        />
      )}
      {series === 'paralelo' && parallelBenchmarks ? (
        <div className="grid gap-3" aria-label="Comparaciones de la cotización paralela por fecha">
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-black/[0.03] p-4">
            <div>
              <p className="text-sm font-medium text-ink">Comparación por fecha</p>
              <p className="text-xs text-ink/60">Elige un día o haz clic en un punto del gráfico.</p>
            </div>
            <label className="grid gap-1 text-xs uppercase tracking-wide text-ink/55">
              Fecha
              <input
                type="date"
                min={benchmarkBounds.min}
                max={benchmarkBounds.max}
                value={benchmarkDate}
                onChange={(event) => selectBenchmarkDate(event.target.value)}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
              />
            </label>
          </div>
          <p className="text-sm text-ink/70">
            Cotización paralela del <strong>{format(calendarDate(parallelBenchmarks.parallel.date), 'd MMMM yyyy', { locale: es })}</strong>:{' '}
            <strong>Bs {new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parallelBenchmarks.parallel.value)}</strong>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-sand/35 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/55">Vs. Bs 6,96 histórico</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {signedNumber(parallelBenchmarks.historic.percent)}%
              </p>
              <p className="mt-1 text-xs text-ink/60">
                {signedNumber(parallelBenchmarks.historic.delta, 2)} Bs frente al tipo oficial histórico de referencia.
              </p>
            </div>
            {parallelBenchmarks.official ? (
              <div className="rounded-xl border border-black/10 bg-sand/35 p-4">
                <p className="text-xs uppercase tracking-wide text-ink/55">Vs. oficial de la fecha</p>
                <p className="mt-1 text-xl font-semibold text-ink">
                  {signedNumber(parallelBenchmarks.official.percent)}%
                </p>
                <p className="mt-1 text-xs text-ink/60">
                  {signedNumber(parallelBenchmarks.official.delta, 2)} Bs frente al último oficial disponible hasta ese día: Bs{' '}
                  {new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parallelBenchmarks.official.baseline)}
                  {' '}({format(calendarDate(parallelBenchmarks.official.date), 'd MMM yyyy', { locale: es })}).
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {series === 'paralelo' ? (
        <p className="text-xs text-ink/50">
          Histórico diario respaldado desde julio de 2024 con datos de{' '}
          <a className="underline underline-offset-2" href="https://www.dolarbluebolivia.click/datos/" target="_blank" rel="noreferrer">Dólar Blue Bolivia</a>
          {' '}y fuentes propias disponibles. Se descartan ceros y valores inválidos. Cotización actual: cálculo propio con anuncios P2P.
        </p>
      ) : null}
    </div>
  );
}
