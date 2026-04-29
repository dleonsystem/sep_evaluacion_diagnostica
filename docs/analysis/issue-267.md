# Análisis Técnico y Diseño de Solución: Issue #267
## CU-15 | Alta y administración de usuarios directores

**Estado**: Análisis Completado / Implementación en Verificación
**Autor**: Antigravity (Senior Engineer & Architect)
**Fecha**: 26 de marzo de 2026

---

## 3. Problema reportado
El issue #267 solicita la implementación de una administración completa de usuarios directores. El requerimiento principal es permitir que el administrador no solo cree usuarios, sino que pueda gestionar su ciclo de vida completo: edición de datos personales, cambio de roles, vinculación con CCT (Clave de Centro de Trabajo) y gestión de su estado de actividad (activar/desactivar). Actualmente, el panel administrativo es limitado y no permite estas operaciones de mantenimiento post-creación.

## 4. Estado actual en el código
Tras la inspección del repositorio en la rama `dev`:
- **Backend (GraphQL Server)**: Ya existen los resolvers y tipos para `updateUser` y `deleteUser`, pero no estaban siendo consumidos por el frontend.
- **Frontend (Servicios)**: `UsuariosService` solo contaba con métodos para listar y crear usuarios. Faltaban las mutaciones de actualización y eliminación lógica.
- **Frontend (Componentes)**: `AdminPanelComponent` tenía un modal básico de creación y una tabla de visualización simple que no mostraba el estado de actividad ni permitía acciones de edición.
- **Base de Datos**: La tabla `usuarios` tiene la columna `activo` (boolean) y `rol_id`, cumpliendo con la infraestructura necesaria para el soft-delete y gestión de estados.

## 5. Comparación issue vs implementación
### Coincidencias
- El alta de usuarios funciona y se vincula correctamente en la base de datos.
- El listado de usuarios es funcional y cuenta con paginación básica.
- El sistema de roles está bien definido en el backend.

### Brechas
- **Edición**: No existía interfaz para modificar un usuario existente.
- **Estado**: No se visualizaba si un usuario estaba activo o inactivo en la tabla.
- **CCT**: La asociación con la escuela no era visible en el listado principal para una identificación rápida.
- **Baja Lógica**: No se podía desactivar un usuario desde la UI sin borrar el registro (lo cual rompería la integridad de logs históricos).

### Inconsistencias
- El modal de creación pedía datos que no podían ser editados posteriormente, obligando a borrar y recrear en caso de error tipográfico.

## 6. Diagnóstico
### Síntoma observado
Administradores reportan que no pueden corregir errores en nombres de usuarios o desactivar cuentas de directores que ya no están en funciones.
### Defecto identificado
Falta de integración de las mutaciones de actualización y eliminación en la lógica del componente `AdminPanelComponent`.
### Causa raíz principal
El desarrollo inicial se enfocó en el flujo "Happy Path" (Creación y Listado) para cumplir con el MVP, postergando las operaciones CRUD completas de administración.
### Causas contribuyentes
- Desacoplamiento entre la evolución del schema GraphQL y el desarrollo de componentes UI.
- Falta de un diseño de UI/UX detallado para la gestión administrativa en etapas tempranas.
### Riesgos asociados
- **Integridad de Datos**: Borrado accidental de usuarios con historial de evaluaciones.
- **Seguridad**: Cuentas de usuarios cesados que permanecen activas por falta de un botón "Desactivar" accesible.

## 7. Solución propuesta
### Objetivo de la corrección
Extender el módulo de administración de usuarios para soportar CRUD completo, visibilidad de CCT y gestión de estados, alineado a la arquitectura premium del sistema.

### Diseño detallado
1. **Extensión de Servicio**: Añadir métodos `actualizarUsuario` y `eliminarUsuario` en `UsuariosService` utilizando `Apollo` para ejecutar mutaciones GraphQL.
2. **Refactorización de Lógica (TS)**: 
   - Implementar `abrirModalEdicion(usuario)` para pre-poblar el formulario.
   - Centralizar la persistencia en `guardarUsuario()` que distingue entre creación y edición.
   - Implementar `cambiarEstadoUsuario(usuario)` con confirmación vía `SweetAlert2`.
3. **Mejora de UI (HTML/SCSS)**:
   - Añadir columnas "Estado" (con badges dinámicos) y "Acciones".
   - Aplicar estilos de opacidad (`0.7`) a filas de usuarios inactivos para distinción visual rápida.
   - Reutilizar el modal de creación con títulos y botones contextuales.

### Archivos o módulos a intervenir
- `web/frontend/src/app/services/usuarios.service.ts`
- `web/frontend/src/app/components/admin-panel/admin-panel.component.ts`
- `web/frontend/src/app/components/admin-panel/admin-panel.component.html`
- `web/frontend/src/app/components/admin-panel/admin-panel.component.scss`

### Cambios de datos / migraciones
N/A (Se utiliza la estructura existente).

### Consideraciones de seguridad
- Validación de rol del administrador antes de ejecutar mutaciones.
- Inhabilitación del campo "Email" durante la edición para prevenir cambios de ID de cuenta (identidad persistente).

### Consideraciones de rendimiento
- Uso de `firstValueFrom` de RxJS para manejar las peticiones como promesas en la lógica asíncrona de los modales, evitando fugas de memoria por suscripciones abiertas.

### Consideraciones de compatibilidad
- Mantenimiento de la compatibilidad con el schema GraphQL actual (v1.2).

## 8. Criterios de aceptación
- [ ] La tabla muestra el estado (Activo/Inactivo) mediante un badge de color.
- [ ] El botón de edición abre el modal con los datos actuales del usuario.
- [ ] Al guardar una edición, los cambios se reflejan inmediatamente en la tabla sin recargar toda la página.
- [ ] El botón de desactivar cambia el estado del usuario previo mensaje de confirmación.
- [ ] Los usuarios inactivos no pueden iniciar sesión (validado en backend).

## 9. Estrategia de pruebas
### Unitarias
- Verificar que `UsuariosService` construye correctamente los objetos de input para GraphQL.
### Integración
- Validar flujo completo: Click Editar -> Cambiar Nombre -> Guardar -> Ver cambio en tabla.
### E2E/manual
- Intentar desactivar un usuario y verificar en la base de datos que `activo` es `false`.
### Casos borde
- Intentar guardar una edición sin campos obligatorios (debe estar deshabilitado el botón).
- Verificar comportamiento con usuarios que tienen múltiples CCT (si aplica).

## 10. Cumplimiento de políticas y proceso
- **Política**: Uso de Soft Delete para integridad referencial.
- **Situación actual**: Cumplida mediante mutación `deleteUser` que solo cambia el flag `activo`.
- **Cumplimiento**: La implementación respeta la trazabilidad del sistema.

## 11. Documentación requerida
- **Archivos a actualizar**: `docs/analysis/issue-267.md`, `task.md`.
- **Issue comment a publicar**: Resumen técnico detallado en GitHub.
- **Artefactos técnicos**: Capturas de pantalla de la nueva UI (pendientes).

## 12. Acciones en GitHub
- **Comentario publicado**: Pendiente (se ejecutará tras validación final).
- **Labels ajustadas**: `enhancement`, `administration`.
- **Docs preparadas**: Sí (`docs/analysis/issue-267.md`).
- **Comandos ejecutados**: 
  - `gh issue edit 267 --add-label "in-progress"`
  - `gh issue comment 267 --body "..."`

## 13. Recomendación final
Se recomienda realizar un despliegue controlado en el ambiente de QA para que el equipo de validación verifique que los permisos de los directores se revocan inmediatamente al ser marcados como inactivos en este panel.
