# Análisis del Issue 300

## 1. Resumen ejecutivo
El issue 300 (GAP-CAT) identifica la ausencia de datos maestros oficiales (EIA 2025 / SIGED) en el sistema. El análisis técnico revela que las piezas de validación (`worker-excel.ts`) operan de forma aislada, validando solo el formato sintáctico del CCT pero no su existencia real ni su consistencia con el nivel educativo declarado en la base de datos. Se requiere materializar un seed oficial y actualizar la lógica de validación.

## 2. Datos del issue
- Título: [DB][Catálogos] Sembrar catálogos oficiales EIA 2025 y CCT SIGED para validación
- Estado: Open
- Labels: `fase-1`, `media`, `catalogos`, `db`
- Prioridad: Media
- Severidad: Validación (Dato maestro inexistente)
- Fuente: GitHub Issue #300

## 3. Problema reportado
Discrepancia entre la capacidad del sistema para recibir datos y su capacidad para validarlos contra fuentes de verdad institucionales (SIGED/DGADAE). Actualmente, el sistema acepta cualquier CCT que cumpla con la expresión regular, lo que compromete la integridad del RF-13.

## 4. Estado actual en el código
- **Estructura de Datos**: La tabla canónica en el DDL maestro es `escuelas`, mientras que el script de inicialización `init-db.sql` usa `centros_trabajo` (obsoleto).
- **Validación de Excel**: `excel-parser.ts` usa un regex `/^[0-9]{2}[A-Z]{3}[0-9]{4}[0-9A-Z]$/` pero no realiza consultas a la base de datos.
- **Seeds**: `seed-data.sql` contiene datos de prueba "ficticios" y utiliza una estructura de NIA (`catalogo_niveles_integracion`) que ya fue reemplazada en GAP-DB-3.

## 5. Comparación issue vs implementación
### Coincidencias
- El issue reporta correctamente la falta de un seed oficial versionado.
- El sistema es reproducible en Docker pero se levanta con datos de prueba no institucionales.

### Brechas
- Desconexión entre `init-db.sql` (arquitectura antigua) y `ddl_generated.sql` (arquitectura actual).
- Falta de un script `seed-catalogs-eia2025.sql` que pueble `escuelas`, `cat_entidades_federativas`, `cat_nivel_educativo` y `cat_turnos` con valores reales.

## 6. Diagnóstico
### Síntoma observado
Aceptación de archivos Excel con CCTs inventados o que no pertenecen al nivel escolar detectado.

### Defecto identificado
Validación de "caja negra" en el parser de Excel que no aprovecha los catálogos ya definidos en el esquema.

### Causa raíz
Inconsistencia en la gestión de datos maestros. Se priorizó la funcionalidad de parsing sobre la integridad de datos referenciales durante el Sprint 1 y 2.

## 7. Solución propuesta
### Diseño de la solución
1. **Unificación de Inicialización**: Actualizar `init-db.sql` para que sea un espejo de `ddl_generated.sql`.
2. **Script de Seed Oficial**: Crear `seed-catalogs-eia2025.sql` con una muestra representativa de CCTs oficiales (SIGED) y catálogos EIA 2025 completos (Campos Formativos y NIAs reales).
3. **Refactorización de Validación**: Modificar el flujo de carga masiva para que, post-parsing, se realice un cruce (lookup) contra la tabla `escuelas`.
4. **Actualización de Documentación**: Reflejar el origen de los datos en `ESTRUCTURA_DE_DATOS.md`.

### Archivos a intervenir
#### [NEW] [seed-catalogs-eia2025.sql](file:///c:/ANGULAR/sep_evaluacion_diagnostica/graphql-server/scripts/seed-catalogs-eia2025.sql)
#### [MODIFY] [init-db.sql](file:///c:/ANGULAR/sep_evaluacion_diagnostica/graphql-server/scripts/init-db.sql)
#### [MODIFY] [excel-parser.ts](file:///c:/ANGULAR/sep_evaluacion_diagnostica/graphql-server/src/workers/excel-parser.ts)

## 8. Plan de verificación
### Pruebas sugeridas
- Intentar cargar un Excel con CCT `99ZZZ9999Z` (inválida/inexistente) -> Debe fallar la validación.
- Validar que tras `docker-compose up`, la tabla `escuelas` contenga los registros oficiales sembrados.
- Verificar consistencia de niveles educativos en la carga.
