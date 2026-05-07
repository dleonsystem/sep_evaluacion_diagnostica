# Análisis del Issue 344

## 1. Resumen y Datos
- **Título/Estado**: [Security][SFTP] Credenciales SFTP hardcodeadas / **Resuelto**
- **Componentes afectados**: `docker-compose.yml`, `sftp.service.ts`, `.env.example`, `README.md`.
- **Resumen Ejecutivo**: Las claves del servidor de almacenamiento de archivos EIA estaban expuestas en texto claro en un repositorio público. Se ha movido la configuración a variables de entorno inyectadas, desacoplando la infraestructura de los secretos.

## 2. Datos del issue
- Título: Mover credenciales SFTP a archivo .env
- Estado: Cerrado (Remediación finalizada)
- Labels: `infraestructura`, `seguridad`, `fase-1`, `Docker`
- Prioridad aparente: Alta (Exposición pública de secretos en GitHub).
- Fuente consultada: OWASP A02, `docker-compose.yml`.

## 3. Problema reportado
En el archivo `docker-compose.yml`, los servicios `sftp` y `backend` contenían el usuario `eia_user` y el password `eia_password` de forma explícita. Cualquier clon del repositorio podía acceder a la información almacenada en los despliegues resultantes.

## 4. Estado actual en el código
- El `docker-compose.yml` usaba strings literales para las credenciales.
- `SftpService.ts` tenía fallbacks para el usuario y el password en caso de no ser inyectados.

## 5. Comparación issue vs implementación
### Coincidencias
- El reporte señalaba correctamente las líneas de configuración en Docker Compose.
### Brechas
- Se identificó un riesgo adicional: los fallbacks en el código TypeScript (`'user'`, `'pass'`) que permitían al sistema funcionar de forma insegura si el administrador omitía las variables.

## 6. Diagnóstico
### Síntoma observado
- Un usuario externo podía conectarse al puerto 2222 del sistema usando las credenciales por defecto encontradas en GitHub.
### Defecto identificado
- Falta de segregación entre configuración de infraestructura y secretos.
### Causa raíz principal
- Inclusión de parámetros productivos por defecto para simplificar el despliegue de desarrollo.
### Riesgos asociados
- **Pérdida de Integridad**: Manipulación o borrado de evaluaciones EIA de cualquier CCT cargado en el sistema.

## 7. Solución propuesta
### Objetivo
Eliminar cualquier secreto del código fuente y forzar la inyección desde el host mediante el archivo `.env`.
### Diseño detallado
1. Implementación de interpolación `${SFTP_USER}` y `${SFTP_PASSWORD}` en Compose.
2. Refactorización de `SftpService` para bloquear conexiones si la inyección falla.
3. Inclusión de guías de generación de claves en el `README.md`.

## 8. Criterios de aceptación
- [x] `docker-compose.yml` no contiene contraseñas literales.
- [x] El sistema arranca correctamente si las variables están en el `.env` local.
- [x] `.env.example` no contiene secretos reales (Sanitizado con placeholders).
- [x] README incluye comando para generar passwords seguros (ej: `openssl rand -base64 16`).

## 9. Estrategia de pruebas y Evidencia
- **Prueba de Inyección**: Verificado `docker-compose.yml` final: `SFTP_PASSWORD: ${SFTP_PASSWORD}`.
- **Prueba de Bloqueo**: Se ejecutó prueba de runtime: `error: SFTP Connection Blocked: Missing SFTP_USER or SFTP_PASSWORD`.
- **Resultado**: `RESULTADO_PRUEBA: ÉXITO_BLOQUEADO` (Confirmado bloqueo preventivo).
- **Estatus**: ✅ EXITOSO.

## 10. Cumplimiento de políticas y proceso
- Cumple con la **Metodología PSP/RUP** de calidad y seguridad de software.

## 11. Documentación requerida
- Archivos actualizados: `docker-compose.yml`, `sftp.service.ts`, `.env.example`, `README.md`.

## 12. Acciones en GitHub
- Rama creada: `task/pepenautamx-issue344-fix-sftp-credentials`
- Cierre del issue documentado con evidencia técnica.

## 13. Recomendación final
Utilizar contraseñas largas y generadas aleatoriamente (ej: `openssl rand -base64 24`) para las credenciales SFTP de producción.
