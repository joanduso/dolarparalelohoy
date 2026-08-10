'use client';

import { useState } from 'react';

type ShareChannel = 'whatsapp' | 'facebook' | 'native_share' | 'copy' | 'download';

type ShareRateActionsProps = {
  baseUrl: string;
  buy: number | null;
  sell: number | null;
  changePct: number | null;
  gapPct: number | null;
  updatedAt: string | null;
};

function formatRate(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function ShareRateActions({
  baseUrl,
  buy,
  sell,
  changePct,
  gapPct,
  updatedAt
}: ShareRateActionsProps) {
  const [copied, setCopied] = useState(false);
  const buyText = formatRate(buy);
  const sellText = formatRate(sell);
  const context = [
    changePct === null ? null : `variación ${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% vs. ayer`,
    gapPct === null ? null : `brecha ${gapPct.toFixed(1)}%`,
    updatedAt ? `actualizado ${updatedAt}` : null
  ].filter(Boolean).join(' · ');
  const message =
    buyText && sellText
      ? `Dólar paralelo en Bolivia hoy: compra Bs ${buyText} · venta Bs ${sellText}.${context ? ` ${context}.` : ''}`
      : 'Consulta la cotización actualizada del dólar paralelo en Bolivia.';

  const trackedUrl = (channel: ShareChannel) => {
    const url = new URL('/compartir', baseUrl);
    url.searchParams.set('utm_source', channel);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'tarjeta_diaria');
    return url.toString();
  };

  const track = (channel: ShareChannel) => {
    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('event', 'share', {
      method: channel,
      content_type: 'daily_rate_card',
      item_id: 'dolar_paralelo_bolivia'
    });
  };

  const shareNative = async () => {
    const url = trackedUrl('native_share');
    track('native_share');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dólar paralelo en Bolivia hoy',
          text: message,
          url
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    await copyToClipboard(url);
  };

  const copyToClipboard = async (url = trackedUrl('copy')) => {
    try {
      await navigator.clipboard.writeText(`${message}\n${url}`);
      track('copy');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const buttonClass =
    'inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2';

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `${message}\n${trackedUrl('whatsapp')}`
          )}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={() => track('whatsapp')}
          className={`${buttonClass} bg-[#1f9d63] text-white hover:bg-[#188050]`}
        >
          Compartir por WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            trackedUrl('facebook')
          )}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={() => track('facebook')}
          className={`${buttonClass} bg-[#1877f2] text-white hover:bg-[#1264cf]`}
        >
          Compartir en Facebook
        </a>
        <button
          type="button"
          onClick={shareNative}
          className={`${buttonClass} bg-ink text-white hover:bg-ink/90`}
        >
          Compartir
        </button>
        <button
          type="button"
          onClick={() => copyToClipboard()}
          className={`${buttonClass} border border-ink/20 bg-white text-ink hover:bg-sand`}
          aria-live="polite"
        >
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
      <a
        href="/compartir/card?v=live-3"
        download="dolar-paralelo-bolivia-hoy.png"
        onClick={() => track('download')}
        className="justify-self-start text-sm font-semibold underline underline-offset-4"
      >
        Descargar imagen de la cotización
      </a>
    </div>
  );
}
