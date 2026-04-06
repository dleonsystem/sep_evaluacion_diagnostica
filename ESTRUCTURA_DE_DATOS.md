# ESTRUCTURA DE DATOS - Sistema SEP Evaluación Diagnóstica

> **Documento generado desde DDL real** | Fecha: 25 marzo 2026  
> **Fuente de verdad**: `ddl_generated.sql` (62 tablas totales)

Este documento describe la estructura completa y fidedigna de la base de datos PostgreSQL del Sistema SEP Evaluación Diagnóstica, reflejando **exactamente** el DDL productivo actual.

---

## 📊 Inventario de Tablas

| Categoría | Cantidad | Notas |
|-----------|----------|-------|
| **Catálogos ENUM Mirror** | 19 | Reemplazan tipos ENUM por tablas con FKs (incluye NIAs) |
| **Catálogos Tradicionales** | 5 | CAT_CICLOS_ESCOLARES, CAT_ENTIDADES_FEDERATIVAS, CAT_TURNOS, CAT_GRADOS, CAT_ROLES_USUARIO |
| **Entidades Core** | 2 | MATERIAS, COMPETENCIAS |
| **Entidades Principales** | 3 | ESCUELAS, GRUPOS, ESTUDIANTES |
| **Usuarios y Seguridad** | 8 | USUARIOS, USUARIOS_CENTROS_TRABAJO, HISTORICO_PASSWORDS, BLOQUEOS_IP, SESIONES, INTENTOS_LOGIN, CAMBIOS_AUDITORIA, LOG_ACTIVIDADES |
| **Archivos y Validación** | 6 | ARCHIVOS_FRV, ARCHIVOS_TEMPORALES, ARCHIVOS_TICKETS, CREDENCIALES_EIA2, SOLICITUDES_EIA2, BITACORA_SINCRONIZACION |
| **Evaluaciones y NIA** | 4 | EVALUACIONES, RESULTADOS_COMPETENCIAS, PERIODOS_EVALUACION, NIVELES_INTEGRACION_ESTUDIANTE |
| **Reportes y Notificaciones** | 4 | REPORTES_GENERADOS, NOTIFICACIONES_EMAIL, PLANTILLAS_EMAIL, PREGUNTAS_FRECUENTES |
| **Tickets de Soporte** | 3 | TICKETS_SOPORTE, COMENTARIOS_TICKET, CAT_PRIORIDAD_TICKET |
| **Configuración** | 2 | CONFIGURACIONES_SISTEMA, CONSENTIMIENTOS_LGPDP |
| **Staging DBF** | 10 | PRE3, PRI1-PRI6, SEC1-SEC3 |
| **TOTAL** | **66** | Todas documentadas aquí |

---

## 🗂️ CATÁLOGOS ENUM MIRROR

These 18 tablas reemplazan tipos ENUM mediante el patrón **"ENUM Mirror"** (tablas con FK). Todas comparten estructura idéntica:

```sql
CREATE TABLE cat_nombre_catalogo (
    id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    orden SMALLINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 1. CAT_NIVEL_EDUCATIVO

**Valores**: `PREESCOLAR`, `PRIMARIA`, `SECUNDARIA`, `TELESECUNDARIA`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SMALLINT | PK autoincremental |
| codigo | VARCHAR(50) | Código canónico (UNIQUE) |
| descripcion | VARCHAR(200) | Descripción legible |
| orden | SMALLINT | Orden de visualización |
| activo | BOOLEAN | Indica si está activo |

**Notas**: Referenciado por `escuelas(id_nivel)`, `grupos(nivel_educativo)`, `materias(nivel_educativo)`, `cat_grados(nivel_educativo)`.

---

### 2. CAT_ESTADO_ARCHIVO

**Valores**: `CARGADO`, `VALIDADO`, `PROCESADO`, `ERROR`

Usado por: `archivos_frv(estado)`

---

### 3. CAT_ESTADO_ARCHIVO_TEMPORAL

**Valores**: `PENDIENTE`, `PROCESANDO`, `COMPLETADO`, `ERROR`

Usado por: `archivos_temporales(estado)`

---

### 4. CAT_TIPO_BLOQUEO

**Valores**: `AUTOMATICO`, `MANUAL`, `PERMANENTE`

Usado por: `bloqueos_ip(tipo_bloqueo)`

---

### 5. CAT_OPERACION_AUDITORIA

**Valores**: `INSERT`, `UPDATE`, `DELETE`

Usado por: `cambios_auditoria(operacion)`

---

### 6. CAT_TIPO_CONFIGURACION

**Valores**: `STRING`, `INTEGER`, `BOOLEAN`, `JSON`

Usado por: `configuraciones_sistema(tipo_dato)`

---

### 7. CAT_ORIGEN_CAMBIO_PASSWORD

**Valores**: `SISTEMA`, `USUARIO`, `ADMIN`, `RECUPERACION`

Usado por: `historico_passwords(cambiada_por)`

---

### 8. CAT_ESTADO_VALIDACION_EIA2

**Valores**: `VALIDO`, `INVALIDO`

Usado por: `solicitudes_eia2(estado_validacion)`

---

### 9. CAT_TIPO_REPORTE

**Valores**: `ENS`, `HYC`, `LEN`, `SPC`, `F5`

Usado por: `reportes_generados(tipo_reporte)`

---

### 10. CAT_TIPO_NOTIFICACION

**Valores**: `RESULTADO_LISTO`, `TICKET_CREADO`, `TICKET_ACTUALIZADO`, `TICKET_RESUELTO`, `RECUPERACION_PASSWORD`, `CREDENCIALES_EIA2`, `EVALUACION_VALIDADA`

Usado por: `notificaciones_email(tipo)`, `plantillas_email(tipo_notificacion)`

---

### 11. CAT_ESTADO_NOTIFICACION

**Valores**: `PENDIENTE`, `ENVIADO`, `ERROR`, `REINTENTANDO`

Usado por: `notificaciones_email(estado)`

---

### 12. CAT_PRIORIDAD_NOTIFICACION

**Valores**: `ALTA`, `MEDIA`, `BAJA`

Usado por: `notificaciones_email(prioridad)`

---

### 13. CAT_REFERENCIA_TIPO_NOTIFICACION

**Valores**: `TICKET`, `REPORTE`, `USUARIO`, `EVALUACION`, `CREDENCIAL`

Usado por: `notificaciones_email(referencia_tipo)`

---

### 14. CAT_MOTIVO_FALLO_LOGIN

**Valores**: `USUARIO_INVALIDO`, `PASSWORD_INCORRECTO`, `CUENTA_BLOQUEADA`, `CUENTA_INACTIVA`, `CUENTA_ELIMINADA`, `PASSWORD_EXPIRADO`

Usado por: `intentos_login(motivo_fallo)`

---

### 15. CAT_ESTADO_TICKET

**Valores**: `ABIERTO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`

Usado por: `tickets_soporte(estado)`

---

### 16. CAT_ESTADO_ARCHIVO_TICKET

**Valores**: `ACTIVO`, `ELIMINADO`, `CORRUPTO`, `EN_CUARENTENA`

Usado por: `archivos_tickets(estado)`

---

### 17. CAT_PRIORIDAD_TICKET

**Valores**: `BAJA`, `MEDIA`, `ALTA`, `CRITICA`

Usado por: `tickets_soporte(prioridad)`

---

### 18. CAT_NIVELES_INTEGRACION

**Valores**: `ED` (En Desarrollo), `EP` (En Proceso), `ES` (Esperado), `SO` (Sobresaliente)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_nia | SERIAL | PK - Identificador único |
| clave | VARCHAR(2) | Clave unívoca (UNIQUE) |
| nombre | VARCHAR(50) | Nombre del nivel |
| descripcion | TEXT | Descripción del nivel |
| rango_min | INT | Rango mínimo de valoración (0-3) |
| rango_max | INT | Rango máximo de valoración (0-3) |
| color_hex | VARCHAR(7) | Código de color para visualización |
| orden_visual | INT | Orden jerárquico |
| vigente | BOOLEAN | Indica si es vigente |

Usado por: `niveles_integracion_estudiante(id_nia)`

---

### 18. CAT_CAMPOS_FORMATIVOS

**Valores**: `ENS` (Enseñanza), `HYC` (Historia y Civismo), `LEN` (Lenguaje), `SPC` (Saberes), `F5` (Formato 5)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | PK - Identificador único |
| clave | VARCHAR(10) | Clave del campo (UNIQUE) |
| nombre | VARCHAR(100) | Nombre del campo formativo |
| descripcion | TEXT | Descripción del área |
| orden_visual | INT | Orden de visualización |
| vigente | BOOLEAN | Indica si es vigente |

Usado por: `materias(id_campo_formativo)`, `niveles_integracion_estudiante(id_campo_formativo)`

---

## 🏛️ CATÁLOGOS TRADICIONALES

### CAT_CICLOS_ESCOLARES

Ciclos escolares del sistema educativo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_ciclo | INT | PK - Identificador único |
| nombre | VARCHAR(20) | Nombre del ciclo (ej: "2024-2025") UNIQUE |
| fecha_inicio | DATE | Fecha de inicio del ciclo escolar |
| fecha_fin | DATE | Fecha de fin del ciclo escolar |
| activo | BOOLEAN | Indica si es el ciclo activo DEFAULT FALSE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Constraints:**
- `chk_cat_ciclos_fechas CHECK (fecha_fin > fecha_inicio)`

**Relaciones:**
- Referenciado por: `escuelas(id_ciclo)`

---

### CAT_ENTIDADES_FEDERATIVAS

Los 32 estados de la República Mexicana.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_entidad | INT | PK - Código INEGI |
| nombre | VARCHAR(100) | Nombre completo del estado |
| abreviatura | VARCHAR(10) | Abreviatura (ej: "CDMX", "JAL") UNIQUE |
| codigo_sep | VARCHAR(5) | Código SEP UNIQUE |
| region | VARCHAR(50) | Región geográfica |

**Relaciones:**
- Referenciado por: `escuelas(id_entidad)`

---

### CAT_TURNOS

Turnos escolares disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_turno | INT | PK - Identificador único |
| nombre | VARCHAR(50) | Nombre del turno |
| codigo | VARCHAR(10) | Código único (MAT, VESP, NOCT, CONT, DISC) UNIQUE |
| descripcion | VARCHAR(100) | Descripción del turno |

**Datos iniciales**: Matutino, Vespertino, Nocturno, Continuo (Tiempo completo), Discontinuo.

**Relaciones:**
- Referenciado por: `escuelas(id_turno)`

---

### CAT_GRADOS

Grados escolares por nivel educativo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_grado | INT | PK - Identificador único |
| nivel_educativo | SMALLINT | FK a `cat_nivel_educativo(id)` |
| grado_numero | INT | Número del grado (1-6) |
| grado_nombre | VARCHAR(20) | Nombre textual (ej: "Primero", "Segundo") |
| orden | INT | Orden de visualización |

**Constraints:**
- `uq_cat_grados UNIQUE (nivel_educativo, grado_numero)`

**Relaciones:**
- FK: `cat_nivel_educativo(id)`
- Referenciado por: `grupos(grado_id)`

---

### CAT_ROLES_USUARIO

Roles de usuario del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_rol | INT | PK - Identificador único |
| nombre | VARCHAR(50) | Nombre del rol |
| codigo | VARCHAR(20) | Código único (DIRECTOR, OPERADOR, ADMIN) UNIQUE |
| descripcion | VARCHAR(200) | Descripción del rol |
| permisos | JSONB | Objeto JSON con permisos DEFAULT '{}' |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Datos iniciales**: Director, Subdirector, Operador SEP, Administrador General.

**Relaciones:**
- Referenciado por: `usuarios(rol)`

---

## 🎓 ENTIDADES CORE

### MATERIAS

Materias/asignaturas del sistema educativo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| codigo | VARCHAR(10) | Código único de la materia UNIQUE |
| nombre | VARCHAR(100) | Nombre de la materia |
| nivel_educativo | SMALLINT | FK a `cat_nivel_educativo(id)` |
| id_campo_formativo | INT | FK a `cat_campos_formativos(id)` |
| orden | INT | Orden de visualización |
| activa | BOOLEAN | Indica si está activa DEFAULT TRUE |

**Índices:**
- `idx_materias_codigo UNIQUE (codigo)`

**Relaciones:**
- FK: `cat_nivel_educativo(id)`
- Referenciado por: `competencias(id_materia)`, `evaluaciones(materia_id)`

---

### COMPETENCIAS

Competencias asociadas a cada materia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_competencia | INT | PK - Identificador único |
| id_materia | UUID | FK a `materias(id)` |
| codigo | VARCHAR(20) | Código de la competencia |
| descripcion | VARCHAR(500) | Descripción detallada |
| nivel_esperado | INT | Nivel esperado de logro |

**Constraints:**
- `UNIQUE (id_materia, codigo)`

**Relaciones:**
- FK: `materias(id)`
- Referenciado por: `resultados_competencias(id_competencia)`

---

## 🏫 ENTIDADES PRINCIPALES

### ESCUELAS

Centros educativos del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| cct | VARCHAR(10) | Clave de Centro de Trabajo UNIQUE |
| nombre | VARCHAR(150) | Nombre de la escuela |
| estado | VARCHAR(50) | Estado (texto libre) |
| cp | VARCHAR(10) | Código postal |
| telefono | VARCHAR(15) | Teléfono de contacto |
| email | VARCHAR(255) | Email institucional |
| director | VARCHAR(150) | Nombre del director |
| municipio | VARCHAR(100) | Municipio |
| localidad | VARCHAR(100) | Localidad |
| calle | VARCHAR(300) | Nombre de la calle |
| num_exterior | VARCHAR(20) | Número exterior |
| entre_la_calle | VARCHAR(300) | Entre la calle (referencia) |
| y_la_calle | VARCHAR(300) | Y la calle (referencia) |
| calle_posterior | VARCHAR(300) | Calle posterior (referencia) |
| colonia | VARCHAR(100) | Colonia |
| fecha_registro | TIMESTAMP | Fecha de registro DEFAULT NOW() |
| activo | BOOLEAN | Indica si está activa DEFAULT TRUE |
| id_turno | INT | FK a `cat_turnos(id_turno)` NOT NULL |
| id_nivel | SMALLINT | FK a `cat_nivel_educativo(id)` NOT NULL |
| id_entidad | INT | FK a `cat_entidades_federativas(id_entidad)` NOT NULL |
| id_ciclo | INT | FK a `cat_ciclos_escolares(id_ciclo)` NOT NULL |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `uq_escuelas_cct UNIQUE (cct)`
- `chk_escuelas_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`
- `chk_escuelas_cct_format CHECK (cct ~ '^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$')`

**Triggers:**
- `trg_validar_cct_formato` (BEFORE INSERT/UPDATE): Valida y normaliza CCT a mayúsculas
- `trg_touch_escuelas` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `cat_turnos(id_turno)`, `cat_nivel_educativo(id)`, `cat_entidades_federativas(id_entidad)`, `cat_ciclos_escolares(id_ciclo)`
- Referenciado por: `usuarios(escuela_id)`, `grupos(escuela_id)`, `archivos_frv(escuela_id)`, `reportes_generados(escuela_id)`, `tickets_soporte(escuela_id)`, `consentimientos_lgpdp(escuela_id)`

---

### GRUPOS

Grupos escolares dentro de cada escuela.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| escuela_id | UUID | FK a `escuelas(id)` ON DELETE CASCADE |
| grado_id | INT | FK a `cat_grados(id_grado)` |
| nombre | VARCHAR(100) | Nombre del grupo (ej: "A", "B", "Grupo 1") |
| nivel_educativo | SMALLINT | FK a `cat_nivel_educativo(id)` |
| grado_nombre | VARCHAR(20) | Nombre del grado (desnormalizado) |
| grado_numero | INT | Número del grado (desnormalizado) |
| turno | VARCHAR(20) | Turno (desnormalizado) |
| total_alumnos | INT | Total de alumnos DEFAULT 0 |
| activo | BOOLEAN | Indica si está activo DEFAULT TRUE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `UNIQUE (escuela_id, grado_id, nombre)`

**Índices:**
- `idx_grupos_nombre_search (escuela_id, nombre)`
- `idx_grupos_escuela_grado (escuela_id, grado_id)`

**Triggers:**
- `trg_touch_grupos` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `escuelas(id)`, `cat_grados(id_grado)`, `cat_nivel_educativo(id)`
- Referenciado por: `estudiantes(grupo_id)`

---

### ESTUDIANTES

Estudiantes del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| nombre | VARCHAR(150) | Nombre completo del estudiante |
| grupo_id | UUID | FK a `grupos(id)` ON DELETE RESTRICT |
| curp | VARCHAR(18) | CURP del estudiante UNIQUE |
| fecha_nacimiento | DATE | Fecha de nacimiento |
| estatus | CHAR(1) | Estado (A=Activo, B=Baja, etc) DEFAULT 'A' |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Índices:**
- `idx_estudiantes_curp UNIQUE (curp)`
- `idx_estudiantes_grupo (grupo_id)`

**Relaciones:**
- FK: `grupos(id)`
- Referenciado por: `evaluaciones(estudiante_id)`, `consentimientos_lgpdp(estudiante_id)`

---

## 👤 USUARIOS Y SEGURIDAD

### USUARIOS

Usuarios del sistema (consolidado: incluye preferencias de notificación).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| nombre | VARCHAR(60) | Nombre(s) |
| apepaterno | VARCHAR(60) | Apellido paterno |
| apematerno | VARCHAR(60) | Apellido materno |
| email | VARCHAR(255) | Email único UNIQUE |
| email_excel | VARCHAR(255) | Email alternativo de Excel |
| password_hash | VARCHAR(255) | Hash bcrypt de la contraseña |
| rol | INT | FK a `cat_roles_usuario(id_rol)` |
| escuela_id | UUID | FK a `escuelas(id)` (NULL para admin) |
| password_debe_cambiar | BOOLEAN | Fuerza cambio de password DEFAULT TRUE |
| ultimo_cambio_password | TIMESTAMP | Fecha del último cambio |
| bloqueado_hasta | TIMESTAMP | Fecha hasta la cual está bloqueado |
| activo | BOOLEAN | Indica si está activo DEFAULT TRUE |
| preferencias_notif | JSONB | Preferencias de notificación DEFAULT '{}' |
| fecha_registro | TIMESTAMP | Fecha de registro DEFAULT NOW() |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |
| primer_login | BOOLEAN | Indicador de primer acceso DEFAULT TRUE |
| intentos_fallidos | INT | Número de intentos fallidos DEFAULT 0 |

**Constraints:**
- `uq_usuarios_email UNIQUE (email)`

**Índices:**
- `idx_usuarios_email UNIQUE (email)`

**Triggers:**
- `trg_validar_email_formato` (BEFORE INSERT/UPDATE): Valida formato email y normaliza a minúsculas
- `trg_touch_usuarios` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `cat_roles_usuario(id_rol)`, `escuelas(id)`
- Referenciado por: `usuarios_centros_trabajo(usuario_id)`, `historico_passwords(usuario_id)`, `sesiones(usuario_id)`, `intentos_login(usuario_id)`, `log_actividades(id_usuario)`, `notificaciones_email(usuario_id)`, `tickets_soporte(usuario_id, asignado_a)`, `comentarios_ticket(usuario_id)`, `evaluaciones(registrado_por, validado_por)`, `archivos_frv(usuario_id)`, `archivos_temporales(usuario_id)`, `solicitudes_eia2(usuario_id)`, `reportes_generados(descargado_por)`, `plantillas_email(actualizado_por)`, `configuraciones_sistema(actualizado_por)`, `bloqueos_ip(desbloqueado_por)`

---

### USUARIOS_CENTROS_TRABAJO

Relación Muchos-a-Muchos entre Usuarios y Centros de Trabajo (CCTs). Permite que un usuario gestione múltiples escuelas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| usuario_id | UUID | FK a `usuarios(id)` ON DELETE CASCADE |
| centro_trabajo_id | UUID | FK a `escuelas(id)` ON DELETE CASCADE |

**Constraints:**
- `PRIMARY KEY (usuario_id, centro_trabajo_id)`

**Relaciones:**
- FK: `usuarios(id)`, `escuelas(id)`

---

### HISTORICO_PASSWORDS

Historial de contraseñas de usuarios (previene reuso).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| usuario_id | UUID | FK a `usuarios(id)` ON DELETE CASCADE |
| password_hash | VARCHAR(255) | Hash bcrypt de la contraseña |
| es_temporal | BOOLEAN | Indica si es temporal DEFAULT FALSE |
| generada_en | TIMESTAMP | Fecha de generación DEFAULT NOW() |
| expira_en | TIMESTAMP | Fecha de expiración (para temporales) |
| cambiada_en | TIMESTAMP | Fecha en que fue cambiada |
| cambiada_por | SMALLINT | FK a `cat_origen_cambio_password(id)` DEFAULT fn_catalogo_id('cat_origen_cambio_password','SISTEMA') |
| ip_origen | VARCHAR(50) | IP desde donde se cambió |
| activa | BOOLEAN | Indica si es la password activa DEFAULT TRUE |

**Índices:**
- `idx_historico_password_activa UNIQUE (usuario_id) WHERE activa`

**Triggers:**
- `trg_registrar_cambio_password` (BEFORE INSERT): Desactiva passwords anteriores, calcula `expira_en` según origen
- `trg_validar_reutilizacion_password` (BEFORE INSERT): Valida que no se repita entre las últimas 5

**Relaciones:**
- FK: `usuarios(id)`, `cat_origen_cambio_password(id)`

---

### BLOQUEOS_IP

Bloqueos de direcciones IP por seguridad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | PK autoincremental |
| ip_address | INET | Dirección IP bloqueada |
| intentos_fallidos | INT | Número de intentos fallidos DEFAULT 0 |
| motivo | VARCHAR(255) | Motivo del bloqueo |
| tipo_bloqueo | SMALLINT | FK a `cat_tipo_bloqueo(id)` DEFAULT fn_catalogo_id('cat_tipo_bloqueo','AUTOMATICO') |
| bloqueado_desde | TIMESTAMP | Fecha desde la cual está bloqueado DEFAULT NOW() |
| bloqueado_hasta | TIMESTAMP | Fecha hasta la cual está bloqueado |
| desbloqueado_por | UUID | FK a `usuarios(id)` (quien lo desbloqueó) |
| desbloqueado_en | TIMESTAMP | Fecha de desbloqueo |
| activo | BOOLEAN | Indica si está activo DEFAULT TRUE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Relaciones:**
- FK: `cat_tipo_bloqueo(id)`, `usuarios(id)`

---

### CAMBIOS_AUDITORIA

Auditoría de cambios en tablas críticas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | PK autoincremental |
| tabla | VARCHAR(100) | Nombre de la tabla afectada |
| registro_id | VARCHAR(100) | ID del registro afectado |
| operacion | SMALLINT | FK a `cat_operacion_auditoria(id)` (INSERT/UPDATE/DELETE) |
| usuario_id | UUID | FK a `usuarios(id)` |
| valores_anteriores | JSONB | Valores antes del cambio |
| valores_nuevos | JSONB | Valores después del cambio |
| ip_address | INET | IP del usuario |
| user_agent | TEXT | User agent del navegador |
| metadata | JSONB | Metadatos adicionales |
| created_at | TIMESTAMP | Fecha del cambio DEFAULT NOW() |

**Relaciones:**
- FK: `cat_operacion_auditoria(id)`, `usuarios(id)`

---

### LOG_ACTIVIDADES

Bitácora consolidada de actividades del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_log | BIGSERIAL | PK autoincremental |
| id_usuario | UUID | FK a `usuarios(id)` |
| fecha_hora | TIMESTAMP | Fecha y hora DEFAULT NOW() |
| accion | VARCHAR(100) | Acción realizada |
| tabla | VARCHAR(50) | Tabla afectada (si aplica) |
| registro_id | VARCHAR(100) | ID del registro afectado |
| detalle | JSONB | Detalles JSON |
| ip_address | INET | IP del usuario |
| user_agent | TEXT | User agent |
| modulo | VARCHAR(100) | Módulo del sistema |
| resultado | VARCHAR(50) | Resultado (éxito/error) |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Índices:**
- `idx_log_usuario_fecha (id_usuario, fecha_hora)`

**Relaciones:**
- FK: `usuarios(id)`

---

### CONFIGURACIONES_SISTEMA

Configuraciones globales del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | PK autoincremental |
| categoria | VARCHAR(50) | Categoría de la configuración |
| clave | VARCHAR(100) | Clave única de la configuración UNIQUE |
| valor | TEXT | Valor de la configuración |
| tipo_dato | SMALLINT | FK a `cat_tipo_configuracion(id)` (STRING/INTEGER/BOOLEAN/JSON) |
| descripcion | TEXT | Descripción del parámetro |
| editable_por_usuario | BOOLEAN | Permite edición por usuarios DEFAULT FALSE |
| requiere_reinicio | BOOLEAN | Requiere reinicio del sistema DEFAULT FALSE |
| valor_por_defecto | TEXT | Valor por defecto |
| validacion_regex | VARCHAR(255) | Regex de validación |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |
| actualizado_por | UUID | FK a `usuarios(id)` |

**Relaciones:**
- FK: `cat_tipo_configuracion(id)`, `usuarios(id)`

---

### SESIONES

Sesiones activas de usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| usuario_id | UUID | FK a `usuarios(id)` ON DELETE CASCADE |
| token_hash | VARCHAR(255) | Hash del token JWT |
| ip_address | INET | IP de la sesión |
| user_agent | TEXT | User agent del navegador |
| expira_en | TIMESTAMP | Fecha de expiración |
| revocado | BOOLEAN | Indica si fue revocado DEFAULT FALSE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Relaciones:**
- FK: `usuarios(id)`

---

### INTENTOS_LOGIN

Registro de intentos de login (exitosos y fallidos).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| usuario_id | UUID | FK a `usuarios(id)` (NULL si usuario no existe) |
| email | VARCHAR(255) | Email intentado |
| ip_address | INET | IP del intento |
| user_agent | TEXT | User agent |
| exito | BOOLEAN | Indica si fue exitoso |
| motivo_fallo | SMALLINT | FK a `cat_motivo_fallo_login(id)` |
| bloqueado_hasta | TIMESTAMP | Fecha de bloqueo (si aplica) |
| metadata | JSONB | Metadatos adicionales |
| created_at | TIMESTAMP | Fecha del intento DEFAULT NOW() |

**Índices:**
- `idx_intentos_usuario_fecha (usuario_id, created_at) WHERE usuario_id IS NOT NULL`
- `idx_intentos_ip_fecha (ip_address, created_at)`

**Triggers:**
- `trg_verificar_bloqueo_usuario` (BEFORE INSERT): Bloquea usuario tras 5 fallos en 15 min
- `trg_detectar_ataque_distribuido` (AFTER INSERT): Bloquea usuario tras 10 fallos desde 3+ IPs en 1 hora

**Relaciones:**
- FK: `usuarios(id)`, `cat_motivo_fallo_login(id)`

---

## 📂 ARCHIVOS Y VALIDACIÓN

### ARCHIVOS_FRV

Metadata de archivos FRV (Formato de Recepción y Validación) cargados por escuelas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| escuela_id | UUID | FK a `escuelas(id)` ON DELETE CASCADE |
| usuario_id | UUID | FK a `usuarios(id)` |
| ciclo_escolar | VARCHAR(9) | Ciclo escolar (ej: "2024-2025") |
| nivel | SMALLINT | FK a `cat_nivel_educativo(id)` |
| estado | SMALLINT | FK a `cat_estado_archivo(id)` (CARGADO/VALIDADO/PROCESADO/ERROR) |
| file_path | VARCHAR(500) | Ruta física del archivo |
| filename_original | VARCHAR(255) | Nombre original del archivo |
| file_size | BIGINT | Tamaño en bytes |
| mime_type | VARCHAR(50) | Tipo MIME |
| validacion_resultado | JSONB | Resultado de validaciones |
| validado_en | TIMESTAMP | Fecha de validación |
| procesado_en | TIMESTAMP | Fecha de procesamiento |
| total_estudiantes | INT | Total de estudiantes en el archivo |
| created_at | TIMESTAMP | Fecha de carga DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Índices:**
- `idx_archivos_frv_escuela_ciclo (escuela_id, ciclo_escolar)`
- `idx_evaluaciones_archivo (archivo_frv_id)`

**Triggers:**
- `trg_touch_archivos_frv` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `escuelas(id)`, `usuarios(id)`, `cat_nivel_educativo(id)`, `cat_estado_archivo(id)`
- Referenciado por: `evaluaciones(archivo_frv_id)`, `tickets_soporte(archivo_frv_id)`

---

### ARCHIVOS_TEMPORALES

Archivos temporales durante carga (soporte para chunked uploads).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| usuario_id | UUID | FK a `usuarios(id)` |
| filename_original | VARCHAR(255) | Nombre original del archivo |
| file_path_temp | VARCHAR(500) | Ruta temporal |
| file_size | BIGINT | Tamaño en bytes |
| mime_type | VARCHAR(50) | Tipo MIME |
| chunk_actual | INT | Chunk actual (para uploads por partes) |
| chunks_totales | INT | Total de chunks esperados |
| hash_parcial | VARCHAR(64) | Hash SHA256 parcial |
| estado | SMALLINT | FK a `cat_estado_archivo_temporal(id)` DEFAULT fn_catalogo_id('cat_estado_archivo_temporal','PENDIENTE') |
| error_mensaje | TEXT | Mensaje de error (si aplica) |
| expira_en | TIMESTAMP | Fecha de expiración |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Relaciones:**
- FK: `usuarios(id)`, `cat_estado_archivo_temporal(id)`

---

### ARCHIVOS_TICKETS

Metadata de archivos adjuntos a tickets de soporte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| numero_ticket | VARCHAR(20) | FK a `tickets_soporte(numero_ticket)` ON DELETE CASCADE |
| nombre_archivo | VARCHAR(255) | Nombre original del archivo |
| tamanio | BIGINT | Tamaño en bytes |
| extension | VARCHAR(20) | Extensión del archivo (pdf, jpg, png, etc) |
| ruta | VARCHAR(500) | Ruta completa en filesystem/storage |
| estado | SMALLINT | FK a `cat_estado_archivo_ticket(id)` DEFAULT fn_catalogo_id('cat_estado_archivo_ticket','ACTIVO') |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `chk_archivos_tickets_tamanio CHECK (tamanio > 0)`
- `chk_archivos_tickets_extension CHECK (extension IS NULL OR extension ~ '^[A-Za-z0-9]{1,20}$')`

**Índices:**
- `idx_archivos_tickets_numero (numero_ticket)`
- `idx_archivos_tickets_estado (estado)`

**Triggers:**
- `trg_touch_archivos_tickets` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `tickets_soporte(numero_ticket)`, `cat_estado_archivo_ticket(id)`

---

### CREDENCIALES_EIA2

Credenciales de acceso al sistema externo EIA2 por CCT.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| cct | VARCHAR(10) | CCT UNIQUE |
| correo_validado | VARCHAR(255) | Email validado para acceso |
| password_hash | VARCHAR(255) | Hash de la contraseña |
| primera_carga_valida_fecha | TIMESTAMP | Fecha de primera carga válida |
| generado_en | TIMESTAMP | Fecha de generación DEFAULT NOW() |
| activo | BOOLEAN | Indica si está activo DEFAULT TRUE |
| ultimo_acceso | TIMESTAMP | Fecha del último acceso |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Relaciones:**
- Referenciado por: `solicitudes_eia2(credencial_id)`

---

### SOLICITUDES_EIA2

Solicitudes de procesamiento de archivos EIA2 (plataforma externa).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| consecutivo | BIGINT | Consecutivo único DEFAULT nextval('seq_solicitudes_eia2_consecutivo') UNIQUE |
| cct | VARCHAR(10) | CCT de la escuela |
| credencial_id | UUID | FK a `credenciales_eia2(id)` |
| archivo_original | VARCHAR(255) | Nombre del archivo original |
| fecha_carga | TIMESTAMP | Fecha de carga |
| estado_validacion | SMALLINT | FK a `cat_estado_validacion_eia2(id)` (VALIDO/INVALIDO) |
| errores_validacion | JSONB | Errores de validación |
| archivo_path | VARCHAR(500) | Ruta del archivo |
| archivo_size | BIGINT | Tamaño en bytes |
| procesado_externamente | BOOLEAN | Indica si fue procesado externamente DEFAULT FALSE |
| fecha_procesamiento | TIMESTAMP | Fecha de procesamiento |
| resultado_path | VARCHAR(500) | Ruta del archivo de resultados |
| resultado_disponible_desde | TIMESTAMP | Fecha desde que está disponible |
| numero_estudiantes | INT | Número de estudiantes en el archivo |
| nivel_educativo | SMALLINT | FK a `cat_nivel_educativo(id)` |
| hash_archivo | VARCHAR(64) | Hash SHA256 del archivo |
| usuario_id | UUID | FK a `usuarios(id)` |
| resultados | JSONB | Resultados procesados. Estructura: `[{nombre: string, size: number}]`. Crítico para descargas en portal. |
| detalles_error | JSONB | Detalles adicionales de errores si `estado_validacion` es INVALIDO. |
| equipo_asignado | INT | Identificador del equipo de distribución asignado |
| distributed_at | TIMESTAMP | Fecha/hora de distribución al equipo |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Índices:**
- `idx_solicitudes_eia2_consecutivo UNIQUE (consecutivo)`

**Relaciones:**
- FK: `credenciales_eia2(id)`, `cat_estado_validacion_eia2(id)`, `cat_nivel_educativo(id)`, `usuarios(id)`
- Referenciado por: `evaluaciones(solicitud_id)`, `bitacora_sincronizacion(solicitud_id)`

---

### BITACORA_SINCRONIZACION

Bitácora de trazabilidad de sincronización y consolidación de reportes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | PK autoincremental |
| solicitud_id | UUID | FK a `solicitudes_eia2(id)` ON DELETE SET NULL |
| cct | VARCHAR(10) | CCT de la escuela |
| archivos | TEXT | Lista de archivos procesados |
| estado | VARCHAR(50) | Estado de la sincronización (COMPLETADO/ERROR) |
| created_at | TIMESTAMP | Fecha de registro DEFAULT NOW() |

**Relaciones:**
- FK: `solicitudes_eia2(id)`

---

## 📝 EVALUACIONES

### EVALUACIONES

Evaluaciones de estudiantes por materia y periodo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| estudiante_id | UUID | FK a `estudiantes(id)` ON DELETE CASCADE |
| materia_id | UUID | FK a `materias(id)` |
| periodo_id | UUID | FK a `periodos_evaluacion(id)` |
| archivo_frv_id | UUID | FK a `archivos_frv(id)` |
| valoracion | INT | Valoración numérica (0-3) |
| observaciones | TEXT | Observaciones adicionales |
| registrado_por | UUID | FK a `usuarios(id)` |
| fecha_evaluacion | TIMESTAMP | Fecha de evaluación |
| fecha_captura | TIMESTAMP | Fecha de captura en sistema |
| validado | BOOLEAN | Indica si está validado DEFAULT FALSE |
| validado_por | UUID | FK a `usuarios(id)` |
| validado_en | TIMESTAMP | Fecha de validación |
| solicitud_id | UUID | FK a `solicitudes_eia2(id)` ON DELETE CASCADE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `chk_evaluaciones_valor CHECK (valoracion BETWEEN 0 AND 3)`
- `uq_evaluaciones_solicitud UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id)`

**Índices:**
- `idx_evaluaciones_periodo (periodo_id, validado)`
- `idx_evaluaciones_archivo (archivo_frv_id)`

**Triggers:**
- `trg_touch_evaluaciones` (BEFORE UPDATE): Actualiza `updated_at`
- `trg_calcular_nia_auto` (AFTER INSERT OR UPDATE OF valoracion, validado): Calcula automáticamente el NIA en la tabla `niveles_integracion_estudiante` cuando la evaluación es marcada como validada.

**Relaciones:**
- FK: `estudiantes(id)`, `materias(id)`, `periodos_evaluacion(id)`, `archivos_frv(id)`, `usuarios(id)` (x2), `solicitudes_eia2(id)`
- Referenciado por: `resultados_competencias(id_evaluacion)`

---

### NIVELES_INTEGRACION_ESTUDIANTE

Resultados consolidados de NIA por estudiante, campo formativo y periodo. Se calculan automáticamente mediante trigger tras la validación de evaluaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| id_estudiante | UUID | FK a `estudiantes(id)` ON DELETE CASCADE |
| id_campo_formativo | INT | FK a `cat_campos_formativos(id)` |
| id_periodo | UUID | FK a `periodos_evaluacion(id)` |
| id_nia | INT | FK a `cat_niveles_integracion(id_nia)` |
| valoracion_promedio | NUMERIC(4,2) | Promedio de valoraciones de las materias del campo |
| total_materias | INT | Total de materias que integran el campo |
| materias_evaluadas | INT | Cantidad de materias evaluadas efectivamente |
| calculado_en | TIMESTAMP | Fecha de cálculo DEFAULT NOW() |
| calculado_por | VARCHAR(50) | Origen del cálculo (SISTEMA, MANUAL) |
| validado | BOOLEAN | Indica si el NIA ha sido validado |
| validado_por | UUID | FK a `usuarios(id)` |
| validado_en | TIMESTAMP | Fecha de validación manual (si aplica) |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

**Constraints:**
- `uq_estudiante_campo_periodo UNIQUE (id_estudiante, id_campo_formativo, id_periodo)`

**Índices:**
- `idx_nia_estudiante ON niveles_integracion_estudiante(id_estudiante)`
- `idx_nia_periodo ON niveles_integracion_estudiante(id_periodo)`
- `idx_nia_campo ON niveles_integracion_estudiante(id_campo_formativo)`

---

### RESULTADOS_COMPETENCIAS

Resultados por competencia de cada evaluación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_resultado | INT | PK - Identificador único |
| id_evaluacion | UUID | FK a `evaluaciones(id)` ON DELETE CASCADE |
| id_competencia | INT | FK a `competencias(id_competencia)` |
| nivel_logro | INT | Nivel de logro (1-4) CHECK (nivel_logro BETWEEN 1 AND 4) |

**Constraints:**
- `UNIQUE (id_evaluacion, id_competencia)`

**Relaciones:**
- FK: `evaluaciones(id)`, `competencias(id_competencia)`

---

### PERIODOS_EVALUACION

Periodos de evaluación del ciclo escolar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| nombre | VARCHAR(50) | Nombre del periodo (ej: "1er Trimestre") |
| ciclo_escolar | VARCHAR(10) | Ciclo escolar |
| fecha_inicio | DATE | Fecha de inicio |
| fecha_fin | DATE | Fecha de fin |
| activo | BOOLEAN | Indica si es el periodo activo DEFAULT FALSE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |

**Constraints:**
- `chk_periodos_fechas CHECK (fecha_fin > fecha_inicio)`
- `chk_periodos_duracion CHECK (fecha_fin <= fecha_inicio + INTERVAL '1 year')`

**Relaciones:**
- Referenciado por: `evaluaciones(periodo_id)`, `reportes_generados(periodo_id)`

---

### CONSENTIMIENTOS_LGPDP

Consentimientos LGPDP (Ley General de Protección de Datos Personales) de estudiantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| estudiante_id | UUID | FK a `estudiantes(id)` ON DELETE CASCADE |
| escuela_id | UUID | FK a `escuelas(id)` ON DELETE CASCADE |
| tipo_consentimiento | VARCHAR(50) | Tipo de consentimiento |
| consentimiento_otorgado | BOOLEAN | Indica si fue otorgado |
| tutor_nombre | VARCHAR(150) | Nombre del tutor |
| tutor_firma_digital | TEXT | Firma digital del tutor |
| ip_address | INET | IP desde donde se otorgó |
| created_at | TIMESTAMP | Fecha de otorgamiento DEFAULT NOW() |

**Relaciones:**
- FK: `estudiantes(id)`, `escuelas(id)`

---

## 📊 REPORTES Y NOTIFICACIONES

### REPORTES_GENERADOS

Reportes PDF generados por el sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| escuela_id | UUID | FK a `escuelas(id)` ON DELETE CASCADE |
| ciclo_escolar | VARCHAR(9) | Ciclo escolar |
| periodo_id | UUID | FK a `periodos_evaluacion(id)` |
| tipo_reporte | SMALLINT | FK a `cat_tipo_reporte(id)` (ENS/HYC/LEN/SPC/F5) |
| grado | VARCHAR(20) | Grado escolar |
| grupo | VARCHAR(10) | Grupo |
| file_path | VARCHAR(500) | Ruta del archivo PDF |
| filename | VARCHAR(255) | Nombre del archivo |
| file_size | BIGINT | Tamaño en bytes |
| checksum_sha256 | VARCHAR(64) | Checksum SHA256 para integridad |
| generado_en | TIMESTAMP | Fecha de generación DEFAULT NOW() |
| generado_por | VARCHAR(50) | Usuario/proceso generador |
| descargado_en | TIMESTAMP | Fecha de primera descarga |
| descargado_por | UUID | FK a `usuarios(id)` |
| total_descargas | INT | Contador de descargas DEFAULT 0 |
| disponible_hasta | TIMESTAMP | Fecha límite de disponibilidad |
| comprimido | BOOLEAN | Indica si está comprimido DEFAULT FALSE |
| archivo_zip | VARCHAR(500) | Ruta del archivo ZIP (si aplica) |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Índices:**
- `idx_reportes_escuela_ciclo (escuela_id, ciclo_escolar, periodo_id)`
- `idx_reportes_tipo_generado (tipo_reporte, generado_en DESC)`

**Triggers:**
- `trg_touch_reportes` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `escuelas(id)`, `periodos_evaluacion(id)`, `cat_tipo_reporte(id)`, `usuarios(id)`

---

### NOTIFICACIONES_EMAIL

Cola de notificaciones por email con reintentos automáticos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| usuario_id | UUID | FK a `usuarios(id)` |
| destinatario | VARCHAR(255) | Email del destinatario |
| asunto | VARCHAR(200) | Asunto del email |
| cuerpo | TEXT | Cuerpo del email |
| tipo | SMALLINT | FK a `cat_tipo_notificacion(id)` |
| estado | SMALLINT | FK a `cat_estado_notificacion(id)` DEFAULT fn_catalogo_id('cat_estado_notificacion','PENDIENTE') |
| prioridad | SMALLINT | FK a `cat_prioridad_notificacion(id)` DEFAULT fn_catalogo_id('cat_prioridad_notificacion','MEDIA') |
| intentos | INT | Número de intentos de envío DEFAULT 0 |
| max_intentos | INT | Máximo de intentos permitidos DEFAULT 3 |
| error_mensaje | TEXT | Mensaje de error (si aplica) |
| enviado_en | TIMESTAMP | Fecha de envío exitoso |
| proximo_intento | TIMESTAMP | Fecha del próximo intento |
| referencia_id | UUID | ID de referencia (ticket, reporte, etc) |
| referencia_tipo | SMALLINT | FK a `cat_referencia_tipo_notificacion(id)` |
| adjuntos | JSONB | Array de adjuntos DEFAULT '[]' |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Índices:**
- `idx_notificaciones_estado (estado, prioridad, created_at)`
- `idx_notificaciones_proximo (proximo_intento) WHERE estado = <REINTENTANDO>` (índice parcial dinámico)

**Triggers:**
- `trg_inicializar_notificacion` (BEFORE INSERT): Inicializa valores por defecto, busca `usuario_id` por email
- `trg_programar_reintento` (BEFORE UPDATE): Calcula `proximo_intento` según número de intentos (1 min, 5 min, 30 min, 1 hora). Si `intentos >= max_intentos`, cambia estado a ERROR
- `trg_touch_notificaciones` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `usuarios(id)`, `cat_tipo_notificacion(id)`, `cat_estado_notificacion(id)`, `cat_prioridad_notificacion(id)`, `cat_referencia_tipo_notificacion(id)`

---

### PLANTILLAS_EMAIL

Plantillas HTML para emails del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | PK autoincremental |
| codigo | VARCHAR(100) | Código de la plantilla |
| nombre | VARCHAR(150) | Nombre descriptivo |
| tipo_notificacion | SMALLINT | FK a `cat_tipo_notificacion(id)` |
| asunto_template | VARCHAR(255) | Template del asunto (con variables) |
| cuerpo_html | TEXT | Cuerpo HTML del email |
| cuerpo_texto | TEXT | Versión texto plano |
| variables_disponibles | JSONB | Array de variables disponibles DEFAULT '[]' |
| idioma | VARCHAR(10) | Código de idioma DEFAULT 'es' |
| activa | BOOLEAN | Indica si está activa DEFAULT TRUE |
| version | INT | Versión de la plantilla DEFAULT 1 |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |
| actualizado_por | UUID | FK a `usuarios(id)` |

**Constraints:**
- `UNIQUE (codigo, version)`

**Relaciones:**
- FK: `cat_tipo_notificacion(id)`, `usuarios(id)`

---

### PREGUNTAS_FRECUENTES

FAQ (Preguntas Frecuentes) del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| pregunta | TEXT | Pregunta |
| respuesta | TEXT | Respuesta |
| categoria | VARCHAR(100) | Categoría de la pregunta |
| activo | BOOLEAN | Indica si está activa DEFAULT TRUE |
| orden | INTEGER | Orden de visualización DEFAULT 0 |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `chk_preguntas_pregunta CHECK (char_length(trim(pregunta)) >= 10)`
- `chk_preguntas_respuesta CHECK (char_length(trim(respuesta)) >= 20)`

**Índices:**
- `idx_preguntas_frecuentes_categoria (categoria)`
- `idx_preguntas_frecuentes_activo_orden (activo, orden)`

**Triggers:**
- `trg_touch_preguntas_frecuentes` (BEFORE UPDATE): Actualiza `updated_at`

---

## 🎫 TICKETS DE SOPORTE

### TICKETS_SOPORTE

Tickets de soporte técnico gestionados por operadores SEP.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| numero_ticket | VARCHAR(20) | Número único del ticket UNIQUE |
| escuela_id | UUID | FK a `escuelas(id)` |
| usuario_id | UUID | FK a `usuarios(id)` (creador) |
| archivo_frv_id | UUID | FK a `archivos_frv(id)` (si está relacionado) |
| asunto | VARCHAR(200) | Asunto del ticket |
| descripcion | TEXT | Descripción detallada |
| estado | SMALLINT | FK a `cat_estado_ticket(id)` DEFAULT fn_catalogo_id('cat_estado_ticket','ABIERTO') |
| prioridad | VARCHAR(10) | Prioridad (ALTA/MEDIA/BAJA). Futuro: FK a `cat_prioridad_ticket` |
| asignado_a | UUID | FK a `usuarios(id)` (operador asignado) |
| asignado_en | TIMESTAMP | Fecha de asignación |
| resolucion | TEXT | Descripción de la resolución |
| resuelto_en | TIMESTAMP | Fecha de resolución |
| cerrado_en | TIMESTAMP | Fecha de cierre |
| evidencias | JSONB | Evidencias adjuntas DEFAULT '[]' |
| deleted_at | TIMESTAMP | Fecha de eliminación lógica (soft delete) |
| user_fullname | VARCHAR(255) | Nombre completo capturado del usuario reportante |
| user_cct | VARCHAR(20) | CCT capturado del usuario reportante |
| user_email | VARCHAR(150) | Email capturado del usuario reportante |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Índices:**
- `idx_tickets_estado_prioridad (estado, prioridad)`

**Triggers:**
- `trg_touch_tickets` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `escuelas(id)`, `usuarios(id)` (x2), `archivos_frv(id)`, `cat_estado_ticket(id)`
- Referenciado por: `comentarios_ticket(ticket_id)`, `archivos_tickets(numero_ticket)`

---

### COMENTARIOS_TICKET

Comentarios/respuestas en tickets de soporte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| ticket_id | UUID | FK a `tickets_soporte(id)` ON DELETE CASCADE |
| usuario_id | UUID | FK a `usuarios(id)` |
| comentario | TEXT | Texto del comentario |
| es_interno | BOOLEAN | Indica si es visible solo para operadores DEFAULT FALSE |
| adjuntos | JSONB | Array de adjuntos DEFAULT '[]' |
| leido_por_director | BOOLEAN | Indica si fue leído por director DEFAULT FALSE |
| leido_por_operador | BOOLEAN | Indica si fue leído por operador DEFAULT FALSE |
| created_at | TIMESTAMP | Fecha de creación DEFAULT NOW() |
| updated_at | TIMESTAMP | Fecha de actualización DEFAULT NOW() |

**Constraints:**
- `chk_comentario_longitud CHECK (char_length(trim(comentario)) BETWEEN 10 AND 5000)`

**Triggers:**
- `trg_marcar_comentario_leido_autor` (BEFORE INSERT): Marca automáticamente como leído según el rol del autor
- `trg_validar_ticket_abierto` (BEFORE INSERT): Previene agregar comentarios a tickets cerrados
- `trg_touch_comentarios` (BEFORE UPDATE): Actualiza `updated_at`

**Relaciones:**
- FK: `tickets_soporte(id)`, `usuarios(id)`

---

## 🗄️ TABLAS STAGING (DBF)

Las siguientes 10 tablas almacenan datos raw importados desde archivos DBF del sistema SiCRER. Todas comparten la misma estructura:

### PRE3, PRI1, PRI2, PRI3, PRI4, PRI5, PRI6, SEC1, SEC2, SEC3

**Propósito**: Staging temporal para importación de archivos DBF por nivel y grado.

**Estructura compartida**:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cct | VARCHAR(30) | Clave de Centro de Trabajo |
| turno | VARCHAR(30) | Turno escolar |
| nom_cct | VARCHAR(80) | Nombre del centro |
| nivel | VARCHAR(20) | Nivel educativo |
| fase | VARCHAR(20) | Fase de evaluación |
| grado | VARCHAR(20) | Grado escolar |
| correo1 | VARCHAR(100) | Email primario |
| correo2 | VARCHAR(100) | Email secundario |
| matricula_ | VARCHAR(30) | Matrícula del alumno |
| nlista | VARCHAR(20) | Número de lista |
| estudiante | VARCHAR(100) | Nombre del estudiante |
| genero | VARCHAR(10) | Género |
| grupo | VARCHAR(10) | Grupo |
| eia1_c1_a1 | VARCHAR(10) | EIA1 Competencia 1 Área 1 |
| eia1_c1_a2 | VARCHAR(10) | EIA1 Competencia 1 Área 2 |
| eia1_c2_a1 | VARCHAR(10) | EIA1 Competencia 2 Área 1 |
| eia1_c2_a2 | VARCHAR(10) | EIA1 Competencia 2 Área 2 |
| eia1_c3_a1 | VARCHAR(10) | EIA1 Competencia 3 Área 1 |
| eia1_c3_a2 | VARCHAR(10) | EIA1 Competencia 3 Área 2 |
| eia2_c1_a1 | VARCHAR(10) | EIA2 Competencia 1 Área 1 |
| eia2_c2_a1 | VARCHAR(10) | EIA2 Competencia 2 Área 1 |
| eia2_c3_a1 | VARCHAR(10) | EIA2 Competencia 3 Área 1 |
| eia2_c4_a1 | VARCHAR(10) | EIA2 Competencia 4 Área 1 |
| eia2_c4_a2 | VARCHAR(10) | EIA2 Competencia 4 Área 2 |
| plen | VARCHAR(10) | Indicador PLEN |
| pspc | VARCHAR(10) | Indicador PSPC |
| pens | VARCHAR(10) | Indicador PENS |
| phyc | VARCHAR(10) | Indicador PHYC |
| id | VARCHAR(30) | PK - Identificador único del registro |
| archivoori | VARCHAR(50) | Nombre del archivo origen |

**Notas operativas**:
- Se pueblan mediante `COPY` desde archivos DBF
- Se validan y procesan hacia tablas normalizadas
- Se truncan tras procesamiento exitoso para liberar espacio

---

## 📐 FUNCIÓN AUXILIAR

### fn_catalogo_id()

**Descripción**: Función helper para obtener IDs de catálogos por código canónico.

```sql
fn_catalogo_id(p_catalogo TEXT, p_codigo TEXT) RETURNS SMALLINT
```

**Parámetros**:
- `p_catalogo`: Nombre de la tabla catálogo (ej: 'cat_estado_ticket')
- `p_codigo`: Código canónico (ej: 'ABIERTO')

**Retorna**: `SMALLINT` - ID del catálogo

**Ejemplo de uso**:
```sql
SELECT fn_catalogo_id('cat_estado_ticket', 'ABIERTO');
-- Retorna: 1 (ID del código ABIERTO)
```

**Uso en DDL**: Se usa extensivamente en valores DEFAULT de columnas FK a catálogos.

---

## 🔒 TRIGGERS Y FUNCIONES

### Funciones de Validación

#### fn_validar_cct_formato()
**Trigger**: `trg_validar_cct_formato` en `escuelas` (BEFORE INSERT/UPDATE)  
**Función**: Valida formato CCT `^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$` y normaliza a mayúsculas.

#### fn_validar_email_formato()
**Trigger**: `trg_validar_email_formato` en `usuarios` (BEFORE INSERT/UPDATE)  
**Función**: Valida formato email RFC 5322 y normaliza a minúsculas.

#### fn_validar_valoracion_evaluacion()
**Trigger**: `trg_validar_valoracion_evaluacion` en `evaluaciones` (BEFORE INSERT/UPDATE)  
**Función**: Valida rango 0-3 y calcula automáticamente `nivel_integracion`:
- 0-1: "EN DESARROLLO"
- 2: "SATISFACTORIO"
- 3: "AVANZADO" o "SOBRESALIENTE" (según `competencia_alcanzada`)

---

### Funciones de Notificaciones

#### fn_inicializar_notificacion()
**Trigger**: `trg_inicializar_notificacion` en `notificaciones_email` (BEFORE INSERT)  
**Función**: Inicializa valores por defecto (intentos, max_intentos, prioridad, estado), busca `usuario_id` automáticamente por email.

#### fn_programar_reintento()
**Trigger**: `trg_programar_reintento` en `notificaciones_email` (BEFORE UPDATE)  
**Función**: Calcula `proximo_intento` con backoff exponencial:
- Intento 1: +1 minuto
- Intento 2: +5 minutos
- Intento 3: +30 minutos
- Intento 4+: +1 hora

Si `intentos >= max_intentos`, cambia estado a ERROR.

---

### Funciones de Tickets

#### fn_marcar_comentario_leido_autor()
**Trigger**: `trg_marcar_comentario_leido_autor` en `comentarios_ticket` (BEFORE INSERT)  
**Función**: Marca automáticamente como leído según rol del autor:
- DIRECTOR/SUBDIRECTOR: `leido_por_director = TRUE`
- Otros: `leido_por_operador = TRUE`

#### fn_validar_ticket_abierto()
**Trigger**: `trg_validar_ticket_abierto` en `comentarios_ticket` (BEFORE INSERT)  
**Función**: Previene agregar comentarios a tickets con estado CERRADO. Lanza excepción si se intenta.

---

### Funciones de Passwords

#### fn_registrar_cambio_password()
**Trigger**: `trg_registrar_cambio_password` en `historico_passwords` (BEFORE INSERT)  
**Función**: 
- Desactiva passwords anteriores del usuario
- Calcula `expira_en` automáticamente:
  - RECUPERACION: 6 horas
  - Otros: 72 horas

#### fn_validar_reutilizacion_password()
**Trigger**: `trg_validar_reutilizacion_password` en `historico_passwords` (BEFORE INSERT)  
**Función**: Previene reuso de las últimas 5 contraseñas. Lanza excepción si detecta duplicado.

---

### Funciones de Seguridad (Login)

#### fn_verificar_bloqueo_usuario()
**Trigger**: `trg_verificar_bloqueo_usuario` en `intentos_login` (BEFORE INSERT)  
**Función**: Bloquea usuario tras **5 intentos fallidos en 15 minutos**. Establece `bloqueado_hasta = NOW() + 30 minutos`.

#### fn_detectar_ataque_distribuido()
**Trigger**: `trg_detectar_ataque_distribuido` en `intentos_login` (AFTER INSERT)  
**Función**: Detecta ataque distribuido: si **10+ fallos desde 3+ IPs distintas en 1 hora**, bloquea usuario por 1 hora.

---

### Función de Actualización Automática

#### fn_touch_updated_at()
**Triggers**: Múltiples (BEFORE UPDATE en 11 tablas)  
**Función**: Actualiza automáticamente columna `updated_at` a `NOW()`.

**Tablas afectadas**:
- escuelas, grupos, usuarios
- archivos_frv, archivos_tickets
- reportes_generados
- tickets_soporte, comentarios_ticket
- notificaciones_email
- evaluaciones
- preguntas_frecuentes

---

## 📊 ÍNDICES COMPLETOS

### Índices UNIQUE

```sql
idx_estudiantes_curp UNIQUE INDEX ON estudiantes(curp)
idx_usuarios_email UNIQUE INDEX ON usuarios(email)
idx_materias_codigo UNIQUE INDEX ON materias(codigo)
idx_solicitudes_eia2_consecutivo UNIQUE INDEX ON solicitudes_eia2(consecutivo)
idx_historico_password_activa UNIQUE INDEX ON historico_passwords(usuario_id) WHERE activa
```

### Índices de Búsqueda y Performance

```sql
-- Grupos
idx_grupos_nombre_search ON grupos(escuela_id, nombre)
idx_grupos_escuela_grado ON grupos(escuela_id, grado_id)

-- Estudiantes
idx_estudiantes_grupo ON estudiantes(grupo_id)

-- Evaluaciones
idx_evaluaciones_periodo ON evaluaciones(periodo_id, validado)
idx_evaluaciones_archivo ON evaluaciones(archivo_frv_id)

-- Archivos
idx_archivos_frv_escuela_ciclo ON archivos_frv(escuela_id, ciclo_escolar)
idx_archivos_tickets_numero ON archivos_tickets(numero_ticket)
idx_archivos_tickets_estado ON archivos_tickets(estado)

-- Reportes
idx_reportes_escuela_ciclo ON reportes_generados(escuela_id, ciclo_escolar, periodo_id)
idx_reportes_tipo_generado ON reportes_generados(tipo_reporte, generado_en DESC)

-- Tickets
idx_tickets_estado_prioridad ON tickets_soporte(estado, prioridad)

-- Logs y Auditoría
idx_log_usuario_fecha ON log_actividades(id_usuario, fecha_hora)

-- Notificaciones
idx_notificaciones_estado ON notificaciones_email(estado, prioridad, created_at)
idx_notificaciones_proximo ON notificaciones_email(proximo_intento) WHERE estado = <ID_REINTENTANDO>

-- Intentos Login
idx_intentos_usuario_fecha ON intentos_login(usuario_id, created_at) WHERE usuario_id IS NOT NULL
idx_intentos_ip_fecha ON intentos_login(ip_address, created_at)

-- Preguntas Frecuentes
idx_preguntas_frecuentes_categoria ON preguntas_frecuentes(categoria)
idx_preguntas_frecuentes_activo_orden ON preguntas_frecuentes(activo, orden)
```

**Nota índice dinámico**: `idx_notificaciones_proximo` se crea dinámicamente usando `fn_catalogo_id()` para obtener el ID correcto de 'REINTENTANDO'.

---

## 📋 DATOS INICIALES (Seed Data)

### CAT_NIVEL_EDUCATIVO

```sql
INSERT INTO cat_nivel_educativo (codigo, descripcion, orden)
VALUES 
  ('PREESCOLAR', 'Preescolar', 1),
  ('PRIMARIA', 'Primaria', 2),
  ('SECUNDARIA', 'Secundaria', 3),
  ('TELESECUNDARIA', 'Telesecundaria', 4);
```

### CAT_TURNOS

```sql
INSERT INTO CAT_TURNOS (id_turno, nombre, codigo, descripcion) VALUES
(1, 'Matutino', 'MAT', 'Jornada matutina'),
(2, 'Vespertino', 'VESP', 'Jornada vespertina'),
(3, 'Nocturno', 'NOCT', 'Jornada nocturna'),
(4, 'Continuo', 'CONT', 'Jornada de tiempo completo'),
(5, 'Discontinuo', 'DISC', 'Jornada discontinua');
```

### CAT_ROLES_USUARIO

```sql
INSERT INTO CAT_ROLES_USUARIO (id_rol, nombre, codigo, descripcion, permisos) VALUES
(1, 'Director', 'DIRECTOR', 'Director de escuela', '{"ver_evaluaciones": true, "descargar_reportes": true}'),
(2, 'Subdirector', 'SUBDIRECTOR', 'Subdirector de escuela', '{"ver_evaluaciones": true, "descargar_reportes": true}'),
(3, 'Operador SEP', 'OPERADOR', 'Operador de la SEP', '{"gestionar_tickets": true, "validar_archivos": true}'),
(4, 'Administrador General', 'ADMIN', 'Administrador del sistema', '{"acceso_total": true}');
```

### Catálogos ENUM - Populate automático

Todos los catálogos ENUM se pueblan automáticamente mediante:

```sql
INSERT INTO cat_<nombre> (codigo, descripcion, orden)
SELECT val, INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')), ord
FROM unnest(ARRAY['VALOR1','VALOR2',...]::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;
```

---

## 🔑 CONSTRAINTS RESUMEN

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| **PRIMARY KEY** | 59 | Una por tabla |
| **FOREIGN KEY** | ~75 | Referencias entre tablas |
| **UNIQUE** | ~15 | Índices y constraints de unicidad |
| **CHECK** | ~20 | Validaciones de rango, formato, longitud |
| **NOT NULL** | ~200 | Campos obligatorios |
| **DEFAULT** | ~150 | Valores por defecto (NOW(), FALSE, TRUE, fn_catalogo_id(), etc) |

---

## 🔄 SECUENCIAS

```sql
seq_solicitudes_eia2_consecutivo START 1
-- Genera consecutivos únicos para solicitudes EIA2
```

---

## ✅ VALIDACIONES IMPLEMENTADAS

### Validaciones de Formato

- **CCT**: `^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$` (10 caracteres: 2 dígitos, 1 letra, 7 alfanuméricos)
- **Email**: RFC 5322 regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- **CURP**: VARCHAR(18) NO NULL UNIQUE
- **Extensión archivo**: `^[A-Za-z0-9]{1,20}$` (solo alfanumérico)

### Validaciones de Rango

- **Valoración evaluaciones**: 0-3
- **Nivel logro competencias**: 1-4
- **Longitud comentarios**: 10-5000 caracteres
- **Longitud preguntas**: >= 10 caracteres (trim)
- **Longitud respuestas FAQ**: >= 20 caracteres (trim)
- **Tamaño archivos**: > 0 bytes

### Validaciones de Fechas

- **Ciclos escolares**: `fecha_fin > fecha_inicio`
- **Periodos evaluación**: `fecha_fin > fecha_inicio` Y duración <= 1 año

### Validaciones de Negocio

- **Passwords**: No reuso de las últimas 5
- **Comentarios en tickets**: Solo si ticket NO está CERRADO
- **Bloqueo automático**: 5 fallos login en 15 min → bloqueo 30 min
- **Ataque distribuido**: 10 fallos desde 3+ IPs en 1 hora → bloqueo 1 hora

---

## 📖 NOTAS TÉCNICAS

### Patrón ENUM Mirror

Este sistema NO usa tipos ENUM nativos de PostgreSQL. En su lugar, implementa el patrón **"ENUM Mirror"**: tablas catálogo con estructura estándar que referencian por FK.

**Ventajas**:
- Agregar valores sin ALTER TYPE
- Auditoría completa de cambios
- Soporte para soft-delete (columna `activo`)
- Ordenamiento y descripción legible
- Integridad referencial estándar

### Estrategia de Claves

- **UUIDs**: `gen_random_uuid()` para entidades principales (ESCUELAS, USUARIOS, EVALUACIONES, etc)
- **IDENTITY**: Para catálogos ENUM (SMALLINT)
- **SERIAL/BIGSERIAL**: Para contadores y logs
- **INT**: Para catálogos tradicionales con códigos predefinidos

### Auditoría y Trazabilidad

- `created_at` en 100% de tablas
- `updated_at` en tablas transaccionales (actualizado por triggers)
- `cambios_auditoria` para trackeo detallado de cambios críticos
- `log_actividades` consolidado para bitácora general
- `intentos_login` para análisis de seguridad

### Soft Delete

- Columna `activo` en mayoría de tablas
- Permite "eliminar" sin perder datos
- Catálogos soportan desactivación sin eliminar FKs

---

## 🎯 CASOS DE USO PRINCIPALES

1. **Carga de evaluaciones vía DBF** → Staging tables → Validación →  ARCHIVOS_FRV → EVALUACIONES
2. **Generación de reportes PDF** → REPORTES_GENERADOS con checksum SHA256
3. **Sistema de tickets** → TICKETS_SOPORTE + COMENTARIOS_TICKET + ARCHIVOS_TICKETS
4. **Notificaciones email** → Cola NOTIFICACIONES_EMAIL con reintentos automáticos
5. **Seguridad de acceso** → USUARIOS + SESIONES + INTENTOS_LOGIN + BLOQUEOS_IP
6. **Historial de passwords** → HISTORICO_PASSWORDS con validación anti-reuso

---

## 📚 REFERENCIAS

- **DDL Fuente**: `ddl_generated.sql`
- **API GraphQL**: `graphql-server/src/schema/typeDefs.ts`, `resolvers.ts`
- **Data Samples**: `MACROS Evaluacion Diagnostica/Bd_muestra/*.dbf`

---

## 📝 CHANGELOG

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-12 | 2.0 | Eliminación de 8 tablas redundantes. Consolidación LOG_ACTIVIDADES y USUARIOS |
| 2026-03-12 | 3.0 | **Reescritura completa desde DDL real**. Agregadas: ARCHIVOS_TICKETS, PREGUNTAS_FRECUENTES. Documentadas 59 tablas totales con 100% fidelidad al DDL productivo |

---

**FIN DE DOCUMENTO**  
*Generado por DBA Documentador - Marzo 12, 2026*
