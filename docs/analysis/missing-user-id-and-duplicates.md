# Análisis: Identificación de Usuario y Reglas de Duplicidad en Cargas EIA2

## Resumen del Problema
Los usuarios informaron que después de cargar exitosamente un archivo Excel, el campo `usuario_id` en la tabla `solicitudes_eia2` se almacenaba como `NULL`. Esto impedía que el historial de "Cargas realizadas" mostrara correctamente los registros al usuario autenticado.

Además, el sistema requería una definición más estricta de lo que constituye un archivo "duplicado" para evitar múltiples registros activos para la misma escuela y turno por el mismo usuario.

## Análisis de Causa Raíz

### 1. Brecha en la Lógica de Vinculación de `usuario_id`
En el resolver `uploadExcelAssessment`:
- La variable `userToLink` se inicializaba desde el contexto de la sesión.
- Si el usuario no estaba logueado pero proporcionaba un correo, el backend intentaba buscar al usuario.
- **Problema**: Si el usuario era creado *dentro* de la misma transacción (lo cual ocurre si aún no existe), la variable `userToLink` no se actualizaba con el nuevo ID generado, resultando en una inserción de `NULL`.
- **Problema**: La rama de `UPDATE` (cuando el hash del archivo ya existía) no incluía el campo `usuario_id` en la consulta SQL, por lo que nunca vinculaba una carga anónima previa con un usuario identificado posteriormente.

### 2. Limitaciones en la Regla de Duplicidad
- **Lógica Anterior**: La duplicidad se detectaba principalmente por el `hash_archivo` (SHA256 del contenido del archivo).
- **Cambio Requerido**: La regla debe basarse en la identidad funcional de la carga: **Usuario + CCT + Turno**.
- **Restricción**: Un mismo usuario solo debe tener un registro activo (el más reciente) por escuela (CCT) y turno.

## Resolución Implementada

### Cambios en Base de Datos
Para dar soporte al requerimiento de Turno, es necesario persistir el `id_turno` en la tabla `solicitudes_eia2`.
- **ACCIÓN**: Se añadió la columna `id_turno` (INTEGER) a `solicitudes_eia2`.

### Actualización de Lógica en Resolvers
1.  **Verificación de Duplicados**: Antes de procesar el archivo, se busca si ya existe un registro para la combinación `(usuario_id, cct, id_turno)`.
2.  **Creación Atómica de Usuario**: Se captura el ID de los usuarios recién creados dentro de la transacción para asegurar que `userToLink` esté poblado antes del `INSERT` final.
3.  **Actualización Integral**: Se incluyeron `usuario_id` e `id_turno` en la ruta de `UPDATE` de la tabla `solicitudes_eia2`.

## Requerimientos de Documentación
- Actualización de `BITACORA_CAMBIOS_DB.md` con la nueva migración.
- Actualización de `ddl_generated.sql` para incluir la nueva columna.
- Actualización de `ESTRUCTURA_DE_DATOS.md` para reflejar el cambio de esquema.
