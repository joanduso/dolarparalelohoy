'use client';

import { useState } from 'react';

export function WidgetEmbedCode({ embedUrl }: { embedUrl: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<iframe src="${embedUrl}" title="Dólar paralelo Bolivia hoy" width="100%" height="250" style="border:0;max-width:520px" loading="lazy"></iframe>`;

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-3">
      <label htmlFor="widget-code" className="text-sm font-medium">Código para insertar</label>
      <textarea id="widget-code" readOnly value={code} rows={4} className="w-full rounded-xl border border-black/15 bg-white p-4 font-mono text-xs" />
      <button type="button" onClick={copyCode} className="w-fit rounded-full bg-ink px-5 py-2 text-sm font-medium text-white">{copied ? 'Código copiado' : 'Copiar código'}</button>
    </div>
  );
}
