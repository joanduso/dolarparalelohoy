import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseTipoDeCambio, parseValorReferencial } from '../lib/sources/bcb_html';

const fixturePath = (name: string) => `tests/fixtures/${name}`;

async function loadFixture(name: string) {
  return readFile(fixturePath(name), 'utf8');
}

describe('BCB parsers', () => {
  it('parses the unified official value used by the current BCB homepage', () => {
    const html = `
      <section>
        <h2>Tipo de cambio oficial</h2>
        <p>Bolivianos por dólar estadounidense</p>
        <time>MIÉRCOLES 22 DE JULIO, 2026</time>
        <strong>Bs 11,00</strong>
      </section>
    `;

    const { parsed } = parseTipoDeCambio(html);

    expect(parsed).toMatchObject({
      buy: 11,
      sell: 11,
      dateText: 'MIÉRCOLES 22 DE JULIO, 2026'
    });
  });

  it('parseTipoDeCambio extracts numeric values', async () => {
    const html = await loadFixture('bcb_home.html');
    const { parsed } = parseTipoDeCambio(html);

    expect(parsed).not.toBeNull();
    expect(parsed?.buy).toBeCloseTo(6.86, 2);
    expect(parsed?.sell).toBeCloseTo(6.96, 2);
  });

  it('parseValorReferencial follows linked pages when needed', async () => {
    const html = await loadFixture('bcb_home.html');
    const compraHtml = await loadFixture('bcb_valor_compra.html');
    const ventaHtml = await loadFixture('bcb_valor_venta.html');

    const fetcher = async (url: string) => {
      if (url.includes('valor-referencial-de-compra')) return compraHtml;
      if (url.includes('valor-referencial-de-venta')) return ventaHtml;
      return null;
    };

    const { parsed } = await parseValorReferencial(html, {
      fetcher,
      baseUrl: 'https://www.bcb.gob.bo/'
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.buy).toBeCloseTo(6.86, 2);
    expect(parsed?.sell).toBeCloseTo(6.96, 2);
    expect(parsed?.dateText).toBeTruthy();
  });

  it('rejects out-of-range values', () => {
    const html = `
      <section>
        <h2>TIPO DE CAMBIO</h2>
        Compra: 25 Venta: 0
      </section>
    `;

    const { parsed } = parseTipoDeCambio(html);
    expect(parsed).toBeNull();
  });
});
