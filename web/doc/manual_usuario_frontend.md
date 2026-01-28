# Manual de usuario (Frontend)

## 1. Introducción
Este manual explica, paso a paso y en lenguaje no técnico, cómo usar la plataforma web de Evaluación Diagnóstica. Aquí encontrarás qué hacer en cada página, cómo subir archivos, cómo revisar resultados y cómo usar el módulo de soporte. Este manual aplica al frontend actual y se centra en la experiencia del usuario final y del administrador.

> 📷 **Pon aquí imagen de la pantalla de inicio (vista general del portal).**

---

## 2. Navegación general (menú superior)
En el menú superior encontrarás los accesos principales al sistema:

- **Inicio**: Página principal con el resumen del objetivo y el flujo rápido de carga. 【F:web/frontend/src/app/shared/nav/nav.component.html†L10-L38】
- **Carga masiva**: Módulo para subir la plantilla oficial de Excel sin iniciar sesión. 【F:web/frontend/src/app/shared/nav/nav.component.html†L16-L21】
- **Login**: Acceso para usuarios que ya generaron credenciales con su primera carga. 【F:web/frontend/src/app/shared/nav/nav.component.html†L65-L74】
- **Admin login**: Acceso exclusivo para administradores. 【F:web/frontend/src/app/shared/nav/nav.component.html†L106-L112】

Cuando un usuario inicia sesión, el menú muestra un **submenú de usuario** con:

- **Archivos guardados**
- **Descargas**
- **Soporte**
- **Mis tickets**
- **Cerrar sesión**

【F:web/frontend/src/app/shared/nav/nav.component.html†L23-L61】

> 📷 **Pon aquí imagen del menú superior (estado sin sesión).**
> 📷 **Pon aquí imagen del menú con sesión iniciada (submenú desplegado).**

---

## 3. Página de Inicio
En la página de inicio encontrarás:

- Una descripción del objetivo del sistema y sus beneficios. 【F:web/frontend/src/app/components/inicio/inicio.component.html†L26-L71】
- Un flujo rápido de tres pasos: descargar plantilla, validar archivo y descargar resultados. 【F:web/frontend/src/app/components/inicio/inicio.component.html†L74-L90】
- Botones para ir directamente a **Carga masiva** o **Archivos guardados**. 【F:web/frontend/src/app/components/inicio/inicio.component.html†L91-L100】

> 📷 **Pon aquí imagen de la sección “Flujo rápido”.**

---

## 4. Carga masiva (subir archivo Excel)
Esta es la página principal para cargar la plantilla oficial (.xlsx) sin iniciar sesión. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L1-L7】

### 4.1 Estado de sesión
En la parte superior verás un panel que indica si la sesión está activa y, si aplica, el correo de la sesión. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L13-L66】

- Si ya existen credenciales, se muestra un botón para ir al login. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L52-L59】
- Si la sesión está activa, aparece la opción para cerrar sesión. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L61-L63】

> 📷 **Pon aquí imagen del panel de sesión (sin sesión).**
> 📷 **Pon aquí imagen del panel de sesión (con sesión activa).**

### 4.2 Captura de correo
Antes de subir el archivo, es obligatorio capturar un correo válido. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L68-L89】

- El sistema muestra un aviso si el correo ya tiene una contraseña asociada. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L82-L86】

> 📷 **Pon aquí imagen del campo de correo y validación.**

### 4.3 Selección y carga de archivos
La carga se habilita cuando el correo es válido. Puedes arrastrar o seleccionar archivos .xlsx. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L91-L123】

> 📷 **Pon aquí imagen del área de arrastrar y soltar.**

### 4.4 Resultados de validación
Una vez subido el archivo:

- Se muestra el estado de validación (validando, con errores o validado). 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L146-L187】
- Si hay errores, se despliega una lista detallada por hoja. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L199-L214】
- Si el archivo es válido, se confirma el resultado y se generan credenciales si es la primera carga. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L223-L269】

> 📷 **Pon aquí imagen del estado de validación con errores.**
> 📷 **Pon aquí imagen del estado de validación exitoso.**

### 4.5 Guardar archivos localmente
Cuando un archivo es válido, puedes usar el botón **“Cargar Archivo”** para guardarlo localmente en el navegador. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L270-L286】

También existe la opción **“CARGAR TODO”** para guardar todos los archivos válidos. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L312-L319】

> 📷 **Pon aquí imagen del botón “Cargar Archivo” y “CARGAR TODO”.**

### 4.6 Descarga de PDF de confirmación
Si el sistema genera un PDF de confirmación, se muestra su estado y el nombre del archivo descargado. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L288-L311】

> 📷 **Pon aquí imagen del estado de descarga de PDF.**

### 4.7 Guía rápida de validación
Al final de la página hay una guía rápida con reglas para llenar correctamente el archivo Excel (hoja ESC y TERCERO). 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L326-L366】

> 📷 **Pon aquí imagen de la sección “Guía rápida para el archivo de Evaluación”.**

---

## 5. Login (usuarios)
La página de login se usa cuando ya se generaron credenciales en una carga previa. 【F:web/frontend/src/app/components/login/login.component.html†L1-L18】

- Se ingresa correo y contraseña. 【F:web/frontend/src/app/components/login/login.component.html†L14-L46】
- Hay un botón para mostrar/ocultar la contraseña. 【F:web/frontend/src/app/components/login/login.component.html†L32-L45】
- El sistema puede mostrar alertas si no hay credenciales o si hay error. 【F:web/frontend/src/app/components/login/login.component.html†L6-L11】【F:web/frontend/src/app/components/login/login.component.html†L52-L54】

> 📷 **Pon aquí imagen del formulario de login.**

---

## 6. Archivos guardados
Esta sección permite revisar los archivos cargados y guardados localmente.

- Se muestra una tabla con nombre, nivel, CCT, correo, tamaño, fecha y acciones. 【F:web/frontend/src/app/components/archivos-guardados/archivos-guardados.component.html†L21-L73】
- Puedes **descargar** o **eliminar** archivos guardados. 【F:web/frontend/src/app/components/archivos-guardados/archivos-guardados.component.html†L47-L76】
- Si existen resultados asociados, puedes desplegarlos y descargar. 【F:web/frontend/src/app/components/archivos-guardados/archivos-guardados.component.html†L77-L126】

> 📷 **Pon aquí imagen de la tabla de archivos guardados.**
> 📷 **Pon aquí imagen del detalle de resultados desplegado.**

---

## 7. Descargas (usuarios con sesión)
En esta vista se muestran los módulos de descarga disponibles para usuarios con sesión activa.

- Se muestra el seguimiento de descargas y la tabla de versiones disponibles. 【F:web/frontend/src/app/components/descargas/descargas.component.html†L1-L37】

> 📷 **Pon aquí imagen de la pantalla de descargas autenticada.**

---

## 8. Soporte: Crear ticket
En la página **Soporte** el usuario puede levantar tickets con evidencia.

- Selecciona un motivo y describe el problema. 【F:web/frontend/src/app/components/tickets/tickets.component.html†L13-L46】
- Puedes adjuntar evidencias (PDF, Excel, Word o imágenes) hasta el máximo permitido. 【F:web/frontend/src/app/components/tickets/tickets.component.html†L48-L75】
- Después de enviar, se listan los tickets creados y sus respuestas. 【F:web/frontend/src/app/components/tickets/tickets.component.html†L82-L121】

> 📷 **Pon aquí imagen del formulario de creación de ticket.**
> 📷 **Pon aquí imagen del listado de tickets creados.**

---

## 9. Mis tickets (historial del usuario)
Aquí se consulta el estado de los tickets enviados.

- Se muestra una tabla con folio, motivo, descripción, respuesta, fecha, evidencias y estatus. 【F:web/frontend/src/app/components/tickets-historial/tickets-historial.component.html†L14-L43】
- Puedes expandir un ticket para ver la respuesta completa del administrador. 【F:web/frontend/src/app/components/tickets-historial/tickets-historial.component.html†L44-L78】

> 📷 **Pon aquí imagen de la tabla de “Mis tickets”.**
> 📷 **Pon aquí imagen de un ticket expandido con respuesta.**

---

# Manual para Administradores

## 10. Login de administrador
El acceso de administrador se realiza desde **Admin login**.

- Se capturan correo y contraseña. 【F:web/frontend/src/app/components/admin-login/admin-login.component.html†L18-L54】
- Se puede mostrar/ocultar la contraseña. 【F:web/frontend/src/app/components/admin-login/admin-login.component.html†L28-L46】
- Se muestran credenciales de ejemplo en pantalla. 【F:web/frontend/src/app/components/admin-login/admin-login.component.html†L4-L16】

> 📷 **Pon aquí imagen del formulario de login de administrador.**

---

## 11. Panel de administrador
En esta sección se administran registros, resultados y tickets.

### 11.1 Selección de nivel y registros Excel
- El administrador selecciona el nivel (preescolar, primaria o secundaria). 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L14-L26】
- Se muestran registros de Excel disponibles y se pueden filtrar por texto, estatus y fecha. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L33-L82】
- Se selecciona un registro con un botón de radio. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L96-L114】

> 📷 **Pon aquí imagen de la tabla de Excels disponibles.**

### 11.2 Subida de archivos de resultados
- Se seleccionan archivos de resultados (PDF, XLSX, JPG, Word). 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L129-L142】
- El botón **Subir archivos** se habilita cuando se seleccionan archivos. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L143-L150】
- Si intentas subir sin seleccionar un registro de Excel, aparece una alerta indicando que debes seleccionar uno. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.ts†L83-L113】
- El sistema muestra el estado de la carga y el historial reciente. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L152-L176】

> 📷 **Pon aquí imagen del formulario para subir resultados.**
> 📷 **Pon aquí imagen del estado de carga / historial reciente.**

### 11.3 Gestión de tickets (administrador)
- Se listan los tickets de soporte y se filtran por texto o estatus. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L183-L214】
- Al seleccionar un ticket se ve el detalle completo, evidencias y respuestas. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L220-L273】
- El administrador puede cambiar estatus y escribir una respuesta al usuario. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L275-L293】

> 📷 **Pon aquí imagen del listado de tickets (admin).**
> 📷 **Pon aquí imagen del detalle de ticket con respuesta.**

---

## 12. Cerrar sesión (administrador)
El administrador puede cerrar su sesión desde el botón **Cerrar sesión** al final del panel. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L295-L296】

> 📷 **Pon aquí imagen del botón “Cerrar sesión” del administrador.**

---

## 13. Recomendaciones generales
- Usa un correo válido para la carga masiva, ya que con ese correo se generan las credenciales de acceso. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L68-L89】
- Guarda la contraseña generada en la primera carga, ya que será necesaria para futuras sesiones. 【F:web/frontend/src/app/components/carga-masiva/carga-masiva.component.html†L151-L177】
- Si no ves un registro en el panel de administrador, asegúrate de validar un Excel desde carga masiva. 【F:web/frontend/src/app/components/admin-panel/admin-panel.component.html†L27-L32】

> 📷 **Pon aquí imagen de la sección de credenciales generadas.**

---

## 14. Glosario rápido
- **Carga masiva:** Subida de plantilla Excel con validación automática.
- **Credenciales:** Correo + contraseña generada en la primera carga.
- **Resultados:** Archivos de salida que el administrador asocia a un registro Excel.
- **Ticket:** Solicitud de soporte enviada por el usuario.
