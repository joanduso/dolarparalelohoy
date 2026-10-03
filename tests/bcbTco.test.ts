import { describe, expect, it } from 'vitest';
import { parseBcbTcoCsv } from '../lib/bcbTco';

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
      medianRate: 10,
      tcoWithoutBank: 12,
      effectCents: -200
    });
  });

  it('rejects content without the official table', () => {
    expect(parseBcbTcoCsv('sin datos')).toBeNull();
  });
});
