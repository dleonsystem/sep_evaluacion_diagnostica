# ESTRUCTURA_DE_DATOS.md

Este documento contiene la descripción completa de la estructura de datos del sistema SEP Evaluación Diagnóstica. Aquí encontrarás:

- El diagrama entidad-relación (ER) que muestra las relaciones entre las principales entidades y catálogos del sistema.
- Un diccionario de datos unificado y ordenado alfabéticamente, con la definición de todas las tablas, sus campos y descripciones.
- Catálogos, tablas auxiliares y estructuras derivadas de archivos fuente (.DBF) integradas en el modelo.
- Reglas de negocio, índices, procedimientos, vistas, políticas de seguridad y ejemplos de datos relevantes.
- Notas técnicas y recomendaciones para migración, respaldo y auditoría.

Este archivo sirve como referencia técnica para desarrolladores, analistas, auditores y cualquier persona que requiera comprender la estructura y funcionamiento de la base de datos del sistema.

## Resumen de Componentes

**Optimización:** 12 enero 2026 - Se eliminaron 8 tablas (21%) tras análisis de trazabilidad RF vs Tablas.

| Componente | Cantidad | Notas |
| ------------ | ---------- | ------- |
| **Tablas principales** | 30 | Eliminadas: 8 (BITACORA_DETALLADA, CACHE_QUERIES, ARCHIVOS_TEMPORALES, ESTADISTICAS_USO, TAREAS_PROGRAMADAS, RESPALDOS_ARCHIVOS, CONFIGURACIONES_USUARIO, CATALOGO_ERRORES) |
| **Triggers** | 27 | Eliminado 1 (limpiar_archivos_temporales_expirados) |
| **Vistas** | 22 | Eliminadas 3 (v_cache_efectividad, v_estadisticas_uso_sistema, v_tareas_programadas_estado) |
| **Stored Procedures** | ~15 | Actualizados para usar LOG_ACTIVIDADES consolidado |
| **Índices** | ~45 | Optimizados para consultas frecuentes |
| **Consolidaciones** | 2 | LOG_ACTIVIDADES (incluye BITACORA_DETALLADA), USUARIOS (incluye CONFIGURACIONES_USUARIO.preferencias_notif) |

## Diagrama Entidad-Relación (ER)

```mermaid
erDiagram
    ESCUELAS ||--o{ USUARIOS : tiene
    ESCUELAS ||--o{ GRUPOS : agrupa
    ### PRE3

    **Familia de staging FRV:** Las once tablas `pre3`, `pri1`–`pri6` y `sec1`–`sec3` almacenan sin transformar los registros provenientes de los DBF entregados por SiCRER (por ejemplo `MACROS Evaluacion Diagnostica/Bd_muestra/pre3.dbf`). Antes se declaraban mediante `LIKE pre3`, pero ahora todas las tablas quedaron definidas explícitamente en el DDL para eliminar dependencias implícitas y permitir reconstrucciones limpias en cualquier entorno.

    **Esquema de columnas compartido** (aplica a pre3, pri*, sec*):

    | Campo        | Tipo         | Descripción                                      |
    |--------------|--------------|--------------------------------------------------|
    | cct          | VARCHAR(30)  | Clave de Centro de Trabajo tal como viene en el DBF |
    | turno        | VARCHAR(30)  | Turno reportado en el archivo                    |
    | nom_cct      | VARCHAR(80)  | Nombre del plantel                               |
    | nivel        | VARCHAR(20)  | Nivel educativo reportado                        |
    | fase         | VARCHAR(20)  | Fase / aplicación del instrumento                |
    | grado        | VARCHAR(20)  | Grado escolar sin normalizar                     |
    | correo1      | VARCHAR(100) | Correo principal capturado                       |
    | correo2      | VARCHAR(100) | Correo alterno capturado                         |
    | matricula_   | VARCHAR(30)  | Matrícula del alumno                             |
    | nlista       | VARCHAR(20)  | Número de lista                                  |
    | estudiante   | VARCHAR(100) | Nombre completo                                  |
    | genero       | VARCHAR(10)  | Indicador de género                              |
    | grupo        | VARCHAR(10)  | Grupo reportado                                  |
    | eia1_c1_a1   | VARCHAR(10)  | Resultado EIA1 competencia 1 área 1              |
    | eia1_c1_a2   | VARCHAR(10)  | Resultado EIA1 competencia 1 área 2              |
    | eia1_c2_a1   | VARCHAR(10)  | Resultado EIA1 competencia 2 área 1              |
    | eia1_c2_a2   | VARCHAR(10)  | Resultado EIA1 competencia 2 área 2              |
    | eia1_c3_a1   | VARCHAR(10)  | Resultado EIA1 competencia 3 área 1              |
    | eia1_c3_a2   | VARCHAR(10)  | Resultado EIA1 competencia 3 área 2              |
    | eia2_c1_a1   | VARCHAR(10)  | Resultado EIA2 competencia 1 área 1              |
    | eia2_c2_a1   | VARCHAR(10)  | Resultado EIA2 competencia 2 área 1              |
    | eia2_c3_a1   | VARCHAR(10)  | Resultado EIA2 competencia 3 área 1              |
    | eia2_c4_a1   | VARCHAR(10)  | Resultado EIA2 competencia 4 área 1              |
    | eia2_c4_a2   | VARCHAR(10)  | Resultado EIA2 competencia 4 área 2              |
    | plen         | VARCHAR(10)  | Indicador de plenitud                            |
    | pspc         | VARCHAR(10)  | Indicador PSPC                                   |
    | pens         | VARCHAR(10)  | Indicador PENS                                   |
    | phyc         | VARCHAR(10)  | Indicador PHYC                                   |
    | id           | VARCHAR(30)  | Identificador del registro en el DBF (PRIMARY KEY) |
    | archivoori   | VARCHAR(50)  | Nombre del archivo de origen (sin ruta)          |

    **Notas operativas**

    - `id` previene duplicados durante la importación masiva y se indexa como clave primaria en cada tabla.
    - Las tablas se pueblan mediante `COPY`/`ogr2ogr`, se validan y, tras mover la información al modelo normalizado (`ARCHIVOS_FRV` + `EVALUACIONES`), se vacían para liberar espacio.
    - Los anchos de `VARCHAR` reproducen el tamaño máximo observado en los DBF para evitar truncamientos.

    ### PRI1

    - **Rol:** staging de la muestra Primaria 1er grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri1.dbf`).
    - **Esquema:** igual al descrito en [PRE3](#pre3).
    - **Notas:** alimenta las métricas de primaria inmediatamente después de la carga de preescolar.

    ### PRI2

    - **Rol:** staging para Primaria 2º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri2.dbf`).
    - **Esquema:** idéntico al bloque compartido.
    - **Notas:** sólo cambian los valores de `grado` y los resultados capturados; la estructura es común.

    ### PRI3

    - **Rol:** staging para Primaria 3º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri3.dbf`).
    - **Esquema:** reutiliza las mismas columnas `VARCHAR` del bloque compartido.
    - **Notas:** contempla columnas de EIA1 y EIA2 aunque algunas lleguen vacías; el DDL explícito evita dependencias de `LIKE`.

    ### PRI4

    - **Rol:** staging para Primaria 4º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri4.dbf`).
    - **Esquema:** igual que el bloque compartido.
    - **Notas:** se trunca al concluir el pipeline de normalización.

    ### PRI5

    - **Rol:** staging para Primaria 5º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri5.dbf`).
    - **Esquema:** igual al bloque compartido.
    - **Notas:** mantiene la PK en `id` para controlar reimportaciones.

    ### PRI6

    - **Rol:** staging para Primaria 6º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/pri6.dbf`).
    - **Esquema:** igual al bloque compartido.
    - **Notas:** último archivo de primaria previo a las cargas de secundaria.

    ### SEC1

    - **Rol:** staging para Secundaria 1er grado (`MACROS Evaluacion Diagnostica/Bd_muestra/sec1.dbf`).
    - **Esquema:** igual al bloque compartido.
    - **Notas:** aunque el DBF contiene campos auxiliares, se normaliza a la estructura común para simplificar el `COPY`.

    ### SEC2

    - **Rol:** staging para Secundaria 2º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/sec2.dbf`).
    - **Esquema:** igual al bloque compartido.
    - **Notas:** comparte indicadores `plen/pspc/pens/phyc` para la validación de integridad.

    ### SEC3

    - **Rol:** staging para Secundaria 3º grado (`MACROS Evaluacion Diagnostica/Bd_muestra/sec3.dbf`).
    - **Esquema:** igual al bloque compartido.
    - **Notas:** última tabla de staging antes de consolidar secundaria.

    ### RESULTADOS_COMPETENCIAS
| metadata             | JSONB        | Metadata adicional                |
| created_at           | TIMESTAMP    | Fecha y hora del cambio           |

### CAT_CICLOS_ESCOLARES

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_ciclo        | INT          | Identificador único del ciclo     |
| nombre          | VARCHAR(20)  | Nombre del ciclo (ej: 2024-2025)  |
| fecha_inicio    | DATE         | Fecha de inicio del ciclo         |
| fecha_fin       | DATE         | Fecha de fin del ciclo            |
| activo          | BOOLEAN      | Indica si es el ciclo activo      |
| created_at      | TIMESTAMP    | Fecha de creación                 |

### CAT_ENTIDADES_FEDERATIVAS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_entidad      | INT          | Identificador único (clave INEGI) |
| nombre          | VARCHAR(100) | Nombre de la entidad federativa   |
| abreviatura     | VARCHAR(10)  | Abreviatura (ej: CDMX, JAL)       |
| codigo_sep      | VARCHAR(5)   | Código SEP                        |
| region          | VARCHAR(50)  | Región geográfica                 |

### CAT_GRADOS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_grado        | INT          | Identificador único               |
| nivel_educativo | VARCHAR(50)  | Nivel (PREESCOLAR, PRIMARIA, etc) |
| grado_numero    | INT          | Número del grado (1-6)            |
| grado_nombre    | VARCHAR(20)  | Nombre del grado (Primero, etc)   |
| orden           | INT          | Orden de visualización            |

### CAT_NIVELES_EDUCATIVOS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_nivel        | INT          | Identificador único               |
| nombre          | VARCHAR(50)  | Nombre del nivel educativo        |
| codigo          | VARCHAR(10)  | Código corto (PRE, PRI, SEC, TEL) |
| descripcion     | VARCHAR(200) | Descripción del nivel             |
| orden           | INT          | Orden de visualización            |

### CAT_ROLES_USUARIO

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_rol          | INT          | Identificador único               |
| nombre          | VARCHAR(50)  | Nombre del rol                    |
| codigo          | VARCHAR(20)  | Código (DIRECTOR, OPERADOR, ADMIN)|
| descripcion     | VARCHAR(200) | Descripción del rol               |
| permisos        | JSONB        | Objeto con permisos asignados     |
| created_at      | TIMESTAMP    | Fecha de creación                 |

### CAT_TURNOS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_turno        | INT          | Identificador único               |
| nombre          | VARCHAR(50)  | Nombre del turno                  |
| codigo          | VARCHAR(10)  | Código (MAT, VESP, NOCT, CONT)    |
| descripcion     | VARCHAR(100) | Descripción del turno             |

### CAT_NIVELES_INTEGRACION

**Catálogo oficial de Niveles de Integración del Aprendizaje (NIA) - Marco SEP 2025**

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_nia          | SERIAL       | Identificador único del NIA       |
| clave           | VARCHAR(2)   | Clave oficial (ED, EP, ES, SO)    |
| nombre          | VARCHAR(50)  | Nombre del nivel                  |
| descripcion     | TEXT         | Descripción detallada pedagógica  |
| rango_min       | INT          | Valoración mínima (0-3)           |
| rango_max       | INT          | Valoración máxima (0-3)           |
| color_hex       | VARCHAR(7)   | Color para visualización          |
| orden_visual    | INT          | Orden para gráficas (1-4)         |
| vigente         | BOOLEAN      | Indica si el nivel está activo    |
| created_at      | TIMESTAMP    | Fecha de creación                 |
| updated_at      | TIMESTAMP    | Fecha de última actualización     |

### CAT_CAMPOS_FORMATIVOS

**Catálogo de Campos Formativos según Plan de Estudios SEP**

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | SERIAL       | Identificador único               |
| clave           | VARCHAR(10)  | Clave oficial (ENS, HYC, LEN, SPC, F5)|
| nombre          | VARCHAR(100) | Nombre completo del campo         |
| descripcion     | TEXT         | Descripción detallada             |
| orden_visual    | INT          | Orden para visualización          |
| vigente         | BOOLEAN      | Indica si está activo             |
| created_at      | TIMESTAMP    | Fecha de creación                 |

### COMENTARIOS_TICKET

| Campo              | Tipo         | Descripción                                       |
|--------------------|--------------|---------------------------------------------------|
| id                 | UUID         | Identificador único                               |
| ticket_id          | UUID         | Relación con TICKETS_SOPORTE                      |
| usuario_id         | UUID         | Relación con USUARIOS (autor)                     |
| comentario         | TEXT         | Contenido del comentario                          |
| es_interno         | BOOLEAN      | Comentario interno SEP (no visible para director) |
| adjuntos           | JSONB        | Array de archivos adjuntos                        |
| leido_por_director | BOOLEAN      | Indica si el director lo ha leído                 |
| leido_por_operador | BOOLEAN      | Indica si el operador lo ha leído                 |
| created_at         | TIMESTAMP    | Fecha de creación del comentario                  |
| updated_at         | TIMESTAMP    | Fecha de última actualización                     |

### COMPETENCIAS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_competencia  | INT          | Identificador de competencia      |
| id_materia      | INT          | Relación con MATERIAS             |
| codigo          | VARCHAR(20)  | Código de competencia             |
| descripcion     | VARCHAR(500) | Descripción                       |
| nivel_esperado  | INT          | Nivel esperado (1-4)              |

### CONFIGURACIONES_SISTEMA

| Campo                | Tipo         | Descripción                       |
|----------------------|--------------|-----------------------------------|
| id                   | SERIAL       | Identificador único               |
| categoria            | VARCHAR(50)  | Categoría de configuración        |
| clave                | VARCHAR(100) | Clave de configuración (UNIQUE)   |
| valor                | TEXT         | Valor de la configuración         |
| tipo_dato            | ENUM         | STRING, INTEGER, BOOLEAN, JSON    |
| descripcion          | TEXT         | Descripción de la configuración   |
| editable_por_usuario | BOOLEAN      | Si puede ser editada por usuarios |
| requiere_reinicio    | BOOLEAN      | Si requiere reiniciar el sistema  |
| valor_por_defecto    | TEXT         | Valor por defecto                 |
| validacion_regex     | VARCHAR(255) | Expresión regular de validación   |
| created_at           | TIMESTAMP    | Fecha de creación                 |
| updated_at           | TIMESTAMP    | Fecha de última actualización     |
| actualizado_por      | UUID         | Usuario que actualizó (FK USUARIOS) |

UNIQUE (clave)

### CONSENTIMIENTOS_LGPDP

| Campo                 | Tipo         | Descripción                       |
|-----------------------|--------------|-----------------------------------|
| id                    | UUID         | Identificador único               |
| estudiante_id         | UUID         | Relación con ESTUDIANTES          |
| escuela_id            | UUID         | Relación con ESCUELAS             |
| tipo_consentimiento   | VARCHAR(50)  | Tipo de consentimiento            |
| consentimiento_otorgado| BOOLEAN     | Consentimiento otorgado           |
| tutor_nombre          | VARCHAR(150) | Nombre del tutor                  |
| tutor_firma_digital   | TEXT         | Firma digital                     |
| ip_address            | INET         | IP de origen                      |
| created_at            | TIMESTAMP    | Fecha de creación                 |

### CREDENCIALES_EIA2

| Campo                      | Tipo         | Descripción                       |
|----------------------------|--------------|-----------------------------------|
| id                         | UUID         | Identificador único               |
| cct                        | VARCHAR(10)  | CCT de la escuela (usuario)       |
| correo_validado            | VARCHAR(100) | Correo electrónico validado       |
| password_hash              | VARCHAR(255) | Hash de contraseña (bcrypt/argon2)|
| primera_carga_valida_fecha | TIMESTAMP    | Fecha de primera carga válida     |
| generado_en                | TIMESTAMP    | Fecha de generación de credenciales|
| activo                     | BOOLEAN      | Indica si las credenciales están activas|
| ultimo_acceso              | TIMESTAMP    | Fecha del último acceso           |
| created_at                 | TIMESTAMP    | Fecha de creación del registro    |
| updated_at                 | TIMESTAMP    | Fecha de última actualización     |

### ESCUELAS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| cct             | VARCHAR(10)  | Clave Centro Trabajo              |
| nombre          | VARCHAR(150) | Nombre de la escuela              |
| estado          | VARCHAR(50)  | Estado                            |
| cp              | VARCHAR(10)  | Código postal                     |
| telefono        | VARCHAR(15)  | Teléfono                          |
| email           | VARCHAR(100) | Correo electrónico                |
| director        | VARCHAR(150) | Nombre del director               |
| fecha_registro  | DATETIME     | Fecha de registro                 |
| estatus         | CHAR(1)      | Estado (A=Activo, I=Inactivo)     |
| id_turno        | INT          | Relación con CAT_TURNOS           |
| id_nivel        | INT          | Relación con CAT_NIVELES_EDUCATIVOS |
| id_entidad      | INT          | Relación con CAT_ENTIDADES_FEDERATIVAS |
| id_ciclo        | INT          | Relación con CAT_CICLOS_ESCOLARES |

### ESTUDIANTES

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| nombre          | VARCHAR(150) | Nombre completo                   |
| grupo_id        | INT          | Relación con GRUPOS               |
| curp            | VARCHAR(18)  | CURP del estudiante               |
| fecha_nacimiento| DATE         | Fecha de nacimiento               |
| estatus         | CHAR(1)      | Estado (A=Activo, I=Inactivo)     |

### EVALUACIONES

**Registro de valoraciones individuales por materia y periodo**

| Campo              | Tipo         | Descripción                       |
|--------------------|--------------|-----------------------------------|
| id                 | UUID         | Identificador único               |
| estudiante_id      | UUID         | Relación con ESTUDIANTES          |
| materia_id         | INT          | Relación con MATERIAS             |
| periodo_id         | INT          | Relación con PERIODOS_EVALUACION  |
| archivo_frv_id     | UUID         | Relación con ARCHIVOS_FRV (origen)|
| valoracion         | INT          | Valoración asignada (0-3)         |
| observaciones      | TEXT         | Observaciones del docente         |
| registrado_por     | UUID         | Relación con USUARIOS             |
| fecha_evaluacion   | TIMESTAMP    | Fecha de aplicación               |
| fecha_captura      | TIMESTAMP    | Fecha de captura en sistema       |
| validado           | BOOLEAN      | Si fue validado por DGADAE        |
| validado_por       | UUID         | Usuario que validó                |
| validado_en        | TIMESTAMP    | Fecha de validación               |
| created_at         | TIMESTAMP    | Fecha de creación del registro    |
| updated_at         | TIMESTAMP    | Fecha de última actualización     |

**Nota:** Los campos `nivel_integracion` y `competencia_alcanzada` fueron eliminados (19-ene-2026). 
Los Niveles de Integración del Aprendizaje (NIA) ahora se calculan y almacenan en la tabla 
especializada `NIVELES_INTEGRACION_ESTUDIANTE` con granularidad por Campo Formativo.

### GRUPOS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único (UUID)        |
| escuela_id      | UUID         | Relación con ESCUELAS             |
| grado_id        | INT          | Relación con CAT_GRADOS           |
| nombre          | VARCHAR(100) | Nombre del grupo (Ej: 1°A, 2°B)   |
| nivel_educativo | VARCHAR(50)  | Nivel educativo (PREESCOLAR, PRIMARIA, SECUNDARIA) |
| grado_nombre    | VARCHAR(20)  | Nombre del grado                  |
| grado_numero    | INT          | Número de grado                   |
| turno           | VARCHAR(20)  | Turno (MATUTINO, VESPERTINO)      |
| total_alumnos   | INT          | Total de alumnos en el grupo      |
| activo          | BOOLEAN      | Indica si el grupo está activo    |
| created_at      | TIMESTAMP    | Fecha de creación                 |
| updated_at      | TIMESTAMP    | Fecha de última actualización     |

### HISTORICO_PASSWORDS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| usuario_id      | UUID         | Relación con USUARIOS             |
| password_hash   | VARCHAR(255) | Hash de la contraseña (bcrypt/argon2) |
| es_temporal     | BOOLEAN      | Indica si es contraseña temporal  |
| generada_en     | TIMESTAMP    | Fecha de generación               |
| expira_en       | TIMESTAMP    | Fecha de expiración (solo temporales) |
| cambiada_en     | TIMESTAMP    | Fecha en que fue cambiada         |
| cambiada_por    | VARCHAR(20)  | Origen del cambio (SISTEMA, USUARIO, ADMIN, RECUPERACION) |
| ip_origen       | VARCHAR(50)  | IP desde donde se cambió          |
| activa          | BOOLEAN      | Indica si es la contraseña actual |
| created_at      | TIMESTAMP    | Fecha de creación del registro    |

### INTENTOS_LOGIN

| Campo           | Tipo         | Descripción                                      |
|-----------------|--------------|--------------------------------------------------|
| id              | UUID         | Identificador único                              |
| usuario_id      | UUID         | Relación con USUARIOS (NULL si no existe)        |
| email           | VARCHAR(100) | Email del intento de login                       |
| ip_address      | INET         | Dirección IP de origen                           |
| user_agent      | TEXT         | Navegador/cliente usado                          |
| exito           | BOOLEAN      | Indica si el login fue exitoso                   |
| motivo_fallo    | VARCHAR(100) | Razón del fallo (ver enums)                      |
| bloqueado_hasta | TIMESTAMP    | Fecha hasta la cual está bloqueado (si aplica)   |
| metadata        | JSONB        | Datos adicionales (dispositivo, ubicación, etc.) |
| created_at      | TIMESTAMP    | Fecha/hora del intento                           |

### LOG_ACTIVIDADES

**Consolidado** - Incluye funcionalidad de BITACORA_DETALLADA eliminada

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_log          | BIGSERIAL    | Identificador de log              |
| id_usuario      | UUID         | Relación con USUARIOS             |
| fecha_hora      | TIMESTAMP    | Fecha y hora de la actividad      |
| accion          | VARCHAR(100) | Tipo de acción (INSERT, UPDATE, DELETE, LOGIN) |
| tabla           | VARCHAR(50)  | Tabla afectada                    |
| registro_id     | VARCHAR(100) | ID del registro afectado          |
| detalle         | JSONB        | Detalle de la acción (JSON para cambios antes/después) |
| ip_address      | INET         | Dirección IP de origen            |
| user_agent      | TEXT         | Navegador/cliente usado           |
| modulo          | VARCHAR(100) | Módulo del sistema que generó el log |
| resultado       | VARCHAR(50)  | Resultado (EXITOSO, ERROR, PARCIAL) |
| created_at      | TIMESTAMP    | Fecha de creación del registro    |

INDEX idx_log_usuario_fecha ON LOG_ACTIVIDADES(id_usuario, fecha_hora)
INDEX idx_log_tabla_accion ON LOG_ACTIVIDADES(tabla, accion)

### MATERIAS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único (UUID)        |
| codigo          | VARCHAR(10)  | Código de materia (Ej: LEN, MAT)  |
| nombre          | VARCHAR(100) | Nombre de la materia              |
| campo_formativo | VARCHAR(10)  | FK a CAT_CAMPOS_FORMATIVOS.clave  |
| nivel_educativo | VARCHAR(50)  | Nivel educativo al que aplica     |
| orden           | INT          | Orden de visualización            |
| activa          | BOOLEAN      | Indica si la materia está activa  |

### NIVELES_INTEGRACION_ESTUDIANTE

**Tabla especializada para Niveles de Integración del Aprendizaje (NIA)**

| Campo                | Tipo         | Descripción                       |
|----------------------|--------------|-----------------------------------|
| id                   | UUID         | Identificador único               |
| id_estudiante        | UUID         | FK a ESTUDIANTES(id)              |
| id_campo_formativo   | INT          | FK a CAT_CAMPOS_FORMATIVOS(id)    |
| id_periodo           | INT          | FK a PERIODOS_EVALUACION(id)      |
| id_nia               | INT          | FK a CAT_NIVELES_INTEGRACION(id_nia)|
| valoracion_promedio  | NUMERIC(4,2) | Promedio de valoraciones (0-3)    |
| total_materias       | INT          | Total de materias del campo       |
| materias_evaluadas   | INT          | Materias efectivamente evaluadas  |
| calculado_en         | TIMESTAMP    | Fecha/hora de cálculo             |
| calculado_por        | VARCHAR(50)  | Origen (SISTEMA, MANUAL, AJUSTE)  |
| observaciones        | TEXT         | Observaciones adicionales         |
| validado             | BOOLEAN      | Si fue validado por DGADAE        |
| validado_por         | UUID         | FK a USUARIOS(id)                 |
| validado_en          | TIMESTAMP    | Fecha de validación               |
| created_at           | TIMESTAMP    | Fecha de creación del registro    |
| updated_at           | TIMESTAMP    | Fecha de última actualización     |

**Constraint único:** `UNIQUE (id_estudiante, id_campo_formativo, id_periodo)`  
**Nota:** Esta tabla reemplaza los campos eliminados `nivel_integracion` y `competencia_alcanzada` 
de EVALUACIONES. Permite modelar correctamente que cada estudiante tiene 4 NIAs (uno por campo 
formativo: ENS, HYC, LEN, SPC) en cada periodo de evaluación.

### NOTIFICACIONES_EMAIL

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| usuario_id      | UUID         | Relación con USUARIOS (destinatario) |
| destinatario    | VARCHAR(100) | Email del destinatario            |
| asunto          | VARCHAR(200) | Asunto del correo                 |
| cuerpo          | TEXT         | Contenido HTML del correo         |
| tipo            | ENUM         | Tipo de notificación (RESULTADO_LISTO, TICKET_CREADO, TICKET_ACTUALIZADO, TICKET_RESUELTO, RECUPERACION_PASSWORD, CREDENCIALES_EIA2, EVALUACION_VALIDADA) |
| estado          | ENUM         | Estado del envío (PENDIENTE, ENVIADO, ERROR, REINTENTANDO) |
| prioridad       | VARCHAR(10)  | Prioridad (ALTA, MEDIA, BAJA)     |
| intentos        | INT          | Número de intentos de envío       |
| max_intentos    | INT          | Máximo de reintentos (default 3)  |
| error_mensaje   | TEXT         | Mensaje de error si falla envío   |
| enviado_en      | TIMESTAMP    | Fecha/hora de envío exitoso       |
| proximo_intento | TIMESTAMP    | Próximo reintento programado      |
| referencia_id   | UUID         | ID del objeto relacionado (ticket, reporte, etc.) |
| referencia_tipo | VARCHAR(50)  | Tipo de referencia (TICKET, REPORTE, USUARIO, EVALUACION) |
| adjuntos        | JSONB        | Array de adjuntos (opcional)      |
| created_at      | TIMESTAMP    | Fecha de creación del registro    |
| updated_at      | TIMESTAMP    | Fecha de última actualización     |

### PERIODOS_EVALUACION

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único (UUID)        |
| nombre          | VARCHAR(50)  | Nombre del periodo (Ej: Periodo 1) |
| ciclo_escolar   | VARCHAR(10)  | Ciclo escolar (Ej: 2024-2025)     |
| fecha_inicio    | DATE         | Fecha de inicio                   |
| fecha_fin       | DATE         | Fecha de fin                      |
| activo          | BOOLEAN      | Indica si el periodo está activo  |
| created_at      | TIMESTAMP    | Fecha de creación                 |

**Reglas de negocio / validaciones:**
- No se permiten rangos de fechas traslapados entre periodos del mismo `ciclo_escolar` (incluye límites compartidos).
- Se permiten periodos contiguos (fin + 1 día = inicio del siguiente).
- Al editar un periodo, la validación compara contra el resto de registros del mismo ciclo, excluyendo el periodo editado.
- Excepción operativa: si no existe carga válida de Periodo 1 en el ciclo y se recibe una carga etiquetada como Periodo 1 dentro del rango oficial de Periodo 2 o 3, se reclasifica como Periodo 2 (registrando la reasignación).

### PLANTILLAS_EMAIL

| Campo                | Tipo         | Descripción                       |
|----------------------|--------------|-----------------------------------|
| id                   | SERIAL       | Identificador único               |
| codigo               | VARCHAR(100) | Código de plantilla (UNIQUE)      |
| nombre               | VARCHAR(150) | Nombre descriptivo de la plantilla |
| tipo_notificacion    | ENUM         | RESULTADO_LISTO, TICKET_CREADO, RECUPERACION_PASSWORD, etc. |
| asunto_template      | VARCHAR(255) | Template del asunto (con variables) |
| cuerpo_html          | TEXT         | Template HTML del cuerpo          |
| cuerpo_texto         | TEXT         | Template de texto plano           |
| variables_disponibles| JSONB        | Array de variables disponibles    |
| idioma               | VARCHAR(10)  | Idioma de la plantilla (es, en)   |
| activa               | BOOLEAN      | Indica si está activa             |
| version              | INT          | Versión de la plantilla           |
| created_at           | TIMESTAMP    | Fecha de creación                 |
| updated_at           | TIMESTAMP    | Fecha de última actualización     |
| actualizado_por      | UUID         | Usuario que actualizó (FK USUARIOS) |

UNIQUE (codigo, version)
INDEX idx_plantillas_tipo ON PLANTILLAS_EMAIL(tipo_notificacion)

### PRE3

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(31)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(32)    | Correo electrónico principal                     |
| CORREO2       | CHAR(32)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C1_A2    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 2            |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_A2    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 2            |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C3_A2    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 2            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| EIA2_C4_A2    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 2            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(24)    | Nombre de archivo original                       |

### PRI1

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(26)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_A2    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 2            |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C3_A2    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 2            |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### PRI2

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(26)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_A2    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 2            |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C3_A2    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 2            |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### PRI3

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
|  NIVEL        | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(26)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C1_A2    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 2            |
| EIA1_C1_B1    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 1          |
| EIA1_C1_B2    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 2          |
| EIA1_C1_B3    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 3          |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_A2    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 2            |
| EIA1_C2_A3    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 3            |
| EIA1_C2_B1    | CHAR(10)    | Resultado EIA1, Competencia 2, Bloque 1          |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C3_B1    | CHAR(10)    | Resultado EIA1, Competencia 3, Bloque 1          |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA1_C4_A2    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 2            |
| EIA1_C4_A3    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 3            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C1_B1    | CHAR(10)    | Resultado EIA2, Competencia 1, Bloque 1          |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C3_B1    | CHAR(10)    | Resultado EIA2, Competencia 3, Bloque 1          |
| EIA2_C3_C1    | CHAR(10)    | Resultado EIA2, Competencia 3, Componente 1      |
| EIA2_C3_C2    | CHAR(10)    | Resultado EIA2, Competencia 3, Componente 2      |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| EIA2_C4_B1    | CHAR(10)    | Resultado EIA2, Competencia 4, Bloque 1          |
| EIA2_C5_A1    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 1            |
| EIA2_C5_A2    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 2            |
| EIA2_C5_A3    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 3            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### PRI4

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(24)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C1_A2    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 2            |
| EIA1_C1_B1    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 1          |
| EIA1_C1_B2    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 2          |
| EIA1_C1_B3    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 3          |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_A2    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 2            |
| EIA1_C2_A3    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 3            |
| EIA1_C2_B1    | CHAR(10)    | Resultado EIA1, Competencia 2, Bloque 1          |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C3_B1    | CHAR(10)    | Resultado EIA1, Competencia 3, Bloque 1          |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA1_C4_A2    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 2            |
| EIA1_C4_A3    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 3            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C1_B1    | CHAR(10)    | Resultado EIA2, Competencia 1, Bloque 1          |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C3_B1    | CHAR(10)    | Resultado EIA2, Competencia 3, Bloque 1          |
| EIA2_C3_C1    | CHAR(10)    | Resultado EIA2, Competencia 3, Componente 1      |
| EIA2_C3_C2    | CHAR(10)    | Resultado EIA2, Competencia 3, Componente 2      |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| EIA2_C4_B1    | CHAR(10)    | Resultado EIA2, Competencia 4, Bloque 1          |
| EIA2_C5_A1    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 1            |
| EIA2_C5_A2    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 2            |
| EIA2_C5_A3    | CHAR(10)    | Resultado EIA2, Competencia 5, Área 3            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### PRI5

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(24)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C1_B1    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 1          |
| EIA1_C1_B2    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 2          |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_B1    | CHAR(10)    | Resultado EIA1, Competencia 2, Bloque 1          |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C3_B1    | CHAR(10)    | Resultado EIA1, Competencia 3, Bloque 1          |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C1_B1    | CHAR(10)    | Resultado EIA2, Competencia 1, Bloque 1          |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C3_B1    | CHAR(10)    | Resultado EIA2, Competencia 3, Bloque 1          |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### PRI6

| Campo         | Tipo        | Descripción                                      |
|---------------|-------------|--------------------------------------------------|
| CCT           | CHAR(21)    | Clave de Centro de Trabajo                       |
| TURNO         | CHAR(22)    | Turno escolar                                    |
| NOM_CCT       | CHAR(29)    | Nombre del Centro de Trabajo                     |
| NIVEL         | CHAR(10)    | Nivel educativo                                  |
| FASE          | CHAR(7)     | Fase de la evaluación                            |
| GRADO         | CHAR(11)    | Grado escolar                                    |
| CORREO1       | CHAR(26)    | Correo electrónico principal                     |
| CORREO2       | CHAR(29)    | Correo electrónico alternativo                   |
| MATRICULA_    | CHAR(22)    | Matrícula del estudiante                         |
| NLISTA        | CHAR(14)    | Número de lista                                  |
| ESTUDIANTE    | CHAR(59)    | Nombre completo del estudiante                   |
| GENERO        | CHAR(10)    | Género                                           |
| GRUPO         | CHAR(10)    | Grupo escolar                                    |
| EIA1_C1_A1    | CHAR(10)    | Resultado EIA1, Competencia 1, Área 1            |
| EIA1_C1_B1    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 1          |
| EIA1_C1_B2    | CHAR(10)    | Resultado EIA1, Competencia 1, Bloque 2          |
| EIA1_C2_A1    | CHAR(10)    | Resultado EIA1, Competencia 2, Área 1            |
| EIA1_C2_B1    | CHAR(10)    | Resultado EIA1, Competencia 2, Bloque 1          |
| EIA1_C3_A1    | CHAR(10)    | Resultado EIA1, Competencia 3, Área 1            |
| EIA1_C3_B1    | CHAR(10)    | Resultado EIA1, Competencia 3, Bloque 1          |
| EIA1_C4_A1    | CHAR(10)    | Resultado EIA1, Competencia 4, Área 1            |
| EIA2_C1_A1    | CHAR(10)    | Resultado EIA2, Competencia 1, Área 1            |
| EIA2_C1_B1    | CHAR(10)    | Resultado EIA2, Competencia 1, Bloque 1          |
| EIA2_C2_A1    | CHAR(10)    | Resultado EIA2, Competencia 2, Área 1            |
| EIA2_C3_A1    | CHAR(10)    | Resultado EIA2, Competencia 3, Área 1            |
| EIA2_C4_A1    | CHAR(10)    | Resultado EIA2, Competencia 4, Área 1            |
| PLEN          | CHAR(10)    | Indicador de plenitud                            |
| PSPC          | CHAR(10)    | Indicador PSPC                                   |
| PENS          | CHAR(10)    | Indicador PENS                                   |
| PHYC          | CHAR(10)    | Indicador PHYC                                   |
| ID            | CHAR(19)    | Identificador único                              |
| ARCHIVOORI    | CHAR(23)    | Nombre de archivo original                       |

### RESULTADOS_COMPETENCIAS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_resultado    | INT          | Identificador de resultado        |
| id_evaluacion   | INT          | Relación con EVALUACIONES         |
| id_competencia  | INT          | Relación con COMPETENCIAS         |
| nivel_logro     | INT          | Nivel de logro (1-4)              |

### REPORTES_GENERADOS

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| escuela_id      | UUID         | Relación con ESCUELAS             |
| ciclo_escolar   | VARCHAR(9)   | Ciclo escolar (ej: 2024-2025)     |
| periodo_id      | INT          | Relación con PERIODOS_EVALUACION  |
| tipo_reporte    | ENUM         | Tipo: ENS, HYC, LEN, SPC, F5      |
| grado           | VARCHAR(20)  | Grado escolar                     |
| grupo           | VARCHAR(10)  | Grupo (A, B, C, etc.)             |
| file_path       | VARCHAR(500) | Ruta del archivo PDF en filesystem|
| filename        | VARCHAR(255) | Nombre del archivo                |
| file_size       | BIGINT       | Tamaño del archivo en bytes       |
| checksum_sha256 | VARCHAR(64)  | Hash SHA256 para integridad       |
| generado_en     | TIMESTAMP    | Fecha de generación del reporte   |
| generado_por    | VARCHAR(50)  | Sistema/usuario que generó       |
| descargado_en   | TIMESTAMP    | Primera fecha de descarga         |
| descargado_por  | UUID         | Relación con USUARIOS             |
| total_descargas | INT          | Contador de descargas             |
| disponible_hasta| TIMESTAMP    | Fecha límite de disponibilidad    |
| comprimido      | BOOLEAN      | Si está en archivo ZIP            |
| archivo_zip     | VARCHAR(500) | Ruta del ZIP si está comprimido   |
| created_at      | TIMESTAMP    | Fecha de creación                 |
| updated_at      | TIMESTAMP    | Fecha de actualización            |

### SESIONES

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| usuario_id      | UUID         | Relación con USUARIOS             |
| token_hash      | VARCHAR(255) | Hash del token                    |
| ip_address      | INET         | IP de la sesión                   |
| user_agent      | TEXT         | User agent                        |
| expira_en       | TIMESTAMP    | Expiración                        |
| revocado        | BOOLEAN      | Revocado                          |
| created_at      | TIMESTAMP    | Fecha de creación                 |

### SOLICITUDES_EIA2

| Campo                    | Tipo         | Descripción                       |
|--------------------------|--------------|-----------------------------------|
| id                       | UUID         | Identificador único               |
| consecutivo              | BIGINT       | Número consecutivo auto-incremental|
| cct                      | VARCHAR(10)  | CCT de la escuela                 |
| credencial_id            | UUID         | Relación con CREDENCIALES_EIA2    |
| archivo_original         | VARCHAR(255) | Nombre del archivo original       |
| fecha_carga              | TIMESTAMP    | Fecha y hora de carga             |
| estado_validacion        | ENUM         | Estado: VALIDO, INVALIDO          |
| errores_validacion       | JSONB        | Detalle de errores de validación  |
| archivo_path             | VARCHAR(500) | Ruta del archivo en filesystem    |
| archivo_size             | BIGINT       | Tamaño del archivo en bytes       |
| procesado_externamente   | BOOLEAN      | Si fue procesado por sistema externo|
| fecha_procesamiento      | TIMESTAMP    | Fecha de procesamiento externo    |
| resultado_path           | VARCHAR(500) | Liga de descarga del resultado    |
| resultado_disponible_desde| TIMESTAMP   | Fecha desde que está disponible   |
| numero_estudiantes       | INT          | Cantidad de estudiantes en archivo|
| nivel_educativo          | VARCHAR(50)  | Nivel educativo del archivo       |
| created_at               | TIMESTAMP    | Fecha de creación del registro    |
| updated_at               | TIMESTAMP    | Fecha de última actualización     |

### TICKETS_SOPORTE

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| numero_ticket   | VARCHAR(20)  | Número de ticket                  |
| escuela_id      | UUID         | Relación con ESCUELAS             |
| usuario_id      | UUID         | Relación con USUARIOS             |
| archivo_frv_id  | UUID         | Relación con ARCHIVOS_FRV         |
| asunto          | VARCHAR(200) | Asunto                            |
| descripcion     | TEXT         | Descripción                       |
| estado          | ENUM         | Estado del ticket                 |
| prioridad       | VARCHAR(10)  | Prioridad                         |
| asignado_a      | UUID         | Usuario asignado                  |
| asignado_en     | TIMESTAMP    | Fecha de asignación               |
| resolucion      | TEXT         | Resolución                        |
| resuelto_en     | TIMESTAMP    | Fecha de resolución               |
| cerrado_en      | TIMESTAMP    | Fecha de cierre                   |
| created_at      | TIMESTAMP    | Fecha de creación                 |
| updated_at      | TIMESTAMP    | Fecha de actualización            |

### USUARIOS

**Consolidado** - Incluye funcionalidad de CONFIGURACIONES_USUARIO eliminada

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| nombre          | VARCHAR(60)  | Nombre de pila                    |
| apepaterno      | VARCHAR(60)  | Primer apellido                   |
| apematerno      | VARCHAR(60)  | Segundo apellido (opcional)       |
| email           | VARCHAR(100) | Correo electrónico (UNIQUE)       |
| password_hash   | VARCHAR(255) | Hash de la contraseña (bcrypt/argon2) |
| rol             | INT          | Relación con CAT_ROLES_USUARIO (FK) |
| escuela_id      | UUID         | Relación con ESCUELAS             |
| password_debe_cambiar | BOOLEAN | Forzar cambio en primer login     |
| ultimo_cambio_password | TIMESTAMP | Fecha del último cambio de contraseña |
| bloqueado_hasta | TIMESTAMP    | Fecha hasta la cual está bloqueado |
| activo          | BOOLEAN      | Indica si el usuario está activo  |
| preferencias_notif | JSONB     | Preferencias de notificaciones (email, SMS, frecuencia, etc.) |
| fecha_registro  | TIMESTAMP    | Fecha de registro                 |
| created_at      | TIMESTAMP    | Fecha de creación del registro    |
| updated_at      | TIMESTAMP    | Fecha de última actualización     |

Ejemplo de `preferencias_notif`:

```json
{
  "email_enabled": true,
  "email_frecuencia": "inmediato",
  "notif_resultados": true,
  "notif_validaciones": true,
  "notif_sistema": false
}
```

### VALORACIONES

| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| estudiante_id   | UUID         | Relación con ESTUDIANTES          |
| materia_id      | INT          | Relación con MATERIAS             |
| periodo_id      | INT          | Relación con PERIODOS_EVALUACION  |
| valor           | INT          | Valoración (0-3)                  |
| fecha           | DATETIME     | Fecha de valoración               |

---

### Descripción de entidades principales

 **COMPETENCIAS**: Competencias evaluadas por materia.
 **RESULTADOS_COMPETENCIAS**: Logros por competencia en cada evaluación.
 **LOG_ACTIVIDADES**: Bitácora de actividades y auditoría.
 **EVALUACIONES**: Tabla normalizada de valoraciones de estudiantes por materia y periodo. Almacena valoraciones (0-3), nivel de integración calculado, observaciones del docente y trazabilidad completa (quién registró, quién validó). Vincula con ARCHIVOS_FRV para rastrear el origen de los datos. Soporta validación por equipo DGADAE.
 **CREDENCIALES_EIA2**: Gestión de credenciales para acceso a resultados de la plataforma EIA 2ª aplicación. Se generan automáticamente en la primera carga válida del usuario (identificado por correo electrónico) y no se regeneran en cargas posteriores. **Usuario = correo electrónico validado** (reutilizable para múltiples CCT: supervisores, directores con varios planteles), **Contraseña = cadena aleatoria de 12 caracteres** (hasheada con bcrypt salt rounds ≥12 o argon2id). Un usuario puede gestionar solicitudes de múltiples CCT bajo un solo conjunto de credenciales.
 **SOLICITUDES_EIA2**: Registro histórico de todas las cargas de archivos EIA 2ª aplicación. Cada carga se registra como solicitud independiente con número consecutivo, sin importar si es primera o segunda aplicación. Almacena estado de validación, errores, rutas de archivos y ligas de descarga de resultados procesados externamente.
 **REPORTES_GENERADOS**: Gestión completa de reportes PDF generados por el sistema (escuela y grupo). Incluye 5 tipos: ENS, HYC, LEN, SPC y F5. Trackea generación, descargas, integridad (SHA256), disponibilidad temporal (2 ciclos escolares) y archivos comprimidos. Soporta auditoría de descargas con contador y registro de usuario.
 **CAT_TURNOS**: Catálogo de turnos escolares (Matutino, Vespertino, Nocturno, Continuo).
 **CAT_ENTIDADES_FEDERATIVAS**: Catálogo de los 32 estados de la República Mexicana.
 **CAT_NIVELES_EDUCATIVOS**: Catálogo de niveles (Preescolar, Primaria, Secundaria, Telesecundaria).
 **CAT_CICLOS_ESCOLARES**: Catálogo de ciclos escolares (2024-2025, 2025-2026, etc.).
 **CAT_GRADOS**: Catálogo de grados por nivel educativo (1° a 6° primaria, 1° a 3° secundaria, etc.).
 **CAT_ROLES_USUARIO**: Catálogo de roles del sistema (Director, Operador SEP, Administrador).

---

## 4. Datos de ejemplo para catálogos

### CAT_TURNOS - Datos iniciales

```sql
INSERT INTO CAT_TURNOS (id_turno, nombre, codigo, descripcion) VALUES
(1, 'Matutino', 'MAT', 'Turno matutino (7:00 - 13:00)'),
(2, 'Vespertino', 'VESP', 'Turno vespertino (13:00 - 19:00)'),
(3, 'Nocturno', 'NOCT', 'Turno nocturno (19:00 - 22:00)'),
(4, 'Continuo', 'CONT', 'Jornada continua (8:00 - 16:00)'),
(5, 'Discontinuo', 'DISC', 'Jornada discontinua');
```

### CAT_NIVELES_EDUCATIVOS - Datos iniciales

```sql
INSERT INTO CAT_NIVELES_EDUCATIVOS (id_nivel, nombre, codigo, descripcion, orden) VALUES
(1, 'Preescolar', 'PRE', 'Educación Preescolar (3-5 años)', 1),
(2, 'Primaria', 'PRI', 'Educación Primaria (6-11 años)', 2),
(3, 'Secundaria', 'SEC', 'Educación Secundaria General', 3),
(4, 'Telesecundaria', 'TEL', 'Educación Telesecundaria', 4);
```

### CAT_ROLES_USUARIO - Datos iniciales

```sql
INSERT INTO CAT_ROLES_USUARIO (id_rol, nombre, codigo, descripcion, permisos) VALUES
(1, 'Director', 'DIRECTOR', 'Director de plantel educativo', 
 '{"lectura": ["escuela_propia", "reportes_propios"], "escritura": ["cargar_frv", "tickets"]}'),
(2, 'Operador SEP', 'OPERADOR', 'Operador de soporte DGADAE', 
 '{"lectura": ["todas_escuelas", "todos_tickets"], "escritura": ["resolver_tickets", "validar_archivos"]}'),
(3, 'Administrador', 'ADMIN', 'Administrador del sistema', 
 '{"lectura": ["*"], "escritura": ["*"], "admin": ["usuarios", "catalogos", "configuracion"]}'),
(4, 'Equipo Validación', 'VALIDADOR', 'Equipo de validación de datos', 
 '{"lectura": ["datos_asignados"], "escritura": ["validar_datos", "generar_reportes"]}');
```

### CAT_GRADOS - Datos iniciales (Primaria)

```sql
INSERT INTO CAT_GRADOS (id_grado, nivel_educativo, grado_numero, grado_nombre, orden) VALUES
-- Preescolar
(1, 'PREESCOLAR', 1, 'Primero', 1),
(2, 'PREESCOLAR', 2, 'Segundo', 2),
(3, 'PREESCOLAR', 3, 'Tercero', 3),
-- Primaria
(11, 'PRIMARIA', 1, 'Primero', 11),
(12, 'PRIMARIA', 2, 'Segundo', 12),
(13, 'PRIMARIA', 3, 'Tercero', 13),
(14, 'PRIMARIA', 4, 'Cuarto', 14),
(15, 'PRIMARIA', 5, 'Quinto', 15),
(16, 'PRIMARIA', 6, 'Sexto', 16),
-- Secundaria
(21, 'SECUNDARIA', 1, 'Primero', 21),
(22, 'SECUNDARIA', 2, 'Segundo', 22),
(23, 'SECUNDARIA', 3, 'Tercero', 23);
```

### CAT_ENTIDADES_FEDERATIVAS - Datos iniciales (muestra)

```sql
INSERT INTO CAT_ENTIDADES_FEDERATIVAS (id_entidad, nombre, abreviatura, codigo_sep, region) VALUES
(1, 'Aguascalientes', 'AGS', '01', 'Centro-Norte'),
(2, 'Baja California', 'BC', '02', 'Noroeste'),
(9, 'Ciudad de México', 'CDMX', '09', 'Centro'),
(14, 'Jalisco', 'JAL', '14', 'Occidente'),
(19, 'Nuevo León', 'NL', '19', 'Noreste'),
(24, 'San Luis Potosí', 'SLP', '24', 'Centro-Norte');
-- (Incluir las 32 entidades en implementación completa)
```

### CAT_CICLOS_ESCOLARES - Datos iniciales

```sql
INSERT INTO CAT_CICLOS_ESCOLARES (id_ciclo, nombre, fecha_inicio, fecha_fin, activo) VALUES
(1, '2023-2024', '2023-08-21', '2024-07-15', FALSE),
(2, '2024-2025', '2024-08-19', '2025-07-14', TRUE),
(3, '2025-2026', '2025-08-18', '2026-07-13', FALSE);
```

### SOLICITUDES_EIA2 - Ejemplo de datos

```sql
-- Ejemplo 1: Primera solicitud válida (genera credenciales)
INSERT INTO SOLICITUDES_EIA2 (
    id, consecutivo, cct, credencial_id, archivo_original, fecha_carga,
    estado_validacion, errores_validacion, archivo_path, archivo_size,
    procesado_externamente, numero_estudiantes, nivel_educativo
) VALUES (
    gen_random_uuid(),
    1,
    '24PPR0356K',
    NULL, -- Se asignará automáticamente por trigger
    'EIA_2DA_APLICACION_24PPR0356K_2025.xlsx',
    '2025-01-15 10:30:00',
    'VALIDO',
    '{"correo_validado": "director.escuela356@edu.mx"}',
    '/data/solicitudes_eia2/2025/01/24PPR0356K/solicitud_0001.xlsx',
    245760,
    FALSE,
    45,
    'PRIMARIA'
);

-- Ejemplo 2: Segunda solicitud del mismo CCT (NO genera credenciales)
INSERT INTO SOLICITUDES_EIA2 (
    id, consecutivo, cct, credencial_id, archivo_original, fecha_carga,
    estado_validacion, errores_validacion, archivo_path, archivo_size,
    procesado_externamente, numero_estudiantes, nivel_educativo
) VALUES (
    gen_random_uuid(),
    2,
    '24PPR0356K',
    (SELECT id FROM CREDENCIALES_EIA2 WHERE cct = '24PPR0356K'),
    'EIA_2DA_APLICACION_24PPR0356K_2025_CORRECCION.xlsx',
    '2025-01-20 14:45:00',
    'VALIDO',
    '{"correo_validado": "director.escuela356@edu.mx"}',
    '/data/solicitudes_eia2/2025/01/24PPR0356K/solicitud_0002.xlsx',
    248320,
    TRUE,
    45,
    'PRIMARIA'
);

-- Ejemplo 3: Solicitud inválida con errores
INSERT INTO SOLICITUDES_EIA2 (
    id, consecutivo, cct, credencial_id, archivo_original, fecha_carga,
    estado_validacion, errores_validacion, archivo_path, archivo_size,
    procesado_externamente, numero_estudiantes, nivel_educativo
) VALUES (
    gen_random_uuid(),
    3,
    '14DPR0245L',
    NULL,
    'EIA_2DA_APLICACION_14DPR0245L_2025.xlsx',
    '2025-01-16 09:15:00',
    'INVALIDO',
    '{
        "errores": [
            {"fila": 5, "columna": "VALORACION_1", "error": "Valor fuera de rango (4), debe ser 0-3"},
            {"fila": 12, "columna": "CURP", "error": "CURP inválido"},
            {"general": "Número de hojas incorrecto: esperado 6, encontrado 5"}
        ],
        "total_errores": 3
    }',
    '/data/solicitudes_eia2/2025/01/14DPR0245L/solicitud_0003.xlsx',
    198640,
    FALSE,
    38,
    'PRIMARIA'
);
```

### REPORTES_GENERADOS - Ejemplo de datos

```sql
-- Ejemplo 1: Reporte ENS (Enseñanza) de escuela primaria
INSERT INTO REPORTES_GENERADOS (
    id, escuela_id, ciclo_escolar, periodo_id, tipo_reporte, grado, grupo,
    file_path, filename, file_size, checksum_sha256,
    generado_en, generado_por, total_descargas, disponible_hasta
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESCUELAS WHERE cct = '24PPR0356K'),
    '2024-2025',
    1, -- Periodo 1: Diagnóstico inicial
    'ENS',
    NULL, -- Reporte por escuela (no por grado específico)
    NULL,
    '/data/sicrer/pdfs/2024-2025/periodo1/24PPR0356K/24PPR0356K.P1.Reporte_ENS_CAMPO.pdf',
    '24PPR0356K.P1.Reporte_ENS_CAMPO.pdf',
    687104, -- 670 KB
    'a7f3c2e5d8b4f1a9c6e2d7b5f8a3c1e4d9b6f2a7c5e8d3b1f6a9c4e7d2b8f5a3',
    '2024-09-25 18:30:00',
    'SiCRER-Legacy',
    3,
    '2026-07-14', -- Disponible por 2 ciclos escolares
    NOW(),
    NOW()
);

-- Ejemplo 2: Reporte F5 (Grupo) - 3er grado grupo A
INSERT INTO REPORTES_GENERADOS (
    id, escuela_id, ciclo_escolar, periodo_id, tipo_reporte, grado, grupo,
    file_path, filename, file_size, checksum_sha256,
    generado_en, generado_por, descargado_en, descargado_por, total_descargas,
    comprimido_en, disponible_hasta
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESCUELAS WHERE cct = '24PPR0356K'),
    '2024-2025',
    1,
    'F5',
    '3°', -- Tercer grado
    'A',
    '/data/sicrer/pdfs/2024-2025/periodo1/24PPR0356K/24PPR0356K.P1.Reporte_F5_FORMATO.3°.A.pdf',
    '24PPR0356K.P1.Reporte_F5_FORMATO.3°.A.pdf',
    2842624, -- 2.71 MB
    'b8e4d3f2a1c7e9b5d6f3a8c2e5d1b7f4a9c6e3d8b2f5a7c4e1d9b6f3a8c5e2',
    '2024-09-25 18:35:00',
    'FastAPI-Worker-01',
    '2024-09-26 08:15:00',
    (SELECT id FROM USUARIOS WHERE email = 'director.escuela356@edu.mx'),
    5,
    '/data/sicrer/pdfs/2024-2025/periodo1/24PPR0356K/reportes_grupo_3A.7z',
    '2026-07-14',
    NOW(),
    NOW()
);

-- Ejemplo 3: Reporte LEN (Lenguaje) - Sin descargas aún
INSERT INTO REPORTES_GENERADOS (
    id, escuela_id, ciclo_escolar, periodo_id, tipo_reporte, grado, grupo,
    file_path, filename, file_size, checksum_sha256,
    generado_en, generado_por, total_descargas, disponible_hasta
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESCUELAS WHERE cct = '14DPR0245L'),
    '2024-2025',
    1,
    'LEN',
    NULL,
    NULL,
    '/data/sicrer/pdfs/2024-2025/periodo1/14DPR0245L/14DPR0245L.P1.Reporte_LEN_CAMPO.pdf',
    '14DPR0245L.P1.Reporte_LEN_CAMPO.pdf',
    633856, -- 619 KB
    'c9f5a3e8d2b7f1a6c4e9d5b8f3a2c7e1d4b9f6a5c8e3d1b7f2a9c6e4d8b5f3',
    '2024-09-25 19:00:00',
    'SiCRER-Legacy',
    0, -- Sin descargas
    '2026-07-14',
    NOW(),
    NOW()
);

-- Ejemplo 4: Múltiples reportes para secundaria (Preescolar tiene 5, Primaria 30, Secundaria 15)
INSERT INTO REPORTES_GENERADOS (
    id, escuela_id, ciclo_escolar, periodo_id, tipo_reporte, grado, grupo,
    file_path, filename, file_size, checksum_sha256,
    generado_en, generado_por, total_descargas, disponible_hasta
) VALUES 
-- Secundaria: 4 reportes de campo formativo + 15 reportes F5 (3 grados × 5 grupos promedio)
(gen_random_uuid(), (SELECT id FROM ESCUELAS WHERE cct = '24DST0123X'), '2024-2025', 1, 'HYC', NULL, NULL,
 '/data/sicrer/pdfs/2024-2025/periodo1/24DST0123X/24DST0123X.P1.Reporte_HYC_CAMPO.pdf',
 '24DST0123X.P1.Reporte_HYC_CAMPO.pdf', 294912, 
 'd1e7f4a9c6b8e2f5a3d9b7c4e8f1a6d3b5c9e7f2a4d8b6c3e9f5a1d7b4c8e6',
 '2024-09-25 20:00:00', 'FastAPI-Worker-02', 1, '2026-07-14', NOW(), NOW());
```

### INTENTOS_LOGIN - Ejemplo de datos

```sql
-- Ejemplo 1: Login exitoso
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'director.school245@edu.mx',
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    TRUE,
    NULL,
    '2024-09-26 08:30:00'
);

-- Ejemplo 2: Intento fallido - Password incorrecto (1er intento)
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'operador.sep@sepjalisco.gob.mx'),
    'operador.sep@sepjalisco.gob.mx',
    '10.50.20.25'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
    FALSE,
    'PASSWORD_INCORRECTO',
    '2024-09-26 09:15:00'
);

-- Ejemplo 3: Intento fallido - Usuario no existe
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES (
    gen_random_uuid(),
    NULL, -- Usuario no existe
    'hacker@malicious.com',
    '201.175.88.99'::INET,
    'curl/7.68.0', -- Script automatizado
    FALSE,
    'USUARIO_INVALIDO',
    '2024-09-26 10:00:00'
);

-- Ejemplo 4: Intento fallido - Cuenta bloqueada (5to intento)
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, bloqueado_hasta, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    'director.school356@edu.mx',
    '192.168.1.200'::INET,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    FALSE,
    'CUENTA_BLOQUEADA',
    NOW() + INTERVAL '30 minutes', -- Bloqueado por 30 minutos
    NOW()
);

-- Ejemplo 5: Serie de 5 intentos fallidos que resultan en bloqueo
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES 
-- Intento 1
(gen_random_uuid(), 
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 'validador.dgadae@sep.gob.mx', '10.50.30.40'::INET,
 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0', FALSE, 'PASSWORD_INCORRECTO',
 '2024-09-26 11:00:00'),
-- Intento 2
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 'validador.dgadae@sep.gob.mx', '10.50.30.40'::INET,
 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0', FALSE, 'PASSWORD_INCORRECTO',
 '2024-09-26 11:02:00'),
-- Intento 3
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 'validador.dgadae@sep.gob.mx', '10.50.30.40'::INET,
 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0', FALSE, 'PASSWORD_INCORRECTO',
 '2024-09-26 11:05:00'),
-- Intento 4
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 'validador.dgadae@sep.gob.mx', '10.50.30.40'::INET,
 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0', FALSE, 'PASSWORD_INCORRECTO',
 '2024-09-26 11:08:00'),
-- Intento 5 (dispara bloqueo)
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 'validador.dgadae@sep.gob.mx', '10.50.30.40'::INET,
 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0', FALSE, 'PASSWORD_INCORRECTO',
 '2024-09-26 11:10:00');

-- Ejemplo 6: Intento con metadata de geolocalización y dispositivo
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, metadata, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'director.school245@edu.mx',
    '201.150.75.123'::INET,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    TRUE,
    NULL,
    '{
        "device": "iPhone 15 Pro",
        "os": "iOS 17.0",
        "browser": "Safari Mobile",
        "location": {
            "city": "Guadalajara",
            "state": "Jalisco",
            "country": "México",
            "lat": 20.6597,
            "lon": -103.3496
        },
        "is_mobile": true,
        "is_trusted_device": false
    }'::JSONB,
    '2024-09-26 14:30:00'
);

-- Ejemplo 7: Ataque distribuido (múltiples IPs intentando acceder a varias cuentas)
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES 
-- IP 1 probando varias cuentas
(gen_random_uuid(), NULL, 'admin@sep.gob.mx', '45.33.22.11'::INET, 'python-requests/2.31.0', FALSE, 'USUARIO_INVALIDO', NOW() - INTERVAL '5 minutes'),
(gen_random_uuid(), NULL, 'root@sep.gob.mx', '45.33.22.11'::INET, 'python-requests/2.31.0', FALSE, 'USUARIO_INVALIDO', NOW() - INTERVAL '4 minutes'),
(gen_random_uuid(), NULL, 'test@sep.gob.mx', '45.33.22.11'::INET, 'python-requests/2.31.0', FALSE, 'USUARIO_INVALIDO', NOW() - INTERVAL '3 minutes'),
-- IP 2 probando la misma cuenta
(gen_random_uuid(), (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'), 'director.school245@edu.mx', '88.99.77.66'::INET, 'curl/7.88.1', FALSE, 'PASSWORD_INCORRECTO', NOW() - INTERVAL '2 minutes'),
(gen_random_uuid(), (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'), 'director.school245@edu.mx', '88.99.77.66'::INET, 'curl/7.88.1', FALSE, 'PASSWORD_INCORRECTO', NOW() - INTERVAL '1 minute');

-- Ejemplo 8: Intento con cuenta inactiva
INSERT INTO INTENTOS_LOGIN (
    id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'usuario.inactivo@edu.mx'),
    'usuario.inactivo@edu.mx',
    '192.168.10.50'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
    FALSE,
    'CUENTA_INACTIVA',
    '2024-09-26 16:00:00'
);
```

### NOTIFICACIONES_EMAIL - Ejemplo de datos

```sql
-- Ejemplo 1: Notificación de resultado listo (prioridad ALTA)
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'director.school245@edu.mx',
    'Resultados de Evaluación Diagnóstica - Periodo 1 Disponibles',
    '<html><body><h2>Estimado Director</h2><p>Los resultados de la Evaluación Diagnóstica del Periodo 1 para su escuela <strong>14DPR0245L</strong> ya están disponibles.</p><p>Puede descargar los reportes desde el portal: <a href="https://evaluacion.sep.gob.mx/reportes">Ver Reportes</a></p><p>Los reportes estarán disponibles hasta: <strong>14/07/2026</strong></p></body></html>',
    'RESULTADO_LISTO',
    'PENDIENTE',
    'ALTA',
    0,
    3,
    (SELECT id FROM REPORTES_GENERADOS WHERE escuela_id = (SELECT id FROM ESCUELAS WHERE cct = '14DPR0245L') LIMIT 1),
    'REPORTE',
    NOW()
);

-- Ejemplo 2: Notificación de ticket creado (enviada exitosamente)
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, enviado_en, referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    'director.school356@edu.mx',
    'Ticket de Soporte #TKT-2024-00789 Creado',
    '<html><body><h2>Ticket de Soporte Creado</h2><p>Su solicitud de soporte ha sido registrada con el número: <strong>TKT-2024-00789</strong></p><p><strong>Asunto:</strong> Error al descargar archivo FRV</p><p><strong>Estado:</strong> ABIERTO</p><p>Recibirá actualizaciones por este medio. Puede ver el detalle en: <a href="https://evaluacion.sep.gob.mx/tickets/789">Ver Ticket</a></p></body></html>',
    'TICKET_CREADO',
    'ENVIADO',
    'MEDIA',
    1,
    3,
    '2024-09-26 08:35:00',
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00789'),
    'TICKET',
    '2024-09-26 08:31:00'
);

-- Ejemplo 3: Notificación de recuperación de contraseña (temporal - 6h)
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, enviado_en, referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'operador.sep@sepjalisco.gob.mx'),
    'operador.sep@sepjalisco.gob.mx',
    'Recuperación de Contraseña - SEP Evaluación Diagnóstica',
    '<html><body><h2>Recuperación de Contraseña</h2><p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para establecer una nueva contraseña:</p><p><a href="https://evaluacion.sep.gob.mx/reset-password?token=abc123xyz789" style="background:#0066cc;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a></p><p><strong>Este enlace expira en 6 horas.</strong></p><p>Si no solicitaste este cambio, ignora este correo.</p></body></html>',
    'RECUPERACION_PASSWORD',
    'ENVIADO',
    'ALTA',
    1,
    3,
    '2024-09-20 16:46:00',
    (SELECT id FROM USUARIOS WHERE email = 'operador.sep@sepjalisco.gob.mx'),
    'USUARIO',
    '2024-09-20 16:45:00'
);

-- Ejemplo 4: Notificación de credenciales EIA 2ª Aplicación
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    'director.school356@edu.mx',
    'Credenciales de Acceso - Plataforma EIA 2ª Aplicación',
    '<html><body><h2>Credenciales Generadas</h2><p>Se han generado sus credenciales de acceso para la plataforma de Ejercicios Integradores del Aprendizaje (EIA) - 2ª Aplicación.</p><p><strong>Usuario:</strong> 24PPR0356K</p><p><strong>Contraseña:</strong> director.escuela356@edu.mx</p><p>Acceda al sistema en: <a href="https://eia2.sep.gob.mx">Portal EIA 2ª Aplicación</a></p><p><em>Por seguridad, se recomienda cambiar la contraseña en el primer acceso.</em></p></body></html>',
    'CREDENCIALES_EIA2',
    'PENDIENTE',
    'ALTA',
    0,
    3,
    (SELECT id FROM CREDENCIALES_EIA2 WHERE cct = '24PPR0356K'),
    'CREDENCIAL',
    NOW()
);

-- Ejemplo 5: Notificación con error y reintentos
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, error_mensaje, proximo_intento,
    referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.invalido@wrongdomain.xyz'),
    'director.invalido@wrongdomain.xyz',
    'Ticket #TKT-2024-00456 Actualizado',
    '<html><body><h2>Actualización de Ticket</h2><p>Su ticket ha sido actualizado...</p></body></html>',
    'TICKET_ACTUALIZADO',
    'REINTENTANDO',
    'MEDIA',
    2,
    3,
    'SMTP Error: 550 5.1.1 User unknown - Domain wrongdomain.xyz does not exist',
    NOW() + INTERVAL '30 minutes', -- Próximo intento en 30 min (tercer intento)
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00456'),
    'TICKET',
    NOW() - INTERVAL '1 hour'
);

-- Ejemplo 6: Notificación con adjuntos (reporte PDF)
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, adjuntos, enviado_en,
    referencia_id, referencia_tipo, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'director.school245@edu.mx',
    'Reporte de Evaluaciones Validadas - Periodo 1',
    '<html><body><h2>Evaluaciones Validadas</h2><p>Todas las evaluaciones de su escuela para el Periodo 1 han sido validadas exitosamente.</p><p>En el archivo adjunto encontrará el reporte consolidado en formato PDF.</p><p>Total de evaluaciones: <strong>125</strong></p></body></html>',
    'EVALUACION_VALIDADA',
    'ENVIADO',
    'MEDIA',
    1,
    3,
    '[{"nombre": "reporte_evaluaciones_14DPR0245L_P1.pdf", "path": "/data/reportes/temp/eval_14DPR0245L.pdf", "size": 456789, "tipo": "application/pdf"}]'::JSONB,
    '2024-09-25 10:15:00',
    (SELECT id FROM ESCUELAS WHERE cct = '14DPR0245L'),
    'EVALUACION',
    '2024-09-25 10:10:00'
);

-- Ejemplo 7: Notificación con máximo de reintentos alcanzado (ERROR final)
INSERT INTO NOTIFICACIONES_EMAIL (
    id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
    prioridad, intentos, max_intentos, error_mensaje, referencia_id, referencia_tipo, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.bounce@tempmail.com'),
    'director.bounce@tempmail.com',
    'Resultados Disponibles',
    '<html><body>Contenido...</body></html>',
    'RESULTADO_LISTO',
    'ERROR',
    'BAJA',
    3, -- Alcanzó max_intentos
    3,
    'Max retries exceeded. Last error: Connection timeout to SMTP server after 3 attempts.',
    (SELECT id FROM REPORTES_GENERADOS LIMIT 1),
    'REPORTE',
    NOW() - INTERVAL '2 hours',
    NOW()
);
```

### HISTORICO_PASSWORDS - Ejemplo de datos

```sql
-- Ejemplo 1: Contraseña temporal generada por el sistema (primera asignación)
INSERT INTO HISTORICO_PASSWORDS (
    id, usuario_id, password_hash, es_temporal, 
    generada_en, expira_en, cambiada_en, cambiada_por,
    ip_origen, activa
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYdKxGxmKlW', -- Hash de 'TempPass2024!'
    TRUE, -- Es temporal
    '2024-08-15 09:00:00',
    '2024-08-18 09:00:00', -- Expira en 72 horas
    NULL, -- Aún no ha sido cambiada
    'SISTEMA',
    '192.168.1.100',
    TRUE -- Activa
);

-- Ejemplo 2: Cambio de contraseña temporal por el usuario (primer login)
INSERT INTO HISTORICO_PASSWORDS (
    id, usuario_id, password_hash, es_temporal,
    generada_en, expira_en, cambiada_en, cambiada_por,
    ip_origen, activa
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    '$2b$12$8K1p0EYx9vKPWk2yHlXZFO3tGz4cQm5nRj6sWu7vXy8zA9bC0dE1F', -- Nueva contraseña segura
    FALSE, -- Ya no es temporal
    '2024-08-15 14:30:00',
    NULL, -- No tiene expiración
    '2024-08-15 14:30:00',
    'USUARIO',
    '192.168.1.100',
    TRUE -- Nueva contraseña activa
);

-- Ejemplo 3: Contraseña anterior desactivada (tras el cambio del ejemplo 2)
UPDATE HISTORICO_PASSWORDS
SET activa = FALSE,
    cambiada_en = '2024-08-15 14:30:00'
WHERE usuario_id = (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx')
  AND password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYdKxGxmKlW';

-- Ejemplo 4: Reset de contraseña por administrador
INSERT INTO HISTORICO_PASSWORDS (
    id, usuario_id, password_hash, es_temporal,
    generada_en, expira_en, cambiada_en, cambiada_por,
    ip_origen, activa
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'operador.sep@sepjalisco.gob.mx'),
    '$2b$12$Xr9Hy8Kp2LmNq3Oj4Wu5Vv6Zz7Aa8Bb9Cc0Dd1Ee2Ff3Gg4Hh5Ii6', -- Temporal generada por admin
    TRUE,
    '2024-09-10 11:20:00',
    '2024-09-13 11:20:00',
    NULL,
    'ADMIN',
    '10.50.20.15', -- IP del administrador
    TRUE
);

-- Ejemplo 5: Recuperación de contraseña por email
INSERT INTO HISTORICO_PASSWORDS (
    id, usuario_id, password_hash, es_temporal,
    generada_en, expira_en, cambiada_en, cambiada_por,
    ip_origen, activa
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    '$2b$12$Yy0Ii1Jj2Kk3Ll4Mm5Nn6Oo7Pp8Qq9Rr0Ss1Tt2Uu3Vv4Ww5Xx6', -- Token de recuperación
    TRUE,
    '2024-09-20 16:45:00',
    '2024-09-20 22:45:00', -- Expira en 6 horas (recuperación más corta)
    NULL,
    'RECUPERACION',
    '201.175.88.42', -- IP externa del usuario
    TRUE
);

-- Ejemplo 6: Histórico de cambios (usuario con 5 contraseñas previas)
INSERT INTO HISTORICO_PASSWORDS (
    id, usuario_id, password_hash, es_temporal,
    generada_en, expira_en, cambiada_en, cambiada_por,
    ip_origen, activa
) VALUES 
-- Contraseña 1 (más antigua) - inactiva
(gen_random_uuid(), 
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 '$2b$12$Old1PasswordHashXxYyZzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPp',
 FALSE, '2024-01-15 10:00:00', NULL, '2024-03-20 09:15:00', 'USUARIO', '10.50.20.25', FALSE),
-- Contraseña 2 - inactiva
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 '$2b$12$Old2PasswordHashAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq',
 FALSE, '2024-03-20 09:15:00', NULL, '2024-05-10 14:30:00', 'USUARIO', '10.50.20.25', FALSE),
-- Contraseña 3 - inactiva
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 '$2b$12$Old3PasswordHashBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRr',
 FALSE, '2024-05-10 14:30:00', NULL, '2024-07-05 11:00:00', 'USUARIO', '10.50.20.25', FALSE),
-- Contraseña 4 - inactiva
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 '$2b$12$Old4PasswordHashCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSs',
 FALSE, '2024-07-05 11:00:00', NULL, '2024-09-01 08:45:00', 'USUARIO', '10.50.20.25', FALSE),
-- Contraseña 5 (actual) - ACTIVA
(gen_random_uuid(),
 (SELECT id FROM USUARIOS WHERE email = 'validador.dgadae@sep.gob.mx'),
 '$2b$12$CurrentPasswordHashDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt',
 FALSE, '2024-09-01 08:45:00', NULL, NULL, 'USUARIO', '10.50.20.25', TRUE);
```

### COMENTARIOS_TICKET - Ejemplo de datos

```sql
-- Ejemplo 1: Comentario inicial del director al crear ticket
INSERT INTO COMENTARIOS_TICKET (
    id, ticket_id, usuario_id, comentario, es_interno,
    adjuntos, leido_por_director, leido_por_operador, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00123'),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'No puedo descargar el archivo FRV_14DPR0245L_P1_2024.xlsx. Al hacer clic en el botón de descarga aparece el error "Archivo no encontrado". Adjunto captura de pantalla del error.',
    FALSE, -- No es interno, visible para director
    '[{"nombre": "error_descarga.png", "path": "/tickets/adjuntos/2024/123/error_descarga.png", "size": 45678, "tipo": "image/png"}]'::JSONB,
    TRUE,  -- Creado por director, ya leído por él
    FALSE, -- Operador aún no lo ha leído
    '2024-09-26 08:30:00'
);

-- Ejemplo 2: Respuesta del operador SEP (visible para director)
INSERT INTO COMENTARIOS_TICKET (
    id, ticket_id, usuario_id, comentario, es_interno,
    adjuntos, leido_por_director, leido_por_operador, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00123'),
    (SELECT id FROM USUARIOS WHERE rol = 'OPERADOR' LIMIT 1),
    'Estimado director, hemos verificado el problema. El archivo sí existe en el servidor. Por favor intente limpiar la caché de su navegador (Ctrl+Shift+Delete) y vuelva a intentar la descarga. Si el problema persiste, responda a este comentario.',
    FALSE,
    NULL, -- Sin adjuntos
    FALSE, -- Director aún no lo ha leído
    TRUE,  -- Creado por operador, ya leído por él
    '2024-09-26 10:15:00'
);

-- Ejemplo 3: Comentario interno entre operadores (NO visible para director)
INSERT INTO COMENTARIOS_TICKET (
    id, ticket_id, usuario_id, comentario, es_interno,
    adjuntos, leido_por_director, leido_por_operador, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00123'),
    (SELECT id FROM USUARIOS WHERE rol = 'OPERADOR' LIMIT 1),
    'NOTA INTERNA: Revisar logs del servidor. Parece ser un problema de permisos en el directorio /data/archivos/frv/2024/periodo1/. El usuario web no tiene permisos de lectura. Escalar a infraestructura.',
    TRUE, -- INTERNO, solo visible para SEP
    NULL,
    FALSE, -- Director no puede ver esto
    TRUE,
    '2024-09-26 10:17:00'
);

-- Ejemplo 4: Confirmación del director
INSERT INTO COMENTARIOS_TICKET (
    id, ticket_id, usuario_id, comentario, es_interno,
    adjuntos, leido_por_director, leido_por_operador, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00123'),
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    'Problema resuelto. Limpié la caché del navegador como indicaron y ahora puedo descargar el archivo correctamente. Muchas gracias por su apoyo.',
    FALSE,
    NULL,
    TRUE,
    FALSE, -- Operador no lo ha leído aún
    '2024-09-26 14:30:00'
);

-- Ejemplo 5: Comentario con múltiples adjuntos (evidencia de resolución)
INSERT INTO COMENTARIOS_TICKET (
    id, ticket_id, usuario_id, comentario, es_interno,
    adjuntos, leido_por_director, leido_por_operador, created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00456'),
    (SELECT id FROM USUARIOS WHERE rol = 'OPERADOR' LIMIT 1),
    'Se ha corregido el problema en el reporte de Matemáticas. Los datos ahora reflejan correctamente el promedio grupal. Adjunto el reporte corregido y el log de corrección.',
    FALSE,
    '[{"nombre": "reporte_corregido.pdf", "path": "/tickets/adjuntos/2024/456/reporte_MAT_corregido.pdf", "size": 345678, "tipo": "application/pdf"}, {"nombre": "log_correccion.txt", "path": "/tickets/adjuntos/2024/456/log.txt", "size": 2340, "tipo": "text/plain"}]'::JSONB,
    FALSE,
    TRUE,
    '2024-09-27 11:20:00'
);
```

### EVALUACIONES - Ejemplo de datos

```sql
-- Ejemplo 1: Evaluación validada en Lenguaje y Comunicación - Nivel sobresaliente
INSERT INTO EVALUACIONES (
    id, estudiante_id, materia_id, periodo_id, archivo_frv_id,
    valoracion, nivel_integracion, competencia_alcanzada, observaciones,
    registrado_por, fecha_evaluacion, fecha_captura,
    validado, validado_por, validado_en
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESTUDIANTES WHERE curp = 'GOMJ090815HJCLNS07' LIMIT 1),
    101, -- LEN (Lenguaje y Comunicación)
    1, -- Periodo 1
    (SELECT id FROM ARCHIVOS_FRV WHERE nombre_archivo LIKE '%14DPR0245L%' LIMIT 1),
    3, -- Valoración 3 (máxima)
    'SOBRESALIENTE',
    TRUE,
    'Demuestra dominio excepcional en comprensión lectora y expresión escrita. Supera las expectativas.',
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    '2024-09-20 10:00:00',
    '2024-09-20 14:30:00',
    TRUE,
    (SELECT id FROM USUARIOS WHERE rol = 'VALIDADOR' LIMIT 1),
    '2024-09-21 09:15:00'
);

-- Ejemplo 2: Evaluación en Matemáticas - Nivel satisfactorio
INSERT INTO EVALUACIONES (
    id, estudiante_id, materia_id, periodo_id, archivo_frv_id,
    valoracion, nivel_integracion, competencia_alcanzada, observaciones,
    registrado_por, fecha_evaluacion, fecha_captura,
    validado, validado_por, validado_en
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESTUDIANTES WHERE curp = 'GOMJ090815HJCLNS07' LIMIT 1),
    102, -- MAT (Matemáticas)
    1,
    (SELECT id FROM ARCHIVOS_FRV WHERE nombre_archivo LIKE '%14DPR0245L%' LIMIT 1),
    2, -- Valoración 2 (satisfactorio)
    'SATISFACTORIO',
    TRUE,
    'Resuelve operaciones básicas correctamente. Requiere apoyo en problemas complejos.',
    (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
    '2024-09-20 10:00:00',
    '2024-09-20 14:35:00',
    TRUE,
    (SELECT id FROM USUARIOS WHERE rol = 'VALIDADOR' LIMIT 1),
    '2024-09-21 09:16:00'
);

-- Ejemplo 3: Evaluación en Ciencias - Nivel en desarrollo (requiere apoyo)
INSERT INTO EVALUACIONES (
    id, estudiante_id, materia_id, periodo_id, archivo_frv_id,
    valoracion, nivel_integracion, competencia_alcanzada, observaciones,
    registrado_por, fecha_evaluacion, fecha_captura,
    validado, validado_por, validado_en
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESTUDIANTES WHERE curp = 'RAMM101205MJCMRR03' LIMIT 1),
    103, -- SPC (Saberes y Pensamiento Científico)
    1,
    (SELECT id FROM ARCHIVOS_FRV WHERE nombre_archivo LIKE '%24PPR0356K%' LIMIT 1),
    1, -- Valoración 1 (en desarrollo)
    'EN DESARROLLO',
    FALSE,
    'Presenta dificultades en comprensión de conceptos científicos básicos. Se recomienda refuerzo.',
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    '2024-09-22 11:30:00',
    '2024-09-22 16:45:00',
    TRUE,
    (SELECT id FROM USUARIOS WHERE rol = 'OPERADOR' LIMIT 1),
    '2024-09-23 10:00:00'
);

-- Ejemplo 4: Evaluación pendiente de validación (validado = FALSE)
INSERT INTO EVALUACIONES (
    id, estudiante_id, materia_id, periodo_id, archivo_frv_id,
    valoracion, nivel_integracion, competencia_alcanzada, observaciones,
    registrado_por, fecha_evaluacion, fecha_captura,
    validado, validado_por, validado_en
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESTUDIANTES WHERE curp = 'RAMM101205MJCMRR03' LIMIT 1),
    104, -- HYC (Historia y Civismo)
    1,
    (SELECT id FROM ARCHIVOS_FRV WHERE nombre_archivo LIKE '%24PPR0356K%' LIMIT 1),
    2,
    'SATISFACTORIO',
    TRUE,
    'Conoce eventos históricos relevantes y participa en actividades cívicas.',
    (SELECT id FROM USUARIOS WHERE email = 'director.school356@edu.mx'),
    '2024-09-22 11:30:00',
    '2024-09-25 15:00:00',
    FALSE, -- Pendiente de validación
    NULL,
    NULL
);

-- Ejemplo 5: Evaluación nivel avanzado en Formación Cívica y Ética (Secundaria)
INSERT INTO EVALUACIONES (
    id, estudiante_id, materia_id, periodo_id, archivo_frv_id,
    valoracion, nivel_integracion, competencia_alcanzada, observaciones,
    registrado_por, fecha_evaluacion, fecha_captura,
    validado, validado_por, validado_en
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM ESTUDIANTES WHERE grupo_id IN (SELECT id FROM GRUPOS WHERE id_nivel = 3) LIMIT 1),
    201, -- Formación Cívica (Secundaria)
    1,
    (SELECT id FROM ARCHIVOS_FRV WHERE nombre_archivo LIKE '%24DST0123X%' LIMIT 1),
    3,
    'AVANZADO',
    TRUE,
    'Estudiante sobresaliente con habilidades de análisis crítico y argumentación ética.',
    (SELECT id FROM USUARIOS WHERE rol = 'DIRECTOR' LIMIT 1),
    '2024-09-23 09:00:00',
    '2024-09-23 17:20:00',
    TRUE,
    (SELECT id FROM USUARIOS WHERE rol = 'VALIDADOR' LIMIT 1),
    '2024-09-24 08:30:00'
);
```

---

## 5. Notas y recomendaciones

---

## 5. Glosario de términos

| Término | Definición |
|---------|------------|
| CCT | Clave de Centro de Trabajo |
| CURP | Clave Única de Registro de Población |
| FRV | Formato de Recepción de Valoraciones |
| EIA | Ejercicios Integradores del Aprendizaje |
| ENS | Enseñanza (Español y Matemáticas) - Campo formativo |
| HYC | Historia y Civismo - Campo formativo |
| LEN | Lenguaje y Comunicación - Campo formativo |
| SPC | Saberes y Pensamiento Científico - Campo formativo |
| F5 | Formato 5 - Reporte individual por grupo |
| PK | Primary Key (Clave primaria) |
| FK | Foreign Key (Clave foránea) |
| UK | Unique Key (Clave única) |
| DGADAE | Dirección General de Acreditación, Incorporación y Revalidación |

---

## 6. Reglas de negocio relevantes

### Integridad de datos

- No puede haber dos escuelas con el mismo CCT + turno.
- El CURP de cada estudiante debe ser único.
- Un usuario puede estar activo en múltiples escuelas según su asignación en USUARIO_CCT.
- Los valores de valoración deben estar en el rango 0-3.
- Los periodos deben estar correctamente definidos y no solaparse.

### Control de acceso

- Los roles de usuario determinan el acceso a módulos y datos.
- Un usuario con rol DIRECTOR solo puede acceder a datos de su(s) escuela(s) asignada(s).
- Los operadores SEP pueden acceder a múltiples escuelas según asignación.
- Los administradores tienen acceso completo al sistema.
- El campo `rol` en USUARIOS es FK a CAT_ROLES_USUARIO.id (INT).
- El campo `password_hash` es obligatorio y debe usar bcrypt (salt rounds ≥12) o argon2id.
- El campo `password_debe_cambiar` se activa al crear cuenta o resetear contraseña.
- Al cambiar contraseña, actualizar `ultimo_cambio_password` con NOW().
- El campo `bloqueado_hasta` se establece automáticamente tras 5 intentos fallidos de login.
- Un usuario bloqueado no puede hacer login hasta que `bloqueado_hasta < NOW()` o sea NULL.
- Los usuarios inactivos (`activo = FALSE`) no pueden hacer login bajo ninguna circunstancia.

### Catálogos

- Solo puede haber un ciclo escolar activo a la vez (campo `activo` en CAT_CICLOS_ESCOLARES).
- Los códigos en catálogos deben ser únicos (CAT_TURNOS.codigo, CAT_NIVELES_EDUCATIVOS.codigo, etc.).
- Las entidades federativas deben corresponder a los 32 estados de México según INEGI.
- Los grados deben estar asociados al nivel educativo correspondiente.

### Relaciones obligatorias

- Toda escuela debe tener asignado: turno, entidad federativa, nivel educativo y ciclo escolar.
- Todo grupo debe pertenecer a una escuela y tener un grado asignado.
- Todo usuario debe tener un rol asignado.
- El campo `escuela_id` en GRUPOS es FK obligatorio a ESCUELAS.id.
- El campo `grado_id` en GRUPOS es FK obligatorio a CAT_GRADOS.id.
- No puede haber dos grupos con el mismo nombre en la misma escuela (UNIQUE en escuela_id + nombre).
- El campo `total_alumnos` debe actualizarse automáticamente al agregar/eliminar estudiantes.
- Los grupos inactivos (`activo = FALSE`) no permiten asignación de nuevos estudiantes.

### Seguridad de Autenticación (INTENTOS_LOGIN)

- Registrar **todos los intentos de login** (exitosos y fallidos) para auditoría.
- Después de **5 intentos fallidos consecutivos** en 15 minutos, bloquear la cuenta por 30 minutos (RF-09.7).
- Después de **10 intentos fallidos** en 1 hora desde diferentes IPs, bloquear cuenta y alertar administrador (posible ataque distribuido).
- El campo `usuario_id` puede ser NULL si el email no existe en el sistema (registrar intentos con usuarios inválidos).
- El campo `email` siempre debe registrarse para trazabilidad, incluso si el usuario no existe.
- Los intentos exitosos (`exito = TRUE`) deben registrar siempre usuario_id válido.
- El campo `motivo_fallo` debe ser uno de: 'USUARIO_INVALIDO', 'PASSWORD_INCORRECTO', 'CUENTA_BLOQUEADA', 'CUENTA_INACTIVA', 'CUENTA_ELIMINADA', 'PASSWORD_EXPIRADO'.
- El bloqueo automático debe registrarse en `bloqueado_hasta` con timestamp 30 minutos futuro.
- Un usuario bloqueado no puede intentar login hasta que `bloqueado_hasta < NOW()`.
- Los administradores pueden desbloquear manualmente una cuenta antes del tiempo establecido.
- Se debe enviar notificación email al usuario cuando su cuenta es bloqueada por intentos fallidos.
- Los intentos desde IP sospechosas (múltiples cuentas fallidas) deben bloquearse temporalmente a nivel de firewall.
- El campo `user_agent` debe registrarse para detectar patrones de bots/scripts.
- El campo `metadata` puede incluir: geolocalización aproximada, tipo de dispositivo, SO, etc. (JSONB).
- Los intentos de login se conservan por **180 días** para análisis de seguridad.
- Después de 180 días, archivar en tabla histórica o eliminar (cumplimiento LGPDP).
- Se debe implementar rate limiting a nivel de IP: máximo 20 intentos por IP en 5 minutos.
- Los intentos exitosos resetean el contador de fallos para ese usuario.
- Implementar CAPTCHA después de 3 intentos fallidos consecutivos (frontend).
- Los usuarios bloqueados deben recibir enlace de desbloqueo/recuperación en email.

### Notificaciones Email (NOTIFICACIONES_EMAIL)

- Todas las notificaciones deben tener destinatario y asunto válidos (no vacíos).
- El campo `destinatario` debe ser un email válido con formato RFC 5322.
- Las notificaciones con prioridad 'ALTA' deben procesarse primero (orden de cola).
- El máximo de reintentos es **3 intentos** con backoff exponencial (1min, 5min, 30min).
- Después de agotar reintentos, marcar como estado 'ERROR' y no procesar más.
- El campo `cuerpo` debe contener HTML válido para emails responsivos.
- Las notificaciones tipo 'RESULTADO_LISTO' se generan cuando `disponible_hasta` de REPORTES_GENERADOS es válido.
- Las notificaciones tipo 'TICKET_*' se generan en cada cambio de estado del ticket.
- Las notificaciones tipo 'RECUPERACION_PASSWORD' expiran en 6 horas (validar antes de enviar).
- Las notificaciones tipo 'CREDENCIALES_EIA2' se envían solo en la primera carga válida.
- Las notificaciones tipo 'EVALUACION_VALIDADA' se envían al director cuando todas las evaluaciones de su escuela están validadas.
- El campo `referencia_id` es obligatorio y debe existir en la tabla correspondiente según `referencia_tipo`.
- Las notificaciones en estado 'PENDIENTE' deben procesarse cada 1 minuto (worker job).
- Las notificaciones en estado 'REINTENTANDO' deben procesarse según `proximo_intento`.
- El campo `adjuntos` puede contener hasta 3 archivos con máximo 5MB cada uno (estructura JSONB).
- Las notificaciones enviadas exitosamente se conservan por 90 días para auditoría.
- Después de 90 días, archivar notificaciones antiguas en tabla histórica o eliminar.
- Se debe implementar rate limiting: máximo 100 emails por minuto para evitar bloqueos SMTP.
- Todas las notificaciones deben incluir footer con links de preferencias y unsuscribe.
- Las plantillas de email deben ser parametrizables y versionadas.

### Gestión de Contraseñas (HISTORICO_PASSWORDS)

- Todo cambio de contraseña debe registrarse en el histórico (auditoría completa).
- Solo puede haber **una contraseña activa** por usuario (`activa = TRUE`).
- Las contraseñas temporales (`es_temporal = TRUE`) deben tener fecha de expiración obligatoria.
- Las contraseñas temporales expiran en **72 horas** desde su generación.
- Al primer login con contraseña temporal, el sistema debe forzar cambio inmediato.
- Se debe mantener **histórico de las últimas 5 contraseñas** para prevenir reutilización.
- El sistema debe validar que la nueva contraseña no coincida con ninguna de las últimas 5.
- Los hashes deben usar **bcrypt con salt rounds ≥12** o **argon2id**.
- Al cambiar contraseña, marcar la anterior como `activa = FALSE` y registrar `cambiada_en`.
- El campo `cambiada_por` debe ser: 'SISTEMA' (generación automática), 'USUARIO' (cambio voluntario), 'ADMIN' (reset por administrador), 'RECUPERACION' (recuperación por email).
- Las contraseñas temporales no utilizadas que expiran deben desactivarse automáticamente.
- Se debe registrar la IP de origen en cada cambio de contraseña para auditoría de seguridad.
- Los usuarios con contraseñas temporales expiradas deben ser bloqueados hasta reset.
- El histórico de contraseñas se conserva indefinidamente para cumplimiento normativo (NOM-035-STPS, LGPDP).

### Tickets de Soporte y Comentarios (COMENTARIOS_TICKET)

- Todo comentario debe estar asociado a un ticket existente (ticket_id obligatorio).
- Todo comentario debe tener un autor identificado (usuario_id obligatorio).
- El campo `comentario` no puede estar vacío (mínimo 10 caracteres).
- Los comentarios marcados como `es_interno = TRUE` solo son visibles para usuarios con roles 'OPERADOR', 'VALIDADOR' o 'ADMINISTRADOR'.
- Los directores solo pueden ver comentarios con `es_interno = FALSE`.
- El campo `adjuntos` almacena un array JSON con estructura: `[{"nombre": "archivo.pdf", "path": "/ruta/", "size": 12345, "tipo": "application/pdf"}]`.
- Los adjuntos tienen límite de 5 archivos por comentario y 10MB por archivo.
- Al crear un comentario, los flags `leido_por_director` y `leido_por_operador` se inicializan en FALSE.
- Se debe marcar automáticamente como leído por el rol del autor (si es director → leido_por_director=TRUE, si es operador → leido_por_operador=TRUE).
- No se permite editar comentarios después de 24 horas de creación (solo marcar como leído).
- Los comentarios se deben ordenar cronológicamente ascendente para mostrar el hilo de conversación.
- Cuando se cierra un ticket, no se permiten nuevos comentarios (validar estado del ticket).

### Evaluaciones y Valoraciones (EVALUACIONES)

- Las valoraciones deben estar en el rango **0-3** (validación estricta mediante CHECK constraint).
- Cada estudiante debe tener **una evaluación por materia por periodo** (constraint UNIQUE en combinación estudiante_id, materia_id, periodo_id).
- El campo `nivel_integracion` se calcula automáticamente por el sistema por cada combinación estudiante-asignatura, con base en la valoración y competencias.
- Los niveles de integración son: "sin evidencia de aprendizaje", "requiere apoyo para el aprendizaje", "en proceso de desarrollo" y "aprendizaje desarrollado".
- Cada reactivo tiene una valoración de 0 a 3 y un peso por consigna; la suma ponderada de consignas por campo formativo (suma de consignas × PESO del campo) determina el `nivel_integracion` conforme a las reglas vigentes.
- El campo `competencia_alcanzada` se determina comparando la valoración contra los criterios de logro definidos en COMPETENCIAS; si no existe un "nivel esperado", se usa el criterio de logro vigente para la competencia evaluada.
- Las evaluaciones importadas desde ARCHIVOS_FRV deben mantener referencia al archivo origen (campo `archivo_frv_id`).
- Solo evaluaciones con `validado = TRUE` se consideran para generación de reportes oficiales.
- La validación debe ser realizada por usuarios con rol 'VALIDADOR' o 'OPERADOR'.
- El campo `fecha_evaluacion` es la fecha real de aplicación, mientras `fecha_captura` es cuando se registró en el sistema.
- Las observaciones del docente son opcionales pero recomendadas para estudiantes con bajo desempeño.
- Los datos de evaluación son sensibles y deben cumplir con LGPDP (acceso restringido por escuela/grupo).

### Plataforma EIA 2ª Aplicación (CREDENCIALES_EIA2)

- Las credenciales se generan **únicamente en la primera carga válida** de cada CCT.
- El campo `cct` **NO** es UNIQUE - un CCT puede tener múltiples registros de credenciales.
- El usuario para login es el correo electrónico validado.
- La contraseña es aleatoria o se apega al esquema vigente de seguridad, almacenada como hash seguro (bcrypt con salt rounds ≥12 o argon2id).
- Las credenciales **NO se regeneran** en cargas posteriores, incluso si el correo cambia.
- Si se requiere cambio de contraseña, debe implementarse un flujo de recuperación separado.
- El campo `primera_carga_valida_fecha` es inmutable y sirve como auditoría.
- Las credenciales inactivas (`activo = FALSE`) no permiten login pero se preservan para auditoría.
- Se debe actualizar `ultimo_acceso` en cada login exitoso para análisis de uso.

### Solicitudes EIA 2ª Aplicación (SOLICITUDES_EIA2)

- Cada carga de archivo se registra como **solicitud independiente** con número `consecutivo` auto-incremental único.
- El sistema **NO determina** si la carga corresponde a primera o segunda aplicación.
- El campo `consecutivo` es UNIQUE y se genera automáticamente mediante secuencia PostgreSQL.
- Un mismo CCT puede tener múltiples solicitudes (múltiples cargas en el tiempo).
- El `estado_validacion` solo puede ser 'VALIDO' o 'INVALIDO' (ENUM estricto).
- Si `estado_validacion = 'INVALIDO'`, el campo `errores_validacion` (JSONB) debe contener el detalle de errores.
- Si `estado_validacion = 'VALIDO'`, se debe crear/actualizar registro en CREDENCIALES_EIA2 si es la primera carga válida.
- El campo `procesado_externamente` indica si el sistema externo ya procesó la solicitud.
- El campo `resultado_path` contiene la liga de descarga generada por el sistema externo.
- El campo `resultado_disponible_desde` se calcula como `fecha_carga + 4 días` según requerimiento.
- Las solicitudes se conservan indefinidamente para auditoría y trazabilidad completa.
- La relación `credencial_id` permite consultar todas las solicitudes asociadas al correo/usuario validado.

### Reportes Generados (REPORTES_GENERADOS)

- Se generan **5 tipos de reportes** por escuela según RF-05: ENS, HYC, LEN, SPC (reportes por campo formativo) y F5 (reporte por grupo).
- **Volumenétrica esperada (regla actual)**: por cada grupo se genera **1 reporte de resultados (F5)** y, **si aplica**, **1 reporte comparativo adicional**. Los reportes por campo formativo (ENS, HYC, LEN, SPC) se generan a nivel escuela.
- La nomenclatura de archivos debe seguir estándar: `[CCT].[PERIODO].Reporte_[TIPO]_[CAMPO][FORMATO].[GRADO]°.[GRUPO].pdf`
- El campo `checksum_sha256` es obligatorio para verificar integridad del archivo descargado.
- Los reportes deben estar **disponibles por 2 ciclos escolares** (campo `disponible_hasta`).
- El campo `total_descargas` se incrementa automáticamente en cada descarga exitosa.
- La **primera descarga** registra `descargado_en` y `descargado_por` (inmutable para auditoría).
- Los reportes se pueden comprimir en formato 7z/ZIP (campo `comprimido_en` apunta al archivo comprimido).
- El tiempo de generación debe ser ≤1.5 minutos por escuela según RNF-01.1.
- Se debe generar índice por: escuela, ciclo, periodo, tipo de reporte para consultas eficientes.
- Los archivos PDF deben almacenarse en filesystem con estructura: `/data/sicrer/pdfs/{ciclo_escolar}/{periodo}/{cct}/`
- El campo `generado_por` identifica el sistema/proceso que generó el reporte (ej: 'SiCRER-Legacy', 'FastAPI-Worker', etc.).

---

## 7. Índices y optimización

### Índices únicos

- `UNIQUE INDEX idx_escuelas_cct ON ESCUELAS(cct, id_turno)`
- `UNIQUE INDEX idx_estudiantes_curp ON ESTUDIANTES(curp)`
- `UNIQUE INDEX idx_usuarios_email ON USUARIOS(email)`
- `UNIQUE INDEX idx_cat_turnos_codigo ON CAT_TURNOS(codigo)`
- `UNIQUE INDEX idx_cat_niveles_codigo ON CAT_NIVELES_EDUCATIVOS(codigo)`
- `UNIQUE INDEX idx_cat_roles_codigo ON CAT_ROLES_USUARIO(codigo)`
- `UNIQUE INDEX idx_credenciales_eia2_correo ON CREDENCIALES_EIA2(correo_validado)`
- `UNIQUE INDEX idx_solicitudes_eia2_consecutivo ON SOLICITUDES_EIA2(consecutivo)`
- `UNIQUE INDEX idx_grupos_escuela_nombre ON GRUPOS(escuela_id, nombre)`
- `UNIQUE INDEX idx_materias_codigo ON MATERIAS(codigo)`

### Índices compuestos

- `INDEX idx_grupos_escuela_grado ON GRUPOS(escuela_id, grado_id)`
- `INDEX idx_estudiantes_grupo ON ESTUDIANTES(grupo_id)`
- `INDEX idx_valoraciones_estudiante ON VALORACIONES(estudiante_id, periodo_id)`
- `INDEX idx_usuarios_rol ON USUARIOS(rol, activo)`
- `INDEX idx_usuarios_escuela ON USUARIOS(escuela_id, activo)`
- `INDEX idx_usuarios_bloqueado ON USUARIOS(bloqueado_hasta) WHERE bloqueado_hasta > NOW()`
- `UNIQUE INDEX idx_evaluaciones_estudiante_materia_periodo ON EVALUACIONES(estudiante_id, materia_id, periodo_id)`
- `INDEX idx_evaluaciones_periodo ON EVALUACIONES(periodo_id, validado)`
- `INDEX idx_evaluaciones_archivo_origen ON EVALUACIONES(archivo_frv_id)`
- `INDEX idx_evaluaciones_nivel ON EVALUACIONES(nivel_integracion, valoracion)`
- `INDEX idx_archivos_frv_escuela_ciclo ON ARCHIVOS_FRV(escuela_id, ciclo_escolar)`
- `INDEX idx_tickets_estado_prioridad ON TICKETS_SOPORTE(estado, prioridad)`
- `INDEX idx_log_usuario_fecha ON LOG_ACTIVIDADES(id_usuario, fecha_hora)`
- `INDEX idx_credenciales_eia2_activo ON CREDENCIALES_EIA2(activo, ultimo_acceso)`
- `INDEX idx_solicitudes_eia2_cct_fecha ON SOLICITUDES_EIA2(cct, fecha_carga DESC)`
- `INDEX idx_solicitudes_eia2_estado ON SOLICITUDES_EIA2(estado_validacion, procesado_externamente)`
- `INDEX idx_solicitudes_eia2_credencial ON SOLICITUDES_EIA2(credencial_id, fecha_carga DESC)`
- `INDEX idx_reportes_escuela_ciclo ON REPORTES_GENERADOS(escuela_id, ciclo_escolar, periodo_id)`
- `INDEX idx_reportes_tipo_generado ON REPORTES_GENERADOS(tipo_reporte, generado_en DESC)`
- `INDEX idx_reportes_disponibilidad ON REPORTES_GENERADOS(disponible_hasta) WHERE disponible_hasta > NOW()`
- `INDEX idx_reportes_descargados ON REPORTES_GENERADOS(descargado_por, descargado_en DESC)`
- `INDEX idx_comentarios_ticket ON COMENTARIOS_TICKET(ticket_id, created_at ASC)`
- `INDEX idx_comentarios_usuario ON COMENTARIOS_TICKET(usuario_id, created_at DESC)`
- `INDEX idx_comentarios_no_leidos_director ON COMENTARIOS_TICKET(ticket_id, leido_por_director) WHERE leido_por_director = FALSE AND es_interno = FALSE`
- `INDEX idx_comentarios_no_leidos_operador ON COMENTARIOS_TICKET(ticket_id, leido_por_operador) WHERE leido_por_operador = FALSE`
- `INDEX idx_historico_passwords_usuario ON HISTORICO_PASSWORDS(usuario_id, created_at DESC)`
- `UNIQUE INDEX idx_historico_passwords_activa ON HISTORICO_PASSWORDS(usuario_id, activa) WHERE activa = TRUE`
- `INDEX idx_historico_passwords_temporales ON HISTORICO_PASSWORDS(es_temporal, expira_en) WHERE es_temporal = TRUE AND activa = TRUE`
- `INDEX idx_historico_passwords_expiradas ON HISTORICO_PASSWORDS(expira_en) WHERE expira_en < NOW() AND activa = TRUE`
- `INDEX idx_notificaciones_estado ON NOTIFICACIONES_EMAIL(estado, prioridad, created_at ASC) WHERE estado IN ('PENDIENTE', 'REINTENTANDO')`
- `INDEX idx_notificaciones_destinatario ON NOTIFICACIONES_EMAIL(destinatario, created_at DESC)`
- `INDEX idx_notificaciones_tipo ON NOTIFICACIONES_EMAIL(tipo, estado, created_at DESC)`
- `INDEX idx_notificaciones_referencia ON NOTIFICACIONES_EMAIL(referencia_tipo, referencia_id)`
- `INDEX idx_notificaciones_proximo_intento ON NOTIFICACIONES_EMAIL(proximo_intento) WHERE estado = 'REINTENTANDO' AND proximo_intento <= NOW()`
- `INDEX idx_notificaciones_usuario ON NOTIFICACIONES_EMAIL(usuario_id, created_at DESC)`
- `INDEX idx_intentos_usuario_fecha ON INTENTOS_LOGIN(usuario_id, created_at DESC) WHERE usuario_id IS NOT NULL`
- `INDEX idx_intentos_email_fecha ON INTENTOS_LOGIN(email, created_at DESC)`
- `INDEX idx_intentos_ip_fecha ON INTENTOS_LOGIN(ip_address, created_at DESC)`
- `INDEX idx_intentos_fallidos ON INTENTOS_LOGIN(exito, created_at DESC) WHERE exito = FALSE`
- `INDEX idx_intentos_bloqueados ON INTENTOS_LOGIN(usuario_id, bloqueado_hasta) WHERE bloqueado_hasta > NOW()`
- `INDEX idx_intentos_motivo ON INTENTOS_LOGIN(motivo_fallo, created_at DESC) WHERE motivo_fallo IS NOT NULL`

### Índices para catálogos

- `INDEX idx_cat_grados_nivel ON CAT_GRADOS(nivel_educativo)`
- `INDEX idx_escuelas_nivel ON ESCUELAS(id_nivel)`
- `INDEX idx_escuelas_entidad ON ESCUELAS(id_entidad)`

---

## 8. Triggers y procedimientos almacenados

### Enums (Enumeraciones)

Se utilizan tipos ENUM en PostgreSQL para garantizar integridad y claridad en los siguientes campos:

- **nivel**: ('PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'TELESECUNDARIA')
- **estado_archivo**: ('CARGADO', 'VALIDADO', 'PROCESADO', 'ERROR')
- **estado_ticket**: ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO')
- **estado_validacion_eia2**: ('VALIDO', 'INVALIDO')
- **tipo_reporte**: ('ENS', 'HYC', 'LEN', 'SPC', 'F5')
- **tipo_adjunto_comentario**: ('PDF', 'IMAGEN', 'EXCEL', 'WORD', 'OTRO')
- **origen_cambio_password**: ('SISTEMA', 'USUARIO', 'ADMIN', 'RECUPERACION')
- **tipo_notificacion**: ('RESULTADO_LISTO', 'TICKET_CREADO', 'TICKET_ACTUALIZADO', 'TICKET_RESUELTO', 'RECUPERACION_PASSWORD', 'CREDENCIALES_EIA2', 'EVALUACION_VALIDADA')
- **estado_notificacion**: ('PENDIENTE', 'ENVIADO', 'ERROR', 'REINTENTANDO')
- **prioridad_notificacion**: ('ALTA', 'MEDIA', 'BAJA')
- **referencia_tipo_notificacion**: ('TICKET', 'REPORTE', 'USUARIO', 'EVALUACION', 'CREDENCIAL')
- **motivo_fallo_login**: ('USUARIO_INVALIDO', 'PASSWORD_INCORRECTO', 'CUENTA_BLOQUEADA', 'CUENTA_INACTIVA', 'CUENTA_ELIMINADA', 'PASSWORD_EXPIRADO')

### Triggers sugeridos

#### Trigger: auto_generar_credenciales_eia2

**Propósito:** Generar automáticamente credenciales en CREDENCIALES_EIA2 cuando se registra la primera solicitud válida de un CCT.

```sql
CREATE OR REPLACE FUNCTION fn_auto_generar_credenciales_eia2()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si la solicitud es válida y no existen credenciales para ese CCT
    IF NEW.estado_validacion = 'VALIDO' AND 
       NOT EXISTS (SELECT 1 FROM CREDENCIALES_EIA2 WHERE cct = NEW.cct) THEN
        
        INSERT INTO CREDENCIALES_EIA2 (
            id, cct, correo_validado, password_hash, 
            primera_carga_valida_fecha, generado_en, activo
        ) VALUES (
            gen_random_uuid(),
            NEW.cct,
            -- Extraer correo del JSONB del archivo o de metadatos
            NEW.errores_validacion->>'correo_validado',
            -- Hash se debe generar en la aplicación antes del trigger
            'PENDING_HASH',
            NEW.fecha_carga,
            NOW(),
            TRUE
        );
        
        -- Actualizar relación
        NEW.credencial_id := (SELECT id FROM CREDENCIALES_EIA2 WHERE cct = NEW.cct);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_generar_credenciales_eia2
    BEFORE INSERT ON SOLICITUDES_EIA2
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_generar_credenciales_eia2();
```

#### Trigger: calcular_fecha_disponibilidad

**Propósito:** Calcular automáticamente la fecha de disponibilidad de resultados (+4 días).

```sql
CREATE OR REPLACE FUNCTION fn_calcular_fecha_disponibilidad()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_validacion = 'VALIDO' AND NEW.resultado_disponible_desde IS NULL THEN
        NEW.resultado_disponible_desde := NEW.fecha_carga + INTERVAL '4 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_fecha_disponibilidad
    BEFORE INSERT OR UPDATE ON SOLICITUDES_EIA2
    FOR EACH ROW
    EXECUTE FUNCTION fn_calcular_fecha_disponibilidad();
```

#### Secuencia para consecutivo auto-incremental

```sql
CREATE SEQUENCE seq_solicitudes_eia2_consecutivo
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    CACHE 50;

ALTER TABLE SOLICITUDES_EIA2 
    ALTER COLUMN consecutivo 
    SET DEFAULT nextval('seq_solicitudes_eia2_consecutivo');
```

#### Trigger: registrar_descarga_reporte

**Propósito:** Registrar automáticamente la primera descarga de un reporte e incrementar contador.

```sql
CREATE OR REPLACE FUNCTION fn_registrar_descarga_reporte()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualiza si se está modificando el campo descargado_por
    IF NEW.descargado_por IS NOT NULL AND 
       (OLD.descargado_por IS NULL OR OLD.descargado_por IS DISTINCT FROM NEW.descargado_por) THEN
        
        -- Si es la primera descarga, registrar timestamp
        IF OLD.descargado_en IS NULL THEN
            NEW.descargado_en := NOW();
        END IF;
        
        -- Incrementar contador
        NEW.total_descargas := COALESCE(OLD.total_descargas, 0) + 1;
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrar_descarga_reporte
    BEFORE UPDATE ON REPORTES_GENERADOS
    FOR EACH ROW
    WHEN (NEW.descargado_por IS NOT NULL)
    EXECUTE FUNCTION fn_registrar_descarga_reporte();
```

#### Trigger: calcular_disponibilidad_reporte

**Propósito:** Calcular automáticamente fecha de disponibilidad (2 ciclos escolares).

```sql
CREATE OR REPLACE FUNCTION fn_calcular_disponibilidad_reporte()
RETURNS TRIGGER AS $$
DECLARE
    fecha_fin_ciclo DATE;
BEGIN
    IF NEW.disponible_hasta IS NULL THEN
        -- Obtener fecha de fin del ciclo escolar actual
        SELECT fecha_fin INTO fecha_fin_ciclo
        FROM CAT_CICLOS_ESCOLARES
        WHERE nombre = NEW.ciclo_escolar;
        
        -- Agregar 2 años (2 ciclos escolares)
        IF fecha_fin_ciclo IS NOT NULL THEN
            NEW.disponible_hasta := fecha_fin_ciclo + INTERVAL '2 years';
        ELSE
            -- Fallback: 2 años desde generación
            NEW.disponible_hasta := NEW.generado_en + INTERVAL '2 years';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_disponibilidad_reporte
    BEFORE INSERT ON REPORTES_GENERADOS
    FOR EACH ROW
    EXECUTE FUNCTION fn_calcular_disponibilidad_reporte();
```

#### Vista: reportes_disponibles

**Propósito:** Vista para consultar reportes vigentes con información de escuela.

```sql
CREATE OR REPLACE VIEW v_reportes_disponibles AS
SELECT 
    rg.id,
    rg.filename,
    e.cct,
    e.nombre AS escuela_nombre,
    rg.ciclo_escolar,
    pe.nombre AS periodo_nombre,
    rg.tipo_reporte,
    rg.grado,
    rg.grupo,
    rg.file_size,
    rg.generado_en,
    rg.total_descargas,
    rg.disponible_hasta,
    CASE 
        WHEN rg.disponible_hasta > NOW() THEN 'DISPONIBLE'
        ELSE 'EXPIRADO'
    END AS estado_disponibilidad,
    (rg.disponible_hasta - NOW()) AS tiempo_restante
FROM REPORTES_GENERADOS rg
INNER JOIN ESCUELAS e ON rg.escuela_id = e.id
LEFT JOIN PERIODOS_EVALUACION pe ON rg.periodo_id = pe.id_periodo
WHERE rg.disponible_hasta > NOW()
ORDER BY rg.generado_en DESC;
```

#### Procedimiento: limpiar_reportes_expirados

**Propósito:** Procedimiento para archivar reportes expirados (ejecutar mensualmente).

```sql
CREATE OR REPLACE FUNCTION sp_limpiar_reportes_expirados(
    p_solo_marcar BOOLEAN DEFAULT TRUE,
    p_mover_a_archivo BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    reportes_procesados INT,
    espacio_liberado BIGINT,
    mensaje TEXT
) AS $$
DECLARE
    v_reportes_count INT;
    v_espacio_total BIGINT;
BEGIN
    -- Contar reportes expirados
    SELECT COUNT(*), COALESCE(SUM(file_size), 0)
    INTO v_reportes_count, v_espacio_total
    FROM REPORTES_GENERADOS
    WHERE disponible_hasta < NOW();
    
    IF p_solo_marcar THEN
        -- Solo generar reporte sin eliminar
        RETURN QUERY SELECT 
            v_reportes_count,
            v_espacio_total,
            FORMAT('Se encontraron %s reportes expirados (%s MB)', 
                   v_reportes_count, 
                   ROUND(v_espacio_total::NUMERIC / 1048576, 2));
    ELSE
        -- Aquí iría lógica de movimiento a archivo/eliminación
        -- Por seguridad, solo marcamos en esta versión
        RETURN QUERY SELECT 
            v_reportes_count,
            v_espacio_total,
            'Funcionalidad de eliminación no implementada por seguridad';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_limpiar_reportes_expirados(true, false);
```

#### Trigger: validar_rango_valoracion

**Propósito:** Validar que la valoración esté en el rango 0-3 y calcular automáticamente el nivel de integración.

```sql
CREATE OR REPLACE FUNCTION fn_validar_valoracion_evaluacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Validación de rango (redundante con CHECK constraint, pero útil para logging)
    IF NEW.valoracion < 0 OR NEW.valoracion > 3 THEN
        RAISE EXCEPTION 'La valoración debe estar en el rango 0-3. Valor recibido: %', NEW.valoracion;
    END IF;
    
    -- Calcular nivel_integracion automáticamente basado en valoración
    NEW.nivel_integracion := CASE NEW.valoracion
        WHEN 0 THEN 'EN DESARROLLO'
        WHEN 1 THEN 'EN DESARROLLO'
        WHEN 2 THEN 'SATISFACTORIO'
        WHEN 3 THEN CASE 
            WHEN NEW.competencia_alcanzada = TRUE THEN 'AVANZADO'
            ELSE 'SOBRESALIENTE'
        END
    END;
    
    -- Actualizar timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_valoracion_evaluacion
    BEFORE INSERT OR UPDATE ON EVALUACIONES
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_valoracion_evaluacion();
```

#### Trigger: prevenir_duplicados_evaluacion

**Propósito:** Evitar evaluaciones duplicadas para la misma combinación estudiante-materia-periodo.

```sql
CREATE OR REPLACE FUNCTION fn_prevenir_duplicados_evaluacion()
RETURNS TRIGGER AS $$
DECLARE
    v_existe INT;
BEGIN
    -- Verificar si ya existe evaluación (el UNIQUE INDEX ya lo hace, pero esto da mensaje claro)
    SELECT COUNT(*) INTO v_existe
    FROM EVALUACIONES
    WHERE estudiante_id = NEW.estudiante_id
      AND materia_id = NEW.materia_id
      AND periodo_id = NEW.periodo_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF v_existe > 0 THEN
        RAISE EXCEPTION 'Ya existe una evaluación para este estudiante en esta materia y periodo. Use UPDATE en lugar de INSERT.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevenir_duplicados_evaluacion
    BEFORE INSERT ON EVALUACIONES
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevenir_duplicados_evaluacion();
```

#### Vista: v_resumen_evaluaciones_periodo

**Propósito:** Vista para análisis de evaluaciones por periodo con estadísticas agregadas.

```sql
CREATE OR REPLACE VIEW v_resumen_evaluaciones_periodo AS
SELECT 
    pe.id_periodo,
    pe.nombre AS periodo_nombre,
    e.id AS estudiante_id,
    e.nombre AS estudiante_nombre,
    e.curp,
    g.id AS grupo_id,
    g.nombre AS grupo_nombre,
    esc.cct,
    esc.nombre AS escuela_nombre,
    COUNT(ev.id) AS total_evaluaciones,
    COUNT(ev.id) FILTER (WHERE ev.validado = TRUE) AS evaluaciones_validadas,
    COUNT(ev.id) FILTER (WHERE ev.validado = FALSE) AS evaluaciones_pendientes,
    ROUND(AVG(ev.valoracion), 2) AS promedio_valoracion,
    COUNT(ev.id) FILTER (WHERE ev.valoracion = 3) AS valoraciones_excelentes,
    COUNT(ev.id) FILTER (WHERE ev.valoracion = 2) AS valoraciones_satisfactorias,
    COUNT(ev.id) FILTER (WHERE ev.valoracion <= 1) AS valoraciones_desarrollo,
    COUNT(ev.id) FILTER (WHERE ev.competencia_alcanzada = TRUE) AS competencias_alcanzadas,
    COUNT(ev.id) FILTER (WHERE ev.competencia_alcanzada = FALSE) AS competencias_no_alcanzadas
FROM ESTUDIANTES e
INNER JOIN GRUPOS g ON e.grupo_id = g.id
INNER JOIN ESCUELAS esc ON g.escuela_id = esc.id
CROSS JOIN PERIODOS_EVALUACION pe
LEFT JOIN EVALUACIONES ev ON e.id = ev.estudiante_id AND pe.id_periodo = ev.periodo_id
GROUP BY pe.id_periodo, pe.nombre, e.id, e.nombre, e.curp, g.id, g.nombre, esc.cct, esc.nombre
ORDER BY esc.cct, g.nombre, e.nombre;
```

#### Procedimiento: generar_reporte_evaluaciones_escuela

**Propósito:** Procedimiento para generar reporte agregado de evaluaciones por escuela.

```sql
CREATE OR REPLACE FUNCTION sp_generar_reporte_evaluaciones_escuela(
    p_escuela_id UUID,
    p_periodo_id INT
)
RETURNS TABLE(
    nivel_integracion VARCHAR,
    total_estudiantes BIGINT,
    porcentaje NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ev.nivel_integracion,
        COUNT(DISTINCT ev.estudiante_id) AS total_estudiantes,
        ROUND((COUNT(DISTINCT ev.estudiante_id)::NUMERIC / 
               (SELECT COUNT(DISTINCT estudiante_id) 
                FROM EVALUACIONES ev2 
                INNER JOIN ESTUDIANTES e2 ON ev2.estudiante_id = e2.id
                INNER JOIN GRUPOS g2 ON e2.grupo_id = g2.id
                WHERE g2.escuela_id = p_escuela_id 
                  AND ev2.periodo_id = p_periodo_id)::NUMERIC) * 100, 2) AS porcentaje
    FROM EVALUACIONES ev
    INNER JOIN ESTUDIANTES e ON ev.estudiante_id = e.id
    INNER JOIN GRUPOS g ON e.grupo_id = g.id
    WHERE g.escuela_id = p_escuela_id
      AND ev.periodo_id = p_periodo_id
      AND ev.validado = TRUE
    GROUP BY ev.nivel_integracion
    ORDER BY 
        CASE ev.nivel_integracion
            WHEN 'AVANZADO' THEN 1
            WHEN 'SOBRESALIENTE' THEN 2
            WHEN 'SATISFACTORIO' THEN 3
            WHEN 'EN DESARROLLO' THEN 4
        END;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_generar_reporte_evaluaciones_escuela(
--     (SELECT id FROM ESCUELAS WHERE cct = '14DPR0245L'), 
--     1
-- );
```

#### Trigger: marcar_comentario_leido_por_autor

**Propósito:** Marcar automáticamente un comentario como leído por el rol del autor al crearlo.

```sql
CREATE OR REPLACE FUNCTION fn_marcar_comentario_leido_autor()
RETURNS TRIGGER AS $$
DECLARE
    v_rol VARCHAR(50);
BEGIN
    -- Obtener el rol del usuario que crea el comentario
    SELECT r.codigo INTO v_rol
    FROM USUARIOS u
    INNER JOIN CAT_ROLES_USUARIO r ON u.rol = r.codigo
    WHERE u.id = NEW.usuario_id;
    
    -- Marcar como leído según el rol
    IF v_rol IN ('DIRECTOR', 'SUBDIRECTOR') THEN
        NEW.leido_por_director := TRUE;
        NEW.leido_por_operador := FALSE;
    ELSIF v_rol IN ('OPERADOR', 'VALIDADOR', 'ADMINISTRADOR') THEN
        NEW.leido_por_director := FALSE;
        NEW.leido_por_operador := TRUE;
    END IF;
    
    -- Establecer timestamps
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marcar_comentario_leido_autor
    BEFORE INSERT ON COMENTARIOS_TICKET
    FOR EACH ROW
    EXECUTE FUNCTION fn_marcar_comentario_leido_autor();
```

#### Trigger: validar_ticket_abierto

**Propósito:** Evitar agregar comentarios a tickets cerrados.

```sql
CREATE OR REPLACE FUNCTION fn_validar_ticket_abierto()
RETURNS TRIGGER AS $$
DECLARE
    v_estado VARCHAR(20);
BEGIN
    -- Verificar el estado del ticket
    SELECT estado INTO v_estado
    FROM TICKETS_SOPORTE
    WHERE id = NEW.ticket_id;
    
    IF v_estado = 'CERRADO' THEN
        RAISE EXCEPTION 'No se pueden agregar comentarios a un ticket cerrado (ID: %). Debe reabrir el ticket primero.', NEW.ticket_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_ticket_abierto
    BEFORE INSERT ON COMENTARIOS_TICKET
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_ticket_abierto();
```

#### Trigger: validar_longitud_comentario

**Propósito:** Validar que el comentario tenga al menos 10 caracteres y máximo 5000.

```sql
CREATE OR REPLACE FUNCTION fn_validar_longitud_comentario()
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(TRIM(NEW.comentario)) < 10 THEN
        RAISE EXCEPTION 'El comentario debe tener al menos 10 caracteres. Longitud actual: %', LENGTH(TRIM(NEW.comentario));
    END IF;
    
    IF LENGTH(NEW.comentario) > 5000 THEN
        RAISE EXCEPTION 'El comentario no puede exceder 5000 caracteres. Longitud actual: %', LENGTH(NEW.comentario);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_longitud_comentario
    BEFORE INSERT OR UPDATE ON COMENTARIOS_TICKET
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_longitud_comentario();
```

#### Vista: v_hilo_comentarios_ticket

**Propósito:** Vista para mostrar el hilo completo de conversación de un ticket con información del autor.

```sql
CREATE OR REPLACE VIEW v_hilo_comentarios_ticket AS
SELECT 
    ct.id AS comentario_id,
    ct.ticket_id,
    ts.numero_ticket,
    ts.asunto AS ticket_asunto,
    ts.estado AS ticket_estado,
    ct.usuario_id,
    u.nombre AS autor_nombre,
    u.email AS autor_email,
    r.nombre AS autor_rol,
    ct.comentario,
    ct.es_interno,
    ct.adjuntos,
    COALESCE(JSONB_ARRAY_LENGTH(ct.adjuntos), 0) AS total_adjuntos,
    ct.leido_por_director,
    ct.leido_por_operador,
    ct.created_at,
    ROW_NUMBER() OVER (PARTITION BY ct.ticket_id ORDER BY ct.created_at ASC) AS numero_comentario
FROM COMENTARIOS_TICKET ct
INNER JOIN TICKETS_SOPORTE ts ON ct.ticket_id = ts.id
INNER JOIN USUARIOS u ON ct.usuario_id = u.id
INNER JOIN CAT_ROLES_USUARIO r ON u.rol = r.codigo
ORDER BY ct.ticket_id, ct.created_at ASC;
```

#### Procedimiento: marcar_comentarios_como_leidos

**Propósito:** Marcar comentarios como leídos para un usuario específico según su rol.

```sql
CREATE OR REPLACE FUNCTION sp_marcar_comentarios_leidos(
    p_ticket_id UUID,
    p_usuario_id UUID
)
RETURNS TABLE(
    comentarios_marcados INT,
    mensaje TEXT
) AS $$
DECLARE
    v_rol VARCHAR(50);
    v_count INT;
BEGIN
    -- Obtener rol del usuario
    SELECT rol INTO v_rol
    FROM USUARIOS
    WHERE id = p_usuario_id;
    
    -- Marcar como leído según rol
    IF v_rol IN ('DIRECTOR', 'SUBDIRECTOR') THEN
        UPDATE COMENTARIOS_TICKET
        SET leido_por_director = TRUE,
            updated_at = NOW()
        WHERE ticket_id = p_ticket_id
          AND es_interno = FALSE
          AND leido_por_director = FALSE;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSIF v_rol IN ('OPERADOR', 'VALIDADOR', 'ADMINISTRADOR') THEN
        UPDATE COMENTARIOS_TICKET
        SET leido_por_operador = TRUE,
            updated_at = NOW()
        WHERE ticket_id = p_ticket_id
          AND leido_por_operador = FALSE;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;
    
    RETURN QUERY SELECT 
        v_count,
        FORMAT('Se marcaron %s comentarios como leídos', v_count);
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_marcar_comentarios_leidos(
--     (SELECT id FROM TICKETS_SOPORTE WHERE numero_ticket = 'TKT-2024-00123'),
--     (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx')
-- );
```

#### Trigger: registrar_cambio_password

**Propósito:** Registrar automáticamente en el histórico cada cambio de contraseña y desactivar la anterior.

```sql
CREATE OR REPLACE FUNCTION fn_registrar_cambio_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Desactivar contraseña anterior (solo puede haber una activa)
    UPDATE HISTORICO_PASSWORDS
    SET activa = FALSE,
        cambiada_en = NOW()
    WHERE usuario_id = NEW.usuario_id
      AND activa = TRUE
      AND id != NEW.id;
    
    -- Establecer timestamps
    NEW.created_at := NOW();
    
    -- Si es temporal, calcular expiración (72 horas por defecto)
    IF NEW.es_temporal = TRUE AND NEW.expira_en IS NULL THEN
        IF NEW.cambiada_por = 'RECUPERACION' THEN
            -- Recuperación: expira en 6 horas
            NEW.expira_en := NEW.generada_en + INTERVAL '6 hours';
        ELSE
            -- Temporal normal: expira en 72 horas
            NEW.expira_en := NEW.generada_en + INTERVAL '72 hours';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrar_cambio_password
    BEFORE INSERT ON HISTORICO_PASSWORDS
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_cambio_password();
```

#### Trigger: validar_reutilizacion_password

**Propósito:** Prevenir la reutilización de las últimas 5 contraseñas.

```sql
CREATE OR REPLACE FUNCTION fn_validar_reutilizacion_password()
RETURNS TRIGGER AS $$
DECLARE
    v_hash_anterior VARCHAR(255);
BEGIN
    -- Verificar contra las últimas 5 contraseñas
    FOR v_hash_anterior IN (
        SELECT password_hash
        FROM HISTORICO_PASSWORDS
        WHERE usuario_id = NEW.usuario_id
        ORDER BY created_at DESC
        LIMIT 5
    ) LOOP
        IF NEW.password_hash = v_hash_anterior THEN
            RAISE EXCEPTION 'La contraseña no puede ser igual a ninguna de las últimas 5 contraseñas utilizadas.';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_reutilizacion_password
    BEFORE INSERT ON HISTORICO_PASSWORDS
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_reutilizacion_password();
```

#### Trigger: desactivar_passwords_expiradas

**Propósito:** Desactivar automáticamente contraseñas temporales expiradas (ejecutar con cron job).

```sql
CREATE OR REPLACE FUNCTION fn_desactivar_passwords_expiradas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE HISTORICO_PASSWORDS
    SET activa = FALSE,
        cambiada_en = NOW()
    WHERE es_temporal = TRUE
      AND activa = TRUE
      AND expira_en < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar periódicamente (cada hora):
-- SELECT fn_desactivar_passwords_expiradas();
```

#### Vista: v_usuarios_password_temporal

**Propósito:** Vista para identificar usuarios con contraseñas temporales activas o expiradas.

```sql
CREATE OR REPLACE VIEW v_usuarios_password_temporal AS
SELECT 
    u.id AS usuario_id,
    u.nombre,
    u.email,
    u.rol,
    hp.id AS password_id,
    hp.es_temporal,
    hp.generada_en,
    hp.expira_en,
    hp.cambiada_por AS generada_por,
    CASE 
        WHEN hp.expira_en < NOW() THEN 'EXPIRADA'
        WHEN hp.expira_en > NOW() THEN 'VIGENTE'
        ELSE 'PERMANENTE'
    END AS estado_password,
    EXTRACT(EPOCH FROM (hp.expira_en - NOW())) / 3600 AS horas_restantes,
    u.activo AS usuario_activo
FROM USUARIOS u
INNER JOIN HISTORICO_PASSWORDS hp ON u.id = hp.usuario_id
WHERE hp.activa = TRUE
  AND hp.es_temporal = TRUE
ORDER BY hp.expira_en ASC;
```

#### Vista: v_auditoria_cambios_password

**Propósito:** Vista de auditoría completa de cambios de contraseña por usuario.

```sql
CREATE OR REPLACE VIEW v_auditoria_cambios_password AS
SELECT 
    u.id AS usuario_id,
    u.nombre,
    u.email,
    u.rol,
    hp.id AS password_id,
    hp.es_temporal,
    hp.generada_en,
    hp.expira_en,
    hp.cambiada_en,
    hp.cambiada_por,
    hp.ip_origen,
    hp.activa,
    CASE 
        WHEN hp.activa = TRUE THEN 'ACTIVA'
        WHEN hp.cambiada_en IS NOT NULL THEN 'CAMBIADA'
        WHEN hp.es_temporal = TRUE AND hp.expira_en < NOW() THEN 'EXPIRADA'
        ELSE 'INACTIVA'
    END AS estado,
    EXTRACT(DAY FROM (hp.cambiada_en - hp.generada_en)) AS dias_uso
FROM USUARIOS u
INNER JOIN HISTORICO_PASSWORDS hp ON u.id = hp.usuario_id
ORDER BY u.email, hp.created_at DESC;
```

#### Procedimiento: generar_password_temporal

**Propósito:** Generar contraseña temporal para un usuario (usado en creación de cuenta o reset).

```sql
CREATE OR REPLACE FUNCTION sp_generar_password_temporal(
    p_usuario_id UUID,
    p_password_hash VARCHAR(255),
    p_origen VARCHAR(20) DEFAULT 'SISTEMA',
    p_ip_origen VARCHAR(50) DEFAULT '127.0.0.1'
)
RETURNS TABLE(
    password_id UUID,
    expira_en TIMESTAMP,
    mensaje TEXT
) AS $$
DECLARE
    v_password_id UUID;
    v_expira_en TIMESTAMP;
BEGIN
    -- Generar nueva contraseña temporal
    v_password_id := gen_random_uuid();
    v_expira_en := NOW() + INTERVAL '72 hours';
    
    INSERT INTO HISTORICO_PASSWORDS (
        id, usuario_id, password_hash, es_temporal,
        generada_en, expira_en, cambiada_por, ip_origen, activa
    ) VALUES (
        v_password_id,
        p_usuario_id,
        p_password_hash,
        TRUE,
        NOW(),
        v_expira_en,
        p_origen,
        p_ip_origen,
        TRUE
    );
    
    -- Actualizar tabla USUARIOS con el nuevo hash
    UPDATE USUARIOS
    SET password_hash = p_password_hash,
        updated_at = NOW()
    WHERE id = p_usuario_id;
    
    RETURN QUERY SELECT 
        v_password_id,
        v_expira_en,
        FORMAT('Contraseña temporal generada. Expira el %s', v_expira_en::TEXT);
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_generar_password_temporal(
--     (SELECT id FROM USUARIOS WHERE email = 'nuevo.usuario@edu.mx'),
--     '$2b$12$HashGeneradoPorBackend...',
--     'ADMIN',
--     '10.50.20.15'
-- );
```

#### Procedimiento: validar_password_no_reutilizada

**Propósito:** Validar antes de cambio que la contraseña no esté en las últimas 5.

```sql
CREATE OR REPLACE FUNCTION sp_validar_password_no_reutilizada(
    p_usuario_id UUID,
    p_nuevo_password_hash VARCHAR(255)
)
RETURNS TABLE(
    es_valida BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_hash_anterior VARCHAR(255);
BEGIN
    -- Verificar contra últimas 5 contraseñas
    FOR v_hash_anterior IN (
        SELECT password_hash
        FROM HISTORICO_PASSWORDS
        WHERE usuario_id = p_usuario_id
        ORDER BY created_at DESC
        LIMIT 5
    ) LOOP
        IF p_nuevo_password_hash = v_hash_anterior THEN
            RETURN QUERY SELECT 
                FALSE,
                'La contraseña no puede ser igual a ninguna de las últimas 5 contraseñas.'::TEXT;
            RETURN;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE,
        'Contraseña válida. No coincide con las últimas 5.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_validar_password_no_reutilizada(
--     (SELECT id FROM USUARIOS WHERE email = 'usuario@edu.mx'),
--     '$2b$12$NuevoHashAValidar...'
-- );
```

#### Trigger: inicializar_notificacion

**Propósito:** Inicializar campos por defecto al crear una notificación.

```sql
CREATE OR REPLACE FUNCTION fn_inicializar_notificacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Establecer valores por defecto
    NEW.intentos := COALESCE(NEW.intentos, 0);
    NEW.max_intentos := COALESCE(NEW.max_intentos, 3);
    NEW.prioridad := COALESCE(NEW.prioridad, 'MEDIA');
    NEW.estado := COALESCE(NEW.estado, 'PENDIENTE');
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    
    -- Si no tiene usuario_id, buscarlo por email
    IF NEW.usuario_id IS NULL THEN
        SELECT id INTO NEW.usuario_id
        FROM USUARIOS
        WHERE email = NEW.destinatario
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inicializar_notificacion
    BEFORE INSERT ON NOTIFICACIONES_EMAIL
    FOR EACH ROW
    EXECUTE FUNCTION fn_inicializar_notificacion();
```

#### Trigger: programar_reintento

**Propósito:** Programar próximo reintento con backoff exponencial al marcar como REINTENTANDO.

```sql
CREATE OR REPLACE FUNCTION fn_programar_reintento()
RETURNS TRIGGER AS $$
DECLARE
    v_delay INTERVAL;
BEGIN
    -- Solo si cambia a REINTENTANDO
    IF NEW.estado = 'REINTENTANDO' AND OLD.estado != 'REINTENTANDO' THEN
        -- Calcular delay con backoff exponencial
        v_delay := CASE NEW.intentos
            WHEN 1 THEN INTERVAL '1 minute'    -- 1er reintento: 1 min
            WHEN 2 THEN INTERVAL '5 minutes'   -- 2do reintento: 5 min
            WHEN 3 THEN INTERVAL '30 minutes'  -- 3er reintento: 30 min
            ELSE INTERVAL '1 hour'             -- Fallback
        END;
        
        NEW.proximo_intento := NOW() + v_delay;
        NEW.updated_at := NOW();
    END IF;
    
    -- Si alcanzó max_intentos, marcar como ERROR
    IF NEW.intentos >= NEW.max_intentos AND NEW.estado != 'ENVIADO' THEN
        NEW.estado := 'ERROR';
        NEW.error_mensaje := COALESCE(NEW.error_mensaje, '') || ' | Max retries exceeded.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_programar_reintento
    BEFORE UPDATE ON NOTIFICACIONES_EMAIL
    FOR EACH ROW
    EXECUTE FUNCTION fn_programar_reintento();
```

#### Vista: v_notificaciones_pendientes

**Propósito:** Vista para el worker de envío de emails con notificaciones pendientes ordenadas por prioridad.

```sql
CREATE OR REPLACE VIEW v_notificaciones_pendientes AS
SELECT 
    ne.id,
    ne.destinatario,
    ne.asunto,
    ne.cuerpo,
    ne.tipo,
    ne.prioridad,
    ne.intentos,
    ne.max_intentos,
    ne.adjuntos,
    ne.referencia_id,
    ne.referencia_tipo,
    u.nombre AS destinatario_nombre,
    CASE ne.prioridad
        WHEN 'ALTA' THEN 1
        WHEN 'MEDIA' THEN 2
        WHEN 'BAJA' THEN 3
    END AS orden_prioridad
FROM NOTIFICACIONES_EMAIL ne
LEFT JOIN USUARIOS u ON ne.usuario_id = u.id
WHERE ne.estado = 'PENDIENTE'
   OR (ne.estado = 'REINTENTANDO' AND ne.proximo_intento <= NOW())
ORDER BY orden_prioridad ASC, ne.created_at ASC
LIMIT 100; -- Procesar en lotes de 100
```

#### Vista: v_estadisticas_notificaciones

**Propósito:** Vista de estadísticas de notificaciones por tipo y estado.

```sql
CREATE OR REPLACE VIEW v_estadisticas_notificaciones AS
SELECT 
    tipo,
    estado,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE intentos > 0) AS con_reintentos,
    AVG(intentos)::NUMERIC(10,2) AS promedio_intentos,
    MAX(created_at) AS ultima_creacion,
    MAX(enviado_en) AS ultimo_envio
FROM NOTIFICACIONES_EMAIL
GROUP BY tipo, estado
ORDER BY tipo, estado;
```

#### Procedimiento: crear_notificacion_resultado_listo

**Propósito:** Crear notificación automática cuando un reporte está disponible.

```sql
CREATE OR REPLACE FUNCTION sp_crear_notificacion_resultado_listo(
    p_reporte_id UUID
)
RETURNS TABLE(
    notificacion_id UUID,
    destinatario_email VARCHAR,
    mensaje TEXT
) AS $$
DECLARE
    v_notificacion_id UUID;
    v_escuela RECORD;
    v_usuario RECORD;
    v_reporte RECORD;
    v_cuerpo TEXT;
BEGIN
    -- Obtener datos del reporte
    SELECT rg.*, e.cct, e.nombre AS escuela_nombre, pe.nombre AS periodo_nombre
    INTO v_reporte
    FROM REPORTES_GENERADOS rg
    INNER JOIN ESCUELAS e ON rg.escuela_id = e.id
    LEFT JOIN PERIODOS_EVALUACION pe ON rg.periodo_id = pe.id_periodo
    WHERE rg.id = p_reporte_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reporte no encontrado: %', p_reporte_id;
    END IF;
    
    -- Obtener usuario (director de la escuela)
    SELECT u.*
    INTO v_usuario
    FROM USUARIOS u
    WHERE u.escuela_id = v_reporte.escuela_id
      AND u.rol = 'DIRECTOR'
      AND u.activo = TRUE
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró director activo para la escuela %', v_reporte.cct;
    END IF;
    
    -- Generar cuerpo del email
    v_cuerpo := FORMAT(
        '<html><body>'
        '<h2>Estimado(a) Director(a)</h2>'
        '<p>Los resultados de la Evaluación Diagnóstica del <strong>%s</strong> para su escuela <strong>%s - %s</strong> ya están disponibles.</p>'
        '<p>Puede descargar los reportes desde el portal: <a href="https://evaluacion.sep.gob.mx/reportes">Ver Reportes</a></p>'
        '<p>Los reportes estarán disponibles hasta: <strong>%s</strong></p>'
        '<hr><p style="font-size:12px;color:#666;">Este es un correo automático, por favor no responder.</p>'
        '</body></html>',
        v_reporte.periodo_nombre,
        v_reporte.cct,
        v_reporte.escuela_nombre,
        TO_CHAR(v_reporte.disponible_hasta, 'DD/MM/YYYY')
    );
    
    -- Crear notificación
    v_notificacion_id := gen_random_uuid();
    
    INSERT INTO NOTIFICACIONES_EMAIL (
        id, usuario_id, destinatario, asunto, cuerpo, tipo, estado,
        prioridad, referencia_id, referencia_tipo
    ) VALUES (
        v_notificacion_id,
        v_usuario.id,
        v_usuario.email,
        FORMAT('Resultados de Evaluación Diagnóstica - %s Disponibles', v_reporte.periodo_nombre),
        v_cuerpo,
        'RESULTADO_LISTO',
        'PENDIENTE',
        'ALTA',
        p_reporte_id,
        'REPORTE'
    );
    
    RETURN QUERY SELECT 
        v_notificacion_id,
        v_usuario.email,
        FORMAT('Notificación creada para %s (%s)', v_usuario.nombre, v_usuario.email);
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_crear_notificacion_resultado_listo(
--     (SELECT id FROM REPORTES_GENERADOS WHERE escuela_id = (SELECT id FROM ESCUELAS WHERE cct = '14DPR0245L') LIMIT 1)
-- );
```

#### Procedimiento: registrar_intento_envio

**Propósito:** Registrar intento de envío (éxito o error) desde el worker.

```sql
CREATE OR REPLACE FUNCTION sp_registrar_intento_envio(
    p_notificacion_id UUID,
    p_exitoso BOOLEAN,
    p_error_mensaje TEXT DEFAULT NULL
)
RETURNS TABLE(
    nuevo_estado VARCHAR,
    intentos_realizados INT,
    mensaje TEXT
) AS $$
DECLARE
    v_intentos INT;
    v_max_intentos INT;
    v_nuevo_estado VARCHAR(20);
BEGIN
    -- Incrementar intentos
    UPDATE NOTIFICACIONES_EMAIL
    SET intentos = intentos + 1,
        updated_at = NOW()
    WHERE id = p_notificacion_id
    RETURNING intentos, max_intentos INTO v_intentos, v_max_intentos;
    
    IF p_exitoso THEN
        -- Envío exitoso
        UPDATE NOTIFICACIONES_EMAIL
        SET estado = 'ENVIADO',
            enviado_en = NOW(),
            error_mensaje = NULL,
            updated_at = NOW()
        WHERE id = p_notificacion_id;
        
        v_nuevo_estado := 'ENVIADO';
    ELSE
        -- Envío fallido
        IF v_intentos >= v_max_intentos THEN
            -- Alcanzó max reintentos
            UPDATE NOTIFICACIONES_EMAIL
            SET estado = 'ERROR',
                error_mensaje = p_error_mensaje,
                updated_at = NOW()
            WHERE id = p_notificacion_id;
            
            v_nuevo_estado := 'ERROR';
        ELSE
            -- Programar reintento
            UPDATE NOTIFICACIONES_EMAIL
            SET estado = 'REINTENTANDO',
                error_mensaje = p_error_mensaje,
                updated_at = NOW()
            WHERE id = p_notificacion_id;
            
            v_nuevo_estado := 'REINTENTANDO';
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        v_nuevo_estado,
        v_intentos,
        FORMAT('Intento %s/%s - Estado: %s', v_intentos, v_max_intentos, v_nuevo_estado);
END;
$$ LANGUAGE plpgsql;

-- Uso éxito: SELECT * FROM sp_registrar_intento_envio(
--     (SELECT id FROM NOTIFICACIONES_EMAIL WHERE estado = 'PENDIENTE' LIMIT 1),
--     TRUE
-- );
-- Uso error: SELECT * FROM sp_registrar_intento_envio(
--     (SELECT id FROM NOTIFICACIONES_EMAIL WHERE estado = 'PENDIENTE' LIMIT 1),
--     FALSE,
--     'SMTP Error: Connection timeout'
-- );
```

#### Procedimiento: limpiar_notificaciones_antiguas

**Propósito:** Archivar o eliminar notificaciones enviadas con más de 90 días.

```sql
CREATE OR REPLACE FUNCTION sp_limpiar_notificaciones_antiguas(
    p_dias_retencion INT DEFAULT 90,
    p_solo_contar BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    notificaciones_procesadas INT,
    mensaje TEXT
) AS $$
DECLARE
    v_count INT;
BEGIN
    IF p_solo_contar THEN
        -- Solo contar sin eliminar
        SELECT COUNT(*) INTO v_count
        FROM NOTIFICACIONES_EMAIL
        WHERE estado = 'ENVIADO'
          AND enviado_en < NOW() - (p_dias_retencion || ' days')::INTERVAL;
        
        RETURN QUERY SELECT 
            v_count,
            FORMAT('Se encontraron %s notificaciones con más de %s días', v_count, p_dias_retencion);
    ELSE
        -- Eliminar (o mover a tabla de archivo)
        DELETE FROM NOTIFICACIONES_EMAIL
        WHERE estado = 'ENVIADO'
          AND enviado_en < NOW() - (p_dias_retencion || ' days')::INTERVAL;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
        RETURN QUERY SELECT 
            v_count,
            FORMAT('Se eliminaron %s notificaciones antiguas', v_count);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_limpiar_notificaciones_antiguas(90, TRUE);
```

#### Trigger: verificar_bloqueo_usuario

**Propósito:** Bloquear automáticamente usuario después de 5 intentos fallidos en 15 minutos.

```sql
CREATE OR REPLACE FUNCTION fn_verificar_bloqueo_usuario()
RETURNS TRIGGER AS $$
DECLARE
    v_intentos_fallidos INT;
    v_usuario_id UUID;
BEGIN
    -- Solo procesar si el intento fue fallido y el usuario existe
    IF NEW.exito = FALSE AND NEW.usuario_id IS NOT NULL THEN
        
        -- Contar intentos fallidos en los últimos 15 minutos
        SELECT COUNT(*) INTO v_intentos_fallidos
        FROM INTENTOS_LOGIN
        WHERE usuario_id = NEW.usuario_id
          AND exito = FALSE
          AND created_at > NOW() - INTERVAL '15 minutes';
        
        -- Si alcanzó 5 intentos fallidos, bloquear cuenta
        IF v_intentos_fallidos >= 5 THEN
            -- Actualizar tabla USUARIOS con bloqueo
            UPDATE USUARIOS
            SET bloqueado_hasta = NOW() + INTERVAL '30 minutes',
                updated_at = NOW()
            WHERE id = NEW.usuario_id;
            
            -- Actualizar registro actual con info de bloqueo
            NEW.bloqueado_hasta := NOW() + INTERVAL '30 minutes';
            NEW.motivo_fallo := 'CUENTA_BLOQUEADA';
            
            -- Crear notificación de bloqueo
            INSERT INTO NOTIFICACIONES_EMAIL (
                id, usuario_id, destinatario, asunto, cuerpo, tipo, estado, prioridad,
                referencia_id, referencia_tipo
            )
            SELECT 
                gen_random_uuid(),
                NEW.usuario_id,
                u.email,
                'Alerta de Seguridad: Cuenta Bloqueada Temporalmente',
                FORMAT('<html><body><h2>Cuenta Bloqueada</h2><p>Su cuenta ha sido bloqueada temporalmente por múltiples intentos de login fallidos.</p><p><strong>Bloqueada hasta:</strong> %s</p><p>Si no reconoce esta actividad, <a href="https://evaluacion.sep.gob.mx/recuperar">cambie su contraseña inmediatamente</a>.</p></body></html>',
                       TO_CHAR(NOW() + INTERVAL '30 minutes', 'DD/MM/YYYY HH24:MI')),
                'RECUPERACION_PASSWORD',
                'PENDIENTE',
                'ALTA',
                NEW.usuario_id,
                'USUARIO'
            FROM USUARIOS u
            WHERE u.id = NEW.usuario_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_bloqueo_usuario
    BEFORE INSERT ON INTENTOS_LOGIN
    FOR EACH ROW
    EXECUTE FUNCTION fn_verificar_bloqueo_usuario();
```

#### Trigger: detectar_ataque_distribuido

**Propósito:** Detectar múltiples intentos desde diferentes IPs y alertar administrador.

```sql
CREATE OR REPLACE FUNCTION fn_detectar_ataque_distribuido()
RETURNS TRIGGER AS $$
DECLARE
    v_ips_distintas INT;
    v_intentos_totales INT;
BEGIN
    -- Solo si el intento fue fallido y el usuario existe
    IF NEW.exito = FALSE AND NEW.usuario_id IS NOT NULL THEN
        
        -- Contar IPs distintas con intentos fallidos en la última hora
        SELECT COUNT(DISTINCT ip_address), COUNT(*)
        INTO v_ips_distintas, v_intentos_totales
        FROM INTENTOS_LOGIN
        WHERE usuario_id = NEW.usuario_id
          AND exito = FALSE
          AND created_at > NOW() - INTERVAL '1 hour';
        
        -- Si hay 10+ intentos desde 3+ IPs diferentes, es probable ataque distribuido
        IF v_intentos_totales >= 10 AND v_ips_distintas >= 3 THEN
            
            -- Bloquear cuenta inmediatamente (1 hora)
            UPDATE USUARIOS
            SET bloqueado_hasta = NOW() + INTERVAL '1 hour',
                updated_at = NOW()
            WHERE id = NEW.usuario_id;
            
            -- Alertar a administradores
            INSERT INTO NOTIFICACIONES_EMAIL (
                id, usuario_id, destinatario, asunto, cuerpo, tipo, estado, prioridad,
                referencia_id, referencia_tipo
            )
            SELECT 
                gen_random_uuid(),
                (SELECT id FROM USUARIOS WHERE rol = 'ADMINISTRADOR' LIMIT 1),
                'admin@sep.gob.mx',
                FORMAT('[ALERTA SEGURIDAD] Posible Ataque Distribuido - Usuario %s', u.email),
                FORMAT('<html><body><h2 style="color:red;">ALERTA DE SEGURIDAD</h2><p>Se ha detectado un posible ataque distribuido a la cuenta: <strong>%s</strong></p><p><strong>Intentos fallidos:</strong> %s desde %s IPs diferentes en la última hora</p><p><strong>Acción tomada:</strong> Cuenta bloqueada por 1 hora</p><p>Revisar logs de seguridad inmediatamente.</p></body></html>',
                       u.email, v_intentos_totales, v_ips_distintas),
                'TICKET_CREADO',
                'PENDIENTE',
                'ALTA',
                NEW.usuario_id,
                'USUARIO'
            FROM USUARIOS u
            WHERE u.id = NEW.usuario_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detectar_ataque_distribuido
    AFTER INSERT ON INTENTOS_LOGIN
    FOR EACH ROW
    EXECUTE FUNCTION fn_detectar_ataque_distribuido();
```

#### Trigger: actualizar_timestamp_usuario

**Propósito:** Actualizar automáticamente el campo updated_at en la tabla USUARIOS.

```sql
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp_usuario()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_usuario
    BEFORE UPDATE ON USUARIOS
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp_usuario();
```

#### Trigger: actualizar_timestamp_escuela

**Propósito:** Actualizar automáticamente el campo updated_at en la tabla ESCUELAS.

```sql
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_escuela
    BEFORE UPDATE ON ESCUELAS
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();
```

#### Trigger: actualizar_timestamp_archivo

**Propósito:** Actualizar automáticamente el campo updated_at en la tabla ARCHIVOS_FRV.

```sql
CREATE TRIGGER trg_actualizar_timestamp_archivo
    BEFORE UPDATE ON ARCHIVOS_FRV
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();
```

#### Trigger: validar_cct_formato

**Propósito:** Validar el formato del CCT antes de insertar o actualizar una escuela.

```sql
CREATE OR REPLACE FUNCTION fn_validar_cct_formato()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar formato CCT: 10 caracteres alfanuméricos (2 dígitos estado + 1 letra nivel + 7 alfanuméricos)
    IF NEW.cct !~ '^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$' THEN
        RAISE EXCEPTION 'Formato de CCT inválido: %. Debe ser 2 dígitos + 1 letra + 7 alfanuméricos (ej: 09DPR1234A)', NEW.cct;
    END IF;
    
    -- Convertir a mayúsculas
    NEW.cct = UPPER(NEW.cct);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_cct_formato
    BEFORE INSERT OR UPDATE ON ESCUELAS
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_cct_formato();
```

#### Trigger: bloquear_usuario_intentos_fallidos

**Propósito:** Bloquear usuario automáticamente después de 5 intentos fallidos consecutivos.

```sql
CREATE OR REPLACE FUNCTION fn_bloquear_usuario_intentos_fallidos()
RETURNS TRIGGER AS $$
DECLARE
    v_intentos_fallidos INT;
BEGIN
    -- Solo si el intento fue fallido
    IF NEW.exito = FALSE AND NEW.usuario_id IS NOT NULL THEN
        
        -- Contar intentos fallidos consecutivos en los últimos 15 minutos
        SELECT COUNT(*)
        INTO v_intentos_fallidos
        FROM INTENTOS_LOGIN
        WHERE usuario_id = NEW.usuario_id
          AND exito = FALSE
          AND created_at > NOW() - INTERVAL '15 minutes';
        
        -- Si hay 5 o más intentos fallidos, bloquear por 30 minutos
        IF v_intentos_fallidos >= 5 THEN
            UPDATE USUARIOS
            SET bloqueado_hasta = NOW() + INTERVAL '30 minutes',
                updated_at = NOW()
            WHERE id = NEW.usuario_id;
            
            -- Registrar en bitácora
            INSERT INTO BITACORA_DETALLADA (usuario_id, accion, descripcion, modulo, resultado, ip_address, fecha)
            VALUES (
                NEW.usuario_id,
                'BLOQUEO_AUTOMATICO',
                FORMAT('Usuario bloqueado por %s intentos fallidos', v_intentos_fallidos),
                'SEGURIDAD',
                'BLOQUEADO',
                NEW.ip_address,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_usuario_intentos_fallidos
    AFTER INSERT ON INTENTOS_LOGIN
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_usuario_intentos_fallidos();
```

#### Trigger: registrar_log_actividad

**Propósito:** Registrar automáticamente cambios importantes en LOG_ACTIVIDADES.

```sql
CREATE OR REPLACE FUNCTION fn_registrar_log_actividad()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar en log de actividades
    INSERT INTO LOG_ACTIVIDADES (usuario_id, accion, tabla, registro_id, detalle, ip)
    VALUES (
        COALESCE(NEW.usuario_id, OLD.usuario_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'CREAR'
            WHEN TG_OP = 'UPDATE' THEN 'MODIFICAR'
            WHEN TG_OP = 'DELETE' THEN 'ELIMINAR'
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        FORMAT('Operación: %s en %s', TG_OP, TG_TABLE_NAME),
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER trg_log_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON USUARIOS
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_log_actividad();

CREATE TRIGGER trg_log_escuelas
    AFTER INSERT OR UPDATE OR DELETE ON ESCUELAS
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_log_actividad();
```

#### Trigger: validar_fecha_periodo

**Propósito:** Validar que las fechas de periodo sean coherentes.

```sql
CREATE OR REPLACE FUNCTION fn_validar_fecha_periodo()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que fecha_fin sea posterior a fecha_inicio
    IF NEW.fecha_fin <= NEW.fecha_inicio THEN
        RAISE EXCEPTION 'La fecha de fin (%) debe ser posterior a la fecha de inicio (%)', NEW.fecha_fin, NEW.fecha_inicio;
    END IF;
    
    -- Validar que el periodo no sea excesivamente largo (máximo 1 año)
    IF NEW.fecha_fin > NEW.fecha_inicio + INTERVAL '1 year' THEN
        RAISE EXCEPTION 'El periodo no puede exceder 1 año de duración';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_periodo
    BEFORE INSERT OR UPDATE ON PERIODOS_EVALUACION
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_fecha_periodo();
```

#### Trigger: actualizar_contador_descargas

**Propósito:** Actualizar el contador de descargas cuando se descarga un reporte.

```sql
CREATE OR REPLACE FUNCTION fn_actualizar_contador_descargas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.descargado_en IS NOT NULL AND (OLD.descargado_en IS NULL OR NEW.descargado_en > OLD.descargado_en) THEN
        NEW.total_descargas = COALESCE(OLD.total_descargas, 0) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_contador_descargas
    BEFORE UPDATE ON REPORTES_GENERADOS
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_contador_descargas();
```

#### Trigger: validar_email_formato

**Propósito:** Validar el formato de email antes de insertar o actualizar usuarios.

```sql
CREATE OR REPLACE FUNCTION fn_validar_email_formato()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar formato básico de email
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$' THEN
        RAISE EXCEPTION 'Formato de email inválido: %', NEW.email;
    END IF;
    
    -- Convertir a minúsculas
    NEW.email = LOWER(NEW.email);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_email_formato
    BEFORE INSERT OR UPDATE ON USUARIOS
    FOR EACH ROW
    WHEN (NEW.email IS NOT NULL)
    EXECUTE FUNCTION fn_validar_email_formato();
```

#### Trigger: archivar_ticket_resuelto

**Propósito:** Actualizar estado de ticket cuando se resuelve.

```sql
CREATE OR REPLACE FUNCTION fn_archivar_ticket_resuelto()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está marcando como resuelto, actualizar timestamp
    IF NEW.estado = 'RESUELTO' AND OLD.estado != 'RESUELTO' THEN
        NEW.resuelto_en = NOW();
        
        -- Si no tiene resolución, requerirla
        IF NEW.resolucion IS NULL OR TRIM(NEW.resolucion) = '' THEN
            RAISE EXCEPTION 'Se requiere una descripción de resolución para cerrar el ticket';
        END IF;
    END IF;
    
    -- Si se está cerrando, actualizar timestamp
    IF NEW.estado = 'CERRADO' AND OLD.estado != 'CERRADO' THEN
        NEW.cerrado_en = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archivar_ticket_resuelto
    BEFORE UPDATE ON TICKETS_SOPORTE
    FOR EACH ROW
    EXECUTE FUNCTION fn_archivar_ticket_resuelto();
```

#### Trigger: notificar_ticket_asignado

**Propósito:** Crear notificación automática cuando se asigna un ticket.

```sql
CREATE OR REPLACE FUNCTION fn_notificar_ticket_asignado()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se asignó a un usuario diferente
    IF NEW.asignado_a IS NOT NULL AND (OLD.asignado_a IS NULL OR NEW.asignado_a != OLD.asignado_a) THEN
        
        -- Crear notificación
        INSERT INTO NOTIFICACIONES_EMAIL (
            id, usuario_id, destinatario, asunto, cuerpo, tipo, estado, prioridad,
            referencia_id, referencia_tipo
        )
        SELECT 
            gen_random_uuid(),
            NEW.asignado_a,
            u.email,
            FORMAT('Ticket #%s asignado: %s', NEW.numero_ticket, NEW.asunto),
            FORMAT('<html><body><h2>Se le ha asignado un nuevo ticket</h2><p><strong>Número:</strong> %s</p><p><strong>Asunto:</strong> %s</p><p><strong>Prioridad:</strong> %s</p><p><strong>Descripción:</strong> %s</p></body></html>',
                   NEW.numero_ticket, NEW.asunto, NEW.prioridad, NEW.descripcion),
            'TICKET_CREADO',
            'PENDIENTE',
            NEW.prioridad,
            NEW.id,
            'TICKET'
        FROM USUARIOS u
        WHERE u.id = NEW.asignado_a;
        
        -- Actualizar fecha de asignación
        NEW.asignado_en = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificar_ticket_asignado
    BEFORE UPDATE ON TICKETS_SOPORTE
    FOR EACH ROW
    EXECUTE FUNCTION fn_notificar_ticket_asignado();
```

#### Vista: v_intentos_sospechosos

**Propósito:** Vista para monitoreo de seguridad con intentos fallidos agrupados.

```sql
CREATE OR REPLACE VIEW v_intentos_sospechosos AS
SELECT 
    email,
    usuario_id,
    COUNT(*) AS total_intentos_fallidos,
    COUNT(DISTINCT ip_address) AS ips_distintas,
    MIN(created_at) AS primer_intento,
    MAX(created_at) AS ultimo_intento,
    ARRAY_AGG(DISTINCT ip_address::TEXT ORDER BY ip_address::TEXT) AS lista_ips,
    ARRAY_AGG(DISTINCT motivo_fallo ORDER BY motivo_fallo) FILTER (WHERE motivo_fallo IS NOT NULL) AS motivos,
    MAX(bloqueado_hasta) AS bloqueado_hasta,
    CASE 
        WHEN MAX(bloqueado_hasta) > NOW() THEN 'BLOQUEADO'
        WHEN COUNT(*) >= 5 THEN 'ALTO_RIESGO'
        WHEN COUNT(*) >= 3 THEN 'RIESGO_MEDIO'
        ELSE 'NORMAL'
    END AS nivel_alerta
FROM INTENTOS_LOGIN
WHERE exito = FALSE
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY email, usuario_id
HAVING COUNT(*) >= 3
ORDER BY total_intentos_fallidos DESC, ultimo_intento DESC;
```

#### Vista: v_ips_bloqueadas

**Propósito:** Vista de IPs con actividad sospechosa para bloqueo en firewall.

```sql
CREATE OR REPLACE VIEW v_ips_bloqueadas AS
SELECT 
    ip_address,
    COUNT(*) AS total_intentos,
    COUNT(DISTINCT email) AS usuarios_intentados,
    MIN(created_at) AS primer_intento,
    MAX(created_at) AS ultimo_intento,
    ARRAY_AGG(DISTINCT user_agent) AS user_agents,
    COUNT(*) FILTER (WHERE user_agent LIKE '%curl%' OR user_agent LIKE '%python%' OR user_agent LIKE '%bot%') AS intentos_automatizados,
    CASE 
        WHEN COUNT(*) >= 20 THEN 'BLOQUEAR_PERMANENTE'
        WHEN COUNT(*) >= 10 THEN 'BLOQUEAR_TEMPORAL'
        ELSE 'MONITOREAR'
    END AS accion_recomendada
FROM INTENTOS_LOGIN
WHERE exito = FALSE
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY total_intentos DESC;
```

#### Vista: v_escuelas_por_entidad

**Propósito:** Vista consolidada de escuelas agrupadas por entidad federativa con estadísticas.

```sql
CREATE OR REPLACE VIEW v_escuelas_por_entidad AS
SELECT 
    e.entidad_id,
    ent.nombre AS entidad_nombre,
    ent.clave AS entidad_clave,
    COUNT(*) AS total_escuelas,
    COUNT(*) FILTER (WHERE e.activo = TRUE) AS escuelas_activas,
    COUNT(*) FILTER (WHERE e.activo = FALSE) AS escuelas_inactivas,
    COUNT(DISTINCT e.nivel_educativo) AS niveles_educativos,
    COUNT(DISTINCT e.turno) AS turnos_diferentes,
    SUM(e.total_alumnos) AS total_alumnos_entidad,
    AVG(e.total_alumnos) AS promedio_alumnos_escuela,
    MIN(e.created_at) AS primera_escuela_registrada,
    MAX(e.updated_at) AS ultima_actualizacion
FROM ESCUELAS e
JOIN ENTIDADES ent ON e.entidad_id = ent.id
GROUP BY e.entidad_id, ent.nombre, ent.clave
ORDER BY total_escuelas DESC;
```

#### Vista: v_archivos_pendientes_validacion

**Propósito:** Vista de archivos FRV pendientes de validación con información de escuela y periodo.

```sql
CREATE OR REPLACE VIEW v_archivos_pendientes_validacion AS
SELECT 
    a.id,
    a.nombre_archivo,
    a.escuela_id,
    e.cct,
    e.nombre AS escuela_nombre,
    e.entidad_id,
    a.periodo_id,
    p.nombre AS periodo_nombre,
    a.tipo_archivo,
    a.estado,
    a.uploaded_en,
    EXTRACT(EPOCH FROM (NOW() - a.uploaded_en))/3600 AS horas_desde_upload,
    a.tamano_bytes,
    a.total_registros,
    a.usuario_id,
    u.nombre_completo AS usuario_nombre
FROM ARCHIVOS_FRV a
JOIN ESCUELAS e ON a.escuela_id = e.id
JOIN PERIODOS_EVALUACION p ON a.periodo_id = p.id
LEFT JOIN USUARIOS u ON a.usuario_id = u.id
WHERE a.estado IN ('PENDIENTE', 'EN_VALIDACION')
ORDER BY a.uploaded_en ASC;
```

#### Vista: v_evaluaciones_estadisticas

**Propósito:** Estadísticas detalladas de evaluaciones por periodo y nivel.

```sql
CREATE OR REPLACE VIEW v_evaluaciones_estadisticas AS
SELECT 
    ev.periodo_id,
    p.nombre AS periodo_nombre,
    ev.nivel_educativo,
    ev.grado,
    COUNT(*) AS total_evaluaciones,
    COUNT(DISTINCT ev.escuela_id) AS escuelas_participantes,
    COUNT(DISTINCT ev.alumno_id) AS alumnos_evaluados,
    AVG(ev.valoracion) AS promedio_valoracion,
    STDDEV(ev.valoracion) AS desviacion_estandar,
    COUNT(*) FILTER (WHERE ev.valoracion = 0) AS nivel_critico,
    COUNT(*) FILTER (WHERE ev.valoracion = 1) AS nivel_bajo,
    COUNT(*) FILTER (WHERE ev.valoracion = 2) AS nivel_medio,
    COUNT(*) FILTER (WHERE ev.valoracion = 3) AS nivel_destacado,
    COUNT(*) FILTER (WHERE ev.observaciones IS NOT NULL) AS con_observaciones,
    MIN(ev.created_at) AS primera_evaluacion,
    MAX(ev.created_at) AS ultima_evaluacion
FROM EVALUACIONES ev
JOIN PERIODOS_EVALUACION p ON ev.periodo_id = p.id
GROUP BY ev.periodo_id, p.nombre, ev.nivel_educativo, ev.grado
ORDER BY ev.periodo_id DESC, ev.nivel_educativo, ev.grado;
```

#### Vista: v_reportes_por_generar

**Propósito:** Vista de reportes programados pendientes de generación.

```sql
CREATE OR REPLACE VIEW v_reportes_por_generar AS
SELECT 
    rg.id,
    rg.escuela_id,
    e.cct,
    e.nombre AS escuela_nombre,
    rg.periodo_id,
    p.nombre AS periodo_nombre,
    rg.tipo_reporte,
    rg.formato,
    rg.estado,
    rg.solicitado_en,
    EXTRACT(EPOCH FROM (NOW() - rg.solicitado_en))/3600 AS horas_esperando,
    rg.prioridad,
    rg.usuario_id,
    u.email AS usuario_email,
    rg.intentos,
    rg.error_mensaje
FROM REPORTES_GENERADOS rg
JOIN ESCUELAS e ON rg.escuela_id = e.id
JOIN PERIODOS_EVALUACION p ON rg.periodo_id = p.id
LEFT JOIN USUARIOS u ON rg.usuario_id = u.id
WHERE rg.estado IN ('PENDIENTE', 'PROCESANDO', 'ERROR')
  AND rg.intentos < 3
ORDER BY 
    rg.prioridad DESC,
    rg.solicitado_en ASC;
```

#### Vista: v_tickets_abiertos_resumen

**Propósito:** Resumen de tickets abiertos con información de asignación y antigüedad.

```sql
CREATE OR REPLACE VIEW v_tickets_abiertos_resumen AS
SELECT 
    t.id,
    t.numero_ticket,
    t.asunto,
    t.categoria,
    t.prioridad,
    t.estado,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at))/86400 AS dias_abierto,
    t.creado_por,
    uc.nombre_completo AS creador_nombre,
    uc.email AS creador_email,
    t.asignado_a,
    ua.nombre_completo AS asignado_nombre,
    ua.email AS asignado_email,
    t.asignado_en,
    (SELECT COUNT(*) FROM COMENTARIOS_TICKET WHERE ticket_id = t.id) AS total_comentarios,
    (SELECT MAX(created_at) FROM COMENTARIOS_TICKET WHERE ticket_id = t.id) AS ultimo_comentario,
    CASE 
        WHEN t.prioridad = 'URGENTE' AND NOW() - t.created_at > INTERVAL '4 hours' THEN 'SLA_VIOLADO'
        WHEN t.prioridad = 'ALTA' AND NOW() - t.created_at > INTERVAL '1 day' THEN 'SLA_VIOLADO'
        WHEN t.prioridad = 'MEDIA' AND NOW() - t.created_at > INTERVAL '3 days' THEN 'SLA_VIOLADO'
        ELSE 'SLA_OK'
    END AS estado_sla
FROM TICKETS_SOPORTE t
JOIN USUARIOS uc ON t.creado_por = uc.id
LEFT JOIN USUARIOS ua ON t.asignado_a = ua.id
WHERE t.estado IN ('ABIERTO', 'EN_PROGRESO', 'ESPERANDO_RESPUESTA')
ORDER BY 
    CASE t.prioridad 
        WHEN 'URGENTE' THEN 1 
        WHEN 'ALTA' THEN 2 
        WHEN 'MEDIA' THEN 3 
        WHEN 'BAJA' THEN 4 
    END,
    t.created_at ASC;
```

#### Vista: v_usuarios_activos_sesion

**Propósito:** Vista de usuarios con sesiones activas y última actividad.

```sql
CREATE OR REPLACE VIEW v_usuarios_activos_sesion AS
SELECT 
    u.id,
    u.email,
    u.nombre_completo,
    u.rol,
    u.entidad_id,
    s.id AS sesion_id,
    s.token_hash,
    s.ip_address,
    s.user_agent,
    s.created_at AS inicio_sesion,
    s.expires_at AS expira_sesion,
    s.ultima_actividad,
    EXTRACT(EPOCH FROM (NOW() - s.ultima_actividad))/60 AS minutos_inactivo,
    CASE 
        WHEN s.expires_at < NOW() THEN 'EXPIRADA'
        WHEN NOW() - s.ultima_actividad > INTERVAL '30 minutes' THEN 'INACTIVA'
        ELSE 'ACTIVA'
    END AS estado_sesion
FROM USUARIOS u
JOIN SESIONES_USUARIO s ON u.id = s.usuario_id
WHERE s.revocado = FALSE
  AND s.expires_at > NOW()
ORDER BY s.ultima_actividad DESC;
```

#### Vista: v_bitacora_ultimas_24h

**Propósito:** Registro de actividad de las últimas 24 horas para monitoreo.

```sql
CREATE OR REPLACE VIEW v_bitacora_ultimas_24h AS
SELECT 
    b.id,
    b.usuario_id,
    u.email,
    u.nombre_completo,
    u.rol,
    b.accion,
    b.descripcion,
    b.modulo,
    b.resultado,
    b.ip_address,
    b.user_agent,
    b.fecha,
    b.duracion_ms,
    b.metadatos
FROM BITACORA_DETALLADA b
LEFT JOIN USUARIOS u ON b.usuario_id = u.id
WHERE b.fecha > NOW() - INTERVAL '24 hours'
ORDER BY b.fecha DESC;
```

#### Vista: v_intentos_login_fallidos

**Propósito:** Monitoreo de intentos de login fallidos para detección de ataques.

```sql
CREATE OR REPLACE VIEW v_intentos_login_fallidos AS
SELECT 
    il.id,
    il.email,
    il.ip_address,
    il.user_agent,
    il.motivo_fallo,
    il.created_at,
    il.usuario_id,
    u.bloqueado_hasta,
    COUNT(*) OVER (PARTITION BY il.ip_address) AS intentos_desde_ip,
    COUNT(*) OVER (PARTITION BY il.email) AS intentos_con_email,
    LAG(il.created_at) OVER (PARTITION BY il.email ORDER BY il.created_at) AS intento_anterior,
    CASE 
        WHEN COUNT(*) OVER (PARTITION BY il.ip_address) >= 10 THEN 'IP_SOSPECHOSA'
        WHEN COUNT(*) OVER (PARTITION BY il.email) >= 5 THEN 'CUENTA_ATACADA'
        ELSE 'NORMAL'
    END AS tipo_alerta
FROM INTENTOS_LOGIN il
LEFT JOIN USUARIOS u ON il.usuario_id = u.id
WHERE il.exito = FALSE
  AND il.created_at > NOW() - INTERVAL '1 hour'
ORDER BY il.created_at DESC;
```

#### Vista: v_escuelas_sin_actividad

**Propósito:** Escuelas sin archivos ni evaluaciones en el periodo actual.

```sql
CREATE OR REPLACE VIEW v_escuelas_sin_actividad AS
SELECT 
    e.id,
    e.cct,
    e.nombre,
    e.entidad_id,
    ent.nombre AS entidad_nombre,
    e.nivel_educativo,
    e.turno,
    e.total_alumnos,
    e.created_at AS fecha_registro,
    (SELECT MAX(uploaded_en) FROM ARCHIVOS_FRV WHERE escuela_id = e.id) AS ultimo_archivo,
    (SELECT MAX(created_at) FROM EVALUACIONES WHERE escuela_id = e.id) AS ultima_evaluacion,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
        (SELECT MAX(uploaded_en) FROM ARCHIVOS_FRV WHERE escuela_id = e.id),
        e.created_at
    )))/86400 AS dias_sin_actividad
FROM ESCUELAS e
JOIN ENTIDADES ent ON e.entidad_id = ent.id
WHERE e.activo = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM ARCHIVOS_FRV a 
      WHERE a.escuela_id = e.id 
        AND a.periodo_id = (SELECT id FROM PERIODOS_EVALUACION WHERE activo = TRUE LIMIT 1)
  )
ORDER BY dias_sin_actividad DESC;
```

#### Vista: v_usuarios_inactivos

**Propósito:** Usuarios que no han iniciado sesión en los últimos 30 días.

```sql
CREATE OR REPLACE VIEW v_usuarios_inactivos AS
SELECT 
    u.id,
    u.email,
    u.nombre_completo,
    u.rol,
    u.entidad_id,
    e.nombre AS entidad_nombre,
    u.activo,
    u.created_at AS fecha_creacion,
    u.ultimo_acceso,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(u.ultimo_acceso, u.created_at)))/86400 AS dias_inactivo,
    (SELECT COUNT(*) FROM SESIONES_USUARIO WHERE usuario_id = u.id) AS total_sesiones_historicas,
    CASE 
        WHEN u.ultimo_acceso IS NULL THEN 'NUNCA_INGRESO'
        WHEN NOW() - u.ultimo_acceso > INTERVAL '90 days' THEN 'INACTIVO_CRITICO'
        WHEN NOW() - u.ultimo_acceso > INTERVAL '30 days' THEN 'INACTIVO'
        ELSE 'ACTIVO_RECIENTE'
    END AS estado_actividad
FROM USUARIOS u
LEFT JOIN ENTIDADES e ON u.entidad_id = e.id
WHERE COALESCE(u.ultimo_acceso, u.created_at) < NOW() - INTERVAL '30 days'
  OR u.ultimo_acceso IS NULL
ORDER BY dias_inactivo DESC;
```

#### Vista: v_periodos_evaluacion_activos

**Propósito:** Información completa de periodos activos con estadísticas de participación.

```sql
CREATE OR REPLACE VIEW v_periodos_evaluacion_activos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.fecha_inicio,
    p.fecha_fin,
    p.activo,
    EXTRACT(EPOCH FROM (p.fecha_fin - NOW()))/86400 AS dias_restantes,
    (SELECT COUNT(*) FROM ARCHIVOS_FRV WHERE periodo_id = p.id) AS total_archivos,
    (SELECT COUNT(*) FROM ARCHIVOS_FRV WHERE periodo_id = p.id AND estado = 'VALIDADO') AS archivos_validados,
    (SELECT COUNT(*) FROM EVALUACIONES WHERE periodo_id = p.id) AS total_evaluaciones,
    (SELECT COUNT(DISTINCT escuela_id) FROM ARCHIVOS_FRV WHERE periodo_id = p.id) AS escuelas_participantes,
    (SELECT COUNT(*) FROM ESCUELAS WHERE activo = TRUE) AS total_escuelas_activas,
    ROUND(
        (SELECT COUNT(DISTINCT escuela_id)::NUMERIC FROM ARCHIVOS_FRV WHERE periodo_id = p.id) /
        NULLIF((SELECT COUNT(*)::NUMERIC FROM ESCUELAS WHERE activo = TRUE), 0) * 100,
        2
    ) AS porcentaje_participacion
FROM PERIODOS_EVALUACION p
WHERE p.activo = TRUE
   OR p.fecha_fin > NOW() - INTERVAL '30 days'
ORDER BY p.fecha_inicio DESC;
```

#### Vista: v_configuraciones_sistema_activas

**Propósito:** Parámetros de configuración del sistema actualmente en uso.

```sql
CREATE OR REPLACE VIEW v_configuraciones_sistema_activas AS
SELECT 
    c.id,
    c.clave,
    c.valor,
    c.tipo_dato,
    c.descripcion,
    c.categoria,
    c.modificable_usuario,
    c.requiere_reinicio,
    c.valor_default,
    c.updated_at,
    u.nombre_completo AS modificado_por,
    CASE 
        WHEN c.valor = c.valor_default THEN 'DEFAULT'
        ELSE 'PERSONALIZADO'
    END AS estado_configuracion,
    CASE c.tipo_dato
        WHEN 'INTEGER' THEN c.valor::INTEGER::TEXT
        WHEN 'BOOLEAN' THEN c.valor::BOOLEAN::TEXT
        WHEN 'FLOAT' THEN c.valor::FLOAT::TEXT
        ELSE c.valor
    END AS valor_tipado
FROM CONFIGURACIONES_SISTEMA c
LEFT JOIN USUARIOS u ON c.modificado_por = u.id
WHERE c.activo = TRUE
ORDER BY c.categoria, c.clave;
```

#### Vista: v_auditoria_cambios_recientes

**Propósito:** Últimos cambios registrados en auditoría LGPDP (usa tabla CAMBIOS_AUDITORIA, no requiere cambios por eliminación de BITACORA_DETALLADA).

```sql
CREATE OR REPLACE VIEW v_auditoria_cambios_recientes AS
SELECT 
    ca.id,
    ca.tabla,
    ca.registro_id,
    ca.campo_modificado,
    ca.valor_anterior,
    ca.valor_nuevo,
    ca.usuario_id,
    u.email AS usuario_email,
    u.nombre_completo AS usuario_nombre,
    ca.ip_address,
    ca.user_agent,
    ca.fecha_cambio,
    ca.motivo,
    ca.metadata,
    CASE 
        WHEN ca.tabla IN ('USUARIOS', 'HISTORICO_PASSWORDS') THEN 'SENSIBLE'
        WHEN ca.tabla IN ('EVALUACIONES', 'ESCUELAS') THEN 'CRITICO'
        ELSE 'NORMAL'
    END AS criticidad_cambio
FROM CAMBIOS_AUDITORIA ca
JOIN USUARIOS u ON ca.usuario_id = u.id
WHERE ca.fecha_cambio > NOW() - INTERVAL '7 days'
ORDER BY ca.fecha_cambio DESC;
```

#### Procedimiento: registrar_intento_login

**Propósito:** Procedimiento unificado para registrar intentos de login desde la API.

```sql
CREATE OR REPLACE FUNCTION sp_registrar_intento_login(
    p_email VARCHAR(100),
    p_password_correcto BOOLEAN,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_motivo_fallo VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
    intento_id UUID,
    bloqueado BOOLEAN,
    bloqueado_hasta_ts TIMESTAMP,
    mensaje TEXT
) AS $$
DECLARE
    v_usuario_id UUID;
    v_intento_id UUID;
    v_bloqueado_hasta TIMESTAMP;
    v_usuario_activo BOOLEAN;
BEGIN
    -- Buscar usuario por email
    SELECT id, activo INTO v_usuario_id, v_usuario_activo
    FROM USUARIOS
    WHERE email = p_email;
    
    -- Determinar motivo de fallo si no se proporcionó
    IF NOT p_password_correcto THEN
        IF v_usuario_id IS NULL THEN
            p_motivo_fallo := 'USUARIO_INVALIDO';
        ELSIF v_usuario_activo = FALSE THEN
            p_motivo_fallo := COALESCE(p_motivo_fallo, 'CUENTA_INACTIVA');
        ELSE
            p_motivo_fallo := COALESCE(p_motivo_fallo, 'PASSWORD_INCORRECTO');
        END IF;
    END IF;
    
    -- Verificar si ya está bloqueado
    IF v_usuario_id IS NOT NULL THEN
        SELECT bloqueado_hasta INTO v_bloqueado_hasta
        FROM USUARIOS
        WHERE id = v_usuario_id;
        
        IF v_bloqueado_hasta IS NOT NULL AND v_bloqueado_hasta > NOW() THEN
            p_motivo_fallo := 'CUENTA_BLOQUEADA';
            p_password_correcto := FALSE;
        END IF;
    END IF;
    
    -- Crear registro de intento
    v_intento_id := gen_random_uuid();
    
    INSERT INTO INTENTOS_LOGIN (
        id, usuario_id, email, ip_address, user_agent, exito, motivo_fallo, metadata, created_at
    ) VALUES (
        v_intento_id,
        v_usuario_id,
        p_email,
        p_ip_address,
        p_user_agent,
        p_password_correcto,
        p_motivo_fallo,
        p_metadata,
        NOW()
    )
    RETURNING bloqueado_hasta INTO v_bloqueado_hasta;
    
    -- Si el login fue exitoso, resetear contador de fallos
    IF p_password_correcto = TRUE THEN
        UPDATE USUARIOS
        SET bloqueado_hasta = NULL,
            updated_at = NOW()
        WHERE id = v_usuario_id;
        
        v_bloqueado_hasta := NULL;
    END IF;
    
    RETURN QUERY SELECT 
        v_intento_id,
        (v_bloqueado_hasta IS NOT NULL AND v_bloqueado_hasta > NOW()),
        v_bloqueado_hasta,
        CASE 
            WHEN p_password_correcto THEN 'Login exitoso'
            WHEN v_bloqueado_hasta > NOW() THEN FORMAT('Cuenta bloqueada hasta %s', v_bloqueado_hasta::TEXT)
            ELSE FORMAT('Login fallido: %s', p_motivo_fallo)
        END;
END;
$$ LANGUAGE plpgsql;

-- Uso exitoso: SELECT * FROM sp_registrar_intento_login(
--     'director.school245@edu.mx',
--     TRUE,
--     '192.168.1.100'::INET,
--     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
-- );
-- Uso fallido: SELECT * FROM sp_registrar_intento_login(
--     'director.school245@edu.mx',
--     FALSE,
--     '192.168.1.100'::INET,
--     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
--     'PASSWORD_INCORRECTO'
-- );
```

#### Procedimiento: desbloquear_usuario

**Propósito:** Desbloquear manualmente un usuario (acción de administrador).

```sql
CREATE OR REPLACE FUNCTION sp_desbloquear_usuario(
    p_usuario_id UUID,
    p_admin_id UUID
)
RETURNS TABLE(
    desbloqueado BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_email VARCHAR(100);
    v_estaba_bloqueado BOOLEAN;
BEGIN
    -- Verificar que existe bloqueo
    SELECT email, (bloqueado_hasta > NOW()) INTO v_email, v_estaba_bloqueado
    FROM USUARIOS
    WHERE id = p_usuario_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Usuario no encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Desbloquear
    UPDATE USUARIOS
    SET bloqueado_hasta = NULL,
        updated_at = NOW()
    WHERE id = p_usuario_id;
    
    -- Registrar acción en log
    INSERT INTO LOG_ACTIVIDADES (
        id_log, id_usuario, fecha_hora, accion, tabla, registro_id, detalle, ip
    ) VALUES (
        (SELECT COALESCE(MAX(id_log), 0) + 1 FROM LOG_ACTIVIDADES),
        p_admin_id,
        NOW(),
        'DESBLOQUEO_MANUAL',
        'USUARIOS',
        p_usuario_id::TEXT::INT,
        FORMAT('Cuenta %s desbloqueada manualmente por administrador', v_email),
        NULL
    );
    
    RETURN QUERY SELECT 
        TRUE,
        FORMAT('Usuario %s desbloqueado exitosamente', v_email);
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM sp_desbloquear_usuario(
--     (SELECT id FROM USUARIOS WHERE email = 'director.school245@edu.mx'),
--     (SELECT id FROM USUARIOS WHERE rol = 'ADMINISTRADOR' LIMIT 1)
-- );
```

#### Procedimiento: procesar_archivo_frv

**Propósito:** Validación completa y carga masiva de archivos FRV con manejo de errores transaccional.

```sql
CREATE OR REPLACE FUNCTION sp_procesar_archivo_frv(
    p_archivo_id UUID,
    p_usuario_id UUID
)
RETURNS TABLE(
    procesado BOOLEAN,
    registros_insertados INT,
    registros_rechazados INT,
    mensaje TEXT,
    errores JSONB
) AS $$
DECLARE
    v_escuela_id UUID;
    v_periodo_id UUID;
    v_tipo_archivo VARCHAR(50);
    v_estado VARCHAR(50);
    v_total_registros INT := 0;
    v_insertados INT := 0;
    v_rechazados INT := 0;
    v_errores JSONB := '[]'::JSONB;
    v_contenido JSONB;
BEGIN
    -- Obtener información del archivo
    SELECT escuela_id, periodo_id, tipo_archivo, estado, contenido_json, total_registros
    INTO v_escuela_id, v_periodo_id, v_tipo_archivo, v_estado, v_contenido, v_total_registros
    FROM ARCHIVOS_FRV
    WHERE id = p_archivo_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Archivo no encontrado'::TEXT, '[]'::JSONB;
        RETURN;
    END IF;
    
    -- Validar que el archivo esté en estado PENDIENTE
    IF v_estado != 'PENDIENTE' THEN
        RETURN QUERY SELECT FALSE, 0, 0, FORMAT('Archivo en estado %s, no se puede procesar', v_estado)::TEXT, '[]'::JSONB;
        RETURN;
    END IF;
    
    -- Actualizar estado a EN_VALIDACION
    UPDATE ARCHIVOS_FRV
    SET estado = 'EN_VALIDACION',
        procesado_en = NOW(),
        usuario_id = p_usuario_id
    WHERE id = p_archivo_id;
    
    -- Procesar registros según tipo de archivo
    BEGIN
        IF v_tipo_archivo = 'FRV_PREESCOLAR' THEN
            -- Insertar evaluaciones de preescolar
            INSERT INTO EVALUACIONES (
                id, escuela_id, periodo_id, alumno_id, grado, nivel_educativo,
                campo_formativo, valoracion, observaciones, created_at
            )
            SELECT 
                gen_random_uuid(),
                v_escuela_id,
                v_periodo_id,
                gen_random_uuid(), -- Temporal, se debe resolver con ALUMNOS
                (rec->>'grado')::INT,
                'PREESCOLAR',
                rec->>'campo_formativo',
                (rec->>'valoracion')::INT,
                rec->>'observaciones',
                NOW()
            FROM jsonb_array_elements(v_contenido) AS rec
            WHERE (rec->>'valoracion')::INT BETWEEN 0 AND 3; -- Validación rango
            
            GET DIAGNOSTICS v_insertados = ROW_COUNT;
            
        ELSIF v_tipo_archivo IN ('FRV_PRIMARIA', 'FRV_SECUNDARIA') THEN
            -- Insertar evaluaciones de primaria/secundaria
            INSERT INTO EVALUACIONES (
                id, escuela_id, periodo_id, alumno_id, grado, nivel_educativo,
                materia, valoracion, observaciones, created_at
            )
            SELECT 
                gen_random_uuid(),
                v_escuela_id,
                v_periodo_id,
                gen_random_uuid(),
                (rec->>'grado')::INT,
                CASE 
                    WHEN v_tipo_archivo = 'FRV_PRIMARIA' THEN 'PRIMARIA'
                    ELSE 'SECUNDARIA'
                END,
                rec->>'materia',
                (rec->>'valoracion')::INT,
                rec->>'observaciones',
                NOW()
            FROM jsonb_array_elements(v_contenido) AS rec
            WHERE (rec->>'valoracion')::INT BETWEEN 0 AND 3;
            
            GET DIAGNOSTICS v_insertados = ROW_COUNT;
        END IF;
        
        v_rechazados := v_total_registros - v_insertados;
        
        -- Actualizar archivo a VALIDADO
        UPDATE ARCHIVOS_FRV
        SET estado = 'VALIDADO',
            validado_en = NOW(),
            registros_procesados = v_insertados,
            registros_rechazados = v_rechazados
        WHERE id = p_archivo_id;
        
        -- Registrar en bitácora
        INSERT INTO BITACORA_DETALLADA (
            usuario_id, accion, descripcion, modulo, resultado, fecha
        ) VALUES (
            p_usuario_id,
            'PROCESAR_ARCHIVO_FRV',
            FORMAT('Archivo %s procesado: %s insertados, %s rechazados', 
                   p_archivo_id, v_insertados, v_rechazados),
            'VALIDACION',
            'EXITO',
            NOW()
        );
        
        RETURN QUERY SELECT 
            TRUE, 
            v_insertados, 
            v_rechazados, 
            FORMAT('Procesamiento exitoso: %s registros insertados', v_insertados)::TEXT,
            v_errores;
            
    EXCEPTION WHEN OTHERS THEN
        -- Rollback y actualizar archivo a ERROR
        UPDATE ARCHIVOS_FRV
        SET estado = 'ERROR',
            error_mensaje = SQLERRM
        WHERE id = p_archivo_id;
        
        RETURN QUERY SELECT 
            FALSE, 
            0, 
            v_total_registros, 
            FORMAT('Error en procesamiento: %s', SQLERRM)::TEXT,
            jsonb_build_array(jsonb_build_object('error', SQLERRM));
    END;
END;
$$ LANGUAGE plpgsql;
```

#### Procedimiento: calcular_estadisticas_escuela

**Propósito:** Calcular estadísticas agregadas de una escuela para un periodo específico.

```sql
CREATE OR REPLACE FUNCTION sp_calcular_estadisticas_escuela(
    p_escuela_id UUID,
    p_periodo_id UUID
)
RETURNS TABLE(
    total_alumnos_evaluados INT,
    promedio_general NUMERIC(4,2),
    nivel_critico_count INT,
    nivel_bajo_count INT,
    nivel_medio_count INT,
    nivel_destacado_count INT,
    porcentaje_critico NUMERIC(5,2),
    porcentaje_bajo NUMERIC(5,2),
    porcentaje_medio NUMERIC(5,2),
    porcentaje_destacado NUMERIC(5,2),
    materias_evaluadas TEXT[],
    grados_evaluados INT[]
) AS $$
DECLARE
    v_total INT;
BEGIN
    -- Contar total de evaluaciones
    SELECT COUNT(DISTINCT alumno_id) INTO v_total
    FROM EVALUACIONES
    WHERE escuela_id = p_escuela_id
      AND periodo_id = p_periodo_id;
    
    IF v_total = 0 THEN
        RETURN QUERY SELECT 0, 0.0, 0, 0, 0, 0, 0.0, 0.0, 0.0, 0.0, 
                            ARRAY[]::TEXT[], ARRAY[]::INT[];
        RETURN;
    END IF;
    
    -- Calcular estadísticas
    RETURN QUERY
    SELECT 
        v_total,
        ROUND(AVG(valoracion), 2)::NUMERIC(4,2),
        COUNT(*) FILTER (WHERE valoracion = 0)::INT,
        COUNT(*) FILTER (WHERE valoracion = 1)::INT,
        COUNT(*) FILTER (WHERE valoracion = 2)::INT,
        COUNT(*) FILTER (WHERE valoracion = 3)::INT,
        ROUND(COUNT(*) FILTER (WHERE valoracion = 0)::NUMERIC / v_total * 100, 2)::NUMERIC(5,2),
        ROUND(COUNT(*) FILTER (WHERE valoracion = 1)::NUMERIC / v_total * 100, 2)::NUMERIC(5,2),
        ROUND(COUNT(*) FILTER (WHERE valoracion = 2)::NUMERIC / v_total * 100, 2)::NUMERIC(5,2),
        ROUND(COUNT(*) FILTER (WHERE valoracion = 3)::NUMERIC / v_total * 100, 2)::NUMERIC(5,2),
        ARRAY_AGG(DISTINCT COALESCE(materia, campo_formativo)) FILTER (WHERE materia IS NOT NULL OR campo_formativo IS NOT NULL),
        ARRAY_AGG(DISTINCT grado ORDER BY grado)
    FROM EVALUACIONES
    WHERE escuela_id = p_escuela_id
      AND periodo_id = p_periodo_id;
END;
$$ LANGUAGE plpgsql;
```

#### Procedimiento: limpiar_sesiones_expiradas

**Propósito:** Limpiar sesiones expiradas y marcar como revocadas (job programado).

```sql
CREATE OR REPLACE FUNCTION sp_limpiar_sesiones_expiradas()
RETURNS TABLE(
    sesiones_limpiadas INT,
    sesiones_revocadas INT,
    mensaje TEXT
) AS $$
DECLARE
    v_limpiadas INT := 0;
    v_revocadas INT := 0;
BEGIN
    -- Marcar como revocadas las sesiones expiradas que no estaban revocadas
    UPDATE SESIONES_USUARIO
    SET revocado = TRUE,
        revocado_en = NOW(),
        motivo_revocacion = 'EXPIRACION_AUTOMATICA'
    WHERE expires_at < NOW()
      AND revocado = FALSE;
    
    GET DIAGNOSTICS v_revocadas = ROW_COUNT;
    
    -- Eliminar sesiones expiradas hace más de 30 días (limpieza histórica)
    DELETE FROM SESIONES_USUARIO
    WHERE expires_at < NOW() - INTERVAL '30 days'
      AND revocado = TRUE;
    
    GET DIAGNOSTICS v_limpiadas = ROW_COUNT;
    
    -- Registrar en estadísticas de uso
    INSERT INTO ESTADISTICAS_USO (
        id, fecha, entidad_id, metrica, valor, dimensiones
    ) VALUES (
        gen_random_uuid(),
        CURRENT_DATE,
        NULL, -- Métrica global
        'sesiones_limpiadas',
        v_limpiadas + v_revocadas,
        jsonb_build_object(
            'revocadas', v_revocadas,
            'eliminadas', v_limpiadas,
            'fecha_proceso', NOW()
        )
    );
    
    RETURN QUERY SELECT 
        v_limpiadas,
        v_revocadas,
        FORMAT('Limpieza completada: %s sesiones revocadas, %s eliminadas', 
               v_revocadas, v_limpiadas)::TEXT;
END;
$$ LANGUAGE plpgsql;
```

#### Procedimiento: generar_reporte_consolidado

**Propósito:** Generar reporte consolidado de evaluaciones para múltiples escuelas de una entidad.

```sql
CREATE OR REPLACE FUNCTION sp_generar_reporte_consolidado(
    p_entidad_id UUID,
    p_periodo_id UUID,
    p_nivel_educativo VARCHAR(50) DEFAULT NULL,
    p_formato VARCHAR(10) DEFAULT 'JSON'
)
RETURNS TABLE(
    reporte_id UUID,
    total_escuelas INT,
    total_evaluaciones INT,
    promedio_entidad NUMERIC(4,2),
    contenido JSONB,
    mensaje TEXT
) AS $$
DECLARE
    v_reporte_id UUID := gen_random_uuid();
    v_total_escuelas INT;
    v_total_evaluaciones INT;
    v_promedio NUMERIC(4,2);
    v_contenido JSONB;
BEGIN
    -- Calcular estadísticas consolidadas
    SELECT 
        COUNT(DISTINCT e.escuela_id),
        COUNT(*),
        ROUND(AVG(e.valoracion), 2)
    INTO 
        v_total_escuelas,
        v_total_evaluaciones,
        v_promedio
    FROM EVALUACIONES e
    JOIN ESCUELAS esc ON e.escuela_id = esc.id
    WHERE esc.entidad_id = p_entidad_id
      AND e.periodo_id = p_periodo_id
      AND (p_nivel_educativo IS NULL OR e.nivel_educativo = p_nivel_educativo);
    
    -- Construir contenido JSON con detalle por escuela
    SELECT jsonb_build_object(
        'entidad_id', p_entidad_id,
        'periodo_id', p_periodo_id,
        'nivel_educativo', COALESCE(p_nivel_educativo, 'TODOS'),
        'fecha_generacion', NOW(),
        'resumen', jsonb_build_object(
            'total_escuelas', v_total_escuelas,
            'total_evaluaciones', v_total_evaluaciones,
            'promedio_general', v_promedio
        ),
        'detalle_escuelas', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cct', esc.cct,
                    'nombre', esc.nombre,
                    'total_evaluaciones', COUNT(*),
                    'promedio', ROUND(AVG(e.valoracion), 2),
                    'distribucion', jsonb_build_object(
                        'critico', COUNT(*) FILTER (WHERE e.valoracion = 0),
                        'bajo', COUNT(*) FILTER (WHERE e.valoracion = 1),
                        'medio', COUNT(*) FILTER (WHERE e.valoracion = 2),
                        'destacado', COUNT(*) FILTER (WHERE e.valoracion = 3)
                    )
                )
            )
            FROM EVALUACIONES e
            JOIN ESCUELAS esc ON e.escuela_id = esc.id
            WHERE esc.entidad_id = p_entidad_id
              AND e.periodo_id = p_periodo_id
              AND (p_nivel_educativo IS NULL OR e.nivel_educativo = p_nivel_educativo)
            GROUP BY esc.id, esc.cct, esc.nombre
        )
    ) INTO v_contenido;
    
    -- Crear registro de reporte generado
    INSERT INTO REPORTES_GENERADOS (
        id, escuela_id, periodo_id, tipo_reporte, formato, estado,
        ruta_archivo, contenido_json, generado_en, solicitado_en
    ) VALUES (
        v_reporte_id,
        NULL, -- Reporte consolidado, no es de una escuela específica
        p_periodo_id,
        'CONSOLIDADO_ENTIDAD',
        p_formato,
        'DISPONIBLE',
        FORMAT('/reportes/consolidado_%s_%s_%s.%s', 
               p_entidad_id, p_periodo_id, TO_CHAR(NOW(), 'YYYYMMDD'), LOWER(p_formato)),
        v_contenido,
        NOW(),
        NOW()
    );
    
    RETURN QUERY SELECT 
        v_reporte_id,
        v_total_escuelas,
        v_total_evaluaciones,
        v_promedio,
        v_contenido,
        FORMAT('Reporte consolidado generado: %s escuelas, %s evaluaciones', 
               v_total_escuelas, v_total_evaluaciones)::TEXT;
END;
$$ LANGUAGE plpgsql;
```

#### Procedimiento: sincronizar_catalogos_externos

**Propósito:** Sincronizar catálogos desde fuentes externas (entidades, escuelas, niveles).

```sql
CREATE OR REPLACE FUNCTION sp_sincronizar_catalogos_externos(
    p_catalogo VARCHAR(50),
    p_datos JSONB,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS TABLE(
    registros_nuevos INT,
    registros_actualizados INT,
    registros_desactivados INT,
    mensaje TEXT,
    errores JSONB
) AS $$
DECLARE
    v_nuevos INT := 0;
    v_actualizados INT := 0;
    v_desactivados INT := 0;
    v_errores JSONB := '[]'::JSONB;
BEGIN
    IF p_catalogo = 'ENTIDADES' THEN
        -- Sincronizar entidades federativas
        WITH datos_externos AS (
            SELECT 
                (rec->>'clave')::VARCHAR(2) AS clave,
                (rec->>'nombre')::VARCHAR(100) AS nombre,
                (rec->>'activo')::BOOLEAN AS activo
            FROM jsonb_array_elements(p_datos) AS rec
        )
        -- Insertar nuevas
        INSERT INTO ENTIDADES (id, clave, nombre, activo, created_at)
        SELECT gen_random_uuid(), clave, nombre, activo, NOW()
        FROM datos_externos
        WHERE clave NOT IN (SELECT clave FROM ENTIDADES)
        ON CONFLICT (clave) DO NOTHING;
        
        GET DIAGNOSTICS v_nuevos = ROW_COUNT;
        
        -- Actualizar existentes
        WITH datos_externos AS (
            SELECT 
                (rec->>'clave')::VARCHAR(2) AS clave,
                (rec->>'nombre')::VARCHAR(100) AS nombre,
                (rec->>'activo')::BOOLEAN AS activo
            FROM jsonb_array_elements(p_datos) AS rec
        )
        UPDATE ENTIDADES e
        SET nombre = de.nombre,
            activo = de.activo,
            updated_at = NOW()
        FROM datos_externos de
        WHERE e.clave = de.clave
          AND (e.nombre != de.nombre OR e.activo != de.activo);
        
        GET DIAGNOSTICS v_actualizados = ROW_COUNT;
        
    ELSIF p_catalogo = 'ESCUELAS' THEN
        -- Sincronizar escuelas desde sistema externo
        WITH datos_externos AS (
            SELECT 
                (rec->>'cct')::VARCHAR(10) AS cct,
                (rec->>'nombre')::VARCHAR(200) AS nombre,
                (rec->>'entidad_clave')::VARCHAR(2) AS entidad_clave,
                (rec->>'nivel_educativo')::VARCHAR(50) AS nivel_educativo,
                (rec->>'turno')::VARCHAR(20) AS turno,
                (rec->>'total_alumnos')::INT AS total_alumnos,
                (rec->>'activo')::BOOLEAN AS activo
            FROM jsonb_array_elements(p_datos) AS rec
        )
        INSERT INTO ESCUELAS (
            id, cct, nombre, entidad_id, nivel_educativo, turno, 
            total_alumnos, activo, created_at
        )
        SELECT 
            gen_random_uuid(),
            de.cct,
            de.nombre,
            (SELECT id FROM ENTIDADES WHERE clave = de.entidad_clave),
            de.nivel_educativo,
            de.turno,
            de.total_alumnos,
            de.activo,
            NOW()
        FROM datos_externos de
        WHERE de.cct NOT IN (SELECT cct FROM ESCUELAS)
        ON CONFLICT (cct) DO NOTHING;
        
        GET DIAGNOSTICS v_nuevos = ROW_COUNT;
        
        -- Actualizar existentes
        WITH datos_externos AS (
            SELECT 
                (rec->>'cct')::VARCHAR(10) AS cct,
                (rec->>'nombre')::VARCHAR(200) AS nombre,
                (rec->>'total_alumnos')::INT AS total_alumnos,
                (rec->>'activo')::BOOLEAN AS activo
            FROM jsonb_array_elements(p_datos) AS rec
        )
        UPDATE ESCUELAS e
        SET nombre = de.nombre,
            total_alumnos = de.total_alumnos,
            activo = de.activo,
            updated_at = NOW()
        FROM datos_externos de
        WHERE e.cct = de.cct;
        
        GET DIAGNOSTICS v_actualizados = ROW_COUNT;
        
    ELSE
        RETURN QUERY SELECT 
            0, 0, 0,
            FORMAT('Catálogo desconocido: %s', p_catalogo)::TEXT,
            jsonb_build_array(jsonb_build_object('error', 'CATALOGO_INVALIDO'));
        RETURN;
    END IF;
    
    -- Registrar sincronización en bitácora
    INSERT INTO BITACORA_DETALLADA (
        usuario_id, accion, descripcion, modulo, resultado, fecha, metadatos
    ) VALUES (
        p_usuario_id,
        'SINCRONIZAR_CATALOGO',
        FORMAT('Catálogo %s sincronizado', p_catalogo),
        'SINCRONIZACION',
        'EXITO',
        NOW(),
        jsonb_build_object(
            'catalogo', p_catalogo,
            'nuevos', v_nuevos,
            'actualizados', v_actualizados
        )
    );
    
    RETURN QUERY SELECT 
        v_nuevos,
        v_actualizados,
        v_desactivados,
        FORMAT('Sincronización completada: %s nuevos, %s actualizados', 
               v_nuevos, v_actualizados)::TEXT,
        v_errores;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        0, 0, 0,
        FORMAT('Error en sincronización: %s', SQLERRM)::TEXT,
        jsonb_build_array(jsonb_build_object('error', SQLERRM));
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Scripts de Migración DDL - Corrección de Problemas de Diseño

### Problema 1: Inconsistencia en tipos de ID - Unificar a UUID

#### Migración de GRUPOS (INT → UUID)

```sql
-- Paso 1: Crear columna temporal UUID en GRUPOS
ALTER TABLE GRUPOS ADD COLUMN id_nuevo UUID DEFAULT gen_random_uuid();

-- Paso 2: Crear tabla de mapeo temporal para migración de referencias
CREATE TEMP TABLE mapeo_grupos (
    id_antiguo INT,
    id_nuevo UUID
);

INSERT INTO mapeo_grupos (id_antiguo, id_nuevo)
SELECT id_grupo, id_nuevo FROM GRUPOS;

-- Paso 3: Actualizar ESTUDIANTES con nuevos UUIDs de grupos
ALTER TABLE ESTUDIANTES ADD COLUMN grupo_id_nuevo UUID;

UPDATE ESTUDIANTES e
SET grupo_id_nuevo = m.id_nuevo
FROM mapeo_grupos m
WHERE e.grupo_id = m.id_antiguo;

-- Paso 4: Eliminar constraints antiguos
ALTER TABLE ESTUDIANTES DROP CONSTRAINT IF EXISTS fk_estudiantes_grupo;

-- Paso 5: Eliminar columnas antiguas y renombrar
ALTER TABLE ESTUDIANTES DROP COLUMN grupo_id;
ALTER TABLE ESTUDIANTES RENAME COLUMN grupo_id_nuevo TO grupo_id;

ALTER TABLE GRUPOS DROP CONSTRAINT IF EXISTS grupos_pkey;
ALTER TABLE GRUPOS DROP COLUMN id_grupo;
ALTER TABLE GRUPOS RENAME COLUMN id_nuevo TO id;

-- Paso 6: Agregar nuevos constraints
ALTER TABLE GRUPOS ADD PRIMARY KEY (id);
ALTER TABLE ESTUDIANTES ADD CONSTRAINT fk_estudiantes_grupo 
    FOREIGN KEY (grupo_id) REFERENCES GRUPOS(id) ON DELETE RESTRICT;

-- Paso 7: Limpiar
DROP TABLE mapeo_grupos;
```

#### Migración de MATERIAS (VARCHAR → UUID)

```sql
-- Paso 1: Agregar columna UUID en MATERIAS
ALTER TABLE MATERIAS ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Paso 2: Mapeo temporal
CREATE TEMP TABLE mapeo_materias (
    codigo_antiguo VARCHAR(10),
    id_nuevo UUID
);

INSERT INTO mapeo_materias (codigo_antiguo, id_nuevo)
SELECT codigo, id FROM MATERIAS;

-- Paso 3: Actualizar VALORACIONES
ALTER TABLE VALORACIONES ADD COLUMN materia_id_nuevo UUID;

UPDATE VALORACIONES v
SET materia_id_nuevo = m.id_nuevo
FROM mapeo_materias m
WHERE v.materia_id::VARCHAR = m.codigo_antiguo;

-- Paso 4: Actualizar EVALUACIONES
ALTER TABLE EVALUACIONES ADD COLUMN materia_id_nuevo UUID;

UPDATE EVALUACIONES e
SET materia_id_nuevo = m.id_nuevo
FROM mapeo_materias m
WHERE e.materia_id = m.codigo_antiguo::INT;

-- Paso 5: Actualizar COMPETENCIAS
ALTER TABLE COMPETENCIAS ADD COLUMN id_materia_nuevo UUID;

UPDATE COMPETENCIAS c
SET id_materia_nuevo = m.id_nuevo
FROM mapeo_materias m
WHERE c.id_materia = m.codigo_antiguo::INT;

-- Paso 6: Drop y rename
ALTER TABLE VALORACIONES DROP COLUMN materia_id;
ALTER TABLE VALORACIONES RENAME COLUMN materia_id_nuevo TO materia_id;

ALTER TABLE EVALUACIONES DROP COLUMN materia_id;
ALTER TABLE EVALUACIONES RENAME COLUMN materia_id_nuevo TO materia_id;

ALTER TABLE COMPETENCIAS DROP COLUMN id_materia;
ALTER TABLE COMPETENCIAS RENAME COLUMN id_materia_nuevo TO id_materia;

-- Paso 7: Establecer PK en MATERIAS
ALTER TABLE MATERIAS DROP CONSTRAINT IF EXISTS materias_pkey;
ALTER TABLE MATERIAS ADD PRIMARY KEY (id);

-- Paso 8: Mantener codigo como UNIQUE pero no PK
ALTER TABLE MATERIAS ADD CONSTRAINT uq_materias_codigo UNIQUE (codigo);

-- Paso 9: Agregar FKs
ALTER TABLE VALORACIONES ADD CONSTRAINT fk_valoraciones_materia 
    FOREIGN KEY (materia_id) REFERENCES MATERIAS(id);
ALTER TABLE EVALUACIONES ADD CONSTRAINT fk_evaluaciones_materia 
    FOREIGN KEY (materia_id) REFERENCES MATERIAS(id);
ALTER TABLE COMPETENCIAS ADD CONSTRAINT fk_competencias_materia 
    FOREIGN KEY (id_materia) REFERENCES MATERIAS(id);

-- Paso 10: Limpiar
DROP TABLE mapeo_materias;
```

#### Migración de PERIODOS_EVALUACION (INT → UUID)

```sql
-- Paso 1: Agregar UUID en PERIODOS_EVALUACION
ALTER TABLE PERIODOS_EVALUACION ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Paso 2: Mapeo temporal
CREATE TEMP TABLE mapeo_periodos (
    id_antiguo INT,
    id_nuevo UUID
);

INSERT INTO mapeo_periodos (id_antiguo, id_nuevo)
SELECT id_periodo, id FROM PERIODOS_EVALUACION;

-- Paso 3: Actualizar VALORACIONES
ALTER TABLE VALORACIONES ADD COLUMN periodo_id_nuevo UUID;

UPDATE VALORACIONES v
SET periodo_id_nuevo = m.id_nuevo
FROM mapeo_periodos m
WHERE v.periodo_id = m.id_antiguo;

-- Paso 4: Actualizar EVALUACIONES
ALTER TABLE EVALUACIONES ADD COLUMN periodo_id_nuevo UUID;

UPDATE EVALUACIONES e
SET periodo_id_nuevo = m.id_nuevo
FROM mapeo_periodos m
WHERE e.periodo_id = m.id_antiguo;

-- Paso 5: Actualizar REPORTES_GENERADOS
ALTER TABLE REPORTES_GENERADOS ADD COLUMN periodo_id_nuevo UUID;

UPDATE REPORTES_GENERADOS r
SET periodo_id_nuevo = m.id_nuevo
FROM mapeo_periodos m
WHERE r.periodo_id = m.id_antiguo;

-- Paso 6: Drop y rename
ALTER TABLE VALORACIONES DROP COLUMN periodo_id;
ALTER TABLE VALORACIONES RENAME COLUMN periodo_id_nuevo TO periodo_id;

ALTER TABLE EVALUACIONES DROP COLUMN periodo_id;
ALTER TABLE EVALUACIONES RENAME COLUMN periodo_id_nuevo TO periodo_id;

ALTER TABLE REPORTES_GENERADOS DROP COLUMN periodo_id;
ALTER TABLE REPORTES_GENERADOS RENAME COLUMN periodo_id_nuevo TO periodo_id;

ALTER TABLE PERIODOS_EVALUACION DROP CONSTRAINT IF EXISTS periodos_evaluacion_pkey;
ALTER TABLE PERIODOS_EVALUACION DROP COLUMN id_periodo;
ALTER TABLE PERIODOS_EVALUACION RENAME COLUMN id TO id;

-- Paso 7: Establecer PK
ALTER TABLE PERIODOS_EVALUACION ADD PRIMARY KEY (id);

-- Paso 8: Agregar FKs
ALTER TABLE VALORACIONES ADD CONSTRAINT fk_valoraciones_periodo 
    FOREIGN KEY (periodo_id) REFERENCES PERIODOS_EVALUACION(id);
ALTER TABLE EVALUACIONES ADD CONSTRAINT fk_evaluaciones_periodo 
    FOREIGN KEY (periodo_id) REFERENCES PERIODOS_EVALUACION(id);
ALTER TABLE REPORTES_GENERADOS ADD CONSTRAINT fk_reportes_periodo 
    FOREIGN KEY (periodo_id) REFERENCES PERIODOS_EVALUACION(id);

-- Paso 9: Limpiar
DROP TABLE mapeo_periodos;
```

### Problema 2: Campo rol en USUARIOS debe ser FK a CAT_ROLES_USUARIO

```sql
-- Paso 1: Crear mapeo de roles VARCHAR → INT
CREATE TEMP TABLE mapeo_roles (
    codigo_rol VARCHAR(20),
    id_rol INT
);

INSERT INTO mapeo_roles (codigo_rol, id_rol)
SELECT codigo, id FROM CAT_ROLES_USUARIO;

-- Paso 2: Agregar nueva columna rol_id en USUARIOS
ALTER TABLE USUARIOS ADD COLUMN rol_id INT;

-- Paso 3: Migrar datos usando mapeo
UPDATE USUARIOS u
SET rol_id = m.id_rol
FROM mapeo_roles m
WHERE u.rol = m.codigo_rol;

-- Paso 4: Verificar que todos los usuarios tienen rol_id asignado
SELECT COUNT(*) FROM USUARIOS WHERE rol_id IS NULL;
-- Si hay NULLs, asignar rol por defecto:
-- UPDATE USUARIOS SET rol_id = (SELECT id FROM CAT_ROLES_USUARIO WHERE codigo = 'DIRECTOR') WHERE rol_id IS NULL;

-- Paso 5: Eliminar columna antigua y renombrar
ALTER TABLE USUARIOS DROP COLUMN rol;
ALTER TABLE USUARIOS RENAME COLUMN rol_id TO rol;

-- Paso 6: Establecer NOT NULL y FK
ALTER TABLE USUARIOS ALTER COLUMN rol SET NOT NULL;
ALTER TABLE USUARIOS ADD CONSTRAINT fk_usuarios_rol 
    FOREIGN KEY (rol) REFERENCES CAT_ROLES_USUARIO(id) ON DELETE RESTRICT;

-- Paso 7: Agregar índice
CREATE INDEX idx_usuarios_rol ON USUARIOS(rol, activo);

-- Paso 8: Limpiar
DROP TABLE mapeo_roles;
```

### Problema 3: Tabla GRUPOS mal relacionada

```sql
-- Paso 1: Agregar escuela_id en GRUPOS
ALTER TABLE GRUPOS ADD COLUMN escuela_id UUID;

-- Paso 2: Migrar escuela_id desde ESTUDIANTES (inferir escuela del grupo)
-- Opción A: Si cada grupo pertenece a una sola escuela (lo correcto)
UPDATE GRUPOS g
SET escuela_id = (
    SELECT e.escuela_id
    FROM ESTUDIANTES est
    INNER JOIN USUARIOS u ON est.grupo_id = g.id
    WHERE est.grupo_id = g.id
    LIMIT 1
);

-- Opción B: Si no hay datos de estudiantes, asignar manualmente o desde otra fuente
-- UPDATE GRUPOS SET escuela_id = (SELECT id FROM ESCUELAS WHERE cct = 'XXXXX') WHERE ...;

-- Paso 3: Establecer NOT NULL (después de migrar datos)
ALTER TABLE GRUPOS ALTER COLUMN escuela_id SET NOT NULL;

-- Paso 4: Agregar FK
ALTER TABLE GRUPOS ADD CONSTRAINT fk_grupos_escuela 
    FOREIGN KEY (escuela_id) REFERENCES ESCUELAS(id) ON DELETE CASCADE;

-- Paso 5: Eliminar id_rol que no tiene sentido
ALTER TABLE GRUPOS DROP COLUMN IF EXISTS id_rol;

-- Paso 6: Agregar grado_id si no existe
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS grado_id INT;

-- Migrar datos de grado_numero a grado_id usando mapeo
UPDATE GRUPOS g
SET grado_id = (
    SELECT id 
    FROM CAT_GRADOS 
    WHERE grado = g.grado_numero 
      AND nivel_educativo = g.nivel_educativo
    LIMIT 1
);

ALTER TABLE GRUPOS ADD CONSTRAINT fk_grupos_grado 
    FOREIGN KEY (grado_id) REFERENCES CAT_GRADOS(id);

-- Paso 7: Agregar campos adicionales
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS turno VARCHAR(20);
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS total_alumnos INT DEFAULT 0;
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE GRUPOS ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Paso 8: Agregar constraint UNIQUE en escuela_id + nombre
ALTER TABLE GRUPOS ADD CONSTRAINT uq_grupos_escuela_nombre 
    UNIQUE (escuela_id, nombre);

-- Paso 9: Agregar índices
CREATE INDEX idx_grupos_escuela_grado ON GRUPOS(escuela_id, grado_id);
CREATE INDEX idx_grupos_activo ON GRUPOS(activo) WHERE activo = TRUE;
```

### Problema 4: Falta password_hash en USUARIOS

```sql
-- Paso 1: Agregar campos de contraseña
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS password_debe_cambiar BOOLEAN DEFAULT TRUE;
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS ultimo_cambio_password TIMESTAMP;
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;

-- Paso 2: Generar contraseñas temporales para usuarios existentes
-- IMPORTANTE: Ejecutar esto en un script separado y enviar credenciales por email

CREATE OR REPLACE FUNCTION fn_generar_password_temporal_masiva()
RETURNS TABLE(usuario_id UUID, email VARCHAR, password_temporal VARCHAR) AS $$
DECLARE
    v_usuario RECORD;
    v_password VARCHAR(20);
    v_hash VARCHAR(255);
BEGIN
    FOR v_usuario IN SELECT id, email FROM USUARIOS WHERE password_hash IS NULL LOOP
        -- Generar password temporal (en producción usar librería crypto segura)
        v_password := 'Temp' || SUBSTRING(MD5(v_usuario.email || NOW()::TEXT) FROM 1 FOR 12) || '!';
        
        -- Hashear (en producción usar bcrypt desde la aplicación)
        -- Este es solo un placeholder, DEBE hashearse con bcrypt desde Python/Node
        v_hash := 'PENDING_HASH_' || v_password;
        
        -- Actualizar usuario
        UPDATE USUARIOS
        SET password_hash = v_hash,
            password_debe_cambiar = TRUE,
            ultimo_cambio_password = NOW()
        WHERE id = v_usuario.id;
        
        -- Crear registro en HISTORICO_PASSWORDS
        INSERT INTO HISTORICO_PASSWORDS (
            id, usuario_id, password_hash, es_temporal,
            generada_en, expira_en, cambiada_por, activa
        ) VALUES (
            gen_random_uuid(),
            v_usuario.id,
            v_hash,
            TRUE,
            NOW(),
            NOW() + INTERVAL '72 hours',
            'SISTEMA',
            TRUE
        );
        
        -- Retornar para envío de email
        RETURN QUERY SELECT v_usuario.id, v_usuario.email, v_password;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración (comentar después de ejecutar)
-- SELECT * FROM fn_generar_password_temporal_masiva();

-- Paso 3: Establecer NOT NULL en password_hash (después de migración)
ALTER TABLE USUARIOS ALTER COLUMN password_hash SET NOT NULL;

-- Paso 4: Agregar índice para bloqueos
CREATE INDEX idx_usuarios_bloqueado ON USUARIOS(bloqueado_hasta) 
    WHERE bloqueado_hasta > NOW();

-- Paso 5: Cambiar estatus CHAR(1) a activo BOOLEAN
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS activo BOOLEAN;

UPDATE USUARIOS
SET activo = CASE 
    WHEN estatus = 'A' THEN TRUE
    WHEN estatus = 'I' THEN FALSE
    ELSE TRUE
END;

ALTER TABLE USUARIOS DROP COLUMN IF EXISTS estatus;
ALTER TABLE USUARIOS ALTER COLUMN activo SET DEFAULT TRUE;
ALTER TABLE USUARIOS ALTER COLUMN activo SET NOT NULL;

-- Paso 6: Agregar timestamps si no existen
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE USUARIOS ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Paso 7: Crear trigger para updated_at
CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON USUARIOS
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_updated_at();
```

### Script de Verificación Post-Migración

```sql
-- Verificar integridad referencial
DO $$
DECLARE
    v_errors TEXT := '';
BEGIN
    -- 1. Verificar UUIDs en GRUPOS
    IF EXISTS (SELECT 1 FROM GRUPOS WHERE id IS NULL) THEN
        v_errors := v_errors || 'ERROR: GRUPOS tiene registros con id NULL' || E'\n';
    END IF;
    
    -- 2. Verificar FK rol en USUARIOS
    IF EXISTS (SELECT 1 FROM USUARIOS WHERE rol NOT IN (SELECT id FROM CAT_ROLES_USUARIO)) THEN
        v_errors := v_errors || 'ERROR: USUARIOS tiene roles no válidos' || E'\n';
    END IF;
    
    -- 3. Verificar escuela_id en GRUPOS
    IF EXISTS (SELECT 1 FROM GRUPOS WHERE escuela_id IS NULL) THEN
        v_errors := v_errors || 'ERROR: GRUPOS tiene registros sin escuela_id' || E'\n';
    END IF;
    
    -- 4. Verificar password_hash en USUARIOS
    IF EXISTS (SELECT 1 FROM USUARIOS WHERE password_hash IS NULL) THEN
        v_errors := v_errors || 'ERROR: USUARIOS tiene registros sin password_hash' || E'\n';
    END IF;
    
    -- 5. Verificar constraints UNIQUE
    IF EXISTS (
        SELECT escuela_id, nombre, COUNT(*)
        FROM GRUPOS
        GROUP BY escuela_id, nombre
        HAVING COUNT(*) > 1
    ) THEN
        v_errors := v_errors || 'ERROR: GRUPOS tiene duplicados en escuela_id + nombre' || E'\n';
    END IF;
    
    IF LENGTH(v_errors) > 0 THEN
        RAISE EXCEPTION E'Errores de migración:\n%', v_errors;
    ELSE
        RAISE NOTICE 'Migración completada exitosamente. Todas las verificaciones pasaron.';
    END IF;
END $$;
```

### Notas Importantes de Migración

1. **Backup obligatorio**: Ejecutar `pg_dump` antes de cualquier migración.
2. **Orden de ejecución**: Ejecutar scripts en el orden presentado.
3. **Downtime**: Estas migraciones requieren mantenimiento programado.
4. **Testing**: Probar en ambiente de staging antes de producción.
5. **Passwords temporales**: DEBE implementarse hashing seguro desde la aplicación (bcrypt/argon2).
6. **Notificaciones**: Enviar emails con credenciales temporales a todos los usuarios migrados.
7. **Rollback plan**: Mantener scripts de reversión preparados.

---
