'use client';

import dynamic from 'next/dynamic';

const DeclareForm = dynamic(() => import('./DeclareForm').then((mod) => mod.DeclareForm), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-ink/10 px-4 py-2 text-sm text-transparent animate-pulse">
        Reportar precio
      </span>
    </div>
  )
});

export { DeclareForm as DeclareFormLazy };
