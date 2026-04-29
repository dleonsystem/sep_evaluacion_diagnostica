# Análisis del Issue 352

## 1. Resumen y Datos
- **Título/Estado:** [FASE1][HIGH] Implementación de Redirección `primerLogin` en Frontend / OPEN
- **Componentes afectados:** Frontend (Angular), UI (LoginComponent), Seguridad (Auth Flow)
- **Resumen Ejecutivo:** Se detectó el incumplimiento del requerimiento RF-18.1, donde los usuarios con sesión inicial permitida deben ser forzados a cambiar su contraseña. El componente de login actual ignora el flag `primerLogin` enviado por el backend.

## 2. Datos del issue
- **Título:** [FASE1][HIGH] Implementación de Redirección `primerLogin` en Frontend
- **Estado:** OPEN
- **Labels:** frontend, phase1, security
- **Prioridad aparente:** High
- **Fuente consultada:** Reporte de Auditoría Técnica 06-abr-2026 y `REMEDIATION_ISSUES_FASE1.md`.

## 3. Problema reportado
El requerimiento funcional RF-18.1 exige que los usuarios cambien su contraseña obligatoriamente en su primer acceso al sistema. El backend ya implementa y envía el campo `primerLogin: true` en el payload de autenticación, pero el frontend no realiza la redirección correspondiente, permitiendo que el usuario navege por el sistema con una contraseña temporal.

## 4. Estado actual en el código
- **Archivo:** `web/frontend/src/app/components/login/login.component.ts`
- **Observación:** En el método `iniciarSesion`, tras persistir la sesión (Línea 66-73), el código salta directamente a la redirección por rol (`esAdmin ? /admin/dashboard : /archivos-evaluacion`) sin evaluar el estado del flag `primerLogin`.
- **User Service:** `web/frontend/src/app/services/usuarios.service.ts` ya define `primerLogin` en la interfaz `UsuarioAutenticado`.

## 5. Comparación issue vs implementación
- **Coincidencias:** El componente de login carece de la lógica de bifurcación de seguridad requerida.
- **Brechas/Inconsistencias:** El flujo de autenticación es "optimista" y no prioriza la seguridad de la cuenta sobre la navegación estándar.

## 6. Diagnóstico
- **Síntoma observado:** Un usuario nuevo (por ejemplo, recién creado por un administrador) puede ignorar el cambio de contraseña y operar normalmente.
- **Defecto identificado:** Falta de un guard o lógica de interceptación en la fase de post-login.
- **Causa raíz principal:** Omisión del requerimiento RF-18.1 en la implementación inicial del `LoginComponent`.
- **Riesgos asociados:** 
  - **Seguridad:** Uso prolongado de contraseñas enviadas por email plano, aumentando el riesgo de compromiso de cuenta.
  - **Compliance:** Incumplimiento del manual técnico de Fase 1.

## 7. Solución propuesta
- **Objetivo de la corrección:** Interceptar el flujo de login para forzar la navegación hacia `/cambiar-password` si se detecta que es el primer acceso.
- **Diseño detallado:** 
  1. Extraer el valor de `usuario.primerLogin` de la respuesta de `autenticarUsuario`.
  2. Implementar una validación prioritaria después del `Swal.fire` de éxito.
  3. Si `primerLogin` es `true`, usar `router.navigateByUrl('/cambiar-password')`.
  4. De lo contrario, proceder con la redirección por rol existente.
- **Archivos a intervenir:** 
  - `web/frontend/src/app/components/login/login.component.ts`
- **Consideraciones de seguridad/rendimiento:** La redirección es inmediata y evita la exposición de rutas de negocio a usuarios no securizados.

## 8. Criterios de aceptación
- [ ] El login redirige a `/cambiar-password` si `user.primerLogin === true`.
- [ ] El login redirige a las rutas normales si `user.primerLogin === false`.
- [ ] El cambio de contraseña es persistente (se asume que el backend ya maneja el update del flag).

## 9. Estrategia de pruebas y Evidencia
- **Definición de tests:** 
  - Mock de respuesta de `usuariosService` con `primerLogin: true`.
  - Verificación manual del flujo E2E con un usuario de prueba en la base de datos con `primer_login = true`.
- **Evidencia de validación:** (Pendiente de ejecución)

## 10. Cumplimiento de políticas y proceso
- **Metodología:** Alineado con OWASP (A07: Identification and Authentication Failures).
- **RUP:** Fase de Elaboración - Implementación de Mecanismos de Seguridad.

## 11. Documentación requerida
- `docs/analysis/issue-352.md`
- Actualización de `PLAN_TRABAJO_FASE1.md` (Bitácora).

## 12. Acciones en GitHub
- **Rama de trabajo:** `task/pepenautamx-issue352-implementar-redir-primer-login`
- **Labels ajustadas:** frontend, security, phase1
- **Comandos ejecutados:** `git checkout -b`.

## 13. Recomendación final
Implementar un `AuthGuard` más estricto que verifique el estado del flag `primerLogin` en cada navegación, no solo durante el login, para evitar que el usuario salte la pantalla de cambio de contraseña mediante navegación directa por URL.

