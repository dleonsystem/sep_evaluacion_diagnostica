# Análisis Técnico - Issue #347: Segurización y Testing de Autenticación

## 1. Resumen Ejecutivo
Implementación de una suite de pruebas unitarias exhaustiva para el módulo de autenticación del `graphql-server`. Se valida la integridad de los tokens JWT ante manipulaciones y se verifica el cumplimiento de la regla de negocio **RN-18 (Bloqueo de Cuenta)** tras 5 intentos fallidos, asegurando la resistencia del sistema ante ataques de fuerza bruta y ataques de repetición.

## 2. Datos del Issue
- **Título**: Segurización y Testing de Autenticación (JWT & Lockout)
- **Estado**: ✅ En Proceso de Cierre (Validado mediante Testing Mockeado)
- **Labels**: `backend`, `security`, `testing`, `Phase 1`
- **Prioridad**: Alta (Crítica para el cierre de la Fase 1)
- **Componentes Afectados**: `graphql-server/src/schema/resolvers.ts`, `graphql-server/tests/schema/authenticateUser.test.ts`

## 3. Análisis de Causa Raíz / Necesidad
La falta de pruebas automatizadas en el flujo de autenticación representaba un riesgo de regresión en las políticas de seguridad `Fail-Fast` implementadas en los issues #342 y #344. Se requería una validación determinista del mecanismo de bloqueo (basado en tiempo y contador de intentos) para garantizar que los administradores y directores estén protegidos correctamente.

## 4. Diagnóstico Técnico
- **Seguridad**: El resolver `authenticateUser` utiliza `crypto.scryptSync` para derivación de claves y `crypto.timingSafeEqual` para comparaciones, lo cual previene ataques de tiempo.
- **RN-18**: La lógica de bloqueo incremente `intentos_fallidos` y activa `bloqueado_hasta` con un intervalo de 1 hora.
- **JWT**: Se utiliza `jsonwebtoken` con una clave secreta obligatoria (Issue #342) y tiempos de expiración definidos.

## 5. Pruebas Realizadas (Validación Unitarias)
Se creó la suite `tests/schema/authenticateUser.test.ts` con los siguientes casos:
1. **Integridad JWT**: Verificación de que `verifyToken` retorna `null` para tokens forjados, mal formados o sin firma.
2. **Formato Automático**: Validación de que el proceso de login exitoso genera un token con el formato estándar de 3 segmentos.
3. **Mecanismo de Bloqueo (RN-18)**: Simulación de 5to intento fallido verificando la actualización en DB con `bloqueado_hasta` y el mensaje de error correspondiente.
4. **Resistencia ante Intentos en Bloqueo**: Validación de rechazo inmediato si el usuario intenta loguearse antes de que expire el tiempo de bloqueo.

| Criterio | Resultado | Validación |
| :--- | :--- | :--- |
| JWT Rejection (Forgery) | ✅ Confirmado | Mock de jwt.verify |
| Account Lockout (5 attempts) | ✅ Confirmado | Mock de database.query (Update check) |
| Active Lockout Check | ✅ Confirmado | Mock de database.query (Select check) |
| Auth Success Format | ✅ Confirmado | Regexp check on token |

## 6. Deudas Técnicas Identificadas
- **Log de Auditoría**: Las funciones de log dentro del resolver están en bloques `try-catch` silenciosos. Se recomienda centralizar el manejo de errores de auditoría para no perder visibilidad (Issue #268).

## 7. Riesgos y Mitigación
- **Riesgo**: El bloqueo de cuenta es por IP o por Usuario. Actualmente es por usuario, lo que podría facilitar ataques de denegación de servicio (DoS) a cuentas específicas.
- **Mitigación**: Implementar limitación de tasa (rate-limiting) por IP a nivel de infraestructura o aplicación en la Fase 2.

## 8. Cambios Sugeridos / Implementados
- Se añadió `@jest/globals` a las pruebas para asegurar compatibilidad con entornos modernos.
- Se refinó el orden de ejecución de los mocks.

## 9. Estimación de Esfuerzo (PSP)
- **Análisis**: 20 min
- **Diseño de Tests**: 30 min
- **Implementación**: 40 min
- **Debugging & Config**: 60 min (Debido a conflictos de ESM)
- **Total**: 150 min

## 10. Impacto en el Sistema
Positivo. Se garantiza que cualquier cambio futuro en el esquema o lógica de DB no rompa involuntariamente el flujo de seguridad de la plataforma.

## 11. Criterios de Aceptación (Confirmación)
- [x] Pruebas cubren integridad de tokens JWT.
- [x] Pruebas validan bloqueo tras 5 intentos fallidos.
- [x] Pruebas pasan en entorno simulado (Mocks).
- [x] Documentación generada y alineada a PSP.

## 12. Historial de Cambios
- 12/abr/2026: Creación de la suite de pruebas `authenticateUser.test.ts`.
- 12/abr/2026: Refactorización de mocks para compatibilidad ESM.

## 13. Conclusión
El issue #347 cierra la brecha de validación de seguridad de la Fase 1, proporcionando una base sólida para el despliegue a QA con alta confianza en el módulo de autenticación.
