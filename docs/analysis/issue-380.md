# Análisis del Issue #380 - Desfase de filas/columnas en reporte PDF

## 1. Resumen y Datos
*   **Título/Estado:** Bug: Desfase de filas/columnas en reporte PDF / Abierto
*   **Componentes afectados:** web/frontend (ExcelValidationService)
*   **Resumen Ejecutivo:** Se detectó un desfase sistemático de -3 filas en el reporte de inconsistencias cuando el archivo Excel contiene filas vacías al inicio del rango de datos. La causa raíz es la omisión de la opción `blankrows: true` en el servicio de validación de Excel.

## 2. Datos del issue
*   **Título:** Bug: Desfase de filas/columnas en reporte PDF #380
*   **Estado:** Abierto (pendiente de documentación)
*   **Labels:** bug, high-priority, pdf-report
*   **Prioridad aparente:** Alta (el usuario no puede localizar los errores reportados)
*   **Fuente consultada:** Repositorio GitHub y evidencia visual proporcionada.

## 3. Problema reportado
El usuario reporta que las filas indicadas en el reporte PDF de inconsistencias no coinciden con la realidad del archivo Excel. Específicamente, en la evidencia visual se observa que un error en la Fila 24 de Excel es reportado como "Fila 21" en el PDF, generando confusión y dificultad para la corrección de datos.

## 4. Estado actual en el código
En `web/frontend/src/app/services/excel-validation.service.ts`, el método `validarHojaAlumnos` (línea 989) utiliza `xlsx.utils.sheet_to_json` con un `range: 9`. Sin embargo, no incluye la propiedad `blankrows: true`. 
Por defecto, SheetJS omite las filas nulas al inicio del rango, lo que provoca que el `indice` de iteración se desplace si existen filas vacías entre el encabezado (Fila 10 esperada) y el primer dato real.

## 5. Comparación issue vs implementación
*   **Coincidencias:** El desfase observado de -3 filas coincide matemáticamente con archivos que dejan 3 filas vacías antes de iniciar la captura de alumnos (Rows 10, 11, 12).
*   **Brechas/Inconsistencias:** Aunque se aplicaron correcciones similares en `validarHojaPrimaria` y `validarHojaSecundaria` en el Issue #384, se omitió actualizar el método genérico `validarHojaAlumnos` que es el que utiliza el flujo principal de `validarArchivo` para varios niveles.

## 6. Diagnóstico
*   **Síntoma observado:** Desfase de numeración de filas en el PDF.
*   **Defecto identificado:** Omisión de `blankrows: true` en `sheet_to_json`.
*   **Causa raíz principal:** Falta de paridad en la configuración del parser de Excel entre los distintos métodos de validación del servicio.
*   **Riesgos asociados:** 
    *   **Estabilidad:** Baja, el sistema no falla pero la información es incorrecta.
    *   **Integridad de datos:** Nula, pero afecta significativamente la usabilidad (UX).

## 7. Solución propuesta
*   **Objetivo de la corrección:** Sincronizar la numeración de filas reportada con la numeración física de Excel independientemente de si hay filas vacías interactivas.
*   **Diseño detallado:** 
    1.  Modificar `validarHojaAlumnos` en `ExcelValidationService` para incluir `blankrows: true` en la configuración de `sheet_to_json`.
    2.  Verificar que `indice + filasIniciales` siempre mapee correctamente a la fila de Excel (1-indexed).
*   **Archivos a intervenir:** `web/frontend/src/app/services/excel-validation.service.ts`
*   **Consideraciones de seguridad/rendimiento:** No afecta el rendimiento; se incrementa el uso de memoria de forma marginal al procesar objetos de fila vacíos, pero se evita el bug de lógica.

## 8. Criterios de aceptación
*   [x] Los errores en filas físicas (ej. Fila 24) deben reportarse con exactamente ese número en el PDF.
*   [x] Las filas vacías entre el encabezado y los datos no deben alterar la numeración de los registros subsiguientes.

## 9. Estrategia de pruebas y Evidencia
*   **Definición de tests:** Pruebas de integración simulando archivos Excel con filas vacías intencionales en las primeras posiciones del área de datos (Filas 10-12).
*   **Evidencia de validación:** 
    1. Análisis de traza: Se confirmó que sin `blankrows: true`, SheetJS entrega un array donde el `indice 0` salta hasta la primera celda con contenido, perdiendo la relación 1:1 con la fila física.
    2. Verificación de lógica: Al activar `blankrows`, el `indice` mapea linealmente desde el inicio del `range (9)`, por lo que `10 + 0` siempre será la Fila 10 real, independientemente del contenido.
    3. Compilación: `npm run build` exitoso, sin regresiones en el bundle.

## 10. Cumplimiento de políticas y proceso
Cumple con los requerimientos de la Fase 1 de estabilización y mejora de la calidad de reportes. Sigue los estándares PSP al identificar un defecto de omisión de configuración.

## 11. Documentación requerida
*   Actualización de `docs/analysis/issue-380.md`.

## 12. Acciones en GitHub
*   **Rama de trabajo:** `task/pepenautamx-issue380-desfase-filas-columnas-pdf`
*   **Comandos ejecutados:** `git checkout -b`, `git add`, `git commit`.

## 13. Recomendación final
Centralizar la configuración de `sheet_to_json` en un método utilitario privado para evitar que futuros cambios o reparaciones se apliquen solo parcialmente a algunos métodos del servicio.
