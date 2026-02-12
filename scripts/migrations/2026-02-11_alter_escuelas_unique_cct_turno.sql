-- Migration: Change unique constraint on escuelas to (cct, id_turno)
-- Run with psql:
--   psql -h <host> -U <user> -d <db> -f scripts/migrations/2026-02-11_alter_escuelas_unique_cct_turno.sql

BEGIN;

-- Drop previous unique constraint on cct if exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'escuelas'
      AND c.conname = 'uq_escuelas_cct'
  ) INTO v_exists;
  IF v_exists THEN
    ALTER TABLE escuelas DROP CONSTRAINT uq_escuelas_cct;
  END IF;
END$$;

-- Add new unique constraint on (cct, id_turno)
ALTER TABLE escuelas
  ADD CONSTRAINT uq_escuelas_cct_turno UNIQUE (cct, id_turno);

COMMIT;