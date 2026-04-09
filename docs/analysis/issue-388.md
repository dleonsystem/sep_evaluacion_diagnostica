# Análisis de Incidencia: Generación Redundante de Credenciales

**ID del Issue:** #388
**Estado:** RESUELTO (Validado en Código)
**Prioridad:** Alta (Fase 1)

## Descripción del Problema
Se reportó que al reintentar cargas de archivos Excel, el sistema generaba nuevas credenciales (contraseñas) que sobreescribían las anteriores, bloqueando efectivamente el acceso de los usuarios que ya tenían una cuenta válida.

## Análisis Técnico en el Backend
He analizado el flujo de la mutación `uploadExcelAssessment` en `resolvers.ts` y he verificado que la lógica actual previene este comportamiento redundante:

### 1. Detección de Usuario Existente
Antes de cualquier generación de credenciales, el sistema realiza una búsqueda por el correo electrónico normalizado proporcionado en el archivo o en el input (`normalizedEmail`).

### 2. Lógica de Bifurcación (Resolvers:2414-2424)
El código implementa una guardia estricta:
```typescript
if (!userToLink && inputEmail) {
  const uCheck = await client.query('SELECT id FROM usuarios WHERE email = $1', [inputEmail]);
  if (uCheck.rows.length > 0) {
    // CASO: Usuario ya existe
    userToLink = uCheck.rows[0].id;
    // Vincula la escuela si es necesario, pero NO genera ni cambia el password_hash
  } else {
    // CASO: Usuario nuevo
    // Solo aquí se genera la contraseña y se inserta el nuevo registro
  }
}
```

### 3. Preservación de Credenciales
- Si el usuario existe, se recupera su `id` y se utiliza para la transacción de carga.
- El campo `password_hash` en la tabla `usuarios` **no se modifica** durante los flujos de reintento o reemplazo de archivos.
- Esto garantiza que el usuario pueda seguir entrando con su contraseña original independientemente de cuántas veces reintente la carga.

## Conclusión
La lógica actual es **correcta y robusta**. El bug reportado ha sido solventado al asegurar que la creación de usuarios y generación de secretos solo ocurre una única vez (cuando el email no existe previamente en la base de datos).

---
**Fecha de Análisis:** 2026-04-09
**Estatus:** Verificado en el código base.
**Responsable:** Antigravity AI
