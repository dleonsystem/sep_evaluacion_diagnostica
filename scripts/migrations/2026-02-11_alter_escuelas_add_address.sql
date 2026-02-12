-- Migration: Add address fields to escuelas
-- Run with psql:
--   psql -h <host> -U <user> -d <db> -f scripts/migrations/2026-02-11_alter_escuelas_add_address.sql

BEGIN;

ALTER TABLE escuelas
  ADD COLUMN municipio       VARCHAR(100),
  ADD COLUMN localidad       VARCHAR(100),
  ADD COLUMN calle           VARCHAR(150),
  ADD COLUMN num_exterior    VARCHAR(20),
  ADD COLUMN entre_la_calle  VARCHAR(150),
  ADD COLUMN y_la_calle      VARCHAR(150),
  ADD COLUMN calle_posterior VARCHAR(150),
  ADD COLUMN colonia         VARCHAR(100);

-- Optional: consider indexes later if query patterns require them
-- COMMIT
COMMIT;