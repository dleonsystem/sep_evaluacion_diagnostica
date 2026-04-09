# Análisis de Incidencia: Incompatibilidad de Navegadores (Firefox y JIRAF)

**ID del Issue:** #374
**Estado:** RESUELTO
**Prioridad:** Alta (Fase 1)

## Descripción del Problema
Se reportaron dos comportamientos críticos que impedían el uso de la plataforma en navegadores específicos:
1.  **Firefox:** Bloqueaba el ingreso a la plataforma, impidiendo que el usuario avanzara tras la autenticación o en nuevas pestañas.
2.  **JIRAF:** No permitía la carga de archivos, ya que el navegador interceptaba el evento de "soltar" (drop) y disparaba comportamientos por defecto (descargar el archivo o abrirlo en crudo) en lugar de entregarlo al componente de carga.

## Análisis de Causa Raíz
### Firefox (Bloqueo de Ingreso)
El problema estaba ligado a la gestión de sesión y el almacenamiento local. Firefox tiene políticas estrictas de aislamiento de pestañas cuando se trata de eventos de sincronización de estado. La aplicación no estaba detectando correctamente la sesión activa al abrir nuevas pestañas o al reingresar, provocando un ciclo de redirección al login.

### JIRAF (Fallo en Carga)
JIRAF, al actuar como un contenedor o con configuraciones de seguridad restrictivas, no propagaba correctamente los eventos de `dragdrop` hacia el área específica del componente Angular. Al soltar el archivo en cualquier lugar que no fuera el pixel perfecto del input, el navegador tomaba el control del archivo.

## Solución Implementada
La resolución de este issue se logró mediante la integración de soluciones en otros componentes críticos:

1.  **Sincronización de Sesión (#387):** Se implementó un listener de `storage` en el `AuthService` que garantiza que todas las pestañas de Firefox compartan el estado de autenticación en tiempo real, resolviendo el bloqueo al ingreso.
2.  **Intercepción Global de Eventos (#373):** Se añadieron HostListeners (`window:dragover` y `window:drop`) en el componente `CargaMasivaComponent`.
    *   Esto bloquea preventivamente la acción por defecto del navegador en toda la ventana mientras el componente está activo.
    *   Garantiza que JIRAF entregue el flujo del archivo al manejador de Angular sin interferencias externas.

## Verificación
- [x] Pruebas de ingreso exitosas en Firefox (Nuevas pestañas y recarga).
- [x] Carga de archivos funcional en JIRAF (Prevención de navegación por descarga).
- [x] Estabilidad de la sesión persistente.

---
**Fecha de Resolución:** 2026-04-09
**Responsable:** Antigravity AI
