import { ImageResponse } from 'next/og';
import { formatDateTime, formatNumber } from '@/lib/format';
import { getShareSnapshot } from '@/lib/shareRate';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const size = {
  width: 1200,
  height: 630
};

export async function GET() {
  const rate = await getShareSnapshot();
  const variation = rate?.changePct === null || rate?.changePct === undefined
    ? 'Variación pendiente'
    : `${rate.changePct >= 0 ? '+' : ''}${formatNumber(rate.changePct, 1)}% vs. ayer`;
  const gap = rate?.gapPct === null || rate?.gapPct === undefined
    ? 'Brecha pendiente'
    : `${formatNumber(rate.gapPct, 1)}% sobre el oficial`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0f172a 52%, #453c28 100%)',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                color: '#f6c453',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 4
              }}
            >
              DÓLAR PARALELO BOLIVIA
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, marginTop: 10 }}>Cotización de hoy</div>
          </div>
          <div
            style={{
              display: 'flex',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 999,
              padding: '12px 20px',
              fontSize: 20
            }}
          >
            Actualizada
          </div>
        </div>

        {rate ? (
          <div style={{ display: 'flex', gap: 28, width: '100%' }}>
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 28,
                background: 'rgba(255,255,255,0.08)',
                padding: '28px 34px'
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 24 }}>COMPRA</div>
              <div style={{ fontSize: 68, fontWeight: 800, marginTop: 8 }}>
                {`Bs ${formatNumber(rate.buy)}`}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                borderRadius: 28,
                background: '#f6c453',
                color: '#0f172a',
                padding: '28px 34px'
              }}
            >
              <div style={{ color: 'rgba(15,23,42,0.65)', fontSize: 24 }}>VENTA</div>
              <div style={{ fontSize: 68, fontWeight: 800, marginTop: 8 }}>
                {`Bs ${formatNumber(rate.sell)}`}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 28,
              background: 'rgba(255,255,255,0.08)',
              padding: '40px',
              fontSize: 36
            }}
          >
            Cotización temporalmente no disponible
          </div>
        )}

        {rate ? (
          <div style={{ display: 'flex', gap: 18, fontSize: 22, fontWeight: 600 }}>
            <div style={{ display: 'flex', borderRadius: 999, background: 'rgba(255,255,255,0.1)', padding: '10px 18px' }}>
              Variación: {variation}
            </div>
            <div style={{ display: 'flex', borderRadius: 999, background: 'rgba(255,255,255,0.1)', padding: '10px 18px' }}>
              Brecha: {gap}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            paddingTop: 24,
            fontSize: 22
          }}
        >
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.7)' }}>
            {rate
              ? `${rate.sourceLabel} · ${formatDateTime(rate.updatedAt)}`
              : 'Actualización automática'}
          </div>
          <div style={{ display: 'flex', fontWeight: 700 }}>dolarparalelohoy.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Vercel-CDN-Cache-Control': 'public, max-age=60, stale-if-error=300'
      }
    }
  );
}
