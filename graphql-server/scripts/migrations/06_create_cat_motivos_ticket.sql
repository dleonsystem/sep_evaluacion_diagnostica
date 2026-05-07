-- Migración: Creación de catálogo de motivos de tickets
-- Objetivo: Estandarizar las opciones de motivos de tickets siguiendo el patrón Enum Mirror.

BEGIN;

-- 1. Crear tabla de catálogo
CREATE TABLE IF NOT EXISTS cat_motivos_ticket (
    id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    orden SMALLINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Insertar motivos solicitados
INSERT INTO cat_motivos_ticket (codigo, descripcion, orden) VALUES
('ENV_RFV_INCOMPLETO', 'Envié un RFV incompleto', 1),
('RES_NO_APARECEN', 'Mis resultados no aparecen / no he recibido mis resultados', 2),
('INCONS_RESULTADOS', 'Inconsistencias en mis resultados', 3),
('PROB_INTERPR_COMP', 'Problemas para interpretar el comparativo', 4),
('NO_DESC_REPORTE', 'No puedo descargar mi reporte de resultados', 5),
('NO_ABRIR_ARCHIVO', 'No puedo abrir el archivo de descarga', 6),
('DUDA_COMPATIBILIDAD', 'Dudas sobre compatibilidad del sistema', 7),
('FRV_INCORRECTO', 'Mi formato FRV es incorrecto', 8)
ON CONFLICT (codigo) DO NOTHING;

-- 3. Comentario de tabla
COMMENT ON TABLE cat_motivos_ticket IS 'Catálogo institucional de motivos para la creación de tickets de soporte.';

COMMIT;
