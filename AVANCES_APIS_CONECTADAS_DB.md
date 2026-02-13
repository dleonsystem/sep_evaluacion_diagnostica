# Avances de APIs conectadas a base de datos (estado actual)

Este documento resume las APIs del backend `graphql-server` que hoy ya ejecutan operaciones contra PostgreSQL.

## 1) Base técnica ya operativa

- API GraphQL montada con Apollo Server.
- Conexión a PostgreSQL mediante pool (`pg.Pool`).
- Helper de consultas central (`query`) y cliente transaccional (`getClient`).
- Verificación de salud por GraphQL y por endpoint REST.

---

## 2) Queries implementadas y conectadas a BD

## `healthCheck`
- Ejecuta `SELECT NOW()` para comprobar conectividad.
- Devuelve estado de BD y latencia.

## `getUser(id)`
- Consulta usuario por ID.
- Integra catálogo de roles con `JOIN`.

## `listUsers(limit, offset)`
- Cuenta total de usuarios.
- Lista usuarios paginados con `LIMIT/OFFSET`.

## `getCCT(clave)`
- Recupera un centro de trabajo por clave CCT.

## `getEvaluacion(id)`
- Recupera evaluación por identificador.

## `getSolicitudes(limit, offset)`
- Lista solicitudes EIA2 ordenadas por fecha.
- Incluye estado de validación y metadatos del archivo.

---

## 3) Mutations implementadas y conectadas a BD

## `createUser(input)`
- Verifica duplicidad de correo.
- Resuelve rol desde catálogo.
- Genera hash de contraseña (`scrypt` + salt).
- Inserta usuario y relaciona CCTs.

## `authenticateUser(input)`
- Busca usuario por correo.
- Valida usuario activo.
- Compara contraseña con hash almacenado.
- Actualiza último acceso al autenticar.

## `updateUser(id, input)`
- Actualización dinámica de campos enviados.
- Persistencia directa en `usuarios`.

## `deleteUser(id)`
- Baja de usuario por id.
- Retorna éxito/mensaje de operación.

## `uploadExcelAssessment(input)`
- Procesa archivo Excel en base64.
- Detecta CCT, nivel y grado.
- Registra solicitud en `solicitudes_eia2`.
- Inserta/actualiza escuela, grupos y estudiantes.
- Inserta evaluaciones por materia.
- Usa transacción completa (`BEGIN/COMMIT/ROLLBACK`).

---

## 4) Endpoints REST de soporte en el mismo servidor

- `GET /health`
  - Reporta disponibilidad y estado de conexión a BD.
- `GET /`
  - Reporta metadata del servicio y rutas.

---

## 5) Tablas alcanzadas por la capa API

- `usuarios`
- `cat_roles_usuario`
- `usuarios_centros_trabajo`
- `centros_trabajo`
- `solicitudes_eia2`
- `escuelas`
- `grupos`
- `estudiantes`
- `evaluaciones`
- `periodos_evaluacion`
- `materias`

---

## 6) Conclusión

A la fecha, el backend ya cuenta con operaciones funcionales conectadas a PostgreSQL para:
- autenticación y administración de usuarios,
- consulta de catálogos y entidades clave,
- y carga masiva EIA2 con persistencia transaccional.

Esto confirma que la capa API ya está integrada a base de datos para los flujos críticos del sistema.
