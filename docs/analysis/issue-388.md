# Análisis de Incidencia: Generación Redundante de Credenciales (Issue #388)

**Estado:** RESUELTO Y VALIDADO
**Prioridad:** Crítica (Fase 1)
**Fecha de Resolución:** 2026-04-09

## Descripción del Problema
El sistema generaba nuevas contraseñas ("Ghost Passwords") durante cargas masivas para usuarios que ya estaban autenticados o registrados, enviando correos redundantes con credenciales no funcionales y sobreescribiendo visualmente la clave en el PDF de comprobante.

## Hallazgo Crítico: Sincronización de Build
Se identificó que los intentos iniciales de solución fallaron porque el servidor se estaba ejecutando mediante `npm start`, el cual apunta a la carpeta `dist/` pre-compilada. Los cambios realizados en `src/` eran ignorados por el motor de ejecución hasta que se forzó un `npm run build`.

## Solución Implementada: Triple Blindaje (Triple-Failsafe)

Para erradicar el problema, se implementó una lógica de tres capas en el backend (`resolvers.ts` e `index.ts`):

### 1. Capa de Contexto (Context Awareness)
Se actualizó el middleware de autenticación en `index.ts` para incluir el `password_hash` en el objeto de usuario del contexto de GraphQL. Esto permite que los resolvers sepan instantáneamente si el usuario logueado ya posee credenciales válidas.

### 2. Capa de Verificación en Transacción (Ground Truth Check)
Dentro de la mutación de carga masiva, se añadió un re-check obligatorio a la base de datos:
- Antes de emitir cualquier clave, el sistema realiza un `SELECT password_hash FROM usuarios` filtrando por el ID vinculado.
- Si existe un hash en DB, la generación se cancela inmediatamente (Inyección de NULL en la variable de contraseña generada).

### 3. Capa de Bloqueo de Notificaciones (Mailing Guard)
Se implementó la bandera `isNewUser`. El servicio de mensajería (`mailingService.sendCredentials`) solo se activa si se cumplen simultáneamente tres condiciones:
1. Se generó una contraseña nueva.
2. Existe un correo de destino.
3. **El usuario es estrictamente nuevo** (creado en la transacción actual).
Esto evita el envío de correos molestos a usuarios que ya están operando en la plataforma.

## Verificación de Integridad
- [x] **Backend:** Compilado exitosamente (`npm run build`).
- [x] **PDF:** Ahora muestra correctamente "SU CONTRASEÑA ES LA QUE YA TIENE REGISTRADA" para usuarios logueados.
- [x] **Correo:** Bloqueado para reintentos de carga.
- [x] **Persistencia:** El hash original del usuario permanece intacto en la tabla `usuarios`.

---
**Responsable:** Antigravity AI
**Estado Final:** Cerrado
