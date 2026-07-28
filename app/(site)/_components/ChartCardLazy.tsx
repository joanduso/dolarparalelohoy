'use client';

import dynamic from 'next/dynamic';

const ChartCard = dynamic(() => import('./ChartCard').then((mod) => mod.ChartCard), {
  ssr: false,
  loading: () => (
    <div className="card p-5 flex flex-col gap-4 min-h-[360px] animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="h-6 w-40 rounded bg-ink/10" />
        <div className="h-6 w-48 rounded bg-ink/10" />
      </div>
      <div className="h-64 w-full rounded bg-ink/5" />
    </div>
  )
});

export { ChartCard as ChartCardLazy };
