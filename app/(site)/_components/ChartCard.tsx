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

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

type SeriesPoint = { date: string; value: number };

type ChartPayload = {
  paralelo: SeriesPoint[];
  oficial: SeriesPoint[];
  brecha: SeriesPoint[];
};

const ranges = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 }
];

export function ChartCard({ data }: { data: ChartPayload }) {
  const [series, setSeries] = useState<'paralelo' | 'oficial' | 'brecha'>('paralelo');
  const [range, setRange] = useState(30);

  const selected = data[series];

  const filtered = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - range);
    return selected.filter((point) => new Date(point.date) >= from);
  }, [selected, range]);

  const chartData = useMemo(() => {
    return {
      labels: filtered.map((point) =>
        format(new Date(point.date), 'd MMM', { locale: es })
      ),
      datasets: [
        {
          data: filtered.map((point) => point.value),
          borderColor: series === 'brecha' ? '#2f5d50' : '#0f172a',
          backgroundColor: 'rgba(15, 23, 42, 0.08)',
          tension: 0.3,
          pointRadius: 2
        }
      ]
    };
  }, [filtered, series]);

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(['paralelo', 'oficial', 'brecha'] as const).map((option) => (
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
        <div className="flex gap-2">
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
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-ink/60">Sin datos suficientes para el rango seleccionado.</p>
      ) : (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, ticks: { maxTicksLimit: 8 } },
              y: { display: true }
            }
          }}
        />
      )}
    </div>
  );
}
