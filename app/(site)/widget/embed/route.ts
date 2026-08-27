import { getParallelQuote } from '@/lib/p2pIndex';
import { siteConfig } from '@/lib/seo';

export const revalidate = 60;

const formatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timeFormatter = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/La_Paz' });

export async function GET() {
  const quote = await getParallelQuote();
  const values = quote
    ? `<div class="rates"><div><span>Compra</span><strong>Bs ${formatter.format(quote.buy)}</strong></div><div><span>Venta</span><strong>Bs ${formatter.format(quote.sell)}</strong></div></div><p>Actualizado ${timeFormatter.format(new Date(quote.updatedAt))}</p>`
    : '<div class="offline">Cotización temporalmente no disponible</div>';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Dólar paralelo Bolivia hoy</title><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#fffaf0;color:#17202a;font:14px system-ui,sans-serif}.card{border:1px solid #eadfca;border-radius:18px;padding:18px;background:#fff}.label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#806a42}.rates{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.rates div{padding:12px;border-radius:12px;background:#f7edda}.rates span{display:block;font-size:11px;text-transform:uppercase;color:#756a59}.rates strong{display:block;margin-top:4px;font-size:23px}.offline{margin:14px 0;padding:16px;background:#f7edda;border-radius:12px}p{margin:8px 0;color:#756a59;font-size:12px}a{color:#17202a;font-weight:700}</style></head><body><div class="card"><div class="label">Dólar paralelo Bolivia hoy</div>${values}<a href="${siteConfig.url}/?utm_source=widget&utm_medium=referral&utm_campaign=widget_cotizacion" target="_blank" rel="noopener">Fuente: Dólar Paralelo Hoy →</a></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600', 'X-Robots-Tag': 'noindex, follow' } });
}
