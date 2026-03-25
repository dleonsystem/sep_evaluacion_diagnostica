# Análisis Técnico Issue #254 - CU-16: Recepción y Validación de Materiales

## 1. Problema Real
El sistema permite la carga de archivos Excel (`uploadExcelAssessment`), pero la lógica de persistencia de resultados es incompleta o utiliza "mocking" parcial. Falta la materialización robusta de:
- Integración con el **NIA (Número de Identificación de Alumno)** generado dinámicamente.
- Registro de **Resultados de Evaluación** (calificaciones por materia/pregunta).
- Vinculación correcta con **cat_campos_formativos** y **cat_niveles_integracion**.

## 2. Causa Raíz
La implementación inicial se centró en la validación sintáctica del Excel y la subida a SFTP, postergando la inserción masiva de resultados detallados debido a la falta del modelo de base de datos normalizado (que fue resuelto recientemente en el Issue #299).

## 3. Brechas Detectadas
- **NIA**: El código actual no utiliza el trigger `trg_calcular_nia_auto` eficientemente durante la carga masiva.
- **Resultados**: No se están insertando los registros en la tabla `evaluaciones` de forma granular (pregunta por pregunta).
- **Consistencia**: Falta el cruce final entre los estudiantes detectados en el Excel y la tabla `estudiantes` existente para evitar duplicidad de registros bajo diferentes NIAs.

## 4. Diseño de Solución
- Refactorizar el bloque de persistencia en `uploadExcelAssessment`.
- Asegurar que cada estudiante tenga su entrada en `niveles_integracion_estudiante`.
- Implementar la inserción de resultados en `respuestas_estudiante` (o tabla equivalente de resultados).
- Validar el proceso mediante un "Smoke Test" de carga completa.

## 5. Criterios de Aceptación
1. Subida exitosa del Excel.
2. Generación automática de NIA en la base de datos.
3. Existencia de registros de evaluación vinculados a la solicitud.
4. Generación de comprobante PDF con datos reales (dependencia de CU-17).
