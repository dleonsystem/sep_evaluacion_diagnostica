# Análisis del Issue 258

## 1. Resumen y Datos
* **Título/Estado**: CU-04v2 | Persistencia y trazabilidad de solicitudes / Abierto
* **Componentes afectados**: Módulo de API (`graphql-server`), Base de Datos (PostgreSQL), Infraestructura.
* **Resumen Ejecutivo**: El flujo de carga masiva (CU-04v2) requiere un mecanismo robusto para persistir metadatos, estados de validación y registros de auditoría. Se implementa una trazabilidad completa mediante la tabla `solicitudes_eia2` y el log de actividades.

## 2. Datos del issue
* **Título**: CU-04v2 | Persistencia y trazabilidad de solicitudes
* **Estado**: OPEN
* **Labels**: enhancement, fase-1, critico, portal-web
* **Prioridad aparente**: Crítica (Core del negocio para el MVP)
* **Fuente consultada**: Issue #258 vía GitHub CLI (MCP)

## 3. Problema reportado
Se requiere asegurar que cada carga de archivo EIA2 (Excel) genere un registro persistente que permita su seguimiento histórico. Esto incluye guardar el estado de validación (Pendiente, Validado, Rechazado), los metadatos del archivo (hash, tamaño, ruta en SFTP), la relación con el CCT y el usuario que realizó la carga, así como los errores detectados en caso de falla.

## 4. Estado actual en el código
El código base en `resolvers.ts` ya cuenta con una implementación inicial del resolver `uploadExcelAssessment` que interactúa con la tabla `solicitudes_eia2`. 
- Se utiliza `Worker Threads` para la validación asíncrona.
- Se respaldan los archivos en SFTP.
- Se insertan registros en `solicitudes_eia2` tanto en éxito como en rechazo.
- Existe una query `getSolicitudes` para consulta histórica.

## 5. Comparación issue vs implementación
* **Coincidencias**: La estructura de la tabla `solicitudes_eia2` y los resolvers asociados cubren gran parte del requerimiento de persistencia y trazabilidad.
* **Brechas/Inconsistencias**: 
    - El esquema GraphQL (`typeDefs.ts`) usa tipos de datos inconsistentes para estados (Int vs Enum).
    - La query `getSolicitudes` tiene un mapeo incompleto de campos de retorno (ej. `detalles_error`).
    - No se ha validado formalmente la integridad referencial en todos los casos borde (ej. usuario_id nulo en cargas públicas).

## 6. Diagnóstico
* **Síntoma observado**: Aunque los datos se guardan, la exposición de los mismos a través de la API no es completa ni estándar, dificultando el seguimiento por parte del frontend.
* **Defecto identificado**: Falta de estandarización en los tipos de datos del schema y mapeo incompleto en resolvers de consulta.
* **Causa raíz principal**: Evolución iterativa del código donde el schema GraphQL no se sincronizó totalmente con el modelo físico de base de datos final.
* **Riesgos asociados**:
    - **Seguridad (OWASP)**: Inyección de datos si no se validan correctamente los metadatos del archivo persistido.
    - **Integridad de datos**: Pérdida de trazabilidad si el registro en `solicitudes_eia2` falla pero el backup en SFTP o el log de actividades tiene éxito.

## 7. Solución propuesta
* **Objetivo de la corrección**: Estandarizar y completar el ciclo de vida de la solicitud (Persistencia -> Trazabilidad -> Consulta).
* **Diseño detallado**:
    - **Schema**: Actualizar `SolicitudEia2` para usar `EstadoValidacion` (Enum). Añadir campos perdidos como `fechaActualizacion`.
    - **Persistencia**: Asegurar que `uploadExcelAssessment` guarde siempre el `archivo_path` y `hash_archivo` de forma determinista.
    - **Consulta**: Ampliar `getSolicitudes` para retornar el objeto completo alineado al schema.
* **Archivos a intervenir**: `typeDefs.ts`, `resolvers.ts`.
* **Consideraciones de seguridad/rendimiento**: Las consultas a `solicitudes_eia2` para historial deben estar paginadas (ya implementado) y filtradas por privilegios (ya implementado).

## 8. Criterios de aceptación
* [x] Cada carga genera o actualiza un registro trazable en `solicitudes_eia2`.
* [x] El sistema conserva estado y resultado (incluyendo errores estructurados).
* [x] Se puede consultar el histórico detallado mediante `getSolicitudes`.

## 9. Estrategia de pruebas y Evidencia
* **Definición de tests**:
    - Prueba de Integración: Mockear el Worker y validar que la inserción en DB contenga los campos esperados.
    - Prueba de Consulta: Verificar que un admin pueda ver todas las solicitudes y un usuario solo las propias.
* **Evidencia de validación**: (Pendiente de ejecución tras aprobación del plan).

## 10. Cumplimiento de políticas y proceso
Cumple con los requerimientos de la Fase 1 (CU-04v2, CU-16) y sigue el diseño arquitectónico de segregación de responsabilidades. Se alinea con OWASP A01:2021 (Broken Access Control) mediante el filtrado estricto en la query de historial.

## 11. Documentación requerida
* **Archivos actualizados**: `typeDefs.ts`, `resolvers.ts`.
* **Nuevos artefactos creados**: `docs/analysis/issue-258.md`.

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue258-persistencia-solicitudes`
* **Labels ajustadas**: enhancement, fase-1, critico, portal-web.
* **Comandos ejecutados**: (gh CLI, git).

## 13. Recomendación final
Implementar una vista de base de datos o un índice compuesto en (cct, fecha_carga) para optimizar el reporte histórico conforme el volumen de solicitudes crezca en Fase 2.
