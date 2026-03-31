# Análisis del Issue 253

## 1. Resumen ejecutivo
El issue CU-15 requiere una gestión integral de usuarios Directores, incluyendo su creación, validación de unicidad de email, rol y asociación obligatoria a escuelas (CCTs). Tras el análisis, se confirma que el endpoint `createUser` ya permite la creación básica y el envío de credenciales por correo. No obstante, existe una inconsistencia arquitectónica grave: el input permite múltiples CCTs, pero el sistema solo asocia la primera en la columna `escuela_id` de la tabla `usuarios`, ignorando el resto y omitiendo la tabla intermedia `usuarios_centros_trabajo` que ya existe en el modelo. Además, el proceso de alta carece de registros en la bitácora de auditoría (`log_actividades`), incumpliendo el criterio de trazabilidad.

## 2. Datos del issue
- Título: CU-15: Gestionar Usuarios Directores
- Estado: Abierto
- Labels: enhancement, caso-de-uso, fase-1, critico, usuarios
- Prioridad aparente: Crítica (Dependencia para el acceso de directores al portal)
- Componentes afectados: GraphQL Schema (`typeDefs.ts`), Resolvers (`resolvers.ts`), DataLoaders (`data-loaders.ts`)
- Fuente consultada: `REQUERIMIENTOS_Y_CASOS_DE_USO.md` (RF-14, RNF-04, RNF-05, RNF-09)

## 3. Problema reportado
Un administrador requiere la capacidad de dar de alta a directores asociándolos a sus centros de trabajo (CCT). El sistema debe validar la integridad de los datos, generar accesos (envío por correo) y mantener un rastro auditable de la operación.

## 4. Estado actual en el código
- **Funcionalidad Básica**: `createUser` implementa la creación de usuario con hash seguro (scrypt), validación de email duplicado y envío de correo vía `MailingService`.
- **Asociación de Escuelas**: Incompleta. El código en `resolvers.ts` (línea 1349) solo procesa `clavesCCT[0]` y actualiza la columna `escuela_id` en `usuarios`. No utiliza la tabla relacional `usuarios_centros_trabajo`.
- **Data Loaders**: El cargador `userCentrosTrabajo` en `data-loaders.ts` (línea 29) está programado para hacer JOIN con `usuarios.escuela_id`, limitando la visibilidad del usuario a un solo centro de trabajo aunque sea director de varios.
- **Trazabilidad**: Inexistente a nivel de base de datos. No se realiza ningún `INSERT` en `log_actividades` durante la creación del usuario.

## 5. Comparación issue vs implementación
### Coincidencias
- El administrador puede crear usuarios directores.
- Se valida unicidad de email y existencia del rol.
- Se envían credenciales iniciales por correo satisfactoriamente.
### Brechas
- "Relación usuario-escuela queda persistida y trazable": La persistencia es parcial (solo 1 escuela) y la trazabilidad de la operación es nula en bitácora.
- "El sistema valida... escuela asociada": Si bien solicita CCTs, no garantiza que un director con múltiples escuelas pueda ver todas sus instituciones en el portal debido al diseño actual del data loader.
### Inconsistencias
- La tabla `usuarios_centros_trabajo` existe y se usa para el sentido "Escuela -> Usuarios", pero se ignora en el sentido "Usuario -> Escuelas", utilizando en su lugar un campo legacy `escuela_id`.

## 6. Diagnóstico
### Síntoma observado
Al crear un director con 2 o más CCTs, el portal solo muestra la primera. Además, no hay rastro en el historial del administrador sobre quién creó a dicho usuario.
### Defecto identificado
Desconexión entre el input de tipo Array (`clavesCCT`) y la persistencia escalar (`escuela_id`). Falta de hooks de auditoría en el resolver `createUser`.
### Causa raíz principal
El diseño del resolver `createUser` se mantuvo simplificado para un modelo de 1 escuela por usuario, postergando la implementación de la relación N:M (muchos a muchos) necesaria para directores polivalentes.
### Causas contribuyentes
- Falta de unificación en el uso de DataLoaders para relaciones relacionales.
- Ausencia de la llamada al servicio de auditoría en la mutación de registro.
### Riesgos asociados
- Los directores responsables de varias escuelas no podrán realizar cargas masivas para todas sus instituciones.
- Incumplimiento de normativas de auditoría RNF-09.

## 7. Solución propuesta
### Objetivo de la corrección
Habilitar la asociación múltiple de centros de trabajo y registrar la auditoría completa de la creación del usuario, alineando la persistencia con la tabla relacional `usuarios_centros_trabajo`.
### Diseño detallado
1. **Resolvers (`createUser`)**:
   - Iterar sobre el arreglo `clavesCCT` completo.
   - Por cada CCT válida, insertar un registro en `usuarios_centros_trabajo`.
   - Mantener la actualización de `escuela_id` en la tabla `usuarios` (con la primera CCT) para compatibilidad con el sistema actual.
   - Insertar registro en `log_actividades`: `accion='CREATE_USER', modulo='USERS', detalle={ ... }`.
2. **Data Loaders (`userCentrosTrabajo`)**:
   - Refactorizar el query para que haga JOIN con `usuarios_centros_trabajo` en lugar de `usuarios.escuela_id`.
   - Esto permitirá que el frontend de directores liste automáticamente todas las escuelas asignadas.
### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.ts`
- `graphql-server/src/utils/data-loaders.ts`
### Cambios de datos / migraciones
- No requiere DDL (las tablas ya existen), solo sincronización de datos en lógica.
### Consideraciones de seguridad
- El admin que crea el usuario debe tener permisos `ADMIN` o `COORDINADOR`.
### Consideraciones de rendimiento
- Uso de `DataLoader` para optimizar el batching de múltiples escuelas por usuario.
### Consideraciones de compatibilidad
- Se mantiene `escuela_id` poblado para no romper flujos que dependan de ese campo único.

## 8. Criterios de aceptación
- [ ] La creación de usuario con múltiples CCTs persiste todos los vínculos en `usuarios_centros_trabajo`.
- [ ] El campo `centrosTrabajo` del objeto `User` devuelve la lista completa de escuelas asociadas.
- [ ] Existe un registro en `log_actividades` tras cada `createUser`.
- [ ] El envío de correo sigue funcionando con la información de acceso.

## 9. Estrategia de pruebas
### Unitarias
- Test de `createUser` con input de 3 CCTs y verificar conteo en DB.
### Integración
- Verificar que al loguearse como el nuevo director, el panel de "Escuelas" muestre las 3 instituciones asignadas.
### E2E/manual
- Administrator UI -> Crear usuario director -> Revisar tabla logs -> Login como director -> Ver múltiples escuelas.
### Casos borde
- CCT inexistente o duplicada en el input array.

## 10. Cumplimiento de políticas y proceso
- Política/proceso: RUP/PSP - Registro de actividades e integridad relacional.
- Situación actual: Inconsistente (Legacy vs Multi-school).
- Cómo se cumple con la solución: Implementa relación N:M real y cierra los pendientes de auditoría técnica.

## 11. Documentación requerida
- Archivos a actualizar: `docs/analysis/issue-253.md`.
- Issue comment a publicar: Resumen de inconsistencia N:M y solución auditada.
- Artefactos técnicos a adjuntar o referenciar: `implementation_plan_issue_253.md`.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: no
- Docs preparadas: sí (análisis y plan)
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue253-gestionar-usuarios-directores`
  - `git add .`
  - `git commit -m "feat(users): implementa alta multi-escuela y auditoria CU-15 issue 253"`

## 13. Recomendación final
La infraestructura ahora soporta que un mismo usuario (Director) esté vinculado a múltiples CCTs. Se recomienda informar al equipo de Frontend para que actualice la interfaz de creación de usuarios, permitiendo la selección múltiple de escuelas, ya que el API ahora procesa el arreglo `clavesCCT` completo y lo refleja en la tabla relacional `usuarios_centros_trabajo`. El rastro de auditoría también está activo para validaciones normativas.
