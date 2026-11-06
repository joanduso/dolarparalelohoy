# Diagnóstico local SEO/AEO — 6 de noviembre de 2026

## Alcance y límites
Revisión sin navegador, búsquedas web, consultas a producción ni servicios externos. Código local en 864aa43, ZIP Search Console recibido el 6 de noviembre y capturas de esta conversación. No se verificó si producción cambió desde el despliegue anterior. No se modificó la aplicación.

## Evidencia de rendimiento
Filtro Bolivia, propiedad HTTPS, 4 de agosto–3 de noviembre: 22 clics, 1.415 impresiones, CTR 1,55 %, posición 48,87 según Países.csv.
Comparación reconstruida desde Gráfico.csv:
- 9 septiembre–6 octubre: 397 impresiones, 11 clics, CTR 2,77 %, posición ponderada aproximada 42,79.
- 7 octubre–3 noviembre: 397 impresiones, 4 clics, CTR 1,01 %, posición ponderada aproximada 45,35.
La comparación cambia la mezcla de consultas; no mide el movimiento de una consulta fija. El archivo no tiene comparación por consulta/página. Muestra pequeña y solo cinco días posteriores al cambio del 29 de octubre.

La captura filtrada por consulta muestra portada 34 impresiones, histórico 29, blue 27, paralelo 12, oficial 9 y calculadora 2. Varias URLs aparecen para una consulta; no prueba canibalización, alternancia temporal ni una penalización. Las impresiones por página no deben sumarse para inferir búsquedas únicas.

## Hallazgos comprobados

### 1. Validación insuficiente de la fuente externa — prioridad alta, confianza alta
lib/p2pIndex.ts, fetchP2PIndex, comprueba tipos y frescura, pero admite compra cero, venta negativa y cero fuentes. Se reprodujo con fetch simulado, sin red: {buy:0,sell:-1,median:0,sourceCount:0,timestamp:ahora} fue aceptado.
Las páginas pueden tratar ese objeto como una cotización disponible; /paralelo determina estado OK por presencia del objeto.
Acción: validar precios finitos positivos y número entero positivo de fuentes; rechazar entrada inválida y usar respaldo. No imponer una relación compra/venta sin confirmar la convención del proveedor.
No consta que producción haya recibido esos valores ni que expliquen posiciones.

### 2. Fuente y frescura no se presentan con un criterio único — prioridad alta, confianza alta
Portada y /paralelo usan fetchP2PIndex con fallback a getSiteData; blue usa getParallelQuote, que aplica una comprobación de frescura adicional al respaldo propio.
En portada, parallelSourceNote decide que un índice es multi-exchange solo si indexSources > 1; si el índice válido tiene una fuente puede etiquetarlo como Binance o como no disponible, aunque los precios proceden del índice externo.
En /paralelo, el respaldo usa sampleSize como evidencia y llega a decir «Confirmado por N muestras». Muestras de anuncios no son fuentes independientes.
La portada promete «Actualización cada 10 minutos»; revalidate=600 es una política de caché y no garantiza un dato nuevo ni una actualización periódica independiente de solicitudes.
Acción: resolver una sola cotización con precio, proveedor, hora original, estado y evidencia; compartirla entre páginas y ajustar las etiquetas al estado real. Preservar fecha y procedencia de los respaldos.

### 3. Solapamiento editorial y de enlaces — prioridad media, confianza alta sobre el código
Portada, /paralelo y blue tienen títulos/encabezados de cotización de compra y venta hoy. /paralelo se presenta como metodología, pero conserva el encabezado «Precio del dólar paralelo en Bolivia hoy» y una respuesta inmediata de compra/venta.
Portada enlaza /paralelo como «dólar paralelo de hoy» y «Dólar paralelo hoy», aunque se propone que la portada sea la referencia principal para esa intención. Otras páginas ya enlazan la portada correctamente; no se parte de cero.
Acción propuesta: portada para cotización general; /paralelo para composición y metodología del índice; blue para significado y diferencias; histórico para fechas y evolución. Ajustar títulos, encabezados y textos de enlaces coherentemente sin eliminar utilidad ni redirigir URLs solo por esta captura.
Hipótesis: una diferenciación más clara puede ayudar. No se puede atribuir causalmente el ranking a este solapamiento.

### 4. Confianza editorial incompleta — prioridad media, confianza alta
/acerca-de explica independencia, política editorial y enlaza el repositorio, pero no identifica una persona o entidad responsable ni una vía explícita de contacto/correcciones.
La portada describe promedios diarios y filtros de forma genérica, mientras la cotización principal puede proceder de la mediana de un proveedor externo, con metodología propia.
Acción: distinguir cotización externa, respaldo propio e histórico; añadir responsable y canal de corrección solo con información real y autorizada. No inventar credenciales.

### 5. Tendencias existentes, con ventana anclada al último dato — prioridad media
Ya existen gráfico, tablas históricas y TrendSummary en portada; /paralelo tiene tendencias de 7 y 30 días. No hace falta recrearlos.
computeTrend calcula la ventana desde el último punto, no desde hoy. TrendSummary dice «últimos N días»: si la serie se atrasa, esa expresión puede sugerir una actualidad que no tiene. Las fechas sí se muestran, lo que reduce el riesgo.
Acción: indicar fecha de cierre y cobertura o condicionar la expresión «últimos días» a la frescura real. No alterar el histórico.

## Lo que no está demostrado
- No se observó en el código revisado un noindex o canonical ajena que bloquee portada, paralelo o blue.
- Hay metadatos en las 27 rutas del inventario y sitemap/robots presentes; eso no garantiza indexación.
- Las cotizaciones y tendencias se calculan en componentes de servidor; no son exclusivamente una aplicación vacía que exige JavaScript para todo el contenido. Suspense por sí mismo no demuestra un fallo de rastreo.
- No se midieron Core Web Vitals, enlaces externos, competidores, estado actual de seguridad ni citas en asistentes de IA.
- La asociación histórica de /privacidad con una web de apuestas sigue sin causa identificada; no demuestra por sí sola un ataque o penalización y este diagnóstico offline no confirma su resolución en el índice.
- llms.txt y FAQ existen, pero no prueban presencia AEO. La coherencia de la respuesta, procedencia y frescura es el trabajo verificable aquí.

## Orden de ejecución recomendado
1. Unificar y validar cotización/frescura/procedencia; corregir etiquetas y cubrir fallos reales con pruebas sin red.
2. Diferenciar las tres páginas y sus enlaces; conservar histórico y herramientas útiles.
3. Mejorar identificación editorial y resúmenes existentes, sin contenido masivo nuevo.

## Medición
Verificar primero exactitud, origen y fecha en todos los caminos de datos; luego medir impresiones y posición de consultas fijas en Bolivia por página y dispositivo. Revisar señales a 14 días y comparar ventanas completas de 28 días; no prometer top 10 ni atribuir cambios pequeños a una única acción. No repetir solicitudes de indexación como mecanismo para subir posiciones.

## Implementación posterior autorizada
Se endureció la validación de precios y fuentes; portada, índice y blue comparten el resolvedor de cotización reciente con procedencia explícita. Se corrigieron las atribuciones de una sola fuente y se eliminaron equivalencias entre muestras y fuentes. Se diferenciaron títulos, encabezados y enlaces de las páginas y se precisó el cierre de las tendencias. Se añadió una indicación de correcciones a través del repositorio público, sin inventar identidad ni credenciales editoriales.
Validación local: 83 pruebas aprobadas, compilación de producción completa y revisión de canonical/título/encabezado del HTML generado. La compilación toleró indisponibilidad local de la base de datos en componentes existentes; no se verificó la disponibilidad de esa base en producción mediante esta comprobación.
