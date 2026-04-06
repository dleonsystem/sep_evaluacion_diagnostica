# Auditoría de Sincronización de Base de Datos

## 1. Objetivo
Realizar un análisis exhaustivo para verificar la consistencia entre el código fuente (Backend GraphQL), la documentación de la estructura (`ESTRUCTURA_DE_DATOS.md`), la bitácora de cambios (`BITACORA_CAMBIOS_DB.md`) y el DDL maestro (`ddl_generated.sql`).

## 2. Metodología
1. Inventario de tablas en código vs DDL vs Documentación.
2. Auditoría de campos críticos por módulo (Auth, Carga, Soporte, NIA, Materiales).
3. Verificación de secuencias y triggers.
4. Validación de Semillas (Seeds).

## 3. Inventario General
• **DDL Maestro (`ddl_generated.sql`)**: 63 tablas detectadas.
• **Documentación (`ESTRUCTURA_DE_DATOS.md`)**: 63 tablas documentadas.
• **Bitácora (`BITACORA_CAMBIOS_DB.md`)**: Registro cronológico hasta 2026-04-05.

## 4. Hallazgos Detallados

### 🚨 GAPs Críticos (Código -> DDL/Docs)
| Objeto | Ubicación en Código | Estado en DDL | Estado en Docs | Riesgo |
| :--- | :--- | :--- | :--- | :--- |
| `usuarios_centros_trabajo` | `resolvers.ts:L1389` | **Faltante** | **Faltante** | Alto (Error en creación de usuarios con CCTs múltples) |
| `bitacora_sincronizacion` | `report-consolidator.service.ts:L126` | **Faltante** | **Faltante** | Bajo (Warning en logs de service) |

### ✅ Objetos Sincronizados
| Tabla | Estado | Observaciones |
| :--- | :--- | :--- |
| `usuarios` | Sincronizado | Incluye `apepaterno`, `apematerno`, `email_excel`, etc. |
| `solicitudes_eia2` | Sincronizado | Incluye `hash_archivo`, `consecutivo`, `credencial_id`. |
| `evaluaciones` | Sincronizado | Incluye campo `validado` y `solicitud_id`. |
| `materiales_evaluacion`| Sincronizado | Estructura coincide con CU-01. |
| `tickets_soporte` | Sincronizado | Incluye campos de metadatos de auditoría (#262). |
| `seq_numero_ticket` | Sincronizado | Agregado recientemente. |
| `seq_solicitudes_eia2_consecutivo` | Sincronizado | Presente en DDL. |

## 5. Auditoría de Triggers y Funciones
(Siguiente paso...)
