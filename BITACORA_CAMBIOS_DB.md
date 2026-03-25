# Bitácora de Cambios en Base de Datos - Proyecto EIA

Este documento detalla todas las modificaciones realizadas a la base de datos `EvaluacionDiagnosticaQA` para estabilizar el proceso de carga masiva de archivos Excel.

| Fecha | Tabla / Objeto | Tipo de Cambio | Razón / Justificación |
| :--- | :--- | :--- | :--- |
| 2024-02-04 | `estudiantes` | Corrección de lógica de inserción | Se identificó que la tabla no tiene columna `grupo` sino `grupo_id` (UUID). Se ajustó el resolver para crear/buscar el grupo y asociar el ID correcto. |
| 2024-02-04 | `cat_turnos` | Poblado de datos (Seeds) | Estaba vacía. Imprescindible para la creación de escuelas (llave foránea obligatoria). |
| 2024-02-04 | `cat_niveles_educativos` | Poblado de datos (Seeds) | Estaba vacía. Imprescindible para la creación de escuelas (llave foránea obligatoria). |
| 2024-02-04 | `cat_entidades_federativas`| Poblado de datos (Seeds) | Estaba vacía. Imprescindible para la creación de escuelas (llave foránea obligatoria). Se agregaron estados base (Jalisco, CDMX, etc.). |
| 2024-02-04 | `cat_ciclos_escolares` | Poblado de datos (Seeds) | Estaba vacía. Imprescindible para la creación de escuelas (llave foránea obligatoria). Se creó el ciclo '2024-2025'. |
| 2024-02-04 | `cat_grados` | Poblado de datos (Seeds) | Estaba vacía. Necesaria para asociar grupos a un grado académico real (ej: 201 = 1° Primaria). |
| 2024-02-04 | `materias` | Poblado de datos (Seeds) | Estaba vacía. Se registraron las materias base (Lenguajes, Saberes, etc.) para poder guardar valoraciones de alumnos. |
| 2024-02-04 | `periodos_evaluacion` | Poblado de datos (Seeds) | Estaba vacía. Necesaria para la tabla `evaluaciones` (llave foránea obligatoria). |
| 2024-02-04 | `grupos` | Inclusión de campo en INSERT | La tabla requería `nivel_educativo` como NOT NULL. Se ajustó el código para enviarlo durante la creación automática del grupo. |
| 2024-02-04 | `evaluaciones` | Corrección de nombre de columna | El código intentaba insertar en `fecha_aplicacion`, pero el campo real en DB es `fecha_evaluacion`. |
| 2024-02-04 | `solicitudes_eia2` | Inclusión de metadatos | Se incluyeron `archivo_path` y `archivo_size` en la inserción para cumplir con los requerimientos de auditoría y almacenamiento. |
| 2026-02-13 | `grupos` | Ajuste de unicidad | Se cambió la restricción `UNIQUE (escuela_id, nombre)` por `UNIQUE (escuela_id, grado_id, nombre)` para permitir grupos con el mismo nombre en diferentes grados (RF-02.7). |
| 2026-02-13 | `solicitudes_eia2`, `evaluaciones` | Soporte de versiones y duplicados | Se agregó `hash_archivo` y `solicitud_id` para permitir carga de múltiples archivos y control de duplicados (RF-XX). |
| 2026-02-23 | `solicitudes_eia2` | Adición de `usuario_id` (FK) | Se añadió el campo `usuario_id` para rastrear qué usuario realizó la carga y aplicar filtros de privacidad por rol (solo el autor puede ver sus cargas, excepto administradores). |
| 2026-02-23 | `solicitudes_eia2` | Adición de `resultados` (JSONB) | Se añadió el campo `resultados` para almacenar el histórico de archivos de resultados (PDFs, imágenes) subidos al SFTP por el administrador. |
| 2026-02-23 | `solicitudes_eia2` | Limpieza de registros huérfanos| Se vincularon retroactivamente todos los registros que tenían `usuario_id` NULL con los usuarios responsables de sus respectivos CCTs para mantener la integridad de la privacidad. |
| 2026-03-12 | `materiales_evaluacion` | Creación de tabla | Implementación de CU-01 para la publicación de materiales EIA, FRV y Rúbricas por parte de administración. |

### Notas Adicionales:
- **Catálogos Duplicados:** Resuelto. Se consolidó el uso de `cat_nivel_educativo` como fuente única de verdad y se eliminó la tabla plural `cat_niveles_educativos` de la base de datos (GAP-DB-2).
- **Mapeo de Tipos:** Se solucionaron errores de `smallint` asegurando que los IDs enviados desde Node.js fueran numéricos y no strings u objetos vacíos.
