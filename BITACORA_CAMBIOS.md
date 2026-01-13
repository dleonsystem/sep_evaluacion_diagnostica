# Bitácora de cambios del proyecto

Este documento se actualiza con cada modificación relevante al proyecto para entregar el informe mensual solicitado.

## 2025-11-25

- Se instala y configura el frontend en Angular, incluyendo ajustes iniciales de caché y dependencias para asegurar builds consistentes.
- Se habilita el componente de inicio con módulos compartidos básicos y se alinea el `.gitignore` para evitar artefactos de caché en el repositorio.

## 2025-12-12

- Se integra el módulo de autenticación JWT y se agrega el componente de **carga masiva** con validación frontal de la plantilla de Preescolar.
- Se implementan flujos de guardado local: selector del navegador, automatización del guardado y listado/eliminación de archivos almacenados.
- Se añaden alertas con SweetAlert2, prevención de duplicados por hash y control de sesión (obligatorio para cargas repetidas, consulta de guardados y reenvío autenticado tras la primera carga).
- Se mejora la consistencia del guardado (confirmaciones centralizadas, almacenamiento por correo) y se ajusta el layout de carga masiva (espaciados, eliminación de tarjetas, estado visual de botones guardados).

## 2025-12-15

- Se refuerza la captura y validación de correo antes de cargar archivos, asociando metadatos por CCT y permitiendo recuperar registros aunque el correo no venga explícito en la hoja.
- Se valida que el correo del formulario coincida con la hoja ESC, se muestra el estado de sesión y se permite volver a la carga sin forzar login cuando aplica.
- Se amplía la validación de múltiples archivos antes de guardarlos y se previene la eliminación errónea de tarjetas o vínculos en el flujo de carga masiva.

## 2025-12-18

- Se precarga el correo de usuarios autenticados, se muestra cada lote de credenciales solo una vez y se mejora el formato de las credenciales en pantalla.
- Se exige un correo válido para habilitar el botón/zona de carga, se muestran mensajes durante la validación inicial y de éxito con la fecha disponible (+4 días) y se mantiene el checklist que bloquea cargas con inconsistencias de correo, CCT, hoja o estructura.
- Se corrige la generación y uso de `fechaDisponible` antes de construir mensajes de éxito para evitar errores de compilación y asegurar que la fecha calculada se refleje correctamente.
