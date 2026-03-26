# Análisis del Issue 268

## 1. Resumen ejecutivo
Se analiza la implementación de la gestión de credenciales iniciales y recuperación de acceso (CU-15). Se identificó una discrepancia en el flujo de cambio obligatorio de contraseña en el primer login, el cual, aunque implementado inicialmente siguiendo estándares generales, no es un requerimiento según la aclaración del usuario. La solución se ajustará para permitir el acceso directo con credenciales generadas, manteniendo la auditoría y la funcionalidad opcional de cambio.

## 2. Datos del issue
- Título: CU-15 | Credenciales iniciales y recuperacion de acceso
- Estado: Abierto (en proceso de ajuste)
- Labels: enhancement, fase-1, critico, usuarios
- Prioridad aparente: Crítica (afecta acceso inicial)
- Componentes afectados: Backend (Resolvers), Frontend (AuthService, Login, Guards), DB (usuarios)
- Fuente consultada: GitHub Issue #268, Aclaración directa del usuario.

## 3. Problema reportado
Definir y construir el mecanismo de credenciales iniciales y recuperación de acceso para usuarios directores. Incluye generación segura, política de expiración, recuperación y auditoría.

## 4. Estado actual en el código
Se implementó un flujo que activa los flags `primer_login` y `password_debe_cambiar` al crear usuarios o recuperar contraseñas. El frontend intercepta estos flags mediante un `PasswordChangeGuard` y redirige forzosamente a `/cambiar-password`.

## 5. Comparación issue vs implementación
### Coincidencias
- Generación de credenciales (scrypt).
- Flujo de recuperación (email).
- Registro de auditoría (IP/UA).
### Brechas
- El issue menciona "Política de expiración", lo cual se interpretó como forzado de cambio, pero el usuario aclara que no caducan automáticamente.
### Inconsistencias
- Implementación de un flujo restrictivo de cambio obligatorio que no fue solicitado explícitamente y que el usuario desea eliminar.

## 6. Diagnóstico
### Síntoma observado
- Los usuarios son bloqueados por un Guard y obligados a cambiar su contraseña temporal inmediatamente después del login.
### Defecto identificado
- Lógica de negocio excesivamente restrictiva en backend y frontend.
### Causa raíz principal
- Interpretación subjetiva de "mecanismo de acceso inicial seguro" asumiendo el estándar de cambio forzado por defecto.
### Causas contribuyentes
- Falta de validación previa del flujo de negocio específico con el usuario final.
### Riesgos asociados
- Mala experiencia de usuario (fricción innecesaria).

## 7. Solución propuesta
### Objetivo de la corrección
- Eliminar el forzado de cambio de contraseña en el primer acceso y tras recuperación, permitiendo el uso directo de la clave proporcionada por el sistema.
### Diseño detallado
1. Modificar resolvers de creación y recuperación para no marcar `password_debe_cambiar = true`.
2. Actualizar `AuthService` y `LoginComponent` para eliminar la redirección automática.
3. Desactivar el `PasswordChangeGuard` de las rutas principales.
4. Mantener la pantalla de cambio de contraseña como funcionalidad accesible pero no obligatoria.
### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.ts`
- `web/frontend/src/app/services/auth.service.ts`
- `web/frontend/src/app/components/login/login.component.ts`
- `web/frontend/src/app/app.routes.ts`
### Cambios de datos / migraciones
- Limpieza masiva de flags `password_debe_cambiar` en la DB si fuera necesario (para usuarios ya creados).
### Consideraciones de seguridad
- Se mantiene el uso de `scrypt` y la auditoría de accesos.
### Consideraciones de rendimiento
- Sin impacto significativo.
### Consideraciones de compatibilidad
- Compatible con el esquema de base de datos actual.

## 8. Criterios de aceptación
- [ ] El login permite acceso directo con contraseñas generadas vía Excel.
- [ ] La recuperación de contraseña envía una nueva clave que funciona de inmediato sin forzar reset.
- [ ] La auditoría de IP y User Agent sigue registrando eventos correctamente.
- [ ] El componente de cambio manual sigue funcionando.

## 9. Estrategia de pruebas
### Unitarias
- Verificar que los resolvers no inyecten el flag de cambio obligatorio.
### Integración
- Flujo completo: Carga Excel -> Login con nueva clave -> Acceso a archivos-evaluacion sin interrupciones.
### E2E/manual
- Probar el flujo de recuperación y autenticar sin redirección.
### Casos borde
- Intentos fallidos (sigue bloqueando tras 5 intentos, esto se mantiene).

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Gestión de requerimientos y PSP.
- Situación actual: Implementación divergente por interpretación local.
- Cómo se cumple con la solución: Alineación con la directiva explícita del usuario y documentación de la discrepancia.

## 11. Documentación requerida
- Archivos a actualizar: `PLAN_TRABAJO_FASE1.md`, `docs/analysis/issue-268.md`
- Issue comment a publicar: Análisis técnico y solución de ajuste.
- Artefactos técnicos a adjuntar o referenciar: Este documento de análisis.

## 12. Acciones en GitHub
- Comentario publicado: no (pendiente)
- Labels ajustadas: no
- Docs preparadas: sí
- Comandos ejecutados:
  - `git push origin qa` (previamente)

## 13. Recomendación final
Proceder con la refactorización para eliminar el bloqueo de navegación, priorizando la facilidad de acceso solicitada, sin comprometer la trazabilidad de auditoría.
