-- =============================================================================
-- Script de Corrección de Restricción de Unicidad en Tabla Grupos
-- =============================================================================
-- @version 1.1.0
-- @reason RF-02.7: La unicidad debe ser por (escuela_id, grado_id, nombre)
-- =============================================================================

-- 1. Eliminar la restricción antigua que solo incluía (escuela_id, nombre)
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_escuela_id_nombre_key;

-- 2. Agregar la nueva restricción que incluye grado_id
-- Esto permite que una escuela tenga un grupo "A" por cada grado.
ALTER TABLE grupos 
ADD CONSTRAINT grupos_escuela_id_grado_id_nombre_key 
UNIQUE (escuela_id, grado_id, nombre);

-- 3. Registrar el cambio en auditoría manual (opcional si existe la tabla)
INSERT INTO cambios_auditoria (tabla, registro_id, operacion, valores_nuevos, created_at)
VALUES ('grupos', 'CONSTRAINT', 2, '{"constraint": "grupos_escuela_id_grado_id_nombre_key", "columns": ["escuela_id", "grado_id", "nombre"]}'::JSONB, NOW());
