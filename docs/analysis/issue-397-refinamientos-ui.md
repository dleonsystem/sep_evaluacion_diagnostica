# Refinamientos de Interfaz y Lógica de Estados (Sprint / Mantenimiento)

## Resumen
Se realizaron ajustes menores de interfaz, correcciones ortográficas, actualizaciones de correos y la resolución de un problema de lógica de sincronización de estados en la bandeja de archivos del usuario.

## 1. Actualización de Mensaje de Carga Masiva
- **Archivo modificado**: `web/frontend/src/app/components/carga-masiva/carga-masiva.component.html`
- **Descripción**: Se actualizó el mensaje de éxito tras una validación exitosa de archivo para incluir explícitamente información sobre la disponibilidad de comprobantes en la carpeta "Descargas" y notificar sobre el envío de credenciales por correo electrónico.

## 2. Ajustes a la Plantilla de Notificación por Correo
- **Archivo modificado**: `graphql-server/src/services/mailing.service.ts`
- **Descripción**: Se refinó la redacción del correo electrónico de bienvenida al sistema. Se modificó el título del correo de "Bienvenido al Sistema SiRVER" a **"Bienvenido al SiRVER"** y se mejoró el tono de seguridad cambiando "no la compartas con nadie" a **"no la comparta con nadie"**.

## 3. Correcciones en Mesa de Ayuda (Tickets)
- **Archivos modificados**: 
  - `web/frontend/src/app/components/tickets/tickets.component.ts`
  - `web/frontend/src/app/components/tickets/tickets.component.html`
- **Descripción**: 
  - Se corrigió el error gramatical en la validación del formulario de tickets ("Completa los campos" por "Complete los campos").
  - Se ocultó el listado del historial de tickets que aparecía en la parte inferior de la vista del formulario para mantener una interfaz más limpia.

## 4. Resolución de Desincronización del Estado "PENDIENTE" y "ASIGNADO"
- **Problema**: Cuando el administrador subía resultados a un archivo de evaluación, su panel mostraba "Asignado", pero el usuario, al ingresar a su panel, seguía viendo el estado "PENDIENTE".
- **Análisis**: 
  - El backend (GraphQL) retornaba el estado a través de un mapeo de strings (`'VALIDADO'`, `'PENDIENTE'`, etc.), pero el frontend (en `archivos-evaluacion.component.ts`) evaluaba este valor como si fuera numérico en un bloque `switch`, cayendo invariablemente en el caso `default` ("PENDIENTE").
  - Además, el estado "Asignado" no proviene directamente del enumerador en la base de datos, sino de la confirmación de la existencia de resultados cargados en la propiedad `resultados` del registro.
- **Solución implementada**:
  - **`archivos-evaluacion.component.ts`**: Se actualizó el método `obtenerEstadoDescripcion(registro: SolicitudEia2)` para evaluar el registro en lugar de solo su estado numérico. Si `registro.resultados` posee elementos, ahora retorna correctamente `"ASIGNADO"`. Si recibe strings directamente (como sucede con GraphQL), las retorna de forma segura.
  - **`archivos-evaluacion.component.html`**: Se adaptaron las llamadas a `obtenerEstadoDescripcion(registro)`.
  - **`archivos-evaluacion.component.scss`**: Se refactorizaron los selectores CSS de las insignias, pasando de `[data-estado="2"]` a `[data-estado="VALIDADO"]`, y se añadió un nuevo bloque estilizado para `[data-estado="ASIGNADO"]` con un color verde/azulado característico para indicar disponibilidad de descarga.
  - **`admin-panel.component.ts`**: Se alineó la lógica del panel administrador, determinando el estatus `"asignado"` basándose también en la presencia de `registro.resultados`, en vez de un simple chequeo numérico de validación (`registro.estadoValidacion === 2`).

## 5. Mejora de Usabilidad: Botón "Descargar resultados"
- **Archivo modificado**: `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.html`
- **Descripción**: Se sustituyó el botón de ícono para la descarga de resultados (una flecha de descarga en color verde) por un botón de texto claro y explícito (**"Descargar resultados"**) aprovechando la clase CSS `.archivos__btn-descargar`. Esto mejora la claridad de la acción requerida por el usuario una vez que su archivo cambia al estado "ASIGNADO".
