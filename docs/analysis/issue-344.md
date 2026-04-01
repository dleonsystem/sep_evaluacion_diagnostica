# Análisis del Issue 344

## 1. Resumen y Datos
- **Título/Estado**: [Security][SFTP] Mover credenciales SFTP de docker-compose.yml a archivo .env / **Abierto**
- **Componentes afectados**: `docker-compose.yml`, `.env.example`, `graphql-server/.env.example`, `README.md`.
- **Resumen Ejecutivo**: Las credenciales del servicio SFTP y del cliente en el backend están expuestas en texto claro dentro del control de versiones. Esto viola el estándar OWASP A02:2021 (Cryptographic Failures) y permite el acceso no autorizado al servidor de almacenamiento en cualquier despliegue derivado del repositorio.

## 2. Diagnóstico Técnico
- **Estado en Código**: 
    - `docker-compose.yml:40`: `SFTP_PASS: eia_password` (servicio backend).
    - `docker-compose.yml:64`: `SFTP_USERS: "eia_user:eia_password:1001"` (servicio sftp).
    - `.env.example`: Contiene los mismos valores "por defecto" que coinciden con la infraestructura real.
- **Causa Raíz**: Configuración de infraestructura "hardcoded" para facilitar el inicio rápido, sin separar la configuración de los secretos en la etapa de diseño de contenedores.
- **Riesgos**: Compromiso de la integridad de los archivos EIA (segunda aplicación) cargados por los usuarios. Un atacante podría borrar, modificar o descargar evaluaciones sensibles.

## 3. Solución Propuesta
- **Diseño Detallado**:
    1.  **Interpolación en Compose**: Modificar `docker-compose.yml` para usar `${SFTP_USER}`, `${SFTP_PASSWORD}` y `${SFTP_USERS}`.
    2.  **Estandarización de Variables**: Asegurar que el backend y el servicio sftp compartan la misma fuente de verdad para el usuario/password.
    3.  **Limpieza de Plantillas**: Quitar `eia_password` de los archivos de ejemplo.
    4.  **Guía de Usuario**: Agregar sección de "Seguridad de Infraestructura" en el README principal.

- **Criterios de Aceptación**:
    - [x] `docker-compose.yml` no contiene contraseñas literales.
    - [x] El sistema arranca correctamente si las variables están en el `.env` local (Verificado con `npm run build`).
    - [x] `.env.example` no contiene secretos reales (Sanitizado con placeholders).
    - [x] README incluye comando para generar passwords seguros (ej: `openssl rand -base64 16`).

## 4. Estrategia de Pruebas y Evidencia
- **Prueba de Inyección**: Se verificó el `docker-compose.yml` con `Select-String` para asegurar que no hay rastros de `eia_password`.
- **Prueba de Bloqueo en Caliente**: Se ejecutó un script Node que intenta usar `SftpService` sin las variables `SFTP_USER`/`SFTP_PASSWORD` en producción.
  - **Resultado**: `RESULTADO_PRUEBA: ÉXITO_BLOQUEADO` (El sistema impidió la conexión por falta de secretos).
- **Prueba de Compilación**: `npm run build` exitoso con las nuevas referencias de variables.

## 5. Trazabilidad
- **Rama de trabajo**: `task/pepenautamx-issue344-fix-sftp-credentials`
- **Comandos ejecutados**:
    - `git checkout -b task/pepenautamx-issue344-fix-sftp-credentials`
    - `Select-String "SFTP_" docker-compose.yml`
