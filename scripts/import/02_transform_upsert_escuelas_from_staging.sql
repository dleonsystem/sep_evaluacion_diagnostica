-- Transformar y upsert a public.escuelas desde staging.escuelas_csv
BEGIN;

WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY cct, NULLIF(TRIM(id_turno), '')
           ORDER BY nombre_cct
         ) AS rn
  FROM staging.escuelas_csv
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
)
INSERT INTO public.escuelas (
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
FROM clean
ON CONFLICT (cct, id_turno) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  estado    = EXCLUDED.estado,
  cp        = EXCLUDED.cp,
  telefono  = COALESCE(EXCLUDED.telefono, public.escuelas.telefono),
  email     = COALESCE(EXCLUDED.email, public.escuelas.email),
  director  = COALESCE(EXCLUDED.director, public.escuelas.director),
  id_turno  = EXCLUDED.id_turno,
  id_nivel  = EXCLUDED.id_nivel,
  id_entidad= EXCLUDED.id_entidad,
  id_ciclo  = EXCLUDED.id_ciclo,
  municipio = COALESCE(EXCLUDED.municipio, public.escuelas.municipio),
  localidad = COALESCE(EXCLUDED.localidad, public.escuelas.localidad),
  calle     = COALESCE(EXCLUDED.calle, public.escuelas.calle),
  num_exterior = COALESCE(EXCLUDED.num_exterior, public.escuelas.num_exterior),
  entre_la_calle = COALESCE(EXCLUDED.entre_la_calle, public.escuelas.entre_la_calle),
  y_la_calle = COALESCE(EXCLUDED.y_la_calle, public.escuelas.y_la_calle),
  calle_posterior = COALESCE(EXCLUDED.calle_posterior, public.escuelas.calle_posterior),
  colonia   = COALESCE(EXCLUDED.colonia, public.escuelas.colonia),
  updated_at= NOW();

COMMIT;

-- Tip: ejecutar en pgAdmin Query Tool después de importar el CSV a staging.escuelas_csv.