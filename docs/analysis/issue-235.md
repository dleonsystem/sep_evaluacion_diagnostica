# Análisis del Issue 235

## 1. Resumen ejecutivo
El Issue #235 estipula la implementación completa de un formulario de registro de incidentes y seguimiento de tickets para usuarios registrados (directores de escuelas). Aunque se completó la fase de creación (TicketsComponent) y listado (TicketsHistorialComponent), se identificó una brecha arquitectónica severa: falta el componente `DetalleTicketComponent` para mantener un hilo de conversación de soporte bidireccional. Se ha decidido implementar la solución completa ("Opción A") habilitando el chat de respuesta y omitiendo totalmente el envío de correos electrónicos.

## 2. Datos del issue
- Título: Implementar Formulario de Registro de Incidentes para Usuarios
- Estado: Open
- Labels: enhancement
- Prioridad aparente: Alta
- Componentes afectados: UI/UX Frontend Angular (`TicketsHistorialComponent`, nuevo `DetalleTicketComponent`), API de Tickets.
- Fuente consultada: Issue #235, `tickets.component.ts`, `tickets-historial.component.ts`.

## 3. Problema reportado
Los usuarios necesitan una forma de levantar un ticket proactivamente aportando contexto extra mediante capturas de pantalla, pero al mismo tiempo necesitan revisar el progreso del mismo, contestar requerimientos del operador (Nivel 2) y dar por resuelto el problema con evidencias en hilo (timeline).

## 4. Estado actual en el código
- El portal `/tickets` ya carga proactivamente el formulario de creación.
- El portal `/tickets-historial` lista el inventario de incidentes mediante una tabla estilo "Acordeón" de solo lectura.
- No existe pantalla dedicada que soporte `Mutation.agregarComentario` para el usuario final.
- **Se prohíbe el envío de correos electrónicos** (según requerimiento actualizado), lo que obliga al usuario a revisar el portal manualmente para dar seguimiento.

## 5. Comparación issue vs implementación
### Coincidencias
- Lógica de subida de adjuntos y autenticación por roles (JWT).
- Formulario reactivo y paginación en UI/UX general.
### Brechas
- Ausencia total del componente de detalle del chat (Timeline) originalmente contemplado en la Arquitectura ("DetalleTicketComponent").
- No hay interfaz para "Responder" ni para "Marcar como resuelto" del lado del cliente.
### Inconsistencias
- El issue original proponía Notificaciones vía Correo (Nodemailer), pero el diseño técnico reciente revoca esta directriz. *No deben mandarse correos.*

## 6. Diagnóstico
### Síntoma observado
La comunicación entre la escuela (usuario) y soporte (admin) es estática y truncada. El admin contesta en backend, el usuario lo lee en frontend y queda bloqueado sin poder refutar, mandar más anexos o confirmar la solución.
### Defecto identificado
Decisión de diseño prematura que colapsó la vista detalle hacia una fila expansible en el componente historial (`tickets-historial`), eliminando la pantalla diseñada de Chat/Hilo.
### Causa raíz principal
Simplificación del Módulo de Soporte durante el Sprint actual para agilizar liberación de carga masiva, sacrificando el esquema de respuesta interactiva del UI Cliente.
### Causas contribuyentes
Requerimientos cambiantes respecto a notificaciones de correo y UI limits.
### Riesgos asociados
Frustración de usuarios al ver que el soporte les pide un archivo extra pero el portal no tiene un sitio o un `<button>` para anexarlo de regreso.

## 7. Solución propuesta
### Objetivo de la corrección
Desagregar la lectura del ticket a un componente exclusivo `TicketTimelineUI` (o similar), que asiente un diálogo entre las dos entidades, logrando la especificación RUP completa.
### Diseño detallado
1. Crear el nuevo componente `ticket-detalle.component.ts`.
2. Actualizar el routing module para asociar `/tickets/:folio`.
3. Dotar al componente de un motor iterador (`*ngFor`) para desglosar mensajes de usuario y operador como globos de chat estilo "Timeline".
4. Integrar un Formulario inferíor (`TextArea` + input files) donde el usuario lance respuestas (`Mutation.agregarComentario`). Omitir/Eliminar cualquier instancia de Nodemailer en el flujo.
### Archivos o módulos a intervenir
- `app-routing.module.ts` / stand-alone routers.
- Creación de `ticket-detalle.component.ts/.html/.scss`.
- `tickets.service.ts` (asegurar los inputs para comentarios).
- `tickets-historial.component.ts` (cambiar el botón de expandir a un botón `Ir al chat`).
### Cambios de datos / migraciones
- N/A. (GraphQL resolver ya parece soportar las iteraciones).
### Consideraciones de seguridad
- Validar JWT contra el ID o `correo` dueño del ticket para evitar que otro CCT lea su hilo.
### Consideraciones de rendimiento
- Aligerar carga diferida activando lazy-load a esta pantalla.
### Consideraciones de compatibilidad
- Diseño adaptable/responsivo indispensable (Mobile-first para el esquema de Chat).

## 8. Criterios de aceptación
- [ ] El sistema navega del historial a un "Detalle del Ticket" de hilo secuencial.
- [ ] El usuario (escuela) puede responder textualmente a un operador administrativo y subir de 1 a 5 anexos nuevos por respuesta.
- [ ] La interfaz expone la respuesta inmediata sin depender o invocar envío asíncrono de correos electrónicos.

## 9. Estrategia de pruebas
### Unitarias
- Afirmar que `TicketsService.agregarComentario` no despacha correos y construye exitosamente el Array Local en cache.
### Integración
- Confirmación de payload Mutation contra el servidor apollo sin que reviente el CORS ni el Guard de Autorizaciones.
### E2E/manual
- Usuario logueado: Crea ticket -> ve ticket abierto -> escribe respuesta de prueba -> Administrador lo valida en Nivel 2.
### Casos borde
- Intentar adjuntar ejecutables (.exe, .sh) en el "responder". Validar rechazo.

## 10. Cumplimiento de políticas y proceso
- Política/proceso: RUP/PSP y Clean Architecture Angular (Componentización desacoplada).
- Situación actual: Listado y Detalles altamente acoplados en una misma tabla gigante.
- Cómo se cumple con la solución: Se extirpa la responsabilidad de visualización, aislando el Chat hacia un módulo enfocado.

## 11. Documentación requerida
- Archivos a actualizar: `docs/analysis/issue-235.md`, `FRONTEND_ARCHITECTURE.md` (si la hubiese).
- Issue comment a publicar: Reporte técnico simplificado adjunto a Issue 235.
- Artefactos técnicos a adjuntar o referenciar: Planos/Mockups del componente de Timeline.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: no
- Docs preparadas: sí
- Comandos ejecutados:
  - `write_to_file` al archivo analysis markdown.
  - Generación de comment vía MCP tool a Github.
  - `git add docs/analysis/issue-235.md` 

## 13. Recomendación final
Con el análisis formal redactado, lo conducente recae en crear el `implementation_plan.md` (herramienta de Planeación del asistente de Código) para autorizar arquitectónicamente las líneas y métodos exactos donde el `DetalleTicketComponent` nacerá. Posteriormente comenzar Fase 2.3 de ejecución en Angular.
