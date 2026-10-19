# Medición de Search Console cada 28 días

## Línea base del 18 de octubre de 2026

Fuente: ZIP de «Rendimiento → Resultados de búsqueda» para `https://dolarparalelohoy.com/`, tipo **Web**, sin filtros de país, dispositivo, consulta ni página. El filtro de fecha era «Últimos 3 meses». El gráfico contiene datos del **26 de julio al 16 de octubre de 2026** (83 días). El resumen derivado está en [`gsc-baseline-2026-10-18.json`](./gsc-baseline-2026-10-18.json); su SHA-256 identifica el ZIP original sin guardar sus filas en el repositorio.

| Período | Clics | Impresiones | CTR calculado | Posición media estimada |
| --- | ---: | ---: | ---: | ---: |
| Últimos 28 días disponibles, 19 sep.–16 oct. | 13 | 13.554 | 0,0959 % | 10,0 |
| Exportación completa, 26 jul.–16 oct. | 24 | 15.119 | 0,1587 % | 14,5 |

La posición se reconstruye ponderando los valores diarios del CSV, ya redondeados por Search Console. Sirve como aproximación, no como dato de precisión adicional.

En los **83 días** completos, Bolivia registró 23 clics y 1.349 impresiones (CTR 1,70 %). Las variantes con y sin tilde de «dólar blue hoy Bolivia» sumaron 12.976 impresiones y 2 clics en la tabla de consultas visibles. Estas cifras **no corresponden a la ventana de 28 días** y no deben compararse directamente con los cortes de país o consulta de un próximo ZIP de 28 días. La tabla de consultas visibles suma solo 12 clics, frente a los 24 del gráfico; por tanto, no permite repartir todos los clics por intención.

## Próxima revisión

1. Al cabo de 28 días, descargar **un ZIP** desde Search Console → Rendimiento → Resultados de búsqueda, con tipo **Web**, fecha **Últimos 28 días** y sin otros filtros. Esperar a que el gráfico tenga los 28 días completos; la fecha final puede retrasarse respecto al día de descarga. Guardar el ZIP fuera del repositorio.
2. Comparar la ventana nueva con esta línea base:

   ```sh
   python3 scripts/gsc-28d.py '/ruta/al/nuevo.zip' \
     --compare docs/seo/gsc-baseline-2026-10-18.json \
     --output docs/seo/gsc-YYYY-MM-DD.json
   ```

3. Revisar clics, impresiones y CTR calculado, y leer la advertencia de días faltantes o superpuestos. La primera comparación ideal cubre **17 de octubre–13 de noviembre de 2026**, consecutiva a la base. Si Search Console entrega otras fechas, el script las muestra; interpretar esa diferencia antes de atribuir un cambio a SEO.
4. Para el siguiente ciclo, usar el JSON nuevo como `--compare` y conservar únicamente el resumen derivado. No subir el ZIP ni los CSV originales al repositorio.

Si el objetivo es evaluar **las búsquedas hechas desde Bolivia**, hacer como máximo **una segunda exportación** de los mismos 28 días con filtro **País: Bolivia**. Su tabla de consultas permite ver clics, impresiones y posición media por búsqueda; ese ZIP establece una línea base local de 28 días para comparar con el siguiente corte local. El CTR boliviano de 1,70 % anterior abarca 83 días y mezcla posiciones y dispositivos, así que solo describe el período; no permite juzgar si un resultado individual capta suficientes clics. Para una aproximación más justa, agrupar consultas bolivianas por bandas de posición media y revisar el dispositivo; Search Console no ofrece en este ZIP la posición exacta de cada impresión ni un cruce de consulta × país × página.

**Decisión de seguimiento:** priorizar los clics de búsquedas relevantes desde Bolivia y la evolución de `/paralelo` y la portada; usar las impresiones globales y el CTR total como señales de contexto porque el pico de octubre estuvo dominado por visibilidad internacional de dos consultas. Elegir cambios de SEO solo después de revisar el corte local y medirlos en la siguiente ventana de 28 días.
