import { HISTORY_PERIODS } from '@/lib/historyPeriods';

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

export const siteRoutes = [
  '',
  '/paralelo',
  '/oficial',
  '/brecha',
  '/usdt-bob',
  '/eur-bob',
  '/btc-bob',
  '/dolar-blue-bolivia',
  '/exchanges',
  '/historico/paralelo',
  '/historico/oficial',
  ...HISTORY_PERIODS.map((period) => `/historico/paralelo/${period.slug}`),
  ...HISTORY_PERIODS.map((period) => `/historico/oficial/${period.slug}`),
  '/comprar-usdt-bolivia',
  '/bancos-usdt-bolivia',
  '/que-es-dolar-blue-bolivia',
  '/faq',
  '/fuentes',
  '/terminos',
  '/privacidad',
  '/devs'
];

export const pageTitles = {
  home: 'Tipo de Cambio en Bolivia Hoy: Oficial, P2P y USDT',
  paralelo: 'Dólar Paralelo Bolivia Hoy: Compra y Venta',
  oficial: 'Precio Oficial del Dólar en Bolivia Hoy | BCB',
  brecha: 'Brecha dólar oficial vs paralelo Bolivia',
  historicoParalelo: 'Dólar Paralelo Histórico Bolivia: Precios y Variación',
  historicoOficial: 'Histórico dólar oficial Bolivia',
  usdtBob: 'USDT a BOB hoy: conversor y cotización P2P Bolivia',
  eurBob: 'Euro a bolivianos hoy: tipo de cambio oficial BCB',
  btcBob: 'Bitcoin a bolivianos hoy: precio BTC en Bs',
  dolarBlue: 'Dólar blue Bolivia hoy: precio y diferencia con el oficial',
  exchanges: 'Comparador de exchanges P2P Bolivia',
  comprarUsdt: 'Cómo comprar USDT en Bolivia 2026: guía completa paso a paso',
  bancosUsdt: 'Qué bancos venden USDT en Bolivia: BCP, BISA, Ganadero, Unión y FIE',
  queEsDolarBlue: 'Qué es el dólar blue y cómo funciona en Bolivia',
  faq: 'Metodología y preguntas frecuentes',
  devs: 'API pública para desarrolladores',
  fuentes: 'Fuentes del dólar en Bolivia',
  terminos: 'Términos de uso',
  privacidad: 'Política de privacidad'
};

export const pageDescriptions = {
  home:
    'Compara el tipo de cambio en Bolivia hoy: índice P2P, dólar oficial, USDT/BOB, brecha cambiaria, fuentes e históricos actualizados.',
  paralelo:
    'Dólar paralelo Bolivia hoy: precio de compra y venta, variación reciente, fuentes públicas y cotización actualizada cada 10 minutos.',
  oficial:
    'Precio del dólar oficial en Bolivia hoy: compra, venta, evolución reciente y referencia publicada por el Banco Central de Bolivia (BCB), actualizada regularmente.',
  brecha:
    'Brecha cambiaria entre dólar oficial y paralelo en Bolivia: diferencia en bolivianos y porcentaje, su evolución diaria y qué significa para el mercado.',
  historicoParalelo:
    'Consulta el histórico del dólar paralelo en Bolivia: precios por fecha, variación de 7, 30 y 365 días, máximos, mínimos y promedio del último año.',
  historicoOficial:
    'Serie histórica del dólar oficial en Bolivia con datos diarios publicados por el BCB, tendencia reciente, metodología transparente y fuentes verificables.',
  usdtBob:
    'Conversor USDT a BOB y cotización P2P en Bolivia hoy. Compara compra, venta y plataformas con datos actualizados.',
  eurBob:
    'Tipo de cambio del euro a bolivianos hoy, publicado por el Banco Central de Bolivia (BCB). Calculadora para convertir cualquier monto en segundos.',
  btcBob:
    'Precio de referencia de Bitcoin en bolivianos hoy, calculado a partir del precio de BTC en dólares y nuestro índice del dólar paralelo en Bolivia.',
  dolarBlue:
    'Precio del dólar blue en Bolivia hoy. Entiende la diferencia entre dólar paralelo, USDT/BOB y tipo de cambio oficial.',
  exchanges:
    'Compara cotizaciones P2P de exchanges y billeteras disponibles para Bolivia: compra, venta, actualización y condiciones.',
  comprarUsdt:
    'Guía paso a paso para comprar USDT en Bolivia: elegir plataforma, crear cuenta, verificar identidad, encontrar un anuncio P2P seguro y evitar errores comunes.',
  bancosUsdt:
    'Qué bancos bolivianos venden USDT o USDC: BCP, Banco BISA, Banco Ganadero, Banco Unión/Yasta y Banco FIE, con límites, comisiones y requisitos verificados.',
  queEsDolarBlue:
    'Qué es el dólar blue, de dónde viene el término y por qué se usa en Bolivia para describir el mercado paralelo de divisas y el precio de USDT en plataformas P2P.',
  faq:
    'Preguntas frecuentes sobre el dólar en Bolivia: metodología de cálculo, validación de fuentes, actualización de datos y avisos legales del sitio.',
  devs:
    'Documentación de la API pública con endpoints de cotización, histórico y estadísticas del dólar en Bolivia.',
  fuentes:
    'Conoce las fuentes, criterios de validación y metodología de la cotización del dólar paralelo y oficial en Bolivia.',
  terminos:
    'Términos de uso de Dólar Paralelo Hoy Bolivia y alcance informativo de las cotizaciones publicadas.',
  privacidad:
    'Política de privacidad y tratamiento de datos de los reportes voluntarios de precios en Bolivia.'
};
