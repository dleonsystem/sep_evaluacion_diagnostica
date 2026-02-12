-- Crear esquema y tabla de staging para importar CSV vía pgAdmin
BEGIN;

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.escuelas_csv (
  cct               TEXT,
  nombre_cct        TEXT,
  estado            TEXT,
  cp                TEXT,
  telefono          TEXT,
  email             TEXT,
  director          TEXT,
  id_turno          TEXT,
  id_ent            TEXT,
  id_ciclo          TEXT,
  id_nivel          TEXT,
  id_edo            TEXT,
  municipio         TEXT,
  localidad         TEXT,
  calle             TEXT,
  num_exterior      TEXT,
  entre_la_calle    TEXT,
  y_la_calle        TEXT,
  calle_posterior   TEXT,
  colonia           TEXT
);

COMMIT;

-- Uso: en pgAdmin, Query Tool -> ejecutar este script.
-- Luego: Import/Export Data sobre staging.escuelas_csv para importar data/ESCUELAS_VLP.csv
-- Configurar: Format CSV, Header Yes, Delimiter ',', Quote '"'.