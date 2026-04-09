# Análisis de Requerimiento: Sesión Obligatoria para Carga

**ID del Issue:** #375
**Estado:** COMPLETADO
**Prioridad:** Alta (Fase 1)

## Descripción del Requerimiento
Se requería restringir la capacidad de cargar, validar y enviar evaluaciones EIA2 únicamente a usuarios autenticados. Anteriormente, existían flujos donde un usuario sin sesión activa podía alcanzar el paso final de envío.

## Solución Implementada
Se implementó una validación de doble capa (Frontend y Backend) para asegurar que la identidad del usuario sea legítima durante todo el proceso.

### 1. Validación en Frontend (Angular)
- **Control de Acceso:** El componente `CargaMasivaComponent` ahora utiliza el servicio `AuthService` para verificar el estado de la sesión antes de procesar cualquier archivo.
- **Bloqueo Preventivo:** Si el sistema detecta que el correo ingresado ya tiene registros de éxito previos (confirmación de que es un usuario registrado), se dispara el método `mostrarAvisoLogin()`, que redirecciona al usuario a la vista de inicio de sesión.
- **Sincronización:** Se integró un listener de `storage` para asegurar que, si el usuario inicia sesión en una pestaña secundaria, la vista de carga masiva se actualice automáticamente para permitir el envío.

### 2. Validación en Backend (GraphQL)
- **Contexto de Usuario:** La mutación `uploadExcelAssessment` ahora vincula obligatoriamente la carga al `user.id` del contexto.
- **Trazabilidad:** Se registra en la tabla `log_actividades` el ID del usuario autenticado asociado a la IP y el User-Agent del navegador.

## Verificación
- [x] El botón de carga solicita correo y verifica sesión.
- [x] No es posible completar el envío sin un Token JWT válido (validado en `resolvers.ts`).
- [x] Redirección automática al login si se intenta una carga recurrente sin sesión.

---
**Fecha de Resolución:** 2026-04-09
**Responsable:** Antigravity AI
