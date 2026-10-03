import { fetchLatestBcbTcoBreakdown, type BcbBankBreakdown } from '@/lib/bcbTco';
import { formatCalendarDate, formatNumber } from '@/lib/format';

function formatUsd(value: number) {
  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(value);
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('es-BO', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

function formatValidity(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+al\s+(\d{4}-\d{2}-\d{2})$/);
  if (!match) return value;

  const start = new Date(`${match[1]}T00:00:00Z`);
  const end = new Date(`${match[2]}T00:00:00Z`);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();

  if (sameMonth && sameYear) {
    const endLabel = new Intl.DateTimeFormat('es-BO', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(end);
    return `del ${start.getUTCDate()} al ${endLabel}`;
  }

  return `del ${formatCalendarDate(start)} al ${formatCalendarDate(end)}`;
}

function formatEffect(value: number | null) {
  if (value === null) return '—';
  if (Math.abs(value) < 0.005) return '0,00';
  return `${value > 0 ? '+' : ''}${formatNumber(value, 2)}`;
}

function volumePosition(bank: BcbBankBreakdown) {
  const total = bank.belowUsd + bank.atUsd + bank.aboveUsd;
  if (total <= 0) return null;

  return {
    below: (bank.belowUsd / total) * 100,
    at: (bank.atUsd / total) * 100,
    above: (bank.aboveUsd / total) * 100
  };
}

export function BcbTcoBankFallback() {
  return (
    <section className="card grid min-h-[420px] animate-pulse gap-6 p-6 sm:p-8">
      <div className="h-4 w-44 rounded bg-ink/10" />
      <div className="h-10 w-3/4 rounded bg-ink/10" />
      <div className="h-24 rounded-2xl bg-ink/5" />
      <div className="h-48 rounded-2xl bg-ink/5" />
    </section>
  );
}

export async function BcbTcoBankSection() {
  const data = await fetchLatestBcbTcoBreakdown();

  if (!data) {
    return (
      <section className="card grid gap-4 p-6 sm:p-8" aria-labelledby="bancos-tco-title">
        <div>
          <p className="kicker">Cómo se forma el dólar oficial</p>
          <h2 id="bancos-tco-title" className="mt-2 font-serif text-3xl sm:text-4xl">
            Qué bancos movieron la aguja
          </h2>
        </div>
        <p className="max-w-3xl leading-relaxed text-ink/65">
          El detalle de operaciones bancarias del BCB no está disponible en este momento. El
          bloque volverá a mostrarse cuando la fuente oficial responda.
        </p>
        <a
          href="https://www.bcb.gob.bo/bcb_tco_publico_detalle_historico.php"
          target="_blank"
          rel="noreferrer"
          className="text-link w-fit text-sm"
        >
          Consultar la fuente oficial
        </a>
      </section>
    );
  }

  const leadingBank = data.banks[0];
  const medianBankNames = new Intl.ListFormat('es-BO', {
    style: 'long',
    type: 'conjunction'
  }).format(data.medianBanks);

  return (
    <section className="grid gap-6" aria-labelledby="bancos-tco-title">
      <div className="section-heading">
        <div>
          <p className="kicker">Cómo se forma el dólar oficial</p>
          <h2 id="bancos-tco-title">Qué bancos movieron la aguja</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-ink/60">
          El TCO se obtiene de las compras de dólares reportadas por los bancos. Desde el corte del
          25 de septiembre, el BCB usa la mediana ponderada por monto.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] bg-night text-white shadow-lift">
        <div className="data-rule" />
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.72fr_1.28fr] lg:p-10">
          <div className="grid content-between gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sun">
                TCO · corte {formatCalendarDate(data.cutoffDate)}
              </p>
              <p className="mt-4 font-serif text-6xl tracking-[-0.04em] sm:text-7xl">
                {formatNumber(data.tco, 2)}
              </p>
              <p className="mt-2 text-sm text-white/55">bolivianos por dólar</p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/65">
              La mitad del volumen quedó por debajo de este nivel y la otra mitad por encima. El
              resultado de este corte entra en vigencia {formatValidity(data.validity)}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Volumen</p>
              <p className="mt-3 text-3xl font-semibold">USD {formatCompactUsd(data.totalUsd)}</p>
              <p className="mt-2 text-sm text-white/55">
                {formatUsd(data.totalOperations)} operaciones
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                Mayor participación
              </p>
              <p className="mt-3 text-2xl font-semibold">{leadingBank.shortName}</p>
              <p className="mt-2 text-sm text-white/55">
                {formatNumber(leadingBank.sharePct, 1)}% del volumen
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                Promedio ponderado
              </p>
              <p className="mt-3 text-3xl font-semibold">{formatNumber(data.weightedAverage, 2)}</p>
              <p className="mt-2 text-sm text-white/55">Con las mismas operaciones</p>
            </div>
            <div className="rounded-2xl border border-sun/25 bg-sun/10 p-5 sm:col-span-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sun">
                El nivel que fijó la mediana
              </p>
              <p className="mt-2 leading-relaxed text-white/75">
                {medianBankNames || 'Ningún banco identificado'} concentraron compras exactamente
                en Bs {formatNumber(data.tco, 2)}. Es ese volumen acumulado —no una decisión de un
                solo banco— el que ancló el TCO del período.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-black/10 p-5 sm:p-6">
          <h3 className="font-serif text-2xl">Participación por banco</h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink/60">
            “TCO sin el banco” recalcula la mediana excluyendo sus operaciones. El efecto muestra
            la diferencia frente al TCO publicado, en centavos. La barra indica cuánto volumen de
            cada banco quedó debajo, exactamente en o encima del TCO.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-ink/[0.035] text-xs uppercase tracking-[0.12em] text-ink/50">
              <tr>
                <th className="px-5 py-4 font-semibold sm:px-6">Banco</th>
                <th className="px-4 py-4 text-right font-semibold">USD comprados</th>
                <th className="px-4 py-4 text-right font-semibold">Participación</th>
                <th className="px-4 py-4 text-right font-semibold">Operaciones</th>
                <th className="px-4 py-4 text-right font-semibold">TC mediana</th>
                <th className="px-4 py-4 text-right font-semibold">TCO sin banco</th>
                <th className="px-5 py-4 text-right font-semibold sm:px-6">Efecto</th>
              </tr>
            </thead>
            <tbody>
              {data.banks.map((bank) => {
                const position = volumePosition(bank);
                return (
                  <tr key={bank.name} className="border-t border-black/[0.07] align-middle">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="font-semibold">{bank.shortName}</div>
                      {position ? (
                        <div
                          className="mt-2 flex h-1.5 w-36 overflow-hidden rounded-full bg-ink/5"
                          title="Volumen debajo / en / encima del TCO"
                        >
                          <span className="bg-signal/65" style={{ width: `${position.below}%` }} />
                          <span className="bg-sun" style={{ width: `${position.at}%` }} />
                          <span className="bg-moss/70" style={{ width: `${position.above}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatUsd(bank.usd)}</td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatNumber(bank.sharePct, 1)}%
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {formatUsd(bank.operations)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {bank.medianRate === null ? '—' : formatNumber(bank.medianRate, 2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {bank.tcoWithoutBank === null ? '—' : formatNumber(bank.tcoWithoutBank, 2)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums sm:px-6">
                      {formatEffect(bank.effectCents)} ctvs.
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-black/10 bg-ink/[0.025] p-5 text-xs leading-relaxed text-ink/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-signal/65" />Debajo del TCO</span>
            <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-sun" />En el TCO</span>
            <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-moss/70" />Encima del TCO</span>
          </div>
          <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="text-link w-fit">
            Fuente: Banco Central de Bolivia
          </a>
        </div>
      </div>
    </section>
  );
}
