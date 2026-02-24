-- =============================================================================
-- Migración: Adición de resultados (JSONB) a solicitudes_eia2
-- Fecha: 2026-02-23
-- Razón: Soporte para múltiples archivos de resultados por carga
-- =============================================================================

ALTER TABLE solicitudes_eia2 
ADD COLUMN IF NOT EXISTS resultados JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN solicitudes_eia2.resultados IS 'Lista de archivos de resultados asociados (PDF, imágenes, etc.) en formato JSON';
