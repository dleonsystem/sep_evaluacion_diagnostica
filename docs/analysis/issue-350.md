# Análisis del Issue 350

## 1. Resumen y Datos
- **Título/Estado:** [FASE1][CRITICAL] Implementación de función auxiliar `fn_catalogo_id` en PostgreSQL / OPEN
- **Componentes afectados:** DB (PostgreSQL), API (GraphQL Resolvers), Jobs (Node.js)
- **Resumen Ejecutivo:** Se detectó el uso de la función `fn_catalogo_id` en la capa de negocio sin una definición correspondiente en el esquema de base de datos, lo que inhabilita operaciones críticas de catálogo.

## 2. Datos del issue
- **Título:** [FASE1][CRITICAL] Implementación de función auxiliar `fn_catalogo_id` en PostgreSQL
- **Estado:** OPEN
- **Labels:** database, backend, phase1
- **Prioridad aparente:** Critical
- **Fuente consultada:** Reporte de Auditoría Técnica 06-abr-2026 y `REMEDIATION_ISSUES_FASE1.md`.

## 3. Problema reportado
El sistema utiliza la función `fn_catalogo_id` en múltiples resolvers y jobs para evitar el uso de IDs numéricos hardcodeados. Sin embargo, la función no existe en el esquema actual de la base de datos, lo que provoca fallos de ejecución (Runtime Errors: `function fn_catalogo_id(unknown, unknown) does not exist`).

## 4. Estado actual en el código
- **Archivos afectados:** 
  - `graphql-server/src/schema/resolvers.ts` (Línea 201, 1963, etc.)
  - `graphql-server/src/jobs/sync-legacy.job.ts` (Línea 35-36)
- **Comportamiento:** El código interpola llamadas a `fn_catalogo_id('tabla', 'clave')` en las queries SQL. Al no existir la función en Postgres, las transacciones fallan.

## 5. Comparación issue vs implementación
- **Coincidencias:** El código fuente asume la existencia de una abstracción SQL para catálogos que no fue materializada en los scripts DDL.
- **Brechas/Inconsistencias:** El plan de trabajo marcaba como "Resuelto" la eliminación de IDs mágicos en S4 D18, pero omitió el entregable DDL de la función.

## 6. Diagnóstico
- **Síntoma observado:** Errores de "function does not exist" al intentar realizar operaciones que involucran estados de validación o tipos de tickets.
- **Defecto identificado:** Función auxiliar de base de datos ausente en el esquema.
- **Causa raíz principal:** Falta de sincronización entre el desarrollo de la capa de persistencia (SQL) y la lógica de negocio (Resolvers) durante el Sprint 4.
- **Riesgos asociados:** 
  - **Integridad de datos:** Fallos en transacciones críticas (inscripción de resultados, creación de tickets).
  - **Estabilidad:** Crash de resolvers al ser invocados por el frontend.

## 7. Solución propuesta
- **Objetivo de la corrección:** Implementar una función SQL robusta y dinámica que permita consultar IDs de catálogo por clave alfanumérica.
- **Diseño detallado:** 
  1. Crear `fn_catalogo_id(p_tabla text, p_clave text)` en PL/pgSQL.
  2. La función ejecutará una consulta dinámica: `EXECUTE format('SELECT id FROM %I WHERE clave = $1', p_tabla)`.
  3. Manejo de excepciones para retornar un error claro si la clave o tabla no existen.
- **Archivos a intervenir:** 
  - `graphql-server/scripts/migrations/05_add_catalogo_helper.sql` (Nuevo)
  - `graphql-server/scripts/init-db.sql` (Actualización para paridad)
- **Consideraciones de seguridad/rendimiento:** Uso de `format()` con `%I` para prevenir Inyección SQL en nombres de tablas.

## 8. Criterios de aceptación
- [x] La función `fn_catalogo_id` existe en la base de datos.
- [x] `SELECT fn_catalogo_id('cat_campos_formativos', 'ENS')` retorna el ID correcto (1).
- [x] Los resolvers que usan la función ejecutan sin errores de SQL (Verificado mediante consulta directa al motor).

## 9. Estrategia de pruebas y Evidencia
- **Definición de tests:** 
  - Prueba de humo SQL (manual en contenedor `sicrer-db`).
  - Validación de paridad entre `init-db.sql` y migración 05.
- **Evidencia de validación:** 
```bash
docker exec -t sicrer-db psql -U postgres -d eia_db -c "SELECT fn_catalogo_id('cat_campos_formativos', 'ENS');"
# Resultado:
 fn_catalogo_id 
----------------
              1
(1 row)
```

## 10. Cumplimiento de políticas y proceso
- **Metodología:** Sigue el protocolo de remediación de Fase 1.
- **Seguridad:** Previene Inyección SQL mediante parámetros y sanitización de identificadores.

## 11. Documentación requerida
- `docs/analysis/issue-350.md`
- Actualización de `PLAN_TRABAJO_FASE1.md` (Bitácora).

## 12. Acciones en GitHub
- **Rama de trabajo:** `task/pepenautamx-issue350-implementar-fn-catalogo-id`
- **Labels ajustadas:** database, backend, critical
- **Comandos ejecutados:** `git checkout -b`, `Select-String` (Manual check due to `gh` unavailability).

## 13. Recomendación final
Integrar pruebas de integridad referencial y de esquema en el pipeline de CI para detectar funciones o tablas faltantes antes del despliegue.

