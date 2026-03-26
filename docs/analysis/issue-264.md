# Análisis Técnico - Issue #264: CU-13 | Bandeja operativa y respuesta de soporte

## 1. Información General
- **ID del Issue:** #264
- **Título:** CU-13 | Bandeja operativa y respuesta de soporte
- **Asignado a:** pepenautamx, dleon55
- **Etiquetas:** enhancement, fase-1, critico, tickets

## 2. Objetivo
Analizar e implementar las correcciones y la funcionalidad de la bandeja operativa de soporte técnico, asegurando la consistencia entre frontend (Angular) y backend (GraphQL/PostgreSQL), validando autorización de roles, y facilitando la correcta visualización, gestión y auditoría de tickets (públicos y regulares).

## 3. Problema reportado
El issue requiere construir la interfaz operativa para atención, respuesta y cierre de tickets, permitiendo listar, filtrar, y gestionar cambios de estados (abierto, en proceso, resuelto). 
Problemas técnicos subyacentes encontrados:
- Inconsistencia en la importación dinámica de ES Modules para SFTP, que rompía el servidor al recibir un nuevo ticket.
- Ausencia de validación de roles en la mutación `respondToTicket`.
- Fallos en la ruta y persistencia de login para los perfiles administrativos en el frontend, bloqueándolos en la pantalla de *login* y delegándoles permisos visuales del rol 4 (Consulta).

## 4. Estado actual en el código
- El backend soporta las queries `getAllTickets`, `getPublicIncidents`, e integra persistencia JSONB de evidencias directamente en la tabla `tickets_soporte`.
- El frontend gestiona las consultas desde el `AdminPanelComponent` mapeándolo para Angular UI, y ahora cuenta con persistencia exclusiva de sesión para administrador mediante `AdminAuthService` de forma estricta.

## 5. Comparación issue vs implementación
### Coincidencias
- La interfaz operativa se encuentra integrada en `/admin/dashboard` y `admin/panel` donde se listan tickets.
- Las funciones permiten visualizar el historial y responder.
### Brechas
- Se encontraron fallos de compatibilidad modular (`.js` ausente) que imposibilitaban crear tickets bajo la función `createPublicIncident`.
### Inconsistencias
- El frontend gestionaba la autenticación del administrador erróneamente a través de `AuthService` (sesión normal de usuario), lo que invalidaba el acceso al panel administrativo a través de `AdminGuard`.

## 6. Diagnóstico
### Síntoma observado
- Al iniciar sesión con credenciales de administrador, el usuario se mantenía visualmente en `/login` pero la cabecera mostraba opciones de un usuario normal ("Cargas realizadas", "Descargas", etc.).
- Las incidencias públicas fallaban con `INTERNAL_SERVER_ERROR`.
### Defecto identificado
- En `login.component.ts`, la variable `esAdmin` se ignoraba parcialmente o caía en el bloque incorrecto previo a la reestructuración.
- Faltaba importar `sftp.service` respetando las directivas ES Module en Node.js, y se estaba reimportando un módulo ya existente causante del colapso.
### Causa raíz principal
- **Frontend:** Persistencia de estado divergente; el sistema intentaba redirigir a un perfil sin privilegios porque las claves en localStorage no correspondían a los identificadores del AdminAuth.
- **Backend:** Manejador de evidencias (`SFTP`) trataba de importarse mediante importación dinámica rota.
### Causas contribuyentes
- Fuga de validación JWT en los métodos de obtención general de todos los tickets (`getAllTickets` carecia de chequeo contextual real, el cual fue subsanado).

## 7. Solución propuesta
### Objetivo de la corrección
Restaurar la fluidez y seguridad de la intercepción administrativa de tickets, y resolver las caídas del servidor al momento de procesar tickets.

### Diseño detallado
1. **Refactoring Backend (Resolvers GraphQL):**
   - Habilitar autorización (`requiresAuth` y chequeo `rol` de Coordinador en `respondToTicket`).
   - Sustituir `import('../services/sftp.service')` por `new SftpService()` directamente importado a nivel top.
   - Refactorizar lógica de parseo `JSONB` de evidencias.
2. **Refactoring Frontend (Auth):**
   - Asegurar que `login.component.ts` llame estricamente a `adminAuthService.establecerSesion` tras confirmar privilegios para evitar encadenamiento infinito de guardias Angular.
3. **Refactoring Frontend (UI Tickets):**
   - Modificar `admin-panel.component.ts` y `tickets.service.ts` para capturar la estructura final real de `Usuario { nombreCompleto, cct }` y mostrar el historial de respuestas adecuado.

### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.ts`
- `web/frontend/src/app/components/login/login.component.ts`
- `web/frontend/src/app/services/admin-auth.service.ts`
- `web/frontend/src/app/services/tickets.service.ts`
- `web/frontend/src/app/components/admin-panel/admin-panel.component.ts`

### Consideraciones de seguridad
- Todas las mutaciones de gestión y resolución garantizan validación en el contexto de autenticación del usuario.

## 8. Criterios de aceptación
- [x] Un operador autenticado debe poder ver tickets públicos y de plataforma.
- [x] Un ticket puede ser modificado con una respuesta y cambiar de estado PENDIENTE a RESUELTO.
- [x] Un administrador debe poder firmarse correctamente sin bloqueos en el formulario de inicio de sesión y percibir la interfaz administrativa respectiva.

## 9. Estrategia de pruebas
### Unitarias
- Ejecución correcta en la base de metodos GraphQL.
### Integración
- Integración E2E para Backend ejecutado explícitamente en el servidor local emulando el inicio de sesión y la mutación completa `createPublicIncident` -> `respondToTicket`.
### E2E/manual
- Test manual por parte de QA en el ambiente visual (UI) para crear y responder solicitudes con el perfil `admin@sep.gob.mx`.

## 10. Cumplimiento de políticas y proceso
- **Política/proceso:** Arquitectura CMMI L3 - Separation of concerns y validación PSP.
- **Situación actual:** Se encontró un puente lógico deficiente entre la captura de seguridad de los perfiles.
- **Cómo se cumple con la solución:** Centralizando la seguridad en el propio Auth Service específico de cada jerarquía y uniendo los objetos de base de datos a sus interfaces TypeScript genuinas.

## 11. Documentación requerida
- **Archivos a actualizar:** `docs/analysis/issue-264.md`
- **Issue comment a publicar:** Comentario en Issue #264 y posterior solicitud Pull Request.

## 12. Acciones en GitHub
- Comentario publicado: en proceso
- Labels ajustadas: sí
- Comandos ejecutados: 
  - `git commit` de correcciones GraphQL Backend
  - `git commit` de reestructura Login Angular Guard y Admin Auth Service.
  - Test scripts HTTP NodeJS para emular interacciones SFTP backend nativo comprobando que nada falle.

## 13. Recomendación final
Con el sistema lógico estable, la validación del ticket desde el Frontend por parte del usuario usando el dashboard del Admin es el requerimiento terminal de este ciclo. Sugiero crear un checklist de aprobación visual pre-producción y promover inmediatamente estos cambios.
