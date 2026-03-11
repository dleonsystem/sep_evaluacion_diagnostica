-- =============================================================================
-- Migración: Adición de usuario_id a solicitudes_eia2
-- Fecha: 2026-02-23
-- Razón: Control de privacidad y seguimiento de autoría de cargas masivas
-- =============================================================================

ALTER TABLE solicitudes_eia2 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

COMMENT ON COLUMN solicitudes_eia2.usuario_id IS 'ID del usuario que realizó la carga del archivo';

-- Vinculación inicial para registros existentes (opcional, basado en CCT si aplica)
-- UPDATE solicitudes_eia2 s 
-- SET usuario_id = u.id 
-- FROM usuarios u 
-- WHERE s.usuario_id IS NULL AND ...;
