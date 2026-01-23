--
-- DDL generated from ESTRUCTURA_DE_DATOS.md (12-ene-2026)
--

SET client_encoding = 'UTF8';
SET standard_conforming_strings = ON;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO public;


-- =====================================================================
-- ENUM CATALOG MIRRORS (ENUM types replaced by catalog FKs)
-- =====================================================================

CREATE TABLE cat_nivel_educativo (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_nivel_educativo (codigo, descripcion, orden)
SELECT val AS codigo,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')) AS descripcion,
	   ord AS orden
FROM unnest(ARRAY['PREESCOLAR','PRIMARIA','SECUNDARIA','TELESECUNDARIA']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_estado_archivo (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_archivo (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['CARGADO','VALIDADO','PROCESADO','ERROR']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_estado_archivo_temporal (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_archivo_temporal (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['PENDIENTE','PROCESANDO','COMPLETADO','ERROR']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_tipo_bloqueo (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_tipo_bloqueo (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['AUTOMATICO','MANUAL','PERMANENTE']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_operacion_auditoria (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_operacion_auditoria (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['INSERT','UPDATE','DELETE']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_tipo_configuracion (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_tipo_configuracion (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['STRING','INTEGER','BOOLEAN','JSON']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_origen_cambio_password (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_origen_cambio_password (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['SISTEMA','USUARIO','ADMIN','RECUPERACION']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_estado_validacion_eia2 (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_validacion_eia2 (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['VALIDO','INVALIDO']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_tipo_reporte (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_tipo_reporte (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['ENS','HYC','LEN','SPC','F5']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_tipo_notificacion (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_tipo_notificacion (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(REPLACE(LOWER(val::TEXT), '_', ' '), 'eia2', 'EIA2')),
	   ord
FROM unnest(ARRAY['RESULTADO_LISTO','TICKET_CREADO','TICKET_ACTUALIZADO','TICKET_RESUELTO','RECUPERACION_PASSWORD','CREDENCIALES_EIA2','EVALUACION_VALIDADA']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_estado_notificacion (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_notificacion (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['PENDIENTE','ENVIADO','ERROR','REINTENTANDO']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_prioridad_notificacion (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_prioridad_notificacion (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['ALTA','MEDIA','BAJA']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_referencia_tipo_notificacion (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_referencia_tipo_notificacion (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['TICKET','REPORTE','USUARIO','EVALUACION','CREDENCIAL']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_motivo_fallo_login (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_motivo_fallo_login (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['USUARIO_INVALIDO','PASSWORD_INCORRECTO','CUENTA_BLOQUEADA','CUENTA_INACTIVA','CUENTA_ELIMINADA','PASSWORD_EXPIRADO']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE cat_estado_ticket (
	id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden SMALLINT NOT NULL,
	activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cat_estado_ticket (codigo, descripcion, orden)
SELECT val,
	INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
	   ord
FROM unnest(ARRAY['ABIERTO','EN_PROCESO','RESUELTO','CERRADO']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

-- Helper para obtener IDs de catálogos por código canónico
CREATE OR REPLACE FUNCTION fn_catalogo_id(p_catalogo TEXT, p_codigo TEXT)
RETURNS SMALLINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_id SMALLINT;
BEGIN
	EXECUTE format('SELECT id FROM %I WHERE codigo = $1', p_catalogo)
	INTO v_id
	USING p_codigo;
	IF v_id IS NULL THEN
		RAISE EXCEPTION 'Código % no encontrado en catálogo %', p_codigo, p_catalogo;
	END IF;
	RETURN v_id;
END;
$$;

-- =====================================================================
-- SEQUENCES
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS seq_solicitudes_eia2_consecutivo START 1;

-- =====================================================================
-- CATALOG TABLES
-- =====================================================================

CREATE TABLE cat_ciclos_escolares (
	id_ciclo           INT PRIMARY KEY,
	nombre             VARCHAR(20) NOT NULL UNIQUE,
	fecha_inicio       DATE NOT NULL,
	fecha_fin          DATE NOT NULL,
	activo             BOOLEAN NOT NULL DEFAULT FALSE,
	created_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_cat_ciclos_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE cat_entidades_federativas (
	id_entidad   INT PRIMARY KEY,
	nombre       VARCHAR(100) NOT NULL,
	abreviatura  VARCHAR(10) NOT NULL UNIQUE,
	codigo_sep   VARCHAR(5) NOT NULL UNIQUE,
	region       VARCHAR(50)
);

CREATE TABLE cat_niveles_educativos (
	id_nivel    INT PRIMARY KEY,
	nombre      VARCHAR(50) NOT NULL,
	codigo      VARCHAR(10) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	orden       INT
);

CREATE TABLE cat_turnos (
	id_turno    INT PRIMARY KEY,
	nombre      VARCHAR(50) NOT NULL,
	codigo      VARCHAR(10) NOT NULL UNIQUE,
	descripcion VARCHAR(100)
);

CREATE TABLE cat_grados (
	id_grado        INT PRIMARY KEY,
	nivel_educativo SMALLINT NOT NULL REFERENCES cat_nivel_educativo(id),
	grado_numero    INT NOT NULL,
	grado_nombre    VARCHAR(20) NOT NULL,
	orden           INT,
	CONSTRAINT uq_cat_grados UNIQUE (nivel_educativo, grado_numero)
);

CREATE TABLE cat_roles_usuario (
	id_rol      INT PRIMARY KEY,
	nombre      VARCHAR(50) NOT NULL,
	codigo      VARCHAR(20) NOT NULL UNIQUE,
	descripcion VARCHAR(200),
	permisos    JSONB NOT NULL DEFAULT '{}'::JSONB,
	created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE materias (
	id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	codigo            VARCHAR(10) NOT NULL UNIQUE,
	nombre            VARCHAR(100) NOT NULL,
	nivel_educativo   SMALLINT NOT NULL REFERENCES cat_nivel_educativo(id),
	orden             INT,
	activa            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE competencias (
	id_competencia INT PRIMARY KEY,
	id_materia     UUID NOT NULL REFERENCES materias(id),
	codigo         VARCHAR(20) NOT NULL,
	descripcion    VARCHAR(500) NOT NULL,
	nivel_esperado INT NOT NULL,
	UNIQUE (id_materia, codigo)
);

-- =====================================================================
-- CORE ENTITIES
-- =====================================================================

CREATE TABLE escuelas (
	id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	cct            VARCHAR(10) NOT NULL,
	nombre         VARCHAR(150) NOT NULL,
	estado         VARCHAR(50),
	cp             VARCHAR(10),
	telefono       VARCHAR(15),
	email          VARCHAR(100),
	director       VARCHAR(150),
	fecha_registro TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
	activo         BOOLEAN NOT NULL DEFAULT TRUE,
	id_turno       INT NOT NULL REFERENCES cat_turnos(id_turno),
	id_nivel       INT NOT NULL REFERENCES cat_niveles_educativos(id_nivel),
	id_entidad     INT NOT NULL REFERENCES cat_entidades_federativas(id_entidad),
	id_ciclo       INT NOT NULL REFERENCES cat_ciclos_escolares(id_ciclo),
	created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_escuelas_cct UNIQUE (cct),
	CONSTRAINT chk_escuelas_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	CONSTRAINT chk_escuelas_cct_format CHECK (cct ~ '^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$')
);

CREATE TABLE grupos (
	id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	escuela_id      UUID NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
	grado_id        INT NOT NULL REFERENCES cat_grados(id_grado),
	nombre          VARCHAR(100) NOT NULL,
	nivel_educativo SMALLINT NOT NULL REFERENCES cat_nivel_educativo(id),
	grado_nombre    VARCHAR(20),
	grado_numero    INT,
	turno           VARCHAR(20),
	total_alumnos   INT NOT NULL DEFAULT 0,
	activo          BOOLEAN NOT NULL DEFAULT TRUE,
	created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	UNIQUE (escuela_id, nombre)
);

CREATE TABLE estudiantes (
	id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nombre           VARCHAR(150) NOT NULL,
	grupo_id         UUID NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
	curp             VARCHAR(18) NOT NULL UNIQUE,
	fecha_nacimiento DATE,
	estatus          CHAR(1) NOT NULL DEFAULT 'A',
	created_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
	id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nombre                 VARCHAR(60) NOT NULL,
	apepaterno             VARCHAR(60) NOT NULL,
	apematerno             VARCHAR(60),
	email                  VARCHAR(100) NOT NULL,
	password_hash          VARCHAR(255) NOT NULL,
	rol                    INT NOT NULL REFERENCES cat_roles_usuario(id_rol),
	escuela_id             UUID REFERENCES escuelas(id),
	password_debe_cambiar  BOOLEAN NOT NULL DEFAULT TRUE,
	ultimo_cambio_password TIMESTAMP,
	bloqueado_hasta        TIMESTAMP,
	activo                 BOOLEAN NOT NULL DEFAULT TRUE,
	preferencias_notif     JSONB NOT NULL DEFAULT '{}'::JSONB,
	fecha_registro         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	created_at             TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at             TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_usuarios_email UNIQUE (email)
);

CREATE TABLE historico_passwords (
	id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
	password_hash VARCHAR(255) NOT NULL,
	es_temporal   BOOLEAN NOT NULL DEFAULT FALSE,
	generada_en   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	expira_en     TIMESTAMP WITHOUT TIME ZONE,
	cambiada_en   TIMESTAMP WITHOUT TIME ZONE,
	cambiada_por  SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_origen_cambio_password','SISTEMA') REFERENCES cat_origen_cambio_password(id),
	ip_origen     VARCHAR(50),
	activa        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE bloqueos_ip (
	id               BIGSERIAL PRIMARY KEY,
	ip_address       INET NOT NULL,
	intentos_fallidos INT NOT NULL DEFAULT 0,
	motivo           VARCHAR(255),
	tipo_bloqueo     SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_tipo_bloqueo','AUTOMATICO') REFERENCES cat_tipo_bloqueo(id),
	bloqueado_desde  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	bloqueado_hasta  TIMESTAMP WITHOUT TIME ZONE,
	desbloqueado_por UUID REFERENCES usuarios(id),
	desbloqueado_en  TIMESTAMP WITHOUT TIME ZONE,
	activo           BOOLEAN NOT NULL DEFAULT TRUE,
	created_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE cambios_auditoria (
	id                BIGSERIAL PRIMARY KEY,
	tabla             VARCHAR(100) NOT NULL,
	registro_id       VARCHAR(100) NOT NULL,
	operacion         SMALLINT NOT NULL REFERENCES cat_operacion_auditoria(id),
	usuario_id        UUID REFERENCES usuarios(id),
	valores_anteriores JSONB,
	valores_nuevos    JSONB,
	ip_address        INET,
	user_agent        TEXT,
	metadata          JSONB,
	created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE log_actividades (
	id_log      BIGSERIAL PRIMARY KEY,
	id_usuario  UUID REFERENCES usuarios(id),
	fecha_hora  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	accion      VARCHAR(100) NOT NULL,
	tabla       VARCHAR(50),
	registro_id VARCHAR(100),
	detalle     JSONB,
	ip_address  INET,
	user_agent  TEXT,
	modulo      VARCHAR(100),
	resultado   VARCHAR(50),
	created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE configuraciones_sistema (
	id                   SERIAL PRIMARY KEY,
	categoria            VARCHAR(50) NOT NULL,
	clave                VARCHAR(100) NOT NULL UNIQUE,
	valor                TEXT NOT NULL,
	tipo_dato            SMALLINT NOT NULL REFERENCES cat_tipo_configuracion(id),
	descripcion          TEXT,
	editable_por_usuario BOOLEAN NOT NULL DEFAULT FALSE,
	requiere_reinicio    BOOLEAN NOT NULL DEFAULT FALSE,
	valor_por_defecto    TEXT,
	validacion_regex     VARCHAR(255),
	created_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	actualizado_por      UUID REFERENCES usuarios(id)
);

CREATE TABLE consentimientos_lgpdp (
	id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	estudiante_id            UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
	escuela_id               UUID NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
	tipo_consentimiento      VARCHAR(50) NOT NULL,
	consentimiento_otorgado  BOOLEAN NOT NULL,
	tutor_nombre             VARCHAR(150),
	tutor_firma_digital      TEXT,
	ip_address               INET,
	created_at               TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE periodos_evaluacion (
	id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nombre       VARCHAR(50) NOT NULL,
	ciclo_escolar VARCHAR(10) NOT NULL,
	fecha_inicio DATE NOT NULL,
	fecha_fin    DATE NOT NULL,
	activo       BOOLEAN NOT NULL DEFAULT FALSE,
	created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_periodos_fechas CHECK (fecha_fin > fecha_inicio),
	CONSTRAINT chk_periodos_duracion CHECK (fecha_fin <= fecha_inicio + INTERVAL '1 year')
);

CREATE TABLE archivos_frv (
	id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	escuela_id           UUID NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
	usuario_id           UUID REFERENCES usuarios(id),
	ciclo_escolar        VARCHAR(9) NOT NULL,
	nivel                SMALLINT NOT NULL REFERENCES cat_nivel_educativo(id),
	estado               SMALLINT NOT NULL REFERENCES cat_estado_archivo(id),
	file_path            VARCHAR(500) NOT NULL,
	filename_original    VARCHAR(255) NOT NULL,
	file_size            BIGINT NOT NULL,
	mime_type            VARCHAR(50),
	validacion_resultado JSONB,
	validado_en          TIMESTAMP WITHOUT TIME ZONE,
	procesado_en         TIMESTAMP WITHOUT TIME ZONE,
	total_estudiantes    INT,
	created_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE archivos_temporales (
	id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id        UUID NOT NULL REFERENCES usuarios(id),
	filename_original VARCHAR(255) NOT NULL,
	file_path_temp    VARCHAR(500) NOT NULL,
	file_size         BIGINT NOT NULL,
	mime_type         VARCHAR(50),
	chunk_actual      INT,
	chunks_totales    INT,
	hash_parcial      VARCHAR(64),
	estado            SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_estado_archivo_temporal','PENDIENTE') REFERENCES cat_estado_archivo_temporal(id),
	error_mensaje     TEXT,
	expira_en         TIMESTAMP WITHOUT TIME ZONE,
	created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE credenciales_eia2 (
	id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	cct                        VARCHAR(10) NOT NULL UNIQUE,
	correo_validado            VARCHAR(100) NOT NULL,
	password_hash              VARCHAR(255) NOT NULL,
	primera_carga_valida_fecha TIMESTAMP WITHOUT TIME ZONE,
	generado_en                TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	activo                     BOOLEAN NOT NULL DEFAULT TRUE,
	ultimo_acceso              TIMESTAMP WITHOUT TIME ZONE,
	created_at                 TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at                 TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE solicitudes_eia2 (
	id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	consecutivo              BIGINT NOT NULL DEFAULT nextval('seq_solicitudes_eia2_consecutivo'),
	cct                      VARCHAR(10) NOT NULL,
	credencial_id            UUID REFERENCES credenciales_eia2(id),
	archivo_original         VARCHAR(255) NOT NULL,
	fecha_carga              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	estado_validacion        SMALLINT NOT NULL REFERENCES cat_estado_validacion_eia2(id),
	errores_validacion       JSONB,
	archivo_path             VARCHAR(500) NOT NULL,
	archivo_size             BIGINT NOT NULL,
	procesado_externamente   BOOLEAN NOT NULL DEFAULT FALSE,
	fecha_procesamiento      TIMESTAMP WITHOUT TIME ZONE,
	resultado_path           VARCHAR(500),
	resultado_disponible_desde TIMESTAMP WITHOUT TIME ZONE,
	numero_estudiantes       INT,
	nivel_educativo          SMALLINT REFERENCES cat_nivel_educativo(id),
	created_at               TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at               TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	UNIQUE (consecutivo)
);

CREATE TABLE reportes_generados (
	id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	escuela_id       UUID NOT NULL REFERENCES escuelas(id) ON DELETE CASCADE,
	ciclo_escolar    VARCHAR(9) NOT NULL,
	periodo_id       UUID NOT NULL REFERENCES periodos_evaluacion(id),
	tipo_reporte     SMALLINT NOT NULL REFERENCES cat_tipo_reporte(id),
	grado            VARCHAR(20),
	grupo            VARCHAR(10),
	file_path        VARCHAR(500) NOT NULL,
	filename         VARCHAR(255) NOT NULL,
	file_size        BIGINT NOT NULL,
	checksum_sha256  VARCHAR(64) NOT NULL,
	generado_en      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	generado_por     VARCHAR(50) NOT NULL,
	descargado_en    TIMESTAMP WITHOUT TIME ZONE,
	descargado_por   UUID REFERENCES usuarios(id),
	total_descargas  INT NOT NULL DEFAULT 0,
	disponible_hasta TIMESTAMP WITHOUT TIME ZONE,
	comprimido       BOOLEAN NOT NULL DEFAULT FALSE,
	archivo_zip      VARCHAR(500),
	created_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE plantillas_email (
	id                   SERIAL PRIMARY KEY,
	codigo               VARCHAR(100) NOT NULL,
	nombre               VARCHAR(150) NOT NULL,
	tipo_notificacion    SMALLINT NOT NULL REFERENCES cat_tipo_notificacion(id),
	asunto_template      VARCHAR(255) NOT NULL,
	cuerpo_html          TEXT NOT NULL,
	cuerpo_texto         TEXT,
	variables_disponibles JSONB NOT NULL DEFAULT '[]'::JSONB,
	idioma               VARCHAR(10) NOT NULL DEFAULT 'es',
	activa               BOOLEAN NOT NULL DEFAULT TRUE,
	version              INT NOT NULL DEFAULT 1,
	created_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	actualizado_por      UUID REFERENCES usuarios(id),
	UNIQUE (codigo, version)
);

CREATE TABLE notificaciones_email (
	id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id       UUID REFERENCES usuarios(id),
	destinatario     VARCHAR(100) NOT NULL,
	asunto           VARCHAR(200) NOT NULL,
	cuerpo           TEXT NOT NULL,
	tipo             SMALLINT NOT NULL REFERENCES cat_tipo_notificacion(id),
	estado           SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_estado_notificacion','PENDIENTE') REFERENCES cat_estado_notificacion(id),
	prioridad        SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_prioridad_notificacion','MEDIA') REFERENCES cat_prioridad_notificacion(id),
	intentos         INT NOT NULL DEFAULT 0,
	max_intentos     INT NOT NULL DEFAULT 3,
	error_mensaje    TEXT,
	enviado_en       TIMESTAMP WITHOUT TIME ZONE,
	proximo_intento  TIMESTAMP WITHOUT TIME ZONE,
	referencia_id    UUID,
	referencia_tipo  SMALLINT REFERENCES cat_referencia_tipo_notificacion(id),
	adjuntos         JSONB NOT NULL DEFAULT '[]'::JSONB,
	created_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at       TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets_soporte (
	id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	numero_ticket  VARCHAR(20) NOT NULL UNIQUE,
	escuela_id     UUID REFERENCES escuelas(id),
	usuario_id     UUID REFERENCES usuarios(id),
	archivo_frv_id UUID REFERENCES archivos_frv(id),
	asunto         VARCHAR(200) NOT NULL,
	descripcion    TEXT NOT NULL,
	estado         SMALLINT NOT NULL DEFAULT fn_catalogo_id('cat_estado_ticket','ABIERTO') REFERENCES cat_estado_ticket(id),
	prioridad      VARCHAR(10) NOT NULL,
	asignado_a     UUID REFERENCES usuarios(id),
	asignado_en    TIMESTAMP WITHOUT TIME ZONE,
	resolucion     TEXT,
	resuelto_en    TIMESTAMP WITHOUT TIME ZONE,
	cerrado_en     TIMESTAMP WITHOUT TIME ZONE,
	created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE comentarios_ticket (
	id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	ticket_id          UUID NOT NULL REFERENCES tickets_soporte(id) ON DELETE CASCADE,
	usuario_id         UUID NOT NULL REFERENCES usuarios(id),
	comentario         TEXT NOT NULL,
	es_interno         BOOLEAN NOT NULL DEFAULT FALSE,
	adjuntos           JSONB NOT NULL DEFAULT '[]'::JSONB,
	leido_por_director BOOLEAN NOT NULL DEFAULT FALSE,
	leido_por_operador BOOLEAN NOT NULL DEFAULT FALSE,
	created_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_comentario_longitud CHECK (char_length(trim(comentario)) BETWEEN 10 AND 5000)
);

CREATE TABLE sesiones (
	id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
	token_hash VARCHAR(255) NOT NULL,
	ip_address INET,
	user_agent TEXT,
	expira_en  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	revocado   BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE intentos_login (
	id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id      UUID REFERENCES usuarios(id),
	email           VARCHAR(100) NOT NULL,
	ip_address      INET,
	user_agent      TEXT,
	exito           BOOLEAN NOT NULL,
	motivo_fallo    SMALLINT REFERENCES cat_motivo_fallo_login(id),
	bloqueado_hasta TIMESTAMP WITHOUT TIME ZONE,
	metadata        JSONB,
	created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluaciones (
	id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	estudiante_id         UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
	materia_id            UUID NOT NULL REFERENCES materias(id),
	periodo_id            UUID NOT NULL REFERENCES periodos_evaluacion(id),
	archivo_frv_id        UUID REFERENCES archivos_frv(id),
	valoracion            INT NOT NULL,
	nivel_integracion     VARCHAR(20),
	competencia_alcanzada BOOLEAN NOT NULL DEFAULT FALSE,
	observaciones         TEXT,
	registrado_por        UUID REFERENCES usuarios(id),
	fecha_evaluacion      TIMESTAMP WITHOUT TIME ZONE,
	fecha_captura         TIMESTAMP WITHOUT TIME ZONE,
	validado              BOOLEAN NOT NULL DEFAULT FALSE,
	validado_por          UUID REFERENCES usuarios(id),
	validado_en           TIMESTAMP WITHOUT TIME ZONE,
	created_at            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_evaluaciones_valor CHECK (valoracion BETWEEN 0 AND 3),
	CONSTRAINT uq_evaluaciones UNIQUE (estudiante_id, materia_id, periodo_id)
);

CREATE TABLE resultados_competencias (
	id_resultado   INT PRIMARY KEY,
	id_evaluacion  UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
	id_competencia INT NOT NULL REFERENCES competencias(id_competencia),
	nivel_logro    INT NOT NULL CHECK (nivel_logro BETWEEN 1 AND 4),
	UNIQUE (id_evaluacion, id_competencia)
);

-- Staging tables for DBF imports

CREATE TABLE pre3 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri1 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri2 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri3 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri4 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri5 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE pri6 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE sec1 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE sec2 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

CREATE TABLE sec3 (
	cct        VARCHAR(30),
	turno      VARCHAR(30),
	nom_cct    VARCHAR(80),
	nivel      VARCHAR(20),
	fase       VARCHAR(20),
	grado      VARCHAR(20),
	correo1    VARCHAR(100),
	correo2    VARCHAR(100),
	matricula_ VARCHAR(30),
	nlista     VARCHAR(20),
	estudiante VARCHAR(100),
	genero     VARCHAR(10),
	grupo      VARCHAR(10),
	eia1_c1_a1 VARCHAR(10),
	eia1_c1_a2 VARCHAR(10),
	eia1_c2_a1 VARCHAR(10),
	eia1_c2_a2 VARCHAR(10),
	eia1_c3_a1 VARCHAR(10),
	eia1_c3_a2 VARCHAR(10),
	eia2_c1_a1 VARCHAR(10),
	eia2_c2_a1 VARCHAR(10),
	eia2_c3_a1 VARCHAR(10),
	eia2_c4_a1 VARCHAR(10),
	eia2_c4_a2 VARCHAR(10),
	plen       VARCHAR(10),
	pspc       VARCHAR(10),
	pens       VARCHAR(10),
	phyc       VARCHAR(10),
	id         VARCHAR(30) PRIMARY KEY,
	archivoori VARCHAR(50)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE UNIQUE INDEX idx_estudiantes_curp ON estudiantes(curp);
CREATE UNIQUE INDEX idx_usuarios_email ON usuarios(email);
CREATE UNIQUE INDEX idx_grupos_escuela_nombre ON grupos(escuela_id, nombre);
CREATE UNIQUE INDEX idx_materias_codigo ON materias(codigo);
CREATE UNIQUE INDEX idx_solicitudes_eia2_consecutivo ON solicitudes_eia2(consecutivo);
CREATE INDEX idx_grupos_escuela_grado ON grupos(escuela_id, grado_id);
CREATE INDEX idx_estudiantes_grupo ON estudiantes(grupo_id);
CREATE INDEX idx_evaluaciones_periodo ON evaluaciones(periodo_id, validado);
CREATE INDEX idx_evaluaciones_archivo ON evaluaciones(archivo_frv_id);
CREATE INDEX idx_archivos_frv_escuela_ciclo ON archivos_frv(escuela_id, ciclo_escolar);
CREATE INDEX idx_reportes_escuela_ciclo ON reportes_generados(escuela_id, ciclo_escolar, periodo_id);
CREATE INDEX idx_reportes_tipo_generado ON reportes_generados(tipo_reporte, generado_en DESC);
CREATE INDEX idx_tickets_estado_prioridad ON tickets_soporte(estado, prioridad);
CREATE INDEX idx_log_usuario_fecha ON log_actividades(id_usuario, fecha_hora);
CREATE INDEX idx_notificaciones_estado ON notificaciones_email(estado, prioridad, created_at);

-- Crear índice parcial para reintentos utilizando el ID del catálogo
DO $$
DECLARE
	v_estado SMALLINT;
	idx_exists BOOLEAN;
BEGIN
	SELECT id INTO v_estado FROM cat_estado_notificacion WHERE codigo = 'REINTENTANDO';
	IF v_estado IS NULL THEN
		RAISE EXCEPTION 'Código REINTENTANDO no encontrado en cat_estado_notificacion';
	END IF;

	SELECT EXISTS (
		SELECT 1
		FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE c.relname = 'idx_notificaciones_proximo'
		  AND n.nspname = current_schema()
	) INTO idx_exists;

	IF NOT idx_exists THEN
		EXECUTE format(
			'CREATE INDEX idx_notificaciones_proximo ON notificaciones_email(proximo_intento) WHERE estado = %s',
			v_estado
		);
	END IF;
END;
$$;

CREATE INDEX idx_intentos_usuario_fecha ON intentos_login(usuario_id, created_at) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_intentos_ip_fecha ON intentos_login(ip_address, created_at);
CREATE UNIQUE INDEX idx_historico_password_activa ON historico_passwords(usuario_id) WHERE activa;

-- =====================================================================
-- FUNCTIONS & TRIGGERS (subset of critical automation rules)
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_validar_cct_formato()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.cct IS NULL OR NEW.cct !~ '^[0-9]{2}[A-Z]{1}[A-Z0-9]{7}$' THEN
		RAISE EXCEPTION 'Formato de CCT inválido: %', NEW.cct;
	END IF;
	NEW.cct := UPPER(NEW.cct);
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_validar_cct_formato
	BEFORE INSERT OR UPDATE ON escuelas
	FOR EACH ROW EXECUTE FUNCTION fn_validar_cct_formato();

CREATE OR REPLACE FUNCTION fn_validar_email_formato()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
		RAISE EXCEPTION 'Formato de email inválido: %', NEW.email;
	END IF;
	NEW.email := LOWER(NEW.email);
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_validar_email_formato
	BEFORE INSERT OR UPDATE ON usuarios
	FOR EACH ROW EXECUTE FUNCTION fn_validar_email_formato();

CREATE OR REPLACE FUNCTION fn_validar_valoracion_evaluacion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.valoracion < 0 OR NEW.valoracion > 3 THEN
		RAISE EXCEPTION 'La valoración debe estar en el rango 0-3.';
	END IF;
	NEW.nivel_integracion := CASE NEW.valoracion
		WHEN 0 THEN 'EN DESARROLLO'
		WHEN 1 THEN 'EN DESARROLLO'
		WHEN 2 THEN 'SATISFACTORIO'
		WHEN 3 THEN CASE WHEN NEW.competencia_alcanzada THEN 'AVANZADO' ELSE 'SOBRESALIENTE' END
	END;
	NEW.updated_at := NOW();
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_validar_valoracion_evaluacion
	BEFORE INSERT OR UPDATE ON evaluaciones
	FOR EACH ROW EXECUTE FUNCTION fn_validar_valoracion_evaluacion();

CREATE OR REPLACE FUNCTION fn_inicializar_notificacion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_estado_default CONSTANT SMALLINT := fn_catalogo_id('cat_estado_notificacion','PENDIENTE');
	v_prioridad_default CONSTANT SMALLINT := fn_catalogo_id('cat_prioridad_notificacion','MEDIA');
BEGIN
	NEW.intentos := COALESCE(NEW.intentos, 0);
	NEW.max_intentos := COALESCE(NEW.max_intentos, 3);
	NEW.prioridad := COALESCE(NEW.prioridad, v_prioridad_default);
	NEW.estado := COALESCE(NEW.estado, v_estado_default);
	NEW.created_at := NOW();
	NEW.updated_at := NOW();
	IF NEW.usuario_id IS NULL THEN
		SELECT id INTO NEW.usuario_id FROM usuarios WHERE email = NEW.destinatario LIMIT 1;
	END IF;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_inicializar_notificacion
	BEFORE INSERT ON notificaciones_email
	FOR EACH ROW EXECUTE FUNCTION fn_inicializar_notificacion();

CREATE OR REPLACE FUNCTION fn_programar_reintento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_delay INTERVAL;
	v_estado_reintentando CONSTANT SMALLINT := fn_catalogo_id('cat_estado_notificacion','REINTENTANDO');
	v_estado_enviado CONSTANT SMALLINT := fn_catalogo_id('cat_estado_notificacion','ENVIADO');
	v_estado_error CONSTANT SMALLINT := fn_catalogo_id('cat_estado_notificacion','ERROR');
BEGIN
	IF NEW.estado = v_estado_reintentando AND OLD.estado <> v_estado_reintentando THEN
		v_delay := CASE NEW.intentos
			WHEN 1 THEN INTERVAL '1 minute'
			WHEN 2 THEN INTERVAL '5 minutes'
			WHEN 3 THEN INTERVAL '30 minutes'
			ELSE INTERVAL '1 hour'
		END;
		NEW.proximo_intento := NOW() + v_delay;
	END IF;
	IF NEW.intentos >= NEW.max_intentos AND NEW.estado <> v_estado_enviado THEN
		NEW.estado := v_estado_error;
		NEW.error_mensaje := COALESCE(NEW.error_mensaje, '') || ' | Max retries exceeded.';
	END IF;
	NEW.updated_at := NOW();
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_programar_reintento
	BEFORE UPDATE ON notificaciones_email
	FOR EACH ROW EXECUTE FUNCTION fn_programar_reintento();

CREATE OR REPLACE FUNCTION fn_marcar_comentario_leido_autor()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_codigo VARCHAR(20);
BEGIN
	SELECT codigo INTO v_codigo FROM cat_roles_usuario WHERE id_rol = (SELECT rol FROM usuarios WHERE id = NEW.usuario_id);
	IF v_codigo IN ('DIRECTOR','SUBDIRECTOR') THEN
		NEW.leido_por_director := TRUE;
	ELSE
		NEW.leido_por_operador := TRUE;
	END IF;
	NEW.created_at := NOW();
	NEW.updated_at := NOW();
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_marcar_comentario_leido_autor
	BEFORE INSERT ON comentarios_ticket
	FOR EACH ROW EXECUTE FUNCTION fn_marcar_comentario_leido_autor();

CREATE OR REPLACE FUNCTION fn_validar_ticket_abierto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_estado SMALLINT;
	v_estado_cerrado CONSTANT SMALLINT := fn_catalogo_id('cat_estado_ticket','CERRADO');
BEGIN
	SELECT estado INTO v_estado FROM tickets_soporte WHERE id = NEW.ticket_id;
	IF v_estado = v_estado_cerrado THEN
		RAISE EXCEPTION 'No se pueden agregar comentarios a un ticket cerrado.';
	END IF;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_validar_ticket_abierto
	BEFORE INSERT ON comentarios_ticket
	FOR EACH ROW EXECUTE FUNCTION fn_validar_ticket_abierto();

CREATE OR REPLACE FUNCTION fn_registrar_cambio_password()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_origen_recuperacion CONSTANT SMALLINT := fn_catalogo_id('cat_origen_cambio_password','RECUPERACION');
BEGIN
	UPDATE historico_passwords
	SET activa = FALSE,
		cambiada_en = NOW()
	WHERE usuario_id = NEW.usuario_id
	  AND activa
	  AND id <> NEW.id;
	IF NEW.es_temporal AND NEW.expira_en IS NULL THEN
		IF NEW.cambiada_por = v_origen_recuperacion THEN
			NEW.expira_en := NEW.generada_en + INTERVAL '6 hours';
		ELSE
			NEW.expira_en := NEW.generada_en + INTERVAL '72 hours';
		END IF;
	END IF;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_registrar_cambio_password
	BEFORE INSERT ON historico_passwords
	FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio_password();

CREATE OR REPLACE FUNCTION fn_validar_reutilizacion_password()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_hash VARCHAR(255);
BEGIN
	FOR v_hash IN
		SELECT password_hash FROM historico_passwords
		WHERE usuario_id = NEW.usuario_id
		ORDER BY generada_en DESC
		LIMIT 5
	LOOP
		IF v_hash = NEW.password_hash THEN
			RAISE EXCEPTION 'La contraseña no puede repetirse entre las últimas 5.';
		END IF;
	END LOOP;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_validar_reutilizacion_password
	BEFORE INSERT ON historico_passwords
	FOR EACH ROW EXECUTE FUNCTION fn_validar_reutilizacion_password();

CREATE OR REPLACE FUNCTION fn_verificar_bloqueo_usuario()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_fallidos INT;
	v_motivo_bloqueo CONSTANT SMALLINT := fn_catalogo_id('cat_motivo_fallo_login','CUENTA_BLOQUEADA');
BEGIN
	IF NEW.exito = FALSE AND NEW.usuario_id IS NOT NULL THEN
		SELECT COUNT(*) INTO v_fallidos
		FROM intentos_login
		WHERE usuario_id = NEW.usuario_id
		  AND exito = FALSE
		  AND created_at > NOW() - INTERVAL '15 minutes';
		IF v_fallidos >= 5 THEN
			UPDATE usuarios
			SET bloqueado_hasta = NOW() + INTERVAL '30 minutes'
			WHERE id = NEW.usuario_id;
			NEW.bloqueado_hasta := NOW() + INTERVAL '30 minutes';
			NEW.motivo_fallo := v_motivo_bloqueo;
		END IF;
	END IF;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_verificar_bloqueo_usuario
	BEFORE INSERT ON intentos_login
	FOR EACH ROW EXECUTE FUNCTION fn_verificar_bloqueo_usuario();

CREATE OR REPLACE FUNCTION fn_detectar_ataque_distribuido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
	v_ips INT;
	v_total INT;
BEGIN
	IF NEW.exito = FALSE AND NEW.usuario_id IS NOT NULL THEN
		SELECT COUNT(DISTINCT ip_address), COUNT(*)
		INTO v_ips, v_total
		FROM intentos_login
		WHERE usuario_id = NEW.usuario_id
		  AND exito = FALSE
		  AND created_at > NOW() - INTERVAL '1 hour';
		IF v_total >= 10 AND v_ips >= 3 THEN
			UPDATE usuarios
			SET bloqueado_hasta = NOW() + INTERVAL '1 hour'
			WHERE id = NEW.usuario_id;
		END IF;
	END IF;
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_detectar_ataque_distribuido
	AFTER INSERT ON intentos_login
	FOR EACH ROW EXECUTE FUNCTION fn_detectar_ataque_distribuido();

CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
	NEW.updated_at := NOW();
	RETURN NEW;
END;$$;

CREATE TRIGGER trg_touch_escuelas
	BEFORE UPDATE ON escuelas
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_grupos
	BEFORE UPDATE ON grupos
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_usuarios
	BEFORE UPDATE ON usuarios
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_archivos_frv
	BEFORE UPDATE ON archivos_frv
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_reportes
	BEFORE UPDATE ON reportes_generados
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_tickets
	BEFORE UPDATE ON tickets_soporte
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_comentarios
	BEFORE UPDATE ON comentarios_ticket
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_notificaciones
	BEFORE UPDATE ON notificaciones_email
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_evaluaciones
	BEFORE UPDATE ON evaluaciones
	FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- =====================================================================
-- END OF SCRIPT
-- =====================================================================
