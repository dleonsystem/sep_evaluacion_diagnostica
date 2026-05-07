# Análisis del Issue 301 - Containerización

## 1. Resumen ejecutivo
El issue 301 (Infraestructura) aborda la falta de un entorno de despliegue reproducible. Actualmente, el proyecto depende de instalaciones locales de Node.js y bases de datos externas, lo que dificulta la consistencia entre ambientes (Dev, QA, Prod). La solución consiste en containerizar las tres capas principales: Frontend (Angular), Backend (GraphQL) y Base de Datos (PostgreSQL), orquestándolas con Docker Compose.

## 2. Datos del issue
- Título: [Infra][Containers] Containerizar backend y frontend y completar docker-compose con Postgres y healthcheck
- Prioridad: Alta
- Severidad: Infraestructura
- Fuente: GitHub Issue #301 / Sprint 3 del Plan de Trabajo.

## 3. Estado actual
- El archivo `docker-compose.yml` base solo incluye el servicio SFTP.
- No existen Dockerfiles en `graphql-server` ni en `web/frontend`.
- El pipeline de CI fue recientemente actualizado a Node 20, pero el entorno local sigue siendo heterogéneo.

## 4. Diagnóstico y Requerimientos
- **Backend**: Requiere Node 20, TypeScript, y variables de entorno para JWT, DB y SFTP.
- **Frontend**: Requiere Node 20 para el build de Angular y Nginx para servir los estáticos en producción.
- **Base de Datos**: Requiere Postgres 16 y debe inicializarse automáticamente con `init-db.sql`.
- **Orquestación**: Docker Compose debe manejar redes internas, volúmenes de persistencia y healthchecks para asegurar que el backend espere a la DB.

## 5. Propuesta Técnica
- Implementar **Multi-stage Builds** para reducir el tamaño de las imágenes finales.
- Usar imágenes `alpine` por su ligereza y seguridad.
- Configurar un archivo `.env.example` para estandarizar la configuración.
- Implementar un `healthcheck` robusto en el contenedor de Postgres.

## 7. Resultados de la Implementación
- **Backend**: Dockerfile multi-stage basado en `node:20-alpine`, optimizado para producción.
- **Frontend**: Dockerfile multi-stage con build de Angular 19 y servicio mediante Nginx (Nginx configurado para SPA).
- **Orquestación**: `docker-compose.yml` centralizado que levanta:
    - Base de Datos (PostgreSQL 16) con inicialización automática.
    - GraphQL Server (Backend) con healthcheck de DB.
    - Angular SPA (Frontend).
    - Servidor SFTP para almacenamiento de archivos.
- **Configuración**: `.env.example` proveído como plantilla de seguridad.

## 8. Evidencia y Conclusión
La implementación cumple con los criterios de aceptación del Sprint 3, permitiendo un despliegue "one-command" y garantizando la consistencia de versiones de runtime en todos los ambientes.
