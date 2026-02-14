-- =============================================================================
-- Script de Soporte para Múltiples Versiones de Archivos y Detección de Duplicados
-- =============================================================================
-- @version 1.3.0
-- @reason RF-XX: Permitir múltiples archivos independientes y control de duplicados exactos
-- =============================================================================

-- 1. Agregar hash a la tabla de solicitudes para detectar duplicados exactos
ALTER TABLE solicitudes_eia2 ADD COLUMN IF NOT EXISTS hash_archivo VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_solicitudes_hash ON solicitudes_eia2(hash_archivo);

-- 2. Vincular evaluaciones a una solicitud específica
-- Actualmente las evaluaciones son "globales" por estudiante/periodo.
-- Para soportar múltiples archivos (versiones) independientes, necesitamos saber a qué solicitud pertenecen.
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS solicitud_id UUID REFERENCES solicitudes_eia2(id) ON DELETE CASCADE;

-- 3. Actualizar la restricción de unicidad en evaluaciones
-- Antes: UNIQUE (estudiante_id, materia_id, periodo_id) -> Solo una evaluación activa por periodo.
-- Ahora: UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id) -> Una evaluación por solicitud.
-- Esto permite que el mismo alumno tenga evaluaciones diferentes en archivos diferentes.

-- Primero eliminamos la restricción anterior si existe
ALTER TABLE evaluaciones DROP CONSTRAINT IF EXISTS uq_evaluaciones;

-- Creamos la nueva restricción compuesta
ALTER TABLE evaluaciones 
ADD CONSTRAINT uq_evaluaciones_solicitud 
UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id);

-- (Opcional) Índice para búsquedas rápidas por solicitud
CREATE INDEX IF NOT EXISTS idx_evaluaciones_solicitud ON evaluaciones(solicitud_id);
