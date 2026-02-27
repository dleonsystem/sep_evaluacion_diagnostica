# BITÁCORA DE CAMBIOS DEL BRANCH ACTUAL

Este archivo documenta los cambios realizados únicamente en este branch.

## [Fecha: 2026-02-11]
- Creación de bitácora de cambios para el branch.
- Cambios recientes: Modificación de la tabla `usuarios` (reordenamiento de columnas, adición de campos `apepaterno` y `apematerno`).
- Revisión de dependencias y objetos relacionados con la tabla `usuarios`.

---
Agrega aquí cada cambio relevante que realices en este branch, indicando fecha y descripción breve.

## [Fecha: 2026-02-11] Importación de escuelas desde CSV
- Se añadió el script `scripts/import_escuelas_from_csv.sql` para importar datos a `escuelas` desde `data/ESCUELAS_VLP.csv`.
- Implementa staging temporal (`stg_escuelas`), deduplicación por `CCT` (prioriza `ID_TURNO=1`) y upsert con `ON CONFLICT (cct)`.
- Normaliza campos vacíos a `NULL`, fuerza `CCT` en mayúsculas y valida email con conversión a `lower`/`NULL`.

## [Fecha: 2026-02-11] Migración dirección en `escuelas`
- Se creó `scripts/migrations/2026-02-11_alter_escuelas_add_address.sql` que agrega columnas:
	`municipio`, `localidad`, `calle`, `num_exterior`, `entre_la_calle`, `y_la_calle`, `calle_posterior`, `colonia`.
- Se actualizó `scripts/import_escuelas_from_csv.sql` para poblar estas columnas desde el CSV.

## [Fecha: 2026-02-11] Unicidad por CCT + turno
- Se creó `scripts/migrations/2026-02-11_alter_escuelas_unique_cct_turno.sql` para ajustar la unicidad de `escuelas` a `(cct, id_turno)` conforme a la documentación.
- Se actualizó `scripts/import_escuelas_from_csv.sql` para hacer upsert `ON CONFLICT (cct, id_turno)` y deduplicar por `(cct, id_turno)`.

## [Fecha: 2026-02-11] Script de prueba importación (50 filas)
- Se añadió `scripts/import_escuelas_from_csv_sample50.sql` que limita la importación a 50 filas tras limpieza y deduplicación.

## [Fecha: 2026-02-11] Flujo de importación vía pgAdmin
- Se creó `scripts/import/01_create_staging_escuelas.sql` para definir `staging.escuelas_csv`.
- Se creó `scripts/import/02_transform_upsert_escuelas_from_staging.sql` para limpiar y hacer upsert a `public.escuelas` desde staging.

## [Fecha: 2026-02-26] Nueva tabla `preguntas_frecuentes`
- Se creó la migración `scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql` para agregar la tabla en una BD existente.
- Estructura incluida: `id`, `pregunta`, `respuesta`, `categoria`, `orden`, `activo`, `created_at`, `updated_at`.
- Se añadieron índices por `categoria` y `(activo, orden)` y trigger para autogenerar `updated_at` en updates.
- Se actualizó `ddl_generated.sql` para reflejar esta nueva tabla e índices.
- Se creó `scripts/seeds/2026-02-26_seed_preguntas_frecuentes.sql` con carga inicial idempotente de preguntas frecuentes.
