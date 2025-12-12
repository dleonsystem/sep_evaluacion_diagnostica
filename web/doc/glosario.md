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
- **Angular 17:** Framework para el frontend.
- **FastAPI:** Framework de backend en Python 3.12 utilizado para la API.
- **PostgreSQL:** Base de datos que guarda solicitudes, credenciales y bitácoras.
- **Redis + RQ/Celery:** Infraestructura de workers para validaciones y generación de PDFs.
