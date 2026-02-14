-- =============================================================================
-- Script de Corrección de Índice Único en Tabla Grupos (Fase 2)
-- =============================================================================
-- @version 1.2.0
-- @reason Se detectó un índice único redundante que bloqueaba la carga
-- =============================================================================

-- 1. Eliminar el índice único que bloqueaba la carga
-- Este índice duplicaba la restricción que corregimos antes pero con un nombre distinto.
DROP INDEX IF EXISTS idx_grupos_escuela_nombre;

-- 2. (Opcional) Crear un índice normal si se requiere para búsquedas por nombre
-- Pero que no sea único para permitir el mismo nombre en diferentes grados.
CREATE INDEX IF NOT EXISTS idx_grupos_nombre_search ON grupos(escuela_id, nombre);

-- 3. Confirmar que el índice por escuela y grado existe para performance
-- (Ya existía como idx_grupos_escuela_grado, pero nos aseguramos)
CREATE INDEX IF NOT EXISTS idx_grupos_escuela_grado_perf ON grupos(escuela_id, grado_id);
