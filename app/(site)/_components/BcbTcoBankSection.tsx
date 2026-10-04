import {
  fetchRecentBcbTcoBreakdowns,
  type BcbBankBreakdown,
  type BcbTcoBreakdown
} from '@/lib/bcbTco';
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short'
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatSignedPercent(value: number) {
  if (Math.abs(value) < 0.05) return '0,0%';
  return `${value > 0 ? '+' : ''}${formatNumber(value, 1)}%`;
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

function ratePosition(bank: BcbBankBreakdown, tco: number) {
  if (bank.medianRate === null) return { label: 'Sin mediana', tone: 'bg-ink/35' };
  if (bank.medianRate < tco) return { label: 'Mediana bajo el TCO', tone: 'bg-signal/70' };
  if (bank.medianRate > tco) return { label: 'Mediana sobre el TCO', tone: 'bg-moss/75' };
  return { label: 'Mediana en el TCO', tone: 'bg-sun' };
}

function BankRow({
  bank,
  rank,
  tco,
  maxShare
}: {
  bank: BcbBankBreakdown;
  rank: number;
  tco: number;
  maxShare: number;
}) {
  const position = ratePosition(bank, tco);
  const changedResult = bank.effectCents !== null && Math.abs(bank.effectCents) >= 0.005;

  return (
    <li className="grid gap-3 border-t border-black/[0.07] px-5 py-5 sm:px-6 lg:grid-cols-[minmax(220px,1.1fr)_minmax(240px,1.45fr)_150px_170px] lg:items-center lg:gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.055] text-xs font-semibold tabular-nums text-ink/55">
          {rank}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-[-0.01em]">{bank.shortName}</p>
          <p className="mt-0.5 text-xs text-ink/50">{formatUsd(bank.operations)} operaciones</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-ink/50">Participación del volumen</span>
          <strong className="tabular-nums">{formatNumber(bank.sharePct, 1)}%</strong>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden="true">
          <span
            className="block h-full rounded-full bg-ink transition-[width]"
            style={{ width: `${Math.max((bank.sharePct / maxShare) * 100, 1.5)}%` }}
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 lg:block lg:text-right">
        <span className="text-xs text-ink/50 lg:block">USD comprados</span>
        <strong className="tabular-nums">{formatUsd(bank.usd)}</strong>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.045] px-2.5 py-1 text-xs text-ink/65">
          <i className={`h-2 w-2 rounded-full ${position.tone}`} aria-hidden="true" />
          {position.label}
        </span>
        {changedResult ? (
          <span className="rounded-full bg-signal/10 px-2.5 py-1 text-xs font-semibold text-signal">
            Efecto {bank.effectCents && bank.effectCents > 0 ? '+' : ''}
            {formatNumber(bank.effectCents ?? 0, 2)} ctvs.
          </span>
        ) : null}
      </div>
    </li>
  );
}

function DailyPressurePanel({ series }: { series: BcbTcoBreakdown[] }) {
  const points = series.slice(-10);
  if (!points.length) return null;

  const current = points.at(-1) as BcbTcoBreakdown;
  const previous = points.at(-2);
  const comparisonPoints = points.slice(Math.max(0, points.length - 8), -1);
  const recentAverage = comparisonPoints.length
    ? comparisonPoints.reduce((sum, point) => sum + point.totalUsd, 0) / comparisonPoints.length
    : current.totalUsd;
  const versusAverage = recentAverage > 0
    ? ((current.totalUsd - recentAverage) / recentAverage) * 100
    : 0;
  const versusPrevious = previous && previous.totalUsd > 0
    ? ((current.totalUsd - previous.totalUsd) / previous.totalUsd) * 100
    : 0;
  const averageTicket = current.totalOperations > 0
    ? current.totalUsd / current.totalOperations
    : 0;
  const maxVolume = Math.max(...points.map((point) => point.totalUsd), 1);
  const activityLabel = versusAverage >= 15
    ? 'por encima del ritmo reciente'
    : versusAverage <= -15
      ? 'por debajo del ritmo reciente'
      : 'en línea con el ritmo reciente';

  return (
    <section className="card overflow-hidden" aria-labelledby="presion-diaria-title">
      <div className="grid gap-4 border-b border-black/[0.07] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="kicker">Ritmo del mercado</p>
          <h3 id="presion-diaria-title" className="mt-2 font-serif text-2xl sm:text-3xl">
            Presión diaria de compra
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/60">
            Volumen de dólares comprado por los bancos en cada corte. Sirve como indicador de
            actividad: no mide por sí solo escasez, demanda insatisfecha ni dirección futura del TCO.
          </p>
        </div>
        <span className="w-fit rounded-full bg-ink/[0.055] px-3 py-1.5 text-xs font-semibold text-ink/55">
          Últimos {points.length} cortes disponibles
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.72fr_1.28fr] lg:p-8">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.25rem] bg-night p-5 text-white">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-white/45">
              Último corte
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
              USD {formatCompactUsd(current.totalUsd)}
            </p>
            <p className="mt-2 text-sm text-white/55">{formatCalendarDate(current.cutoffDate)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-black/[0.065] bg-white/70 p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-ink/40">
              Frente al corte anterior
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              {formatSignedPercent(versusPrevious)}
            </p>
            <p className="mt-2 text-sm text-ink/50">
              {previous ? `Corte previo: USD ${formatCompactUsd(previous.totalUsd)}` : 'Sin corte comparable'}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-black/[0.065] bg-white/70 p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-ink/40">
              Monto por operación
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              USD {formatCompactUsd(averageTicket)}
            </p>
            <p className="mt-2 text-sm text-ink/50">
              {formatSignedPercent(versusAverage)} vs. promedio · {activityLabel}
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[#f2f2f7] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-ink/55">Volumen por fecha de corte</p>
              <p className="mt-1 text-xs text-ink/40">Escala relativa al mayor volumen del período</p>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink/60 shadow-sm">
              Prom. USD {formatCompactUsd(recentAverage)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-10 gap-1.5 sm:gap-2.5">
            {points.map((point, index) => {
              const isCurrent = index === points.length - 1;
              const barHeight = Math.max((point.totalUsd / maxVolume) * 100, 3);
              return (
                <div
                  key={point.cutoffDate}
                  className="grid min-w-0 gap-2 text-center"
                  title={`${formatCalendarDate(point.cutoffDate)} · USD ${formatUsd(point.totalUsd)} · ${formatUsd(point.totalOperations)} operaciones`}
                  aria-label={`${formatCalendarDate(point.cutoffDate)}: USD ${formatUsd(point.totalUsd)}`}
                >
                  <div className="flex h-36 items-end justify-center border-b border-black/10">
                    <span
                      className={`block w-full max-w-8 rounded-t-lg transition-colors ${isCurrent ? 'bg-night' : 'bg-moss/30'}`}
                      style={{ height: `${barHeight}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={`truncate text-[0.6rem] sm:text-[0.68rem] ${isCurrent ? 'font-bold text-ink' : 'text-ink/45'}`}>
                    {formatShortDate(point.cutoffDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.07] bg-ink/[0.025] px-5 py-4 text-xs leading-relaxed text-ink/50 sm:px-6">
        El promedio compara el último corte con hasta siete cortes anteriores disponibles. Fines de
        semana y feriados pueden generar huecos entre fechas.
      </div>
    </section>
  );
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
  const series = await fetchRecentBcbTcoBreakdowns(10);
  const data = series.at(-1);

  if (!data) {
    return (
      <section className="card grid gap-4 p-6 sm:p-8" aria-labelledby="bancos-tco-title">
        <div>
          <p className="kicker">Datos oficiales explicados</p>
          <h2 id="bancos-tco-title" className="mt-2 font-serif text-3xl sm:text-4xl">
            Radiografía del TCO bancario
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
  const topBanks = data.banks.slice(0, 5);
  const remainingBanks = data.banks.slice(5);
  const topThreeShare = data.banks.slice(0, 3).reduce((sum, bank) => sum + bank.sharePct, 0);
  const maxIndividualEffect = Math.max(
    0,
    ...data.banks.map((bank) => Math.abs(bank.effectCents ?? 0))
  );
  const isResilient = maxIndividualEffect < 0.005;
  const medianBankNames = new Intl.ListFormat('es-BO', {
    style: 'long',
    type: 'conjunction'
  }).format(data.medianBanks);
  const medianBankVerb = data.medianBanks.length === 1 ? 'registró' : 'registraron';

  return (
    <section className="grid gap-6" aria-labelledby="bancos-tco-title">
      <div className="section-heading">
        <div>
          <p className="kicker">Datos oficiales explicados</p>
          <h2 id="bancos-tco-title">Radiografía del TCO bancario</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-ink/60">
          Una lectura del volumen que participa en la mediana del BCB. Muestra concentración y
          sensibilidad; no atribuye el resultado a una sola entidad.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 shadow-lift backdrop-blur-xl">
        <div className="data-rule" />
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
          <div className="grid content-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-ink/[0.055] px-3 py-1.5 text-xs font-semibold text-ink/60">
                <span className="h-2 w-2 rounded-full bg-moss" aria-hidden="true" />
                Corte {formatCalendarDate(data.cutoffDate)}
              </div>
              <p className="mt-5 font-serif text-6xl tracking-[-0.045em] text-ink sm:text-7xl">
                {formatNumber(data.tco, 2)}
              </p>
              <p className="mt-2 text-sm text-ink/50">bolivianos por dólar · TCO publicado</p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink/60">
              La mediana ponderada ubica la mitad del volumen a cada lado del nivel publicado. Este
              corte entra en vigencia {formatValidity(data.validity)}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-black/[0.065] bg-white/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-ink/40">Volumen</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.025em]">USD {formatCompactUsd(data.totalUsd)}</p>
              <p className="mt-2 text-sm text-ink/50">{formatUsd(data.totalOperations)} operaciones</p>
            </div>
            <div className="rounded-[1.35rem] border border-black/[0.065] bg-white/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-ink/40">Mayor cuota</p>
              <p className="mt-3 text-xl font-semibold leading-tight tracking-[-0.02em]">{leadingBank.shortName}</p>
              <p className="mt-2 text-sm text-ink/50">{formatNumber(leadingBank.sharePct, 1)}% del volumen</p>
            </div>
            <div className="rounded-[1.35rem] border border-black/[0.065] bg-white/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-ink/40">Concentración</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.025em]">{formatNumber(topThreeShare, 1)}%</p>
              <p className="mt-2 text-sm text-ink/50">en los 3 primeros</p>
            </div>

            <div className="rounded-[1.35rem] bg-night p-5 text-white sm:col-span-3">
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-sun">
                    {isResilient ? 'Resultado estable' : 'Sensibilidad del período'}
                  </p>
                  <p className="mt-2 max-w-2xl leading-relaxed text-white/72">
                    {isResilient
                      ? `Al retirar uno por uno a cada banco, el TCO recalculado siguió en Bs ${formatNumber(data.tco, 2)}. El dato refleja el conjunto del mercado, no el peso aislado de una entidad.`
                      : `La mayor variación al excluir una entidad fue de ${formatNumber(maxIndividualEffect, 2)} centavos. Esta prueba ayuda a medir cuán sensible fue el resultado a una participación individual.`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white/65">
                  <span className="block text-xs uppercase tracking-[0.14em] text-white/40">Promedio</span>
                  <strong className="mt-1 block text-xl text-white">{formatNumber(data.weightedAverage, 2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DailyPressurePanel series={series} />

      <div className="card overflow-hidden">
        <div className="grid gap-4 border-b border-black/[0.07] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="kicker">Distribución del mercado</p>
            <h3 className="mt-2 font-serif text-2xl sm:text-3xl">Quién concentró las compras</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/60">
              Ordenado por dólares comprados. La barra compara la participación de cada banco; la
              etiqueta indica dónde quedó la mediana de sus propias operaciones respecto al TCO.
            </p>
          </div>
          <p className="rounded-2xl bg-sun/20 px-4 py-3 text-sm leading-relaxed text-ink/70 lg:max-w-sm">
            <strong className="text-ink">Nivel de la mediana:</strong>{' '}
            {medianBankNames || 'sin bancos identificados'} {medianBankVerb} compras exactamente en Bs{' '}
            {formatNumber(data.tco, 2)}.
          </p>
        </div>

        <div className="hidden border-b border-black/[0.07] bg-ink/[0.025] px-6 py-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink/40 lg:grid lg:grid-cols-[minmax(220px,1.1fr)_minmax(240px,1.45fr)_150px_170px] lg:gap-6">
          <span>Banco</span>
          <span>Cuota del volumen</span>
          <span className="text-right">Monto</span>
          <span className="text-right">Posición</span>
        </div>

        <ol>
          {topBanks.map((bank, index) => (
            <BankRow
              key={bank.name}
              bank={bank}
              rank={index + 1}
              tco={data.tco}
              maxShare={leadingBank.sharePct}
            />
          ))}
        </ol>

        {remainingBanks.length ? (
          <details className="group border-t border-black/[0.07]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold transition hover:bg-ink/[0.025] sm:px-6">
              <span>Ver los {remainingBanks.length} bancos restantes</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/[0.055] text-lg font-normal transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <ol start={topBanks.length + 1}>
              {remainingBanks.map((bank, index) => (
                <BankRow
                  key={bank.name}
                  bank={bank}
                  rank={topBanks.length + index + 1}
                  tco={data.tco}
                  maxShare={leadingBank.sharePct}
                />
              ))}
            </ol>
          </details>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-black/[0.07] bg-ink/[0.025] p-5 text-xs leading-relaxed text-ink/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="max-w-3xl">
            Cálculos propios sobre el detalle público del BCB. La participación no equivale a
            influencia causal y no evalúa la calidad de cada banco.
          </p>
          <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="text-link shrink-0">
            Ver datos del BCB
          </a>
        </div>
      </div>
    </section>
  );
}
