# Matriz de Trazabilidad Vigente (QA / Backend)

Este documento vincula los requerimientos funcionales (RF) con sus respectivas pruebas unitarias en el servidor GraphQL.

| ID Requerimiento | Descripción | Caso de Prueba | Referencia de Código | Estado de Validación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01 (Seguridad)** | Autenticación de Usuarios (JWT) | `resolvers.Mutation.authenticateUser` | `tests/schema/resolvers.test.ts` | ✅ VALIDADO |
| **RF-02 (Mesa Ayuda)** | Registro de Tickets de Soporte | `resolvers.Mutation.createTicket` | `tests/schema/resolvers.test.ts` | ✅ VALIDADO |
| **RF-03 (Consultas)** | Consulta de Historial de Tickets | `resolvers.Query.getMyTickets` | `tests/schema/resolvers.test.ts` | ✅ VALIDADO |
| **RF-04 (Notif)** | Notificaciones por Correo | `MailingService.sendCredentials` | `src/services/mailing.service.spec.ts` | ✅ VALIDADO |

## Cobertura Global
- **Líneas Alcanzadas**: 20.45%
- **Fecha de Corte**: 2026-03-30
- **Estatus Pipeline CI/CD**: GREEN (Desbloqueado)
