# Análisis del Issue: [Fase 1] Bug: Fallo de validacion de encabezados en Secundaria (B5-F8) #381

## 1. Resumen Funcional
Se han detectado dos fallas críticas en las reglas de validación de carga masiva que impiden la operación fluida de los directivos:
1.  **Rigidez en Encabezados:** El sistema valida celdas informativas (B5-F8) en hojas de Secundaria, bloqueando la carga si el formato visual tiene ligeras variaciones.
2.  **Validación de Hojas Vacías:** El sistema exige que TODAS las hojas de grado (1°, 2°, 3°, etc.) contengan al menos un alumno, de lo contrario, invalida el archivo completo, incluso si otras hojas están correctamente llenas.

## 2. Casos de Uso Impactados
*   **CU-04:** Carga de Archivo de Evaluación.
*   **CU-04v2:** Validación Técnica de Formato (PSP/RUP).

## 3. Reglas de Negocio Detectadas
*   **RN-381-01:** En nivel Secundaria, la validación de estructura de datos debe omitir encabezados superiores e iniciar estrictamente en la Fila 10.
*   **RN-381-02:** Un archivo es válido a nivel de datos siempre que al menos una hoja de grado contenga registros válidos, independientemente de si otras hojas están vacías.

## 4. Componentes Técnicos Involucrados
*   **Servicio Frontend:** `ExcelValidationService` (Angular).
    *   Método: `validarSecundariaWorkbook`
    *   Método: `validarHojaSecundaria` / `validarHojaPrimaria`
    *   Método: `validarEncabezadosSecundaria`

## 5. Riesgos Funcionales y Técnicos
*   **Riesgo Técnico:** La omisión de encabezados podría dificultar la detección de columnas desplazadas si el usuario inserta columnas nuevas a la izquierda de la 'A'.
*   **Riesgo Funcional:** Permitir archivos con 0 alumnos totales si no se agrega un contador acumulado al final de la iteración de hojas.

## 6. Recomendación de Atención
1.  **Desactivar** la validación estricta de encabezados en secundaria para mejorar la resiliencia del motor de carga.
2.  **Cambiar** el status del error "No se encontraron estudiantes" de `error` a `info/advertencia` dentro del proceso de cada hoja.
3.  **Implementar** una validación final que cuente el acumulado de la variable `alumnos[]`. Si el acumulado es 0 tras procesar todas las hojas, entonces y solo entonces, marcar el error global.

## 7. Plan de Ejecución (PSP)
*   [ ] Modificar `validarSecundariaWorkbook` para omitir `validarEncabezadosSecundaria`.
*   [ ] Ajustar `validarHojaSecundaria` y `validarHojaPrimaria` para no inyectar errores si el conteo es 0.
*   [ ] Actualizar la lógica de cierre de validación con chequeo de `alumnos.length > 0`.
