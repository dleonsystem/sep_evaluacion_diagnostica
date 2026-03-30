# Análisis del Issue 315

## 1. Resumen ejecutivo
Refactorización integral del `MailingService` en el `graphql-server` para desacoplar las plantillas HTML del código lógico y asegurar la coherencia con la nueva política de seguridad (Issue #268). Se mejora la flexibilidad del transporte SMTP para soportar configuraciones en contenedores Docker y se actualiza el contenido para eliminar procesos de cambio de contraseña obligatorios que generan fricción innecesaria.

## 2. Datos del issue
- Título: Refactorización de Mailing y Notificaciones (Mantenimiento y UX)
- Estado: Abierto
- Labels: `backend`, `enhancement`, `Phase 1`, `security`
- Prioridad aparente: Alta (Bloquea coherencia de UX en producción)
- Componentes afectados: `graphql-server/src/services/mailing.service.ts`, `.env.example`
- Fuente consultada: `GitHub PR #315`, `docs/analysis/issue-268.md`, `mailing.service.ts`

## 3. Problema reportado
La implementación actual de notificaciones por correo es rígida y contiene reglas de negocio obsoletas. Específicamente:
- Los correos de recuperación mencionan "contraseñas temporales" y "expiración de 24 horas", lo cual confunde al usuario ya que el sistema ha migrado a una política de contraseñas permanentes.
- Las plantillas HTML están mezcladas con la lógica de TypeScript (`hardcoded`), dificultando cambios estéticos globales.
- La configuración del transporte SMTP es limitada para entornos de desarrollo y Docker (dependencia rígida de Gmail).

## 4. Estado actual en el código
- El `MailingService` crea el transporte directamente con `host`, `port` y `secure` configurados estáticamente o vía `.env` básico.
- Las funciones `sendPasswordRecovery` y `sendAdminPasswordReset` incluyen bloques de HTML extensos con advertencias de expiración y forzado de cambio de clave.
- No hay un "Template Wrapper" que centralice la identidad visual de la SEP.

## 5. Comparación issue vs implementación
### Coincidencias
- El sistema utiliza `nodemailer` para el envío de correos.
- Existe soporte para un `SMTP_TEST_MODE` básico que imprime en consola.
### Brechas
- Falta de soporte para `SMTP_SERVICE` (presets de proveedores).
- Contenido desactualizado respecto a la permanencia de contraseñas (Issue #268).
### Inconsistencias
- Mientras que el flujo de login ya no exige cambio de contraseña, el correo electrónico sigue diciendo que es obligatorio.

## 6. Diagnóstico
### Síntoma observado
- El usuario recibe un correo informando que su contraseña expirará en 24h, pero al entrar al sistema, la contraseña funciona indefinidamente.
### Defecto identificado
- Desincronización entre la lógica de negocio en BD (`resolvers.ts`) y la capa de comunicación (`mailing.service.ts`).
### Causa raíz principal
- Acoplamiento fuerte de plantillas HTML en el código lógico, lo que impidió una actualización rápida durante el refactor de seguridad previo.
### Causas contribuyentes
- Falta de un sistema de plantillas desacoplado (como un helper de diseño).
### Riesgos asociados
- **Confusión del Usuario**: Soporte técnico inundado con dudas sobre contraseñas "expiradas".
- **Spam**: Envíos accidentales en entornos local/QA por falta de flexibilidad en el transporte.

## 7. Solución propuesta
### Objetivo de la corrección
Modernizar el servicio de correo, centralizar el diseño visual y unificar el mensaje de seguridad según la política de contraseñas permanentes.
### Diseño detallado
1. **Refactorización del Constructor**: Utilizar `getTransporterConfig()` para soportar `SMTP_SERVICE` y puertos dinámicos de forma segura.
2. **Implementación de `wrapInTemplate`**: Crear un método privado que reciba `title`, `subTitle` y `content` para generar el HTML base con el diseño corporativo de la SEP.
3. **Actualización de Contenido**: Reescribir los métodos de envío para eliminar frases como "temporal", "expira" o "cambio obligatorio".
### Archivos o módulos a intervenir
- `graphql-server/src/services/mailing.service.ts`
- `graphql-server/.env.example`
### Cambios de datos / migraciones
- N/A (Solo cambios en lógica de servicio y configuración).
### Consideraciones de seguridad
- Asegurar que el transporte use `secure: true` solo cuando el puerto sea 465.
- Mantener secretos fuera del código.
### Consideraciones de rendimiento
- El refactor mejora la legibilidad pero mantiene la eficiencia asíncrona de `nodemailer`.
### Consideraciones de compatibilidad
- Compatible con Node.js 20+ y contenedores Linux/Ubuntu.

## 8. Criterios de aceptación
- [ ] El constructor de `MailingService` soporta la variable `SMTP_SERVICE`.
- [ ] Los correos de recuperación no mencionan la palabra "temporal" ni "expiración".
- [ ] Todas las notificaciones utilizan el nuevo `wrapInTemplate` para un diseño premium consistente.
- [ ] El `SMTP_TEST_MODE` sigue operativo y muestra el contenido limpio en consola.

## 9. Estrategia de pruebas
### Unitarias
- Ejecutar `npm test` para descartar regresiones en el arranque del servidor.
### Integración
- Validar la inicialización del transporte con diferentes combinaciones de variables `.env`.
### E2E/manual
- Disparar flujo de recuperación y verificar logs del servidor para validar el nuevo contenido del HTML generado.
### Casos borde
- Configuración de SMTP sin puerto explícito (validar defaults).

## 10. Cumplimiento de políticas y proceso
- Política/proceso: **Issue #268 (Seguridad)**
- Situación actual: Notificaciones contradicen la política implementada en BD.
- Cómo se cumple con la solución: Se actualizan las plantillas para informar que el acceso es permanente.

## 11. Documentación requerida
- Archivos a actualizar: `mailing.service.ts`, `issue-315.md`, `.env.example`
- Issue comment a publicar: Comentario detallado en GitHub (PR #315).
- Artefactos técnicos a adjuntar o referenciar: `implementation_plan.md`

## 12. Acciones en GitHub
- Comentario publicado: no (Pendiente tras ejecución)
- Labels ajustadas: no
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue315-mailing-notificaciones-refactor`

## 13. Recomendación final
Proceder con la implementación técnica del refactor del servicio y posteriormente validar con pruebas unitarias antes de fusionar en `dev`.
