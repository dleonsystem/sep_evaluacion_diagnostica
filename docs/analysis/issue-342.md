# Análisis del Issue 342

## 1. Resumen y Datos
- **Título/Estado**: [Security][CORS] JWT_SECRET fallback inseguro / **Resuelto**
- **Componentes afectados**: `graphql-server/src/config/jwt.ts`, `docker-compose.yml`, `.env.example`.
- **Resumen Ejecutivo**: El sistema permitía el arranque con una firma JWT predecible (`supersecretkey`), lo que permitía ataques de falsificación de identidad (Identity Spoofing). Se ha implementado un bloqueo fatal al arranque si el secreto no es proveído.

## 2. Datos del issue
- Título: JWT_SECRET fallback inseguro en entorno productivo
- Estado: Cerrado (Implementación finalizada)
- Labels: `seguridad`, `backend`, `fase-1`, `altaPrioridad`
- Prioridad aparente: Crítica (Riesgo de compromiso de todas las cuentas de administrador).
- Fuente consultada: `jwt.ts`, `docker-compose.yml`.

## 3. Problema reportado
Exposición de una clave JWT por defecto en el código fuente y en configuraciones de Docker Compose. Esto viola el principio de "Seguridad por Defecto" y el estándar OWASP A02 de fallas criptográficas.

## 4. Estado actual en el código
- El archivo `jwt.ts` lanzaba una advertencia pero continuaba la ejecución con una clave pública.
- El archivo `docker-compose.yml` tenía `${JWT_SECRET:-supersecretkey}`.

## 5. Comparación issue vs implementación
### Coincidencias
- El reporte identificó correctamente el fallback en el bloque de variables de entorno.
### Brechas
- Se detectó que el fallback también estaba presente a nivel de orquestación (Docker), no solo en la App.

## 6. Diagnóstico
### Síntoma observado
- El servidor iniciaba sesión exitosamente incluso omitiendo la variable de entorno, usando una llave vulnerable.
### Defecto identificado
- Uso de operador de nulidad (`||`) con un string constante.
### Causa raíz principal
- Facilitar el despliegue rápido en desarrollo sacrificando la postura de seguridad en producción.
### Riesgos asociados
- **Falsificación de Tokens**: Cualquier atacante con conocimiento del código podría generar tokens válidos de administrador.

## 7. Solución propuesta
### Objetivo
Forzar la inyección de una clave robusta desde el entorno host, impidiendo que el servidor procese autenticaciones en estado inseguro.
### Diseño detallado
1. Modificación de `jwt.ts` para usar un bloque condicional que lanza `throw new Error()` si `JWT_SECRET` es corto o nulo.
2. Limpieza de `docker-compose.yml` para requerir la variable sin fallback.

## 8. Criterios de aceptación
- [x] El servidor lanza un error FATAL si `JWT_SECRET` no está definido.
- [x] Se eliminó el string `'supersecretkey'` de todo el repositorio.
- [x] `.env.example` marca la variable como obligatoria.

## 9. Estrategia de pruebas y Evidencia
- **Prueba de Omisión**: Se intentó arrancar el servidor con `JWT_SECRET=''`.
- **Resultado**: `Error: [FATAL] JWT_SECRET environment variable is required. Server cannot start without it.`
- **Estatus**: ✅ EXITOSO.

## 10. Cumplimiento de políticas y proceso
- Cumple con la **Política de Gestión de Secretos de la SEP** y el estándar **OWASP A02**.

## 11. Documentación requerida
- Archivos actualizados: `jwt.ts`, `docker-compose.yml`, `.env.example`.

## 12. Acciones en GitHub
- Rama creada: `task/pepenautamx-issue342-fix-jwt-fallback`
- Push realizado a `origin`.

## 13. Recomendación final
Asegurar que en el servidor productivo de la SEP, la rotación de este secreto se realice cada 90 días como mínimo.
