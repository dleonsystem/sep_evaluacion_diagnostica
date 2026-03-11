-- =============================================================================
-- Script de Soporte para Tickets de Soporte
-- =============================================================================
-- @version 1.4.0
-- @reason RF-XX: Gestión de tickets de mesa de ayuda
-- =============================================================================

-- 1. Asegurar que la tabla tickets_soporte tenga los campos necesarios
-- El usuario solicita "Motivo" (asunto) y "Evidencias" (adjuntos en JSONB)
ALTER TABLE tickets_soporte ADD COLUMN IF NOT EXISTS evidencias JSONB DEFAULT '[]'::JSONB;

-- 2. Asegurar secuencia para número de ticket
CREATE SEQUENCE IF NOT EXISTS seq_numero_ticket START 1;
