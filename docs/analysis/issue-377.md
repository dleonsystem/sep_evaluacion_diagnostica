# Análisis de Incidencia: Lógica de Reemplazo por Duplicidad

**ID del Issue:** #377
**Estado:** RESUELTO (Superado por mejora técnica)
**Prioridad:** Alta (Fase 1)

## Descripción del Problema
Se requería que el sistema detectara si un usuario intentaba subir un archivo que ya existía (basado inicialmente en Nombre y CCT) para solicitar su reemplazo y limpiar los registros previos, evitando la duplicidad de evaluaciones.

## Análisis y Mejora Implementada
Durante el desarrollo del issue #376, se determinó que basar la duplicidad únicamente en el nombre del archivo era insuficiente, ya que un usuario podría renombrar el archivo y subir la misma información, rompiendo la integridad de los datos.

Por lo tanto, la solución para el issue #377 se integró y mejoró con las siguientes reglas:
1.  **Detección por Datos Reales:** El sistema extrae la **CCT** y el **Turno** directamente del contenido del archivo Excel.
2.  **Identidad del Usuario:** La validación se aplica a nivel de usuario. Un mismo usuario no puede tener dos cargas vigentes para la misma combinación de CCT y Turno.
3.  **Flujo de Reemplazo:** Si se detecta la duplicidad (CCT+Turno), el frontend recibe un flag `duplicadoDetectado: true`. El sistema solicita confirmación al usuario para "Sustituir".
4.  **Limpieza Atómica:** Al confirmar el reemplazo, el backend elimina las evaluaciones anteriores asociadas a esa solicitud antes de insertar las nuevas, garantizando que el `id_solicitud` y el `consecutivo` se actualicen correctamente sin dejar registros huérfanos.

## Verificación
- [x] Detección exitosa de archivos con mismo CCT/Turno pero distinto nombre.
- [x] Eliminación física de registros en la tabla `evaluaciones` antes del re-procesamiento.
- [x] Persistencia del historial en `solicitudes_eia2` con estado actualizado.

---
**Fecha de Resolución:** 2026-04-09
**Responsable:** Antigravity AI
