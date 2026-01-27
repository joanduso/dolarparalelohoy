export const siteConfig = {
  name: 'Dólar Paralelo Hoy Bolivia',
  description:
    'Cotización del dólar paralelo y oficial en Bolivia hoy. Brecha cambiaria, histórico y metodología transparente.',
  url: (() => {
    const rawUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3000';
    return rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  })(),
  locale: 'es-BO',
  language: 'es'
};

export const pageTitles = {
  home: 'Dólar paralelo y oficial en Bolivia hoy',
  paralelo: 'Dólar paralelo hoy en Bolivia',
  oficial: 'Dólar oficial hoy en Bolivia',
  brecha: 'Brecha dólar oficial vs paralelo Bolivia',
  historicoParalelo: 'Histórico dólar paralelo Bolivia',
  historicoOficial: 'Histórico dólar oficial Bolivia',
  faq: 'Metodología y preguntas frecuentes'
};

export const pageDescriptions = {
  home:
    'Consulta la cotización del dólar paralelo (blue) y oficial en Bolivia hoy, con brecha, histórico y fuentes verificadas.',
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
  faq:
    'Preguntas frecuentes, metodología, validación y avisos legales sobre el dólar en Bolivia.'
};
