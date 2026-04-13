# Análisis del Issue: [Fase 1] Bug: Inconsistencias entre errores web y PDF de resultados #379

## 1. Resumen y Datos
*   **Título/Estado:** Inconsistencias entre errores web y PDF de resultados / Abierto
*   **Componentes afectados:** UI (Angular), MockPdfService (Frontend), PDF Generation
*   **Resumen Ejecutivo:** Se detectó un límite arbitrario de 20 registros en la generación de reportes de errores PDF, además de una truncación de caracteres y falta de agrupación semántica, lo que causa disparidad visual con la interfaz web.

## 2. Datos del issue
*   **Título:** [Fase 1] Bug: Inconsistencias entre errores web y PDF de resultados #379
*   **Estado:** Abierto
*   **Labels:** bug, fase-1, pdf-generation, high-priority
*   **Prioridad aparente:** Alta (Impacta la confianza del usuario en el reporte oficial)
*   **Fuente consultada:** Imágenes adjuntas y análisis de código estático.

## 3. Problema reportado
El usuario indica que las validaciones mostradas en la página web no coinciden totalmente con las que aparecen en el PDF descargado. Específicamente, el PDF omite una gran cantidad de errores que sí son visibles en la interfaz de usuario (UI), dificultando la corrección completa del archivo Excel por parte del docente o directivo.

## 4. Estado actual en el código
En `web/frontend/src/app/services/mock-pdf.service.ts`:
*   Línea 124: `p.errores.slice(0, 20).forEach(...)` -> Limita estrictamente a los primeros 20 errores.
*   Línea 125: `err.substring(0, 95)` -> Trunca los mensajes de error a 95 caracteres.
*   Lógica de dibujo única en `firstPage`: No soporta múltiples páginas si la lista de errores es extensa.
*   Interfaz `PdfErroresPayload`: Solo recibe un array plano de strings (`errores: string[]`), perdiendo la agrupación por hoja y fila que tiene el componente `CargaMasiva`.

## 5. Comparación issue vs implementación
*   **Coincidencias:** El PDF muestra efectivamente una lista reducida de puntos (bullet points) que coinciden con el inicio de la lista web, pero se "corta" prematuramente.
*   **Brechas/Inconsistencias:**
    *   Web: Muestra errores agrupados por Hoja y Ubicación (Fila/Columna).
    *   PDF: Lista plana, limitada a 20 ítems, sin mención clara de la Hoja si no está implícita en el string.

## 6. Diagnóstico
*   **Síntoma observado:** El PDF generado solo contiene una fracción de los errores detectados.
*   **Defecto identificado:** Hardcoding de límites de visualización en el servicio de generación de PDF.
*   **Causa raíz principal:** Implementación simplificada inicial del `MockPdfService` que no contempló casos de carga masiva con cientos de errores potenciales.
*   **Riesgos asociados:**
    *   **Estabilidad:** El PDF puede volverse ilegible si se intentan dibujar cientos de líneas en una sola página.
    *   **Integridad de datos:** El usuario recibe información incompleta, lo que genera ciclos de re-carga innecesarios.

## 7. Solución propuesta
*   **Objetivo de la corrección:** Sincronizar la fidelidad de los datos entre la Web y el PDF, permitiendo visualizar la totalidad (o un límite mucho mayor y configurable) de los errores con el mismo formato de agrupación.
*   **Diseño detallado:**
    1.  Rediseñar `PdfErroresPayload` para aceptar `GrupoErrores[]` en lugar de `string[]`.
    2.  Modificar `MockPdfService` para iterar sobre los grupos de errores.
    3.  Implementar soporte básico para múltiples páginas en `pdf-lib` o, al menos, aumentar el límite y reducir el tamaño de fuente si es necesario.
    4.  Eliminar la truncación de strings (`substring(0, 95)`).
*   **Archivos a intervenir:**
    *   `web/frontend/src/app/services/mock-pdf.service.ts`
    *   `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
*   **Consideraciones de seguridad/rendimiento:** El procesamiento de PDFs muy grandes en el cliente puede consumir memoria; se recomienda un límite prudente (ej. 100-200 errores) si no se implementa paginación completa.

## 8. Criterios de aceptación
*   [ ] El PDF debe mostrar más de 20 errores si existen.
*   [ ] Los errores en el PDF deben mantener la agrupación por Hoja/Fila.
*   [ ] No debe haber truncación arbitraria de mensajes de error a 95 caracteres.

## 9. Estrategia de pruebas y Evidencia
*   **Definición de tests:** Prueba de carga con archivo Excel intencionalmente dañado (múltiples filas vacías en "TERCERO") para generar > 50 errores.
*   **Evidencia de validación:** (Pendiente de ejecución) Comparación visual entre el nuevo PDF generado y la pantalla de resultados del navegador.

## 10. Cumplimiento de políticas y proceso
*   **PSP/RUP:** Fase de Desarrollo - Corrección de Defectos.
*   **OWASP:** No aplica directamente a seguridad de datos sensibles, pero sí a la integridad de la información entregada al usuario.

## 11. Documentación requerida
*   `docs/analysis/issue-379.md` (este documento).
*   Actualización de comentarios JSDoc en el servicio de PDF.

## 12. Acciones en GitHub
*   **Rama de trabajo:** `task/pepenautamx-issue379-inconsistencia-pdf-web`
*   **Labels ajustadas:** `bug-fixed` (al finalizar).
*   **Comandos ejecutados:** `git commit`, `gh issue comment 379`.

## 13. Recomendación final
Migrar la generación de reportes complejos al backend (GraphQL Server) utilizando `pdfmake`, ya que permite un manejo de flujo y paginación mucho más robusto que el dibujo manual con `pdf-lib` en el frontend.
