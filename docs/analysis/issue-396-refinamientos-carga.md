# Análisis y Corrección de Refinamientos en Carga Masiva y Panel de Administrador

## 1. Filtrado de Incidencias Públicas vs Tickets de Usuario
* **Problema:** En el panel de administrador, los reportes provenientes del formulario público de "Incidencias de Carga" se estaban listando también dentro de la pestaña de "Tickets de Usuario" de la Mesa de Ayuda, duplicando visualmente la información.
* **Causa:** La función de filtrado para la pestaña de tickets regulares no excluía los reportes de tipo público.
* **Solución:** Se modificó la propiedad `ticketsSoporteFiltrados` en `admin-panel.component.ts` para filtrar explícitamente y excluir los tickets cuyo `numeroTicket` comienza con el prefijo `'PUB-'`.
  * **Archivo modificado:** `web/frontend/src/app/components/admin-panel/admin-panel.component.ts`

## 2. Ocultamiento de Credenciales Innecesarias
* **Problema:** Cuando un usuario que ya había iniciado sesión exitosamente realizaba una nueva carga de archivo, la interfaz mostraba la sección "Datos de acceso" (Credenciales) con la contraseña vacía, lo cual causaba confusión ya que el usuario ya estaba autenticado.
* **Causa:** La sección de credenciales se mostraba incondicionalmente al tener éxito una carga.
* **Solución:** Se añadió la directiva `*ngIf="!sesionActiva"` al contenedor de las credenciales en la vista, garantizando que esta sección solo sea visible para usuarios nuevos (sin sesión) durante su primera carga.
  * **Archivo modificado:** `web/frontend/src/app/components/carga-masiva/carga-masiva.component.html`

## 3. Actualización de Identidad en Correos Electrónicos
* **Problema:** Los correos automáticos enviados por el sistema (recuperación de contraseña, envío de credenciales, bienvenida) mantenían el nombre obsoleto "Sistema de Evaluación Diagnóstica SiRVER".
* **Causa:** Las plantillas de correo en el backend estaban *hardcodeadas* con el nombre antiguo.
* **Solución:** Se reemplazaron todas las referencias en el servicio de correos por el nombre oficial actualizado: **"Sistema de Recepción del Formato de Valoraciones y Emisión de Resultados"**.
  * **Archivo modificado:** `graphql-server/src/services/mailing.service.ts`

## 4. Actualización de "Fecha de Carga" al Reemplazar Archivos
* **Problema:** En el historial de cargas del usuario, si se reemplazaba un archivo previamente cargado por una nueva versión validada, la interfaz seguía mostrando la fecha y hora de la primera carga original.
* **Causa:** En la base de datos, el flujo de reemplazo (cláusula `UPDATE`) actualizaba la columna `updated_at`, pero no actualizaba `fecha_carga`, que es la columna que la API expone y el Frontend muestra.
* **Solución:** Se modificó el resolver `uploadExcelAssessment` para que, en caso de reemplazo, incluya `fecha_carga = NOW()` en la sentencia `UPDATE`.
  * **Archivo modificado:** `graphql-server/src/schema/resolvers.ts`

## 5. Mejora en la Identificación de Archivos para Disparar Formulario de Incidencias Públicas
* **Problema:** El sistema debe habilitar el formulario de Incidencias Públicas si un usuario falla 3 veces en la carga. Sin embargo, si el usuario abría el Excel, corregía un error y lo guardaba, el contador se reiniciaba. 
* **Causa:** La función `generarIdArchivo()` generaba un identificador único basado en `nombre + tamaño + fechaDeModificacion`. Al guardar el archivo en Excel, el tamaño y la fecha cambiaban, haciendo que el sistema lo viera como un archivo completamente distinto y reiniciara el contador.
* **Solución:** Se refactorizó `generarIdArchivo()` para que ahora agrupe los intentos utilizando el **CCT** y el **Turno** extraídos directamente de la lectura del Excel. De esta forma, cualquier modificación técnica al archivo o cambios en su nombre son ignorados, manteniendo el historial de intentos para la misma escuela/turno intacto. (Si la lectura del CCT/Turno falla catastróficamente, usa el nombre del archivo como *fallback*).
  * **Archivo modificado:** `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
