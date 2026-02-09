-- =====================================================================
-- MIGRACIÓN: Consolidación de catálogos de nivel educativo
-- Fecha: 09-feb-2026
-- Descripción: Eliminar cat_niveles_educativos y consolidar en cat_nivel_educativo
-- Tabla afectada: escuelas.id_nivel (INT → SMALLINT)
-- =====================================================================

-- =====================================================================
-- PASO 0: VERIFICACIONES PREVIAS
-- =====================================================================

-- Verificar estructura actual
SELECT 'Verificando tabla cat_niveles_educativos...' as paso;
SELECT id_nivel, nombre, codigo, descripcion FROM cat_niveles_educativos ORDER BY id_nivel;

SELECT 'Verificando tabla cat_nivel_educativo...' as paso;
SELECT id, codigo, descripcion, orden FROM cat_nivel_educativo ORDER BY orden;

SELECT 'Verificando distribución actual en escuelas...' as paso;
SELECT 
    e.id_nivel,
    ne.nombre,
    ne.codigo,
    COUNT(*) as total_escuelas
FROM escuelas e
JOIN cat_niveles_educativos ne ON e.id_nivel = ne.id_nivel
GROUP BY e.id_nivel, ne.nombre, ne.codigo
ORDER BY e.id_nivel;

-- =====================================================================
-- PASO 1: ASEGURAR QUE cat_nivel_educativo TIENE LOS DATOS
-- =====================================================================

BEGIN;

-- Insertar valores si no existen
INSERT INTO cat_nivel_educativo (codigo, descripcion, orden, activo)
VALUES 
    ('PREESCOLAR', 'Preescolar', 1, true),
    ('PRIMARIA', 'Primaria', 2, true),
    ('SECUNDARIA', 'Secundaria', 3, true),
    ('TELESECUNDARIA', 'Telesecundaria', 4, true)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar inserción
SELECT 'Catálogo cat_nivel_educativo actualizado:' as paso;
SELECT id, codigo, descripcion, orden, activo FROM cat_nivel_educativo ORDER BY orden;

COMMIT;

-- =====================================================================
-- PASO 2: CREAR MAPEO ENTRE CATÁLOGOS
-- =====================================================================

BEGIN;

-- Crear tabla temporal con mapeo basado en códigos y nombres
CREATE TEMP TABLE temp_nivel_mapping AS
SELECT 
    ne.id_nivel as id_old,
    CASE 
        -- Mapeo por código exacto (PRE, PRI, SEC, TEL)
        WHEN UPPER(ne.codigo) = 'PRE' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN UPPER(ne.codigo) = 'PRI' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN UPPER(ne.codigo) = 'SEC' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN UPPER(ne.codigo) = 'TEL' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        -- Mapeo por código completo
        WHEN UPPER(ne.codigo) = 'PREESCOLAR' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN UPPER(ne.codigo) = 'PRIMARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN UPPER(ne.codigo) = 'SECUNDARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN UPPER(ne.codigo) = 'TELESECUNDARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        -- Mapeo por nombre
        WHEN LOWER(ne.nombre) LIKE '%preescolar%' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN LOWER(ne.nombre) LIKE '%primaria%' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN LOWER(ne.nombre) LIKE '%secundaria%' AND LOWER(ne.nombre) NOT LIKE '%tele%' 
            THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN LOWER(ne.nombre) LIKE '%telesecundaria%' OR LOWER(ne.nombre) LIKE '%tele%secundaria%'
            THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        ELSE NULL
    END as id_new,
    ne.codigo as codigo_old,
    ne.nombre as nombre_old
FROM cat_niveles_educativos ne;

-- Verificar el mapeo
SELECT 'Mapeo generado (REVISAR ANTES DE CONTINUAR):' as paso;
SELECT * FROM temp_nivel_mapping;

-- Contar registros sin mapeo
SELECT 'Total registros sin mapeo:' as paso;
SELECT COUNT(*) as sin_mapeo FROM temp_nivel_mapping WHERE id_new IS NULL;

-- Si hay registros sin mapeo, DETENER AQUÍ y revisar
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_nivel_mapping WHERE id_new IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Existen % registros sin mapeo. Revisar temp_nivel_mapping y ajustar lógica.', v_count;
    END IF;
END $$;

COMMIT;

-- =====================================================================
-- PASO 3: MIGRAR ESCUELAS.ID_NIVEL
-- =====================================================================

BEGIN;

-- Paso 3.1: Agregar columna temporal
ALTER TABLE escuelas ADD COLUMN id_nivel_temp SMALLINT;

-- Paso 3.2: Poblar la columna temporal con el mapeo
UPDATE escuelas e
SET id_nivel_temp = m.id_new
FROM temp_nivel_mapping m
WHERE e.id_nivel = m.id_old;

-- Paso 3.3: Verificar la migración
SELECT 'Verificando migración de datos:' as paso;
SELECT 
    e.id_nivel as id_old,
    e.id_nivel_temp as id_new,
    ne_old.codigo as codigo_old,
    cn_new.codigo as codigo_new,
    COUNT(*) as total
FROM escuelas e
LEFT JOIN cat_niveles_educativos ne_old ON e.id_nivel = ne_old.id_nivel
LEFT JOIN cat_nivel_educativo cn_new ON e.id_nivel_temp = cn_new.id
GROUP BY e.id_nivel, e.id_nivel_temp, ne_old.codigo, cn_new.codigo
ORDER BY e.id_nivel;

-- Paso 3.4: Verificar que NO haya NULLs
SELECT 'Registros con id_nivel_temp NULL:' as paso;
SELECT COUNT(*) as total_null FROM escuelas WHERE id_nivel_temp IS NULL;

DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM escuelas WHERE id_nivel_temp IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Existen % escuelas con id_nivel_temp NULL. Revisar migración.', v_count;
    END IF;
END $$;

-- Paso 3.5: Establecer NOT NULL
ALTER TABLE escuelas ALTER COLUMN id_nivel_temp SET NOT NULL;

-- Paso 3.6: Eliminar FK y columna antigua
ALTER TABLE escuelas DROP CONSTRAINT IF EXISTS escuelas_id_nivel_fkey;
ALTER TABLE escuelas DROP COLUMN id_nivel;

-- Paso 3.7: Renombrar columna temporal
ALTER TABLE escuelas RENAME COLUMN id_nivel_temp TO id_nivel;

-- Paso 3.8: Agregar nueva FK
ALTER TABLE escuelas 
    ADD CONSTRAINT fk_escuelas_nivel_educativo 
    FOREIGN KEY (id_nivel) 
    REFERENCES cat_nivel_educativo(id);

-- Paso 3.9: Crear índice
CREATE INDEX IF NOT EXISTS idx_escuelas_nivel ON escuelas(id_nivel);

SELECT 'Migración de escuelas completada.' as paso;

COMMIT;

-- =====================================================================
-- PASO 4: ELIMINAR TABLA OBSOLETA
-- =====================================================================

BEGIN;

-- Verificar que no hay otras FKs apuntando a cat_niveles_educativos
SELECT 'Verificando dependencias de cat_niveles_educativos:' as paso;
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'cat_niveles_educativos';

-- Si el SELECT anterior retorna registros, NO CONTINUAR
-- Si está vacío, proceder a eliminar

DROP TABLE cat_niveles_educativos CASCADE;

SELECT 'Tabla cat_niveles_educativos eliminada exitosamente.' as paso;

COMMIT;

-- =====================================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================================

-- Verificar estructura de escuelas
\d escuelas

-- Verificar datos en cat_nivel_educativo
SELECT 'Catálogo cat_nivel_educativo:' as paso;
SELECT * FROM cat_nivel_educativo ORDER BY orden;

-- Verificar distribución final en escuelas
SELECT 'Distribución de niveles en escuelas:' as paso;
SELECT 
    cn.id,
    cn.codigo,
    cn.descripcion,
    COUNT(e.id) as total_escuelas
FROM cat_nivel_educativo cn
LEFT JOIN escuelas e ON e.id_nivel = cn.id
GROUP BY cn.id, cn.codigo, cn.descripcion, cn.orden
ORDER BY cn.orden;

-- Verificar que no existe cat_niveles_educativos
SELECT 'Verificando eliminación de cat_niveles_educativos:' as paso;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'cat_niveles_educativos'
) as tabla_existe;

-- =====================================================================
-- RESUMEN FINAL
-- =====================================================================

SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado,
    'Catálogo consolidado: cat_nivel_educativo' as catalogo_activo,
    'Tabla eliminada: cat_niveles_educativos' as tabla_eliminada,
    'Columna migrada: escuelas.id_nivel (INT → SMALLINT)' as cambio_estructura;

-- =====================================================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- =====================================================================
-- 
-- 1. ACTUALIZAR CÓDIGO DE APLICACIÓN:
--    - Cambiar todas las referencias de cat_niveles_educativos a cat_nivel_educativo
--    - Actualizar modelos ORM/TypeORM
--    - Ajustar tipo de dato de escuelas.id_nivel de number a smallint
--
-- 2. ACTUALIZAR QUERIES:
--    - Cambiar id_nivel (INT) por id_nivel (SMALLINT) en selects
--    - Usar códigos canónicos: 'PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'TELESECUNDARIA'
--    - Función helper disponible: fn_catalogo_id('cat_nivel_educativo', 'CODIGO')
--
-- 3. SEEDS/FIXTURES:
--    - Actualizar archivos de datos de prueba
--    - Usar IDs del nuevo catálogo o códigos canónicos
--
-- 4. TESTS:
--    - Actualizar tests unitarios e integración
--    - Verificar que usen el nuevo catálogo
--
-- 5. DOCUMENTACIÓN:
--    - Ya actualizada en ESTRUCTURA_DE_DATOS.md
--    - Comunicar cambios al equipo
--
-- =====================================================================
-- ROLLBACK (Solo si es necesario)
-- =====================================================================
--
-- ADVERTENCIA: Solo ejecutar si la migración falló y necesitas revertir
--
-- BEGIN;
-- 
-- -- Recrear cat_niveles_educativos
-- CREATE TABLE cat_niveles_educativos (
--     id_nivel    INT PRIMARY KEY,
--     nombre      VARCHAR(50) NOT NULL,
--     codigo      VARCHAR(10) NOT NULL UNIQUE,
--     descripcion VARCHAR(200),
--     orden       INT
-- );
-- 
-- INSERT INTO cat_niveles_educativos VALUES
-- (1, 'Preescolar', 'PRE', 'Educación Preescolar (3-5 años)', 1),
-- (2, 'Primaria', 'PRI', 'Educación Primaria (6-11 años)', 2),
-- (3, 'Secundaria', 'SEC', 'Educación Secundaria General', 3),
-- (4, 'Telesecundaria', 'TEL', 'Educación Telesecundaria', 4);
-- 
-- -- Revertir escuelas.id_nivel
-- ALTER TABLE escuelas ADD COLUMN id_nivel_old INT;
-- 
-- UPDATE escuelas e
-- SET id_nivel_old = CASE 
--     WHEN cn.codigo = 'PREESCOLAR' THEN 1
--     WHEN cn.codigo = 'PRIMARIA' THEN 2
--     WHEN cn.codigo = 'SECUNDARIA' THEN 3
--     WHEN cn.codigo = 'TELESECUNDARIA' THEN 4
-- END
-- FROM cat_nivel_educativo cn
-- WHERE e.id_nivel = cn.id;
-- 
-- ALTER TABLE escuelas DROP CONSTRAINT fk_escuelas_nivel_educativo;
-- ALTER TABLE escuelas DROP COLUMN id_nivel;
-- ALTER TABLE escuelas RENAME COLUMN id_nivel_old TO id_nivel;
-- ALTER TABLE escuelas ALTER COLUMN id_nivel SET NOT NULL;
-- ALTER TABLE escuelas ADD CONSTRAINT escuelas_id_nivel_fkey 
--     FOREIGN KEY (id_nivel) REFERENCES cat_niveles_educativos(id_nivel);
-- 
-- COMMIT;
--
-- =====================================================================
