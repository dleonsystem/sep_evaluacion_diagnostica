# Glosario de Términos – Plataforma de Recepción, Validación y Descarga EIA

- **Archivo de recepción:** Archivo .xlsx enviado por la escuela y almacenado tras pasar las 9 validaciones.
- **Archivo de resultados:** ZIP/PDF depositado por el sistema externo para descarga de la escuela.
- **CCT (Clave del Centro de Trabajo):** Identificador oficial de la escuela; se usa como usuario de acceso a descargas.
- **Credenciales generadas:** Usuario = CCT y contraseña = correo validado creados solo en la primera carga válida.
- **PDF de confirmación:** Comprobante descargado automáticamente cuando el archivo es válido; incluye mensaje, fecha de consulta (hoy + 4 días), usuario y contraseña.
- **PDF de errores:** Comprobante descargado automáticamente cuando las validaciones fallan.
- **Plataforma de recepción:** Módulo web que recibe, valida y registra solicitudes sin procesar resultados.
- **Repositorios separados:** Almacenamientos independientes para archivos recibidos y resultados publicados.
- **Validaciones (9):** Reglas automáticas sobre CCT, correo, nivel, campos y columnas obligatorias, valores 0–3, estructura general, número/nombre de hojas y consistencia interna.
- **Reenvío autenticado:** Restricción que bloquea envíos anónimos cuando ya existen credenciales para el CCT/correo; requiere login con las credenciales generadas en la primera carga válida para subir nuevos archivos.
- **SPA (Single Page Application):** Aplicación web de una sola página; el shell se carga una vez y las vistas cambian en el cliente sin recargar todo el documento. En este proyecto se implementa con Angular 19 y signals.
- **Angular 19 (signals):** Framework para el frontend; habilita el modelo reactivo con signals.
- **Guía gráfica gob.mx v3:** Estándar de diseño y estilos de la Administración Pública; se incluye desde CDN (`main.css`, `gobmx.js`, `main.js`) en `index.html`.
- **FastAPI:** Framework de backend en Python 3.12 utilizado para la API.
- **PostgreSQL:** Base de datos que guarda solicitudes, credenciales y bitácoras.
- **Redis + RQ/Celery:** Infraestructura de workers para validaciones y generación de PDFs.
- **Servicios simulados (frontend):** Implementaciones Angular que devuelven datos de prueba/localStorage con el mismo contrato HTTP que ofrecerá FastAPI, permitiendo cambiar a endpoints reales sin reescribir componentes.
- **Equipo backend externo:** Grupo responsable de construir la API FastAPI; el frontend se prepara para integrarse cuando los endpoints estén disponibles.
