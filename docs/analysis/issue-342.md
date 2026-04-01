# Análisis del Issue 342

## 1. Resumen ejecutivo
Se ha detectado una vulnerabilidad crítica de seguridad (OWASP A02:2021) consistente en el uso de "fallbacks" o valores por defecto para la clave secreta de firma de tokens JWT (`JWT_SECRET`). Estos valores están presentes en el código fuente, en la configuración de Docker y en los ejemplos de entorno, lo que expone al sistema a la falsificación de identidad si el servidor se despliega sin configurar correctamente las variables de entorno reales.

## 2. Datos del issue
- Título: [Security][Auth] Eliminar fallback inseguro de JWT_SECRET en jwt.ts
- Estado: Abierto
- Labels: altaPrioridad, fase-1, seguridad
- Prioridad aparente: Alta (Crítica)
- Componentes afectados: `graphql-server/src/config/jwt.ts`, `docker-compose.yml`, `.env.example`.
- Fuente consultada: GitHub Issue 342, Auditoría Técnica 01/04/2026.

## 3. Problema reportado
El uso de `process.env.JWT_SECRET || 'your_jwt_secret_key...'` permite que, en caso de omisión de la variable en el entorno de producción, el sistema use una clave conocida y pública, permitiendo a atacantes generar tokens administrativos válidos (Token Forgery).

## 4. Estado actual en el código
- **`jwt.ts`**: Línea 6 usa un fallback de cadena literal.
- **`docker-compose.yml`**: Usa interpolación de bash con valor por defecto `${JWT_SECRET:-supersecretkey}`, lo que debilita el contenedor.
- **`.env.example`**: Contiene un valor de ejemplo que podría ser usado por error en despliegues reales.

## 5. Comparación issue vs implementación
### Coincidencias
- El código fuente confirma exactamente lo reportado en el issue.
### Brechas
- El issue menciona absorber el problema de `docker-compose.yml` (SEC-NEW-04) junto con el de `jwt.ts`.
### Inconsistencias
- No se han detectado. El reporte es preciso.

## 6. Diagnóstico
### Síntoma observado
El servidor inicia correctamente incluso cuando `JWT_SECRET` no está definida en la terminal o en el archivo `.env`.
### Defecto identificado
Falta de validación de pre-requisitos de seguridad en la etapa de carga de módulos (Bootstrap).
### Causa raíz principal
Arquitectura permisiva que prioriza la disponibilidad sobre la integridad y confidencialidad en el manejo de secretos.
### Causas contribuyentes
Uso de plantillas de configuración con valores por defecto poco estrictos.

## 7. Solución propuesta (Diseño detallado)
### Cambios técnicos
1. **Validación Fatal en Bootstrap**: Modificar `jwt.ts` para que use `throw new Error` si el secreto es nulo. Esto garantiza que el proceso de Node falle al intentar importar el módulo si no es seguro.
2. **Endurecimiento de Docker**: Eliminar el default `:-supersecretkey` en `docker-compose.yml`, forzando a que la variable venga del host o de un archivo `.env` externo.
3. **Documentación de Entorno**: Actualizar `.env.example` para quitar valores de ejemplo e incluir instrucciones de "requerido".

## 8. Análisis de impacto y riesgos
- **Regresión**: Si los entornos de CI/CD (GitHub Actions) no tienen configurada la variable, los tests fallarán al iniciar el servidor de prueba. Se debe asegurar que el secreto esté en los secrets del repo o definido en el workflow yaml.
- **DevOps**: Los desarrolladores locales tendrán que definir el secreto en su `.env` local para poder arrancar el backend.

## 9. Caso de prueba sugerido
1.  Renombrar el archivo `.env` local temporalmente.
2.  Intentar arrancar el servidor backend (`npm start` o `node dist/index.js`).
3.  **Resultado esperado**: El servidor NO debe arrancar y debe mostrar el error fatal por consola.

## 10. Implementación (Plan de tareas)
1.  Modificar `graphql-server/src/config/jwt.ts`.
2.  Modificar `docker-compose.yml`.
3.  Actualizar `graphql-server/.env.example` y `.env.example` (si existe en raíz).
4.  Validar en entorno local.

## 11. Evidencia pre-implementación
Confirmo acceso y hallazgo:
Ruta `graphql-server/src/config/jwt.ts`:
`const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';` (Línea 6)

## 12. Estimación de esfuerzo
~1 hora (Análisis + Implementación + Validación).

## 13. Referencias de calidad
- OWASP Top 10 A02:2021 — Cryptographic Failures.
- RNF-01 (Seguridad) del proyecto.
