-- =============================================================================
-- Script de Inicialización Unificado (Fase 1 - GAP-CAT)
-- Este script recrea la base de datos completa alineada con ddl_generated.sql
-- y carga los catálogos institucionales oficiales EIA 2025.
-- =============================================================================

-- 1. Gestión de Base de Datos
DROP DATABASE IF EXISTS eia_db;
CREATE DATABASE eia_db WITH OWNER = postgres ENCODING = 'UTF8';

\c eia_db;

-- 2. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Carga del DDL Maestro (Esquema físico canónico)
-- Nota: En un entorno real se usaría \i path/to/ddl_generated.sql
-- Para el contenedor/setup inicial, incluimos las definiciones clave.
-- (Se asume que ddl_generated.sql es el resultado de ESTRUCTURA_DE_DATOS.md)

-- [Definiciones extraídas y simplificadas de ddl_generated.sql para inicialización limpia]

-- Catálogos Espejo (Antiguos Enums)
CREATE TABLE cat_nivel_educativo (id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, codigo VARCHAR(50) NOT NULL UNIQUE, descripcion VARCHAR(200), orden SMALLINT NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE);
INSERT INTO cat_nivel_educativo (codigo, descripcion, orden) VALUES ('PREESCOLAR','Preescolar',1), ('PRIMARIA','Primaria',2), ('SECUNDARIA','Secundaria',3), ('TELESECUNDARIA','Telesecundaria',4) ON CONFLICT DO NOTHING;

CREATE TABLE cat_estado_archivo (id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, codigo VARCHAR(50) NOT NULL UNIQUE, descripcion VARCHAR(200), orden SMALLINT NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE cat_estado_validacion_eia2 (id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, codigo VARCHAR(50) NOT NULL UNIQUE, descripcion VARCHAR(200), orden SMALLINT NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE);
INSERT INTO cat_estado_validacion_eia2 (codigo, descripcion, orden) VALUES ('PENDIENTE','Pendiente',1), ('VALIDADO','Validado',2), ('RECHAZADO','Rechazado',3), ('EN_PROCESO','En Proceso',4) ON CONFLICT DO NOTHING;

-- Catálogos Institucionales
CREATE TABLE cat_ciclos_escolares (id_ciclo INT PRIMARY KEY, nombre VARCHAR(20) NOT NULL UNIQUE, fecha_inicio DATE NOT NULL, fecha_fin DATE NOT NULL, activo BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE cat_entidades_federativas (id_entidad INT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, abreviatura VARCHAR(10) NOT NULL UNIQUE, codigo_sep VARCHAR(5) NOT NULL UNIQUE, region VARCHAR(50));
CREATE TABLE cat_turnos (id_turno INT PRIMARY KEY, nombre VARCHAR(50) NOT NULL, activo BOOLEAN DEFAULT TRUE);
CREATE TABLE cat_grados (id_grado INT PRIMARY KEY, nivel_educativo SMALLINT REFERENCES cat_nivel_educativo(id), grado_numero INT, grado_nombre VARCHAR(20));

-- Tablas NIA (Aprobadas en GAP-DB-3)
CREATE TABLE cat_campos_formativos (id SERIAL PRIMARY KEY, clave VARCHAR(10) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, descripcion TEXT, orden_visual INT NOT NULL, vigente BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE cat_niveles_integracion (id_nia SERIAL PRIMARY KEY, clave VARCHAR(2) NOT NULL UNIQUE, nombre VARCHAR(50) NOT NULL, descripcion TEXT NOT NULL, rango_min INT, rango_max INT, color_hex VARCHAR(7), orden_visual INT, vigente BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW());

-- Entidades Nucleares
CREATE TABLE escuelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cct VARCHAR(10) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    id_turno INT REFERENCES cat_turnos(id_turno),
    id_nivel SMALLINT REFERENCES cat_nivel_educativo(id),
    id_entidad INT REFERENCES cat_entidades_federativas(id_entidad),
    id_ciclo INT REFERENCES cat_ciclos_escolares(id_ciclo),
    municipio VARCHAR(100),
    localidad VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_escuelas_cct_turno UNIQUE (cct, id_turno)
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(100),
    password_hash VARCHAR(255),
    rol VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    primer_login BOOLEAN DEFAULT TRUE,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    id_campo_formativo INT REFERENCES cat_campos_formativos(id)
);

CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID, -- Se definirá FK después de crear estudiantes
    materia_id UUID REFERENCES materias(id),
    periodo_id UUID,
    valoracion INT CHECK (valoracion BETWEEN 0 AND 3),
    validado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curp VARCHAR(18) NOT NULL,
    nombre VARCHAR(150),
    escuela_id UUID REFERENCES escuelas(id),
    grado_id INT REFERENCES cat_grados(id_grado),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vincular evaluaciones -> estudiantes (circularidad resuelta)
ALTER TABLE evaluaciones ADD CONSTRAINT fk_evaluaciones_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE;

CREATE TABLE niveles_integracion_estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_estudiante UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    id_campo_formativo INT REFERENCES cat_campos_formativos(id),
    id_nia INT REFERENCES cat_niveles_integracion(id_nia),
    valoracion_promedio NUMERIC(4,2),
-- Usuario del evaluador
INSERT INTO usuarios (email, nombre, rol, password_hash, activo, primer_login)
VALUES ('joseg.gutierrez@nube.sep.gob.mx', 'José Guadalupe Gutiérrez', 'COORDINADOR_FEDERAL', 'a093b0cb8497ed3b2299112d3ec2931f:1720668b5a76985160c918c575001bd80e60824b260907a72d733156be79308be7338e55e0a0a575cb75f56b26d36e2f18398e29a8a30a846f49969062ea6323', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

COMMIT;

SELECT 'Base de Datos EIA 2025 Inicializada Correctamente' as Status;
