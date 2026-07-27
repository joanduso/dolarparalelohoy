export type BcbEurRate = {
  bobPerEur: number;
  dateText: string;
};

const MONTHS_ES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

function parseSpanishDate(text: string): Date | null {
  const match = text.trim().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(\d{4})/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS_ES[monthName.toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(year), month, Number(day)));
}

/**
 * BCB publishes an official (if "indicative", per their own disclaimer) BOB
 * per EUR rate at this endpoint — same domain/pattern already used for the
 * official USD rate. https://www.bcb.gob.bo/librerias/indicadores/euro/ultimo.php
 */
export async function fetchBcbEurRate(): Promise<BcbEurRate | null> {
  try {
    const response = await fetch(
      'https://www.bcb.gob.bo/librerias/indicadores/euro/ultimo.php',
      { next: { revalidate: 6 * 60 * 60 } }
    );
    if (!response.ok) return null;
    const html = await response.text();

    const dateMatch = html.match(/(\d{1,2}\s+de\s+[a-záéíóú]+\s+\d{4})/i);
    const numberMatches = [...html.matchAll(/<div align="right">\s*([\d.,]+)/g)];
    if (!dateMatch || numberMatches.length < 2) return null;

    const date = parseSpanishDate(dateMatch[1]);
    if (!date) return null;

    // Second right-aligned number on the page is Bs per EUR (the first is
    // EUR per USD, which we don't need here).
    const bobPerEur = Number(numberMatches[1][1].replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(bobPerEur) || bobPerEur <= 0) return null;

    return { bobPerEur, dateText: dateMatch[1] };
  } catch (error) {
    console.warn('[bcb-eur] unavailable', String(error));
    return null;
  }
}
