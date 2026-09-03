# Respaldo del histórico paralelo

`parallel-daily.json` es la copia procesada que usa el sitio si la fuente histórica remota no responde.

- Fuente: [Dólar Blue Bolivia](https://www.dolarbluebolivia.click/datos/)
- Captura cruda: archivada por contenido fuera del árbol público del repositorio.
- Integridad: el SHA-256 del archivo crudo está incluido en `metadata.raw_sha256`.
- Transformación: `npm run build:parallel-history -- <archivo.csv>`.
- Validación: se rechazan fechas inválidas, valores no finitos, ceros y cotizaciones fuera de Bs 3–30.
- Continuidad: el generador falla si detecta un día faltante.

La serie derivada no reemplaza la captura cruda. Ambas se conservan separadas para que cualquier actualización sea auditable y reproducible. Los términos de la fuente primaria siguen siendo los de su propietario.
