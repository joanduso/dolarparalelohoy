# Dolar Paralelo Hoy Bolivia

Sitio SSR/ISR con Next.js 14 para cotizacion de dolar paralelo (blue) y oficial en Bolivia. Optimizado para SEO, rendimiento y transparencia metodologica.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + Postgres (Neon recomendado)
- Chart.js (cliente minimo)
- Vercel + Vercel Cron

## Requisitos
- Node.js 20+
- Base de datos Postgres

## Configuracion rapida

1. Clona el repo e instala dependencias:

```bash
npm install
```

2. Crea `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

3. Configura Neon (o Postgres) y ejecuta migraciones:

```bash
npx prisma migrate dev
npx prisma generate
```

Para Vercel, el build usa:

```bash
prisma generate && prisma migrate deploy && next build
```

Si la migracion falla, el error se vera en los logs de build de Vercel.

4. Ejecuta el ingestor (mock):

```bash
npm run ingest
```

5. Levanta el sitio:

```bash
npm run dev
```

## Environment Variables (Required)
- `DATABASE_URL`: conexion a Postgres (requerido por Prisma)
- `DECLARED_SALT`: secreto para hashear IP y user-agent en reportes declarados
- `ADMIN_KEY`: clave para el endpoint `/api/rates/refresh`

Configura estas variables en Vercel para Production, Preview y Development.

## Variables de entorno
- `DATABASE_URL`: conexion a Postgres (Neon recomendado)
- `SITE_URL`: URL publica del sitio
- `CRON_SECRET`: secreto para el endpoint interno de ingesta
- `ADMIN_KEY`: clave para refrescar `/api/rates/refresh`
- `DECLARED_SALT`: sal para anonimizar IP y user-agent en reportes declarados
- `HASH_SALT`: legado (usa `DECLARED_SALT`)
- `SOURCE_BASE_URL`: base URL para adaptador real
- `SOURCE_ROBOTS_URL`: URL de robots.txt del proveedor
- `SOURCE_TERMS_URL`: URL de terminos del proveedor
- `BINANCE_P2P_ENABLED`: activar adaptador P2P
- `ENABLE_BINANCE_P2P`: activar Binance P2P (preferido)
- `BINANCE_P2P_URL`: endpoint P2P configurado por el usuario
- `BINANCE_ROBOTS_URL`: robots.txt de Binance
- `BINANCE_TERMS_URL`: terminos de Binance
- `BINANCE_P2P_MIN_USD`: rango minimo de USD
- `BINANCE_P2P_MAX_USD`: rango maximo de USD
- `BINANCE_P2P_TOP_N`: top N anuncios para mediana
- `BINANCE_P2P_CACHE_TTL_MS`: cache para P2P

## Binance P2P (configuracion sugerida)

Copia estos valores en tu `.env` si cuentas con permiso y verificaste robots/ToS:

```
BINANCE_P2P_ENABLED=true
BINANCE_P2P_URL=https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search
BINANCE_ROBOTS_URL=https://p2p.binance.com/robots.txt
BINANCE_TERMS_URL=https://www.binance.com/es/terms
```

## Ingesta y fuentes
- Los adaptadores estan en `lib/sources/`.
- Se incluyen mock adapters sin scraping real.
- `adapter_template.ts` incluye hooks para robots.txt/ToS, cache y rate limit.
- `binance_p2p_adapter.ts` aplica mediana de top N y respeta configuracion de cumplimiento.
- Cada adaptador debe respetar robots.txt/ToS y limites de uso.

## Precio declarado (crowdsourcing)
- Es un indicador secundario para el dolar paralelo.
- Se valida contra el precio base (maximo 15% de desviacion).
- Se publica solo si hay 5 o mas reportes validos en las ultimas 24h.

## Vercel Cron
El endpoint interno esta en `/api/internal/ingest` y requiere `CRON_SECRET`.

1. Mantén `vercel.json` con el path limpio (sin query string):

```json
{
  "crons": [
    {
      "path": "/api/internal/ingest",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

2. Vercel Cron envía el header `x-vercel-cron: 1` automáticamente. Si además quieres protección extra, configura `CRON_SECRET` y usa el header `x-cron-secret` para invocaciones manuales.

## Tests

```bash
npm run test
```

## SEO
- Metadata por ruta en `generateMetadata`.
- JSON-LD para WebSite, FAQ y Datasets.
- `sitemap.ts` y `robots.ts` generados dinamicamente.

## Seguridad
- Endpoint interno protegido por secreto.
- Rate limiting basico en endpoints publicos.
- No hay secretos en el cliente.

## Licencia
MIT.
