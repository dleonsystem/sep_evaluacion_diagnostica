# Análisis del Issue 298

## 1. Resumen ejecutivo
El issue 298 reporta una duplicidad entre `cat_nivel_educativo` (singular) y `cat_niveles_educativos` (plural). Tras el análisis técnico, se confirma que el código fuente y el reporte estructural más reciente ya utilizan exclusivamente la versión **singular**. Sin embargo, la persistencia de la tabla plural en la base de datos (como objeto huérfano) y en la documentación técnica genera ambigüedad y riesgos de integridad. Se propone la eliminación física de la tabla plural y la actualización de toda la documentación relacionada.

## 2. Datos del issue
- Título: [DB][Catálogos] Eliminar duplicidad entre cat_nivel_educativo y cat_niveles_educativos
- Estado: Open
- Labels: fase-1, alta, catalogos, db
- Prioridad aparente: Alta
- Componentes afectados: Base de Datos, Documentación Técnica, Bitácoras
- Fuente consultada: GitHub Issue #298, GitHub MCP Server

## 3. Problema reportado
Coexistencia de dos tablas para el mismo fin. El issue destaca que "el código y las consultas conviven con dos tablas", aunque la evidencia actual muestra que la migración a la versión singular ya se realizó en la capa de aplicación, pero no se completó en la capa de persistencia ni en la narrativa del proyecto.

## 4. Estado actual en el código
- **Backend (GraphQL)**: Se usa exclusivamente `cat_nivel_educativo` en resolvers, data-loaders e informes de métricas.
- **Frontend (Angular)**: No se encontraron referencias a la versión plural.
- **Base de Datos (Estructura)**: El reporte `db-structure-report.txt` indica que todas las llaves foráneas (ej. `escuelas.nivel`, `solicitudes_eia2.nivel`) ya apuntan a la versión singular.
- **Documentación**: `BITACORA_CAMBIOS_DB.md` y `ESTRUCTURA_DE_DATOS.md` todavía describen la versión plural como "imprescindible" para la integridad de `escuelas`.

## 5. Comparación issue vs implementación
### Coincidencias
- El issue detecta la duplicidad que se originó en febrero de 2024 para resolver una dependencia en `escuelas`.

### Brechas
- El issue sugiere que el código aún convive con ambas, pero el análisis del código actual muestra que la convivencia es mayoritariamente documental y potentially física en la DB, no en la lógica de negocio activa.

### Inconsistencias
- `ddl_generated.sql` tiene un comentario declarando la tabla como consolidada, pero no hay un `DROP TABLE` explícito en los scripts de migración recientes.

## 6. Diagnóstico
### Síntoma observado
Divergencia entre la documentación arquitectónica (que pide unificación) y la bitácora histórica (que justifica la duplicidad).

### Defecto identificado
Deuda técnica de limpieza de esquema (Schema rot). La tabla plural `cat_niveles_educativos` es un objeto sobrante (legacy) de una fase de estabilización previa.

### Causa raíz
Migración incompleta. Se actualizó la lógica y las referencias de FK, pero se omitió el paso final de eliminación del objeto original y la actualización de los documentos de trazabilidad.

## 7. Solución propuesta
### Diseño de la solución
1. **Limpieza Física**: Ejecutar un script de migración para eliminar la tabla plural si existe.
   ```sql
   DROP TABLE IF EXISTS cat_niveles_educativos CASCADE;
   ```
2. **Normalización Documental**: Actualizar `BITACORA_CAMBIOS_DB.md`, `ESTRUCTURA_DE_DATOS.md` y `ANALISIS_TRAZABILIDAD_TABLAS_VS_RFS.md` para reflejar que la tabla fue consolidada en la versión singular.
3. **Validación de Integridad**: Asegurar que todas las filas de `cat_nivel_educativo` cubren los códigos históricos del plural (PREESCOLAR, PRIMARIA, SECUNDARIA, TELESECUNDARIA).

### Cambios en archivos
#### [DELETE] cat_niveles_educativos (Físico en DB)
#### [MODIFY] [BITACORA_CAMBIOS_DB.md](file:///c:/ANGULAR/sep_evaluacion_diagnostica/BITACORA_CAMBIOS_DB.md)
#### [MODIFY] [PLAN_TRABAJO_FASE1.md](file:///c:/ANGULAR/sep_evaluacion_diagnostica/PLAN_TRABAJO_FASE1.md)

## 8. Plan de verificación
### Pruebas sugeridas
- **Inspección de Esquema**: Verificar que `\dt cat_niveles_educativos` no devuelva resultados tras la migración.
- **Prueba Funcional de Carga**: Validar que la creación de grupos y escuelas siga funcionando (ya que usan la versión singular).

### Criterios de aceptación
- No existen tablas plurales `cat_niveles_educativos`.
- Ninguna documentación activa recomienda el uso de la versión plural.
- El sistema es funcional y las llaves foráneas son válidas.
