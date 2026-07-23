export const siteConfig = {
  name: 'Dólar Paralelo Hoy Bolivia',
  shortName: 'Dólar Paralelo Hoy',
  alternateName: 'Dólar Paralelo Bolivia',
  description:
    'Cotización del dólar paralelo y oficial en Bolivia hoy. Brecha cambiaria, histórico y metodología transparente.',
  url: (() => {
    const rawUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'https://dolarparalelohoy.com';
    return rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  })(),
  locale: 'es-BO',
  language: 'es'
};

export const pageTitles = {
  home: 'Dólar Paralelo Bolivia Hoy: Precio, Compra y Venta',
  paralelo: 'Dólar paralelo hoy en Bolivia',
  oficial: 'Dólar oficial hoy en Bolivia',
  brecha: 'Brecha dólar oficial vs paralelo Bolivia',
  historicoParalelo: 'Histórico dólar paralelo Bolivia',
  historicoOficial: 'Histórico dólar oficial Bolivia',
  usdtBob: 'USDT a BOB hoy: conversor y cotización P2P Bolivia',
  dolarBlue: 'Dólar blue Bolivia hoy: precio y diferencia con el oficial',
  exchanges: 'Comparador de exchanges P2P Bolivia',
  faq: 'Metodología y preguntas frecuentes',
  devs: 'API pública para desarrolladores',
  fuentes: 'Fuentes del dólar en Bolivia',
  terminos: 'Términos de uso',
  privacidad: 'Política de privacidad'
};

export const pageDescriptions = {
  home:
    'Consulta el precio del dólar paralelo en Bolivia hoy: compra, venta, comparación USDT/BOB, dólar oficial, brecha e histórico actualizado.',
  paralelo:
    'Precio del dólar paralelo hoy en Bolivia. Compra, venta, variación diaria, fuentes y contexto.',
  oficial:
    'Precio del dólar oficial en Bolivia hoy. Compra, venta, evolución y referencias oficiales.',
  brecha:
    'Brecha cambiaria entre dólar oficial y paralelo en Bolivia. Análisis de la diferencia y su evolución.',
  historicoParalelo:
    'Serie histórica del dólar paralelo en Bolivia con datos diarios y metodología transparente.',
  historicoOficial:
    'Serie histórica del dólar oficial en Bolivia con datos diarios y metodología transparente.',
  usdtBob:
    'Conversor USDT a BOB y cotización P2P en Bolivia hoy. Compara compra, venta y plataformas con datos actualizados.',
  dolarBlue:
    'Precio del dólar blue en Bolivia hoy. Entiende la diferencia entre dólar paralelo, USDT/BOB y tipo de cambio oficial.',
  exchanges:
    'Compara cotizaciones P2P de exchanges y billeteras disponibles para Bolivia: compra, venta, actualización y condiciones.',
  faq:
    'Preguntas frecuentes, metodología, validación y avisos legales sobre el dólar en Bolivia.',
  devs:
    'Documentación de la API pública con endpoints de cotización, histórico y estadísticas del dólar en Bolivia.',
  fuentes:
    'Conoce las fuentes, criterios de validación y metodología de la cotización del dólar paralelo y oficial en Bolivia.',
  terminos:
    'Términos de uso de Dólar Paralelo Hoy Bolivia y alcance informativo de las cotizaciones publicadas.',
  privacidad:
    'Política de privacidad y tratamiento de datos de los reportes voluntarios de precios en Bolivia.'
};
