import { describe, expect, it } from 'vitest';
import { parseBcbTcoCsv, parseBcbTcoCsvSeries } from '../lib/bcbTco';

const csv = `﻿"Tipo de Cambio Oficial del Dólar Estadounidense (TCO)"

"Fecha de corte";Vigencia;"TC (En Bs/USD)";"BANCO A";;"BANCO B";;"TOTAL BANCOS";
;;;N°;Monto;N°;Monto;N°;Monto
2026-10-02;"2026-10-03 al 2026-10-05";10,0000;1;60;-;-;1;60
2026-10-02;"2026-10-03 al 2026-10-05";12,0000;-;-;2;40;2;40
2026-10-02;"2026-10-03 al 2026-10-05";TOTAL;1;60;2;40;3;100
2026-10-02;"2026-10-03 al 2026-10-05";TCO;10,00;;12,00;;10,00;
`;

describe('parseBcbTcoCsv', () => {
  it('reconstructs the weighted median and each bank contribution', () => {
    const result = parseBcbTcoCsv(csv);

    expect(result).not.toBeNull();
    expect(result?.cutoffDate).toBe('2026-10-02');
    expect(result?.tco).toBe(10);
    expect(result?.weightedAverage).toBe(10.8);
    expect(result?.totalUsd).toBe(100);
    expect(result?.totalOperations).toBe(3);
    expect(result?.medianBanks).toEqual(['A']);

    expect(result?.banks[0]).toMatchObject({
      shortName: 'A',
      usd: 60,
      sharePct: 60,
      operations: 1,
      medianRate: 10,
      averageRate: 10,
      tcoWithoutBank: 12,
      effectCents: -200
    });
  });

  it('rejects content without the official table', () => {
    expect(parseBcbTcoCsv('sin datos')).toBeNull();
  });

  it('parses multiple cutoff dates without mixing their volume', () => {
    const multiDateCsv = csv.replace(
      '2026-10-02;"2026-10-03 al 2026-10-05";10,0000;1;60;-;-;1;60',
      `2026-10-01;2026-10-02;11,0000;1;25;-;-;1;25
2026-10-02;"2026-10-03 al 2026-10-05";10,0000;1;60;-;-;1;60`
    );

    const results = parseBcbTcoCsvSeries(multiDateCsv);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ cutoffDate: '2026-10-01', totalUsd: 25, tco: 11 });
    expect(results[1]).toMatchObject({ cutoffDate: '2026-10-02', totalUsd: 100, tco: 10 });
  });
});
