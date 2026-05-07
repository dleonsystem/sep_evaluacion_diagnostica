# Análisis Técnico: Issue #271 - Historial y Descargas (CU-16/CU-17)

## 1. Problema Real
Aunque el sistema cuenta con la funcionalidad de descarga, esta se encuentra **oculta** dentro de una fila expandible que requiere un clic en el registro. El usuario (Responsable CCT) percibe que no tiene una forma integrada porque los botones no son visibles a primera vista (UX deficiente). Además, los fallos previos en CDNs de `gobmx.js` impedían que el clic para expandir funcionara correctamente.

## 2. Causa Raíz
- **UX/UI**: La columna de acciones no es visible directamente en la tabla principal.
- **Feedback Visual**: No hay indicadores claros de que un registro `VALIDADO` ya tiene reportes listos sin necesidad de expandir.
- **Fragilidad**: El sistema dependía de scripts externos para la interactividad de la tabla.

## 3. Implementación Actual vs Requerimiento
| Característica | Estado Actual | Requerimiento |
| :--- | :--- | :--- |
| **Consulta de Historial** | `getSolicitudes` (Admin only) | `getSolicitudesByUser` (Docente/CCT) |
| **Persistencia** | `solicitudes_eia2` tabla lista | Mostrar resultados vinculados |
| **Descargas** | Endpoints de descarga existen | Integrar en el listado de historial |

## 4. Diseño de la Solución
### Backend
- **Query**: Refactorizar `getSolicitudes` para permitir filtrado por CCT del usuario autenticado si no es admin.
- **Tipo**: Extender `SolicitudEia2` con campos de auditoría y enlaces de descarga.

### Frontend
- **Vista**: Nueva pantalla `/historial` en el portal web.
- **Componente**: Tabla responsiva con estados de validación y botones de acción (Descargar Comprobante, Ver Resultados).

## 5. Riesgos y Mitigaciones
- **Seguridad**: Asegurar que un usuario no pueda ver el historial de un CCT que no tiene asignado (Validación técnica en resolver).
- **Rendimiento**: Paginación obligatoria en el historial si el volumen de solicitudes escala.
