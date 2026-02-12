-- Importación de datos a la tabla escuelas desde CSV (muestra de 50 filas)
-- Fuente: data/ESCUELAS_VLP.csv
-- Uso con psql (cliente):
--   psql -h <host> -U <user> -d <db> -f scripts/import_escuelas_from_csv_sample50.sql
--   Ajusta la ruta del CSV si es necesario.

BEGIN;

-- 1) Tabla staging temporal para cargar el CSV completo
DROP TABLE IF EXISTS stg_escuelas;
CREATE TEMP TABLE stg_escuelas (
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

-- 2) Carga del CSV (lado cliente)
\copy stg_escuelas FROM 'c:/VLP/GitHub/sep_evaluacion_diagnostica/data/ESCUELAS_VLP.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8', DELIMITER ',', QUOTE '"');

-- 3) Deduplicar por (CCT, ID_TURNO)
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY cct, NULLIF(TRIM(id_turno), '')
           ORDER BY nombre_cct
         ) AS rn
  FROM stg_escuelas
),
clean AS (
  SELECT
    UPPER(TRIM(cct)) AS cct,
    LEFT(TRIM(nombre_cct), 150) AS nombre,
    NULLIF(TRIM(estado), '') AS estado,
    NULLIF(TRIM(cp), '') AS cp,
    NULLIF(TRIM(telefono), '') AS telefono,
    CASE WHEN TRIM(COALESCE(email, '')) = '' THEN NULL ELSE LOWER(TRIM(email)) END AS email,
    NULLIF(TRIM(director), '') AS director,
    COALESCE(NULLIF(TRIM(id_turno), '')::int, 1) AS id_turno,
    NULLIF(TRIM(id_nivel), '')::int AS id_nivel,
    NULLIF(TRIM(id_ent), '')::int AS id_entidad,
    NULLIF(TRIM(id_ciclo), '')::int AS id_ciclo,
    LEFT(NULLIF(TRIM(municipio), ''), 100)        AS municipio,
    LEFT(NULLIF(TRIM(localidad), ''), 100)        AS localidad,
    LEFT(NULLIF(TRIM(calle), ''), 150)            AS calle,
    LEFT(NULLIF(TRIM(num_exterior), ''), 20)      AS num_exterior,
    LEFT(NULLIF(TRIM(entre_la_calle), ''), 150)   AS entre_la_calle,
    LEFT(NULLIF(TRIM(y_la_calle), ''), 150)       AS y_la_calle,
    LEFT(NULLIF(TRIM(calle_posterior), ''), 150)  AS calle_posterior,
    LEFT(NULLIF(TRIM(colonia), ''), 100)          AS colonia
  FROM ranked
  WHERE rn = 1
),
limited AS (
  SELECT * FROM clean LIMIT 50
)
-- 4) Upsert a escuelas de muestra
INSERT INTO escuelas (
  cct, nombre, estado, cp, telefono, email, director,
  id_turno, id_nivel, id_entidad, id_ciclo,
  municipio, localidad, calle, num_exterior,
  entre_la_calle, y_la_calle, calle_posterior, colonia
)
SELECT
  cct, nombre, estado, cp, telefono, email, director,
  id_turno, id_nivel, id_entidad, id_ciclo,
  municipio, localidad, calle, num_exterior,
  entre_la_calle, y_la_calle, calle_posterior, colonia
FROM limited
ON CONFLICT (cct, id_turno) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  estado    = EXCLUDED.estado,
  cp        = EXCLUDED.cp,
  telefono  = COALESCE(EXCLUDED.telefono, escuelas.telefono),
  email     = COALESCE(EXCLUDED.email, escuelas.email),
  director  = COALESCE(EXCLUDED.director, escuelas.director),
  id_turno  = EXCLUDED.id_turno,
  id_nivel  = EXCLUDED.id_nivel,
  id_entidad= EXCLUDED.id_entidad,
  id_ciclo  = EXCLUDED.id_ciclo,
  municipio = COALESCE(EXCLUDED.municipio, escuelas.municipio),
  localidad = COALESCE(EXCLUDED.localidad, escuelas.localidad),
  calle     = COALESCE(EXCLUDED.calle, escuelas.calle),
  num_exterior = COALESCE(EXCLUDED.num_exterior, escuelas.num_exterior),
  entre_la_calle = COALESCE(EXCLUDED.entre_la_calle, escuelas.entre_la_calle),
  y_la_calle = COALESCE(EXCLUDED.y_la_calle, escuelas.y_la_calle),
  calle_posterior = COALESCE(EXCLUDED.calle_posterior, escuelas.calle_posterior),
  colonia   = COALESCE(EXCLUDED.colonia, escuelas.colonia),
  updated_at= NOW();

COMMIT;
