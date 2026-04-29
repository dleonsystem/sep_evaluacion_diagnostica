# Análisis del Issue 297

## 1. Resumen ejecutivo
Se identificó el uso de literales numéricos (`1`) en lugar de funciones de búsqueda por catálogo para el campo `estado_validacion` en la tabla `solicitudes_eia2` dentro de los resolvers de GraphQL. Esto representa un riesgo de integridad y mantenibilidad ante cambios en la base de datos. Se propone la sustitución sistemática por la función `fn_catalogo_id`.

## 2. Datos del issue
- Título: [DB][Resolvers] Reemplazar IDs hardcodeados por lookup de catálogo en solicitudes EIA2
- Estado: Open
- Labels: fase-1, alta, db
- Prioridad aparente: Alta
- Componentes afectados: GraphQL Server (Resolvers), Base de Datos (Catálogos)
- Fuente consultada: GitHub Issue #297, GitHub MCP Server

## 3. Problema reportado
Los resolvers de carga usan IDs numéricos mágicos (`1`, `2`) para `estado_validacion` en `solicitudes_eia2`. Esto acopla la lógica a datos implícitos de la base y rompe mantenibilidad. Un cambio en catálogos o en seeds puede alterar el comportamiento del backend sin cambiar código.

## 4. Estado actual en el código
En `graphql-server/src/schema/resolvers.ts`, se encontraron múltiples ocurrencias de `1` hardcodeado en las mutaciones de carga:
- Línea 1860, 1875, 1906, 1922, 2013: `estado_validacion = 1`.
- Existen constantes declaradas al inicio del archivo (líneas 195-196) como `SOLICITUD_ESTADO_VALIDO_SQL`, pero solo una está activa y se usa parcialmente.
- Se detectaron otros mapeos hardcodeados de turnos (línea 1890) y niveles educativos (línea 1959) que no forman parte del alcance del issue #297 pero son riesgos similares.

## 5. Comparación issue vs implementación
### Coincidencias
- El código efectivamente contiene el literal `1` para representar el estado inicial o de error en las solicitudes.
- La función `fn_catalogo_id` ya se utiliza en otros puntos (ej. `createTicket`), lo que confirma su disponibilidad.

### Brechas
- Se menciona el literal `2` en el issue, pero en las versiones revisadas de `uploadExcelAssessment` predomina el `1`.
- El literal `2` parece estar relacionado con el estado `VALIDADO`, el cual ya cuenta con una constante SQL pero no se aplica en todos los flujos.

### Inconsistencias
- La lógica de `uploadAssessmentResults` (línea 2194) ya utiliza la constante SQL, mientras que `uploadExcelAssessment` no lo hace, creando una inconsistencia en el estilo de codificación.

## 6. Diagnóstico
### Síntoma observado
Dificultad para garantizar que las solicitudes se inserten con el estado correcto si la tabla `cat_estado_validacion_eia2` cambia sus IDs en un ambiente de QA o Producción.

### Defecto identificado
Acoplamiento rígido (Hardcoding) de llaves primarias de base de datos en el código fuente de la capa de aplicación.

### Causa raíz
Prácticas de desarrollo rápido ("Quick fixes") que priorizaron la funcionalidad inmediata sobre la robustez arquitectónica y la independencia de datos.

## 7. Solución propuesta
### Diseño de la solución
1. **Normalización de constantes**: Definir constantes SQL para todos los estados de validación necesarios al inicio de `resolvers.ts`.
2. **Refactorización sistemática**: Reemplazar los literales `1` por llamadas a las constantes SQL dentro de los templates de consulta.
3. **Limpieza de código**: Eliminar comentarios muertos de constantes no utilizadas.

### Cambios en archivos
#### [MODIFY] [resolvers.ts](file:///c:/ANGULAR/sep_evaluacion_diagnostica/graphql-server/src/schema/resolvers.ts)
- Activar y estandarizar:
  ```typescript
  const SOLICITUD_ESTADO_PENDIENTE_SQL = "fn_catalogo_id('cat_estado_validacion_eia2', 'PENDIENTE')";
  const SOLICITUD_ESTADO_VALIDO_SQL = "fn_catalogo_id('cat_estado_validacion_eia2', 'VALIDO')";
  const SOLICITUD_ESTADO_RECHAZADO_SQL = "fn_catalogo_id('cat_estado_validacion_eia2', 'RECHAZADO')";
  ```
- Reemplazar en queries de `uploadExcelAssessment`.

## 8. Plan de verificación
### Pruebas sugeridas
- **Prueba Unitaria**: Ejecutar `npm test` para asegurar que el cambio de sintaxis SQL no rompe el parser ni los mocks.
- **Prueba Funcional**: Realizar una carga de Excel y verificar en la BD que el `estado_validacion` se asigne correctamente resolviendo el ID dinámicamente.
- **Prueba de Resiliencia**: Modificar temporalmente un ID en el catálogo de la DB y validar que la carga siga funcionando gracias al lookup por código.

### Criterios de aceptación
- No existen literales `1` o `2` en el contexto de `estado_validacion`.
- La solución utiliza `fn_catalogo_id` para garantizar independencia de la DB.
- Los reportes de análisis y documentación están actualizados.
