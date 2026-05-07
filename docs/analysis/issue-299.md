# Análisis del Issue 299

## 1. Resumen ejecutivo
El issue 299 (GAP-DB-3) reporta que el **Modelo de Niveles de Integración del Aprendizaje (NIA)**, aunque aprobado documentalmente en enero de 2026 (`CORRECIONES_MODELO_NIA.md`), no ha sido materializado en la base de datos. El análisis técnico confirma la existencia de campos obsoletos en la tabla `EVALUACIONES` y la ausencia total de la estructura persistente para los 4 campos formativos del alumno.

## 2. Datos del issue
- Título: [DB][NIA] Crear DDL y migración inicial del modelo NIA aprobado
- Estado: Open
- Labels: fase-1, alta, db
- Prioridad: Alta
- Severidad: RF-04.5 incompleto
- Fuente: GitHub Issue #299

## 3. Problema reportado
La discrepancia entre el diseño institucional aprobado por DGTIC/DGADAE y la implementación física del esquema PostgreSQL. El modelo anterior intentaba reducir el NIA a un campo único en `EVALUACIONES`, cuando la realidad normativa exige 4 NIAs independientes por estudiante (uno por cada campo formativo).

## 4. Estado actual en el código
- **Estructura de Datos**: El reporte `db-structure-report.txt` muestra que la tabla `EVALUACIONES` mantiene las columnas obsoletas `nivel_integracion` y `competencia_alcanzada`.
- **DDL Propio**: No se encontraron las tablas `CAT_NIVELES_INTEGRACION`, `CAT_CAMPOS_FORMATIVOS` ni `NIVELES_INTEGRACION_ESTUDIANTE` en `ddl_generated.sql` ni en el reporte físico de la DB.
- **Seeds**: No hay registros para los catálogos oficiales de NIA.

## 5. Comparación issue vs implementación
### Coincidencias
- El issue refleja fielmente la brecha técnica identificada en la documentación de correcciones.

### Brechas
- Ausencia de 3 tablas maestras.
- Persistencia de 2 campos obsoletos (deuda técnica).
- Falta de lógica de trigger automatizado para el cálculo de promedios por campo formativo.

## 6. Diagnóstico
### Síntoma observado
Incapacidad de generar el "Formato 5" (Reporte individual consolidado) adecuadamente por falta de datos normalizados.

### Defecto identificado
Desconexión entre la fase de diseño arquitectónico y la fase de implementación de base de datos (GAP de materialización).

### Causa raíz
Incumplimiento de ejecución del diseño aprobado en `CORRECIONES_MODELO_NIA.md`. El esquema no ha evolucionado a la par que los requerimientos institucionales.

## 7. Solución propuesta
### Diseño de la solución
1. **Materialización DDL**: Crear las 3 tablas (`CAT_NIVELES_INTEGRACION`, `CAT_CAMPOS_FORMATIVOS`, `NIVELES_INTEGRACION_ESTUDIANTE`) con los tipos y restricciones definidos en el marco institucional.
2. **Poblado de Catálogos**: Sembrar los datos oficiales (ED, EP, ES, SO para NIAs) y los 5 campos formativos base.
3. **Refactorización de EVALUACIONES**: Eliminar las columnas obsoletas para forzar la integridad del nuevo modelo.
4. **Cálculo Automático**: Implementar el trigger `calcular_nia_estudiante()` que actualiza el NIA del estudiante cada vez que se valida una evaluación, garantizando datos siempre frescos para los reportes.

### Cambios en archivos
#### [NEW] [02_implement_nia_model.sql](file:///c:/ANGULAR/sep_evaluacion_diagnostica/graphql-server/scripts/migrations/02_implement_nia_model.sql)
#### [MODIFY] [BITACORA_CAMBIOS_DB.md](file:///c:/ANGULAR/sep_evaluacion_diagnostica/BITACORA_CAMBIOS_DB.md)
#### [MODIFY] [PLAN_TRABAJO_FASE1.md](file:///c:/ANGULAR/sep_evaluacion_diagnostica/PLAN_TRABAJO_FASE1.md)

## 8. Plan de verificación
### Pruebas sugeridas
- **Verificación de Esquema**: Ejecutar `\dt` para asegurar existencia de tablas NIA.
- **Prueba de Trigger**: Insertar evaluaciones para una materia de "Lenguajes" (LEN) y validar que se cree un registro en `NIVELES_INTEGRACION_ESTUDIANTE` con el promedio correcto.
- **Prueba de Restricción**: Validar que el `UNIQUE` impida duplicados de NIA para el mismo estudiante, campo y periodo.

### Criterios de aceptación
- DDL ejecutado y versionado.
- Catálogos poblados con datos oficiales.
- Tabla `EVALUACIONES` limpia de campos obsoletos.
- Lógica de cálculo automática operativa.
