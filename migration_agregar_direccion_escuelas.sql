-- =====================================================================
-- MIGRACIÓN: Agregar campos de dirección a tabla ESCUELAS
-- Fecha: 10-feb-2026
-- Descripción: Agregar campos adicionales de dirección provenientes de catálogo SEP
-- =====================================================================

-- =====================================================================
-- VERIFICACIÓN PREVIA
-- =====================================================================

-- Verificar estructura actual de escuelas
SELECT 'Columnas actuales en tabla escuelas:' as paso;
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'escuelas'
ORDER BY ordinal_position;

-- Verificar cantidad de registros
SELECT 'Total de escuelas:' as paso;
SELECT COUNT(*) as total_escuelas FROM escuelas;

-- =====================================================================
-- AGREGAR NUEVOS CAMPOS DE DIRECCIÓN
-- =====================================================================

BEGIN;

-- Agregar campos de dirección
ALTER TABLE escuelas 
    ADD COLUMN municipio VARCHAR(100),
    ADD COLUMN localidad VARCHAR(100),
    ADD COLUMN calle VARCHAR(100),
    ADD COLUMN num_exterior VARCHAR(20),
    ADD COLUMN entre_la_calle VARCHAR(100),
    ADD COLUMN y_la_calle VARCHAR(100),
    ADD COLUMN calle_posterior VARCHAR(100),
    ADD COLUMN colonia VARCHAR(100);

-- Verificar que se agregaron correctamente
SELECT 'Nuevas columnas agregadas:' as paso;
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'escuelas'
    AND column_name IN (
        'municipio', 'localidad', 'calle', 'num_exterior',
        'entre_la_calle', 'y_la_calle', 'calle_posterior', 'colonia'
    )
ORDER BY ordinal_position;

COMMIT;

-- =====================================================================
-- VERIFICACIÓN FINAL
-- =====================================================================

-- Verificar estructura completa final
SELECT 'Estructura final de tabla escuelas:' as paso;
\d escuelas

-- Verificar que los datos existentes no se afectaron
SELECT 'Verificación de integridad de datos:' as paso;
SELECT COUNT(*) as total_escuelas FROM escuelas;

-- Mostrar muestra de registros con nuevos campos
SELECT 'Muestra de registros (primeros 5):' as paso;
SELECT 
    id,
    cct,
    nombre,
    estado,
    municipio,
    localidad,
    calle,
    num_exterior,
    colonia
FROM escuelas
LIMIT 5;

-- =====================================================================
-- RESUMEN
-- =====================================================================

SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado,
    'Tabla: escuelas' as tabla_modificada,
    '8 columnas agregadas' as cambios,
    'municipio, localidad, calle, num_exterior, entre_la_calle, y_la_calle, calle_posterior, colonia' as nuevas_columnas;

-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================
--
-- NUEVOS CAMPOS AGREGADOS (todos opcionales - NULL permitido):
-- 1. municipio       VARCHAR(100)  - Municipio de la escuela
-- 2. localidad       VARCHAR(100)  - Localidad donde se ubica
-- 3. calle           VARCHAR(100)  - Nombre de la calle
-- 4. num_exterior    VARCHAR(20)   - Número exterior (puede ser alfanumérico: 123, S/N, 45-A)
-- 5. entre_la_calle  VARCHAR(100)  - Referencia de ubicación: entre qué calle
-- 6. y_la_calle      VARCHAR(100)  - Referencia de ubicación: y qué otra calle
-- 7. calle_posterior VARCHAR(100)  - Referencia de ubicación: calle posterior
-- 8. colonia         VARCHAR(100)  - Colonia
--
-- PRÓXIMOS PASOS:
-- 1. Cargar catálogo SEP con datos de direcciones
-- 2. Ejecutar UPDATE para poblar campos nuevos desde el catálogo
-- 3. Actualizar modelos TypeORM/ORM para incluir nuevos campos
-- 4. Actualizar formularios/interfaces que capturen datos de escuelas
-- 5. Actualizar validaciones si es necesario
-- 6. Actualizar seeds/fixtures de prueba
--
-- EJEMPLO DE UPDATE CON DATOS DEL CATÁLOGO:
-- UPDATE escuelas e
-- SET 
--     municipio = c.municipio,
--     localidad = c.localidad,
--     calle = c.calle,
--     num_exterior = c.num_exterior,
--     entre_la_calle = c.entre_la_calle,
--     y_la_calle = c.y_la_calle,
--     calle_posterior = c.calle_posterior,
--     colonia = c.colonia
-- FROM catalogo_sep c
-- WHERE e.cct = c.cct;
--
-- =====================================================================
-- ROLLBACK (si es necesario)
-- =====================================================================
--
-- Si necesitas revertir los cambios:
--
-- BEGIN;
-- ALTER TABLE escuelas 
--     DROP COLUMN municipio,
--     DROP COLUMN localidad,
--     DROP COLUMN calle,
--     DROP COLUMN num_exterior,
--     DROP COLUMN entre_la_calle,
--     DROP COLUMN y_la_calle,
--     DROP COLUMN calle_posterior,
--     DROP COLUMN colonia;
-- COMMIT;
--
-- =====================================================================
