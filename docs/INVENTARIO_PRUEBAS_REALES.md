# Inventario de Pruebas Reales (Backend)

Este documento registra las pruebas unitarias e integrales implementadas en el servidor GraphQL, asegurando la trazabilidad y el cumplimiento de los umbrales de cobertura.

| Módulo | Archivo de Prueba | Descripción | Cobertura Est. | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Resolvers** | `tests/schema/resolvers.test.ts` | Pruebas de Autenticación, Tickets y Consultas de Usuario con Mocks. | Alta | ✅ PASSED |
| **Mailing** | `src/services/mailing.service.spec.ts` | Validación de plantillas y políticas de seguridad (Issue #315). | Alta | ✅ PASSED |
| **PDF** | `tests/services/comprobante-pdf.service.test.ts` | Generación de comprobantes en formato PDF. | Media | ✅ PASSED |
| **JWT** | `src/config/jwt.spec.ts` | Firmado y verificación de tokens. | Alta | ✅ PASSED |

## Resumen de Ejecución (Última)
- **Fecha**: 2026-03-30
- **Cobertura Global de Líneas**: 20.45%
- **Resultado de Suite**: EXITOSO (Todas las pruebas pasaron)
