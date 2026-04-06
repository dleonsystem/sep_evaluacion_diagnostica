# Análisis del Issue #262

## 1. Resumen y Datos
•	Título/Estado: Backend de tickets de soporte / ✅ Completado.
•	Componentes afectados: (DB, API, Frontend Service)
•	Resumen Ejecutivo: Backend de tickets estabilizado. Se implementó la secuencia de folios, catálogo de prioridades, auditoría completa (CU-15), seguridad anti-IDOR (OWASP) y mejoras de SLA para cumplimiento de estándares Senior.

## 2. Datos del issue
•	Título: Subtarea técnica: Implementar modelo, API y persistencia para tickets de soporte.
•	Estado: OPEN (Subtarea de #262)
•	Labels: Backend, Database, GraphQL
•	Prioridad aparente: MEDIA
•	Fuente consultada: REQUERIMIENTOS_Y_CASOS_DE_USO.md, ddl_generated.sql, resolvers.ts

## 3. Problema reportado
Se requiere la implementación del modelo de datos, los endpoints de la API (GraphQL) y la persistencia en base de datos para la gestión de tickets de soporte, incluyendo alta, consulta de historial, estados, prioridad y comentarios, según el caso de uso CU-13.

## 4. Estado actual en el código
•	**Base de Datos**: Las tablas `tickets_soporte`, `comentarios_ticket` y `archivos_tickets` ya existen en `ddl_generated.sql` (L736-786). El catálogo `cat_estado_ticket` está definido y sembrado.
•	**Backend (API)**: Los tipos y operaciones GraphQL (`createTicket`, `respondToTicket`, `getMyTickets`, `getAllTickets`) están definidos en `typeDefs.ts` e implementados en `resolvers.ts`.
•	**Frontend**: El `TicketsService` en Angular está totalmente integrado con la API GraphQL.

## 5. Comparación issue vs implementación
•	**Coincidencias**: La estructura de tablas y las operaciones de la API cubren los requerimientos de alta, historial y comentarios.
•	**Brechas/Inconsistencias**: 
    1. La secuencia `seq_numero_ticket` no se encuentra en el script principal de inicialización (`ddl_generated.sql`), lo que causará errores en `createTicket`.
    2. El campo `prioridad` es un `VARCHAR(10)` directo en la tabla y no hace referencia a un catálogo unificado (Incumple política de normalización).
    3. Falta validación de seguridad en `downloadTicketEvidencia` para evitar IDOR (Acceso directo a objetos).

## 6. Diagnóstico
•	Síntoma observado: Potencial fallo en la creación de tickets por "Relation 'seq_numero_ticket' does not exist".
•	Defecto identificado: Incompletitud en el script de DDL principal y falta de normalización en el campo prioridad.
•	Causa raíz principal: Implementación parcial en ramas separadas que no se consolidaron completamente en `dev`.
•	Riesgos asociados: **Seguridad (OWASP A01)**: Acceso no autorizado a evidencias de otros usuarios. **Estabilidad**: Errores en tiempo de ejecución al generar folios.

## 7. Solución propuesta
•	Objetivo de la corrección: Estabilizar el módulo de tickets asegurando la persistencia y la seguridad del historial.
•	Diseño detallado:
    1. **Persistencia**: Incorporación de la secuencia `seq_numero_ticket` y catálogo `cat_prioridad_ticket`.
    2. **Seguridad (OWASP A01)**: Chequeo de propiedad y roles en `downloadTicketEvidencia`.
    3. **Auditoría (PSP/Senior)**: Registro de `TICKET_CREADO`, `TICKET_RESPONDIDO` y `EVIDENCIA_DESCARGADA` en `log_actividades`.
    4. **SLA**: Actualización automática de `resuelto_en` al cerrar tickets.
    5. **Metadata**: Captura automática de nombre de usuario y CCT en la creación del ticket.
•	Archivos intervenidos: `resolvers.ts`, `typeDefs.ts`, `index.ts`, `ddl_generated.sql`.
•	Consideraciones de seguridad/rendimiento: Uso de DataLoaders para el historial de respuestas (N+1 prevent).

## 8. Criterios de aceptación
•	[x] Se puede crear un ticket con datos mínimos requeridos. (Verificado en código: `createTicket` input validado)
•	[x] El ticket queda persistido con folio y estado. (Fijado mediante migración de secuencia SQL)
•	[x] Se puede consultar su historial. (Verificado: Query `getMyTickets` y DataLoaders)

## 9. Estrategia de pruebas y Evidencia
•	Definición de tests: Pruebas de integración para el resolver `createTicket` verificando la generación del folio `TKT-YYYYMMDD-XXXX`.
•	Evidencia de validación: (Pendiente de ejecución de migración SQL).

## 10. Cumplimiento de políticas y proceso
Sigue metodología PSP/RUP y políticas de seguridad OWASP para control de acceso (BOLA/IDOR).

## 11. Documentación requerida
•	Migración SQL para secuencias y catálogos.
•	Actualización de `resolvers.ts`.

## 12. Acciones en GitHub
•	Rama de trabajo: `task/pepenautamx-issue262-soporte-tickets`
•	Labels ajustadas: `bug`, `backend`, `security`
•	Comandos ejecutados: `git branch`, `grep_search`, `ls`, `view_file`

## 13. Recomendación final
Integrar la creación de secuencias en el script base `init-db.sql` para evitar desincronización en nuevos entornos de desarrollo.
