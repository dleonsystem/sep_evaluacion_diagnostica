# Análisis del Issue 384

## 1. Resumen y Datos
* **Título/Estado**: Carga de alumnos con valoraciones parciales / ABIERTO
* **Componentes afectados**: API (GraphQL Server - Worker de Excel), UI (Carga Masiva)
* **Resumen Ejecutivo**: El sistema rechaza archivos de Excel si un alumno no tiene valoraciones capturadas. Se requiere permitir filas sin valoraciones (omitiendo al alumno) pero seguir rechazando filas con valoraciones incompletas (parciales).

## 2. Datos del issue
* **Título**: Regla de Negocio: Carga de alumnos con valoraciones parciales #384
* **Estado**: Open
* **Labels**: enhancement, business-rule
* **Prioridad aparente**: Alta
* **Fuente consultada**: USER_REQUEST / GitHub Issue #384

## 3. Problema reportado
Descripción detallada de la falla o requerimiento según el reporte original:
El sistema actual no permite que un alumno tenga valoraciones vacías si su nombre y metadatos están presentes. Si un alumno no tiene ninguna evaluación en toda la fila, el archivo debería considerarse correcto (el sistema debería simplemente no procesar a ese alumno o aceptarlo sin errores). Sin embargo, si el alumno tiene al menos una valoración pero le faltan otras (valoraciones parciales), el sistema sí debe marcar el error.

## 4. Estado actual en el código
En el archivo `graphql-server/src/workers/excel-parser.ts`, la función `extractStudents` realiza lo siguiente:
* Línea 327-330: Descarta filas completamente vacías (sin nombre ni evaluaciones).
* Línea 395-420: Itera sobre las columnas de valoración y, si alguna es `null` (vacía en Excel), agrega un error a `erroresFila` y posteriormente a `allErrors`.
* No existe una distinción entre "fila sin ninguna valoración" y "fila con algunas valoraciones". Cualquier celda vacía en el rango de evaluación dispara un error si la fila tiene datos de identidad.

## 5. Comparación issue vs implementación
* **Coincidencias**: El sistema valida correctamente el rango de valores (0-3) y la estructura general.
* **Brechas/Inconsistencias**: La lógica actual es binaria: o la fila está totalmente vacía de extremo a extremo, o debe estar totalmente llena. No se contempla el caso intermedio lícito donde un alumno listado no tiene evaluaciones (debe ser ignorado o permitido sin error).

## 6. Diagnóstico
* **Síntoma observado**: El cargador masivo falla con errores de "Falta la valoración" para alumnos que por alguna razón no fueron evaluados (fila de evaluaciones vacía).
* **Defecto identificado**: Validación estricta obligatoria para todas las celdas de evaluación si la identidad del alumno existe.
* **Causa raíz principal**: Falta de lógica de discriminación en `extractStudents` para diferenciar entre ausencia total de evaluaciones y falta de datos en una serie parcial.
* **Riesgos asociados**: 
    * **Integridad de datos**: Si se permite carga parcial inadvertidamente, los promedios podrían ser erróneos.
    * **Estabilidad**: No se identifican riesgos mayores de estabilidad.

## 7. Solución propuesta
* **Objetivo de la corrección**: Implementar una lógica de validación condicional:
    1. Si todas las valoraciones de la fila son nulas -> No marcar error y omitir al alumno del arreglo final.
    2. Si al menos una valoración está presente pero hay celdas vacías -> Marcar error de "Falta valoración" en las celdas vacías.
* **Diseño detallado**:
    * En `extractStudents`, antes de iterar para generar errores, contar el número de valoraciones no nulas.
    * Si `nonNullCount === 0`, retornar tempranamente (skip student).
    * Si `nonNullCount > 0` y hay nulos, proceder con la lógica de errores actual.
* **Archivos a intervenir**: 
    * `graphql-server/src/workers/excel-parser.ts`
* **Consideraciones de seguridad/rendimiento**: La validación se mantiene en el worker, fuera del hilo principal de la API. Se sigue cumpliendo con la sanitización de inputs.

## 8. Criterios de aceptación
* [x] El sistema acepta archivos donde un alumno tiene nombre pero 0 valoraciones (no genera error).
* [x] El sistema rechaza archivos donde un alumno tiene algunas valoraciones pero le faltan otras en la fila.
* [x] El sistema sigue rechazando valoraciones fuera del rango 0-3.
* [x] Si al menos una hoja tiene datos válidos, el proceso continúa.

## 9. Estrategia de pruebas y Evidencia
* **Definición de tests**:
    1. Test de integración en `tests/workers/issue-384.test.ts` con Buffer de Excel simulado que contenga:
        * Alumno A: Todas las valoraciones (OK).
        * Alumno B: 0 valoraciones (Debe ser ignorado, no error).
        * Alumno C: Valoraciones parciales (Debe generar Error).
* **Evidencia de validación**:
```bash
PASS tests/workers/issue-384.test.ts
  Issue #384: Carga de alumnos con valoraciones parciales
    √ debe saltar alumnos sin valoraciones sin marcar error (28 ms)
    √ debe rechazar alumnos con valoraciones parciales (algunas sí, otras no) (5 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

## 10. Cumplimiento de políticas y proceso
* Siguiendo PSP para el registro de defectos y RUP para el análisis de casos de uso de negocio.
* OWASP: Validación estricta de tipos de datos y rangos para prevenir inyección de datos o desbordamientos.

## 11. Documentación requerida
* `docs/analysis/issue-384.md`
* Actualización de `excel-parser.ts`

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue384-carga-parcial-alumnos`
* **Labels ajustadas**: `in-progress`
* **Comandos ejecutados**: `git checkout`, `git pull`, `git checkout -b`

## 13. Recomendación final
Se recomienda implementar pruebas unitarias automatizadas específicas para el parser de Excel que cubran estos casos de borde (edge cases) para evitar regresiones en futuras actualizaciones de las plantillas.
