# Análisis del Issue 343

## 1. Resumen y Datos
- **Título/Estado**: [Security][CORS] CORS Wildcard '*' en producción / **Resuelto**
- **Componentes afectados**: `graphql-server/src/index.ts`, `graphql-server/.env.example`, `.env.example`.
- **Resumen Ejecutivo**: El servidor permitía el acceso desde cualquier origen HTTP vía comodín (`*`), lo que facilitaba ataques CSRF y fugas de datos. Se ha restringido a una lista blanca de orígenes configurada por el administrador.

## 2. Datos del issue
- Título: CORS Wildcard permitido por defecto
- Estado: Cerrado (Remediación finalizada)
- Labels: `seguridad`, `backend`, `fase-1`, `infraestructura`
- Prioridad aparente: Alta (Vulnerabilidad mayor que compromete la aserción de origen).
- Fuente consultada: OWASP A05, `index.ts`.

## 3. Problema reportado
Uso del comodín `*` en el middleware de CORS incluso cuando `NODE_ENV` no es `development`. Esto permite que cualquier sitio malicioso en internet pueda realizar peticiones a la API del SiCRER si un usuario administrador tiene una sesión abierta en su navegador.

## 4. Estado actual en el código
- El middleware de CORS usaba `*` como fallback si `CORS_ORIGIN` no estaba definida.
- En entorno de producción, esto ponía en riesgo la integridad de la base de datos de evaluaciones.

## 5. Comparación issue vs implementación
### Coincidencias
- El middleware `cors()` no estaba filtrando orígenes dinámicamente según el entorno.
### Brechas
- Se descubrió que la variable `CORS_ORIGIN` no estaba documentada en los archivos de ejemplo, imposibilitando una configuración segura inicial.

## 6. Diagnóstico
### Síntoma observado
- Un sitio externo podía recibir respuestas HTTP exitosas desde el servidor GraphQL sin restricciones.
### Defecto identificado
- Implementación de seguridad incompleta en el archivo principal del servidor.
### Causa raíz principal
- Configuración "permissiva" heredada de la fase de prototipado temprano.
### Riesgos asociados
- **Ataques de Cross-Site Request Forgery (CSRF)**.
- **Fuga de Información (Information Leakage)**.

## 7. Solución propuesta
### Objetivo
Restringir el acceso CORS a una lista blanca explícita, manteniendo la flexibilidad en el modo de desarrollo.
### Diseño detallado
1. Implementación de un validador en `index.ts` que separa la variable `CORS_ORIGIN` por comas y normaliza las URLs.
2. Bloqueo al arranque en producción si no existe al menos un origen configurado.
3. Actualización de plantillas de entorno.

## 8. Criterios de aceptación
- [x] El servidor falla al arrancar en producción si `CORS_ORIGIN` está vacío.
- [x] Solo los orígenes configurados pueden acceder a la API en producción.
- [x] El entorno de desarrollo (`development`) mantiene la flexibilidad actual para agilizar debug local.
- [x] Documentación actualizada en plantillas `.env`.

## 9. Estrategia de pruebas y Evidencia
- **Prueba de Producción**: Se arrancó el servidor con `NODE_ENV=production` y `CORS_ORIGIN=''`.
- **Resultado**: `logger.error('[FATAL] CORS_ORIGIN environment variable is required in production.')`.
- **Prueba de Origen**: Se validaron peticiones desde `localhost:4200` y fueron permitidas debido al check de desarrollo.
- **Estatus**: ✅ EXITOSO.

## 10. Cumplimiento de políticas y proceso
- Cumple con los requerimientos de la fase 1 para **Seguridad y Auditoría**.

## 11. Documentación requerida
- Archivos actualizados: `index.ts`, `.env.example`.

## 12. Acciones en GitHub
- Rama creada: `task/pepenautamx-issue343-fix-cors-wildcard`
- Reprote de cierre publicado en GitHub.

## 13. Recomendación final
Configurar en producción el origen exacto (ej: `https://sicrer.sep.gob.mx`) y evitar el uso de comodines incluso parciales.
