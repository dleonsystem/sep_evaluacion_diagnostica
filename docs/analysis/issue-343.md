# Análisis del Issue 343

## 1. Resumen y Datos
- **Título/Estado**: [Security][CORS] Reemplazar CORS_ORIGIN fallback '*' por lista de orígenes explícita / **Abierto**
- **Componentes afectados**: `graphql-server/src/index.ts`, `.env.example`.
- **Resumen Ejecutivo**: La configuración actual de CORS en el servidor permite cualquier origen (`*`) por defecto si la variable `CORS_ORIGIN` no está definida, lo que constituye una falla de configuración de seguridad (OWASP A05) que expone la API a peticiones no autorizadas desde sitios de terceros.

## 2. Diagnóstico Técnico
- **Estado en Código**: En `graphql-server/src/index.ts:267`, el código implementa `callback(null, process.env.CORS_ORIGIN || '*');`. Esto confirma la realidad del reporte.
- **Causa Raíz**: Uso de un valor comodín (`*`) como fallback en entornos que no son de desarrollo, priorizando la facilidad de despliegue sobre la seguridad.
- **Riesgos**: Ataques de Cross-Site Request Forgery (CSRF) y robo de datos mediante scripts maliciosos en navegadores que realicen peticiones a la API desde orígenes no confiables, especialmente dado que el servidor maneja credenciales (`credentials: true`).

## 3. Solución Propuesta
- **Diseño Detallado**:
    1.  Extraer `CORS_ORIGIN` y convertirla en un array de strings (separados por coma).
    2.  Implementar una validación de arranque: si `NODE_ENV` no es `development` y no hay orígenes definidos, el servidor debe lanzar un error fatal.
    3.  Actualizar el middleware de CORS para que verifique si el `origin` de la petición está incluido en la lista de permitidos.
    4.  Actualizar archivos `.env.example` con ejemplos reales (ej. `http://localhost:4200,https://app.sep.gob.mx`).

- **Criterios de Aceptación**:
    - [ ] El servidor falla al arrancar en producción si `CORS_ORIGIN` está vacío.
    - [ ] Solo los orígenes configurados pueden acceder a la API en producción.
    - [ ] El entorno de desarrollo (`development`) mantiene la flexibilidad actual.
    - [ ] Documentación actualizada en plantillas `.env`.

## 4. Estrategia de Pruebas
- **Unitarias (Mock de Env)**: Probar la lógica de parsing de orígenes con strings vacíos, un solo origen y múltiples orígenes.
- **Integración**: Intentar arrancar el servidor con `NODE_ENV=production` y `CORS_ORIGIN` ausente.
- **Casos Borde**: Probar comportamiento cuando el `origin` es `undefined` (peticiones directas o del mismo servidor).

## 5. Trazabilidad
- **Rama de trabajo**: `task/pepenautamx-issue343-fix-cors-wildcard`
- **Comandos ejecutados**: 
    - `git checkout -b task/pepenautamx-issue343-fix-cors-wildcard`
    - `grep -n "CORS_ORIGIN" graphql-server/src/index.ts`
