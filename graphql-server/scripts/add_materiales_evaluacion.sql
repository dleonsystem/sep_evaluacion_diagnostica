-- =============================================================================
-- Migración: Creación de tabla materiales_evaluacion
-- Fecha: 2026-03-12
-- Razón: Implementación de CU-01 (Publicar Materiales de Evaluación)
-- =============================================================================

CREATE TABLE IF NOT EXISTS materiales_evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('EIA', 'FRV', 'RUBRICA')),
    nivel_educativo SMALLINT NOT NULL REFERENCES cat_nivel_educativo(id),
    ruta_archivo TEXT NOT NULL,
    ciclo_escolar VARCHAR(10) NOT NULL,
    periodo_id UUID NOT NULL REFERENCES periodos_evaluacion(id),
    fecha_publicacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE materiales_evaluacion IS 'Materiales oficiales de evaluación (EIA, FRV, Rúbricas) subidos por administración';
COMMENT ON COLUMN materiales_evaluacion.tipo IS 'Tipo de material: EIA (Cuadernillo), FRV (Excel), RUBRICA (Guía)';
COMMENT ON COLUMN materiales_evaluacion.nivel_educativo IS 'Nivel educativo al que pertenece el material';
COMMENT ON COLUMN materiales_evaluacion.ciclo_escolar IS 'Ciclo escolar vigente (ej: 2024-2025)';
COMMENT ON COLUMN materiales_evaluacion.periodo_id IS 'Referencia al periodo de evaluación';
COMMENT ON COLUMN materiales_evaluacion.usuario_id IS 'Administrador que publicó el material';
