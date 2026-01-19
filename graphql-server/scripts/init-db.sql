-- =============================================================================
-- Script de Inicialización de Base de Datos PostgreSQL
-- Sistema de Evaluación Integral de Aprendizaje (EIA) - SEP
-- =============================================================================
-- @version 1.0.0
-- @author SEP - Evaluación Diagnóstica
-- @standard PSP (Personal Software Process)
-- @rup Data Model - Logical Design
-- @cmmi CMMI Level 3 - Configuration Management
-- =============================================================================

-- Crear base de datos
DROP DATABASE IF EXISTS eia_db;
CREATE DATABASE eia_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_MX.UTF-8'
    LC_CTYPE = 'es_MX.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

\c eia_db;

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLA: usuarios
-- @use-case CU-01, CU-02
-- @requirements RF-01, RF-02
-- =============================================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    contrasena_hash VARCHAR(255),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('COORDINADOR_FEDERAL', 'COORDINADOR_ESTATAL', 'RESPONSABLE_CCT', 'CONSULTA')),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    CONSTRAINT usuarios_correo_formato CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema EIA con control de acceso basado en roles';
COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario: COORDINADOR_FEDERAL, COORDINADOR_ESTATAL, RESPONSABLE_CCT, CONSULTA';

-- =============================================================================
-- TABLA: centros_trabajo
-- @use-case CU-03
-- @requirements RF-03
-- =============================================================================
CREATE TABLE centros_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave_cct VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('PREESCOLAR', 'PRIMARIA', 'SECUNDARIA')),
    turno VARCHAR(20) NOT NULL,
    zona_escolar VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    CONSTRAINT cct_formato CHECK (clave_cct ~ '^[0-9]{2}[A-Z]{3}[0-9]{4}[A-Z]$')
);

-- Índices para centros_trabajo
CREATE INDEX idx_cct_clave ON centros_trabajo(clave_cct);
CREATE INDEX idx_cct_nivel ON centros_trabajo(nivel);
CREATE INDEX idx_cct_entidad ON centros_trabajo(entidad);

COMMENT ON TABLE centros_trabajo IS 'Catálogo de Centros de Trabajo (CCT) del sistema educativo';
COMMENT ON COLUMN centros_trabajo.clave_cct IS 'Clave única de Centro de Trabajo formato: 00XXX0000X';

-- =============================================================================
-- TABLA: usuarios_centros_trabajo
-- @use-case CU-02
-- @requirements RF-02: Relación N:M entre usuarios y CCTs
-- =============================================================================
CREATE TABLE usuarios_centros_trabajo (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    centro_trabajo_id UUID NOT NULL REFERENCES centros_trabajo(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, centro_trabajo_id)
);

-- Índices para usuarios_centros_trabajo
CREATE INDEX idx_uct_usuario ON usuarios_centros_trabajo(usuario_id);
CREATE INDEX idx_uct_centro ON usuarios_centros_trabajo(centro_trabajo_id);

COMMENT ON TABLE usuarios_centros_trabajo IS 'Relación N:M entre usuarios y centros de trabajo';

-- =============================================================================
-- TABLA: evaluaciones
-- @use-case CU-05, CU-10
-- @requirements RF-05, RF-14
-- =============================================================================
CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave_cct VARCHAR(10) NOT NULL REFERENCES centros_trabajo(clave_cct),
    periodo VARCHAR(20) NOT NULL,
    grado INTEGER NOT NULL CHECK (grado BETWEEN 1 AND 6),
    grupo VARCHAR(10) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT,
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_carga_id UUID REFERENCES usuarios(id),
    estado_validacion VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_validacion IN ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'EN_PROCESO')),
    fecha_validacion TIMESTAMP,
    observaciones TEXT,
    hash_archivo VARCHAR(64)
);

-- Índices para evaluaciones
CREATE INDEX idx_eval_cct ON evaluaciones(clave_cct);
CREATE INDEX idx_eval_periodo ON evaluaciones(periodo);
CREATE INDEX idx_eval_estado ON evaluaciones(estado_validacion);
CREATE INDEX idx_eval_fecha_carga ON evaluaciones(fecha_carga);

COMMENT ON TABLE evaluaciones IS 'Registro de evaluaciones cargadas al sistema';
COMMENT ON COLUMN evaluaciones.estado_validacion IS 'Estado de validación: PENDIENTE, VALIDADO, RECHAZADO, EN_PROCESO';

-- =============================================================================
-- TABLA: estudiantes
-- @use-case CU-06
-- @requirements RF-06
-- =============================================================================
CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
    curp VARCHAR(18) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    grado INTEGER NOT NULL,
    grupo VARCHAR(10) NOT NULL,
    fecha_nacimiento DATE,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    CONSTRAINT curp_formato CHECK (curp ~ '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$')
);

-- Índices para estudiantes
CREATE INDEX idx_est_evaluacion ON estudiantes(evaluacion_id);
CREATE INDEX idx_est_curp ON estudiantes(curp);

COMMENT ON TABLE estudiantes IS 'Registro de estudiantes asociados a evaluaciones';
COMMENT ON COLUMN estudiantes.curp IS 'Clave Única de Registro de Población formato estándar';

-- =============================================================================
-- TABLA: catalogo_niveles_integracion
-- @requirements Nueva estructura de NIA
-- =============================================================================
CREATE TABLE catalogo_niveles_integracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    orden INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true
);

COMMENT ON TABLE catalogo_niveles_integracion IS 'Catálogo de niveles de integración del aprendizaje';

-- =============================================================================
-- TABLA: catalogo_campos_formativos
-- @requirements Nueva estructura de NIA
-- =============================================================================
CREATE TABLE catalogo_campos_formativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true
);

COMMENT ON TABLE catalogo_campos_formativos IS 'Catálogo de campos formativos';

-- =============================================================================
-- TABLA: niveles_integracion_estudiante
-- @requirements Nueva estructura de NIA
-- =============================================================================
CREATE TABLE niveles_integracion_estudiante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    campo_formativo_id UUID NOT NULL REFERENCES catalogo_campos_formativos(id),
    nivel_integracion_id UUID NOT NULL REFERENCES catalogo_niveles_integracion(id),
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, campo_formativo_id)
);

-- Índices
CREATE INDEX idx_nie_estudiante ON niveles_integracion_estudiante(estudiante_id);
CREATE INDEX idx_nie_campo ON niveles_integracion_estudiante(campo_formativo_id);

COMMENT ON TABLE niveles_integracion_estudiante IS 'Niveles de integración del aprendizaje por estudiante y campo formativo';

-- =============================================================================
-- TABLA: auditoria
-- @psp Process Metrics - Audit Trail
-- @cmmi CMMI Level 3 - Process Monitoring
-- =============================================================================
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabla VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Índice para auditoría
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);

COMMENT ON TABLE auditoria IS 'Registro de auditoría de todas las operaciones en el sistema';

-- =============================================================================
-- VISTAS
-- =============================================================================

-- Vista para usuarios activos con sus CCTs
CREATE OR REPLACE VIEW v_usuarios_activos AS
SELECT 
    u.id,
    u.correo,
    u.nombre || ' ' || u.apellido_paterno || COALESCE(' ' || u.apellido_materno, '') as nombre_completo,
    u.rol,
    COUNT(uct.centro_trabajo_id) as total_ccts,
    u.fecha_ultimo_acceso
FROM usuarios u
LEFT JOIN usuarios_centros_trabajo uct ON u.id = uct.usuario_id
WHERE u.activo = true
GROUP BY u.id, u.correo, u.nombre, u.apellido_paterno, u.apellido_materno, u.rol, u.fecha_ultimo_acceso;

COMMENT ON VIEW v_usuarios_activos IS 'Vista de usuarios activos con conteo de CCTs asignados';

-- =============================================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================================

-- Función para actualizar fecha de último acceso
CREATE OR REPLACE FUNCTION actualizar_ultimo_acceso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_ultimo_acceso := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (tabla, operacion, datos_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (tabla, operacion, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (tabla, operacion, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
CREATE TRIGGER audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER audit_evaluaciones
    AFTER INSERT OR UPDATE OR DELETE ON evaluaciones
    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- =============================================================================
-- PERMISOS Y ROLES
-- =============================================================================

-- Crear rol para la aplicación
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eia_app') THEN
        CREATE ROLE eia_app LOGIN PASSWORD 'change_me_in_production';
    END IF;
END
$$;

-- Otorgar permisos
GRANT CONNECT ON DATABASE eia_db TO eia_app;
GRANT USAGE ON SCHEMA public TO eia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eia_app;

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================

COMMENT ON DATABASE eia_db IS 'Base de datos del Sistema de Evaluación Integral de Aprendizaje - SEP';

SELECT 'Base de datos inicializada correctamente' as status;
