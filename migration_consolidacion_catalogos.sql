-- =====================================================================
-- MIGRACIÓN: Consolidación de catálogos y división campo nombre
-- Fecha: 09-feb-2026
-- Descripción: 
--   1. División de usuarios.nombre en nombre/apepaterno/apematerno
--   2. Consolidación de cat_niveles_educativos en cat_nivel_educativo
-- =====================================================================

-- =====================================================================
-- PARTE 1: DIVISIÓN DEL CAMPO NOMBRE EN TABLA USUARIOS
-- =====================================================================

BEGIN;

-- Paso 1.1: Agregar las nuevas columnas
ALTER TABLE usuarios 
    ADD COLUMN nombre_new VARCHAR(60),
    ADD COLUMN apepaterno VARCHAR(60),
    ADD COLUMN apematerno VARCHAR(60);

-- Paso 1.2: Migrar datos existentes
-- NOTA: Esta lógica asume que el nombre completo está en formato:
-- "Nombre Apellido1 Apellido2" o "Nombre Apellido"
-- Ajustar según el formato real de tus datos
UPDATE usuarios
SET 
    nombre_new = CASE 
        WHEN array_length(string_to_array(nombre, ' '), 1) >= 3 THEN
            string_to_array(nombre, ' ')[1]
        WHEN array_length(string_to_array(nombre, ' '), 1) = 2 THEN
            string_to_array(nombre, ' ')[1]
        ELSE
            nombre
    END,
    apepaterno = CASE 
        WHEN array_length(string_to_array(nombre, ' '), 1) >= 3 THEN
            string_to_array(nombre, ' ')[2]
        WHEN array_length(string_to_array(nombre, ' '), 1) = 2 THEN
            string_to_array(nombre, ' ')[2]
        ELSE
            'APELLIDO' -- Valor por defecto si no hay apellido
    END,
    apematerno = CASE 
        WHEN array_length(string_to_array(nombre, ' '), 1) >= 3 THEN
            array_to_string(string_to_array(nombre, ' ')[3:], ' ')
        ELSE
            NULL
    END;

-- Paso 1.3: Verificar que no haya valores NULL en campos requeridos
-- Descomentar para revisar:
-- SELECT id, nombre, nombre_new, apepaterno, apematerno 
-- FROM usuarios 
-- WHERE nombre_new IS NULL OR apepaterno IS NULL;

-- Paso 1.4: Establecer NOT NULL en las columnas requeridas
ALTER TABLE usuarios 
    ALTER COLUMN nombre_new SET NOT NULL,
    ALTER COLUMN apepaterno SET NOT NULL;

-- Paso 1.5: Eliminar la columna antigua y renombrar la nueva
ALTER TABLE usuarios 
    DROP COLUMN nombre,
    RENAME COLUMN nombre_new TO nombre;

COMMIT;

-- =====================================================================
-- PARTE 2: CONSOLIDACIÓN DE CATÁLOGOS DE NIVEL EDUCATIVO
-- =====================================================================

BEGIN;

-- Paso 2.1: Verificar que cat_nivel_educativo tenga los datos necesarios
-- Si no existe, crearla (este paso debería estar ya hecho)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR') THEN
        INSERT INTO cat_nivel_educativo (codigo, descripcion, orden)
        VALUES 
            ('PREESCOLAR', 'Preescolar', 1),
            ('PRIMARIA', 'Primaria', 2),
            ('SECUNDARIA', 'Secundaria', 3),
            ('TELESECUNDARIA', 'Telesecundaria', 4)
        ON CONFLICT (codigo) DO NOTHING;
    END IF;
END $$;

-- Paso 2.2: Crear tabla temporal de mapeo entre ambos catálogos
CREATE TEMP TABLE temp_nivel_mapping AS
SELECT 
    ne.id_nivel as id_nivel_old,
    cn.id as id_nivel_new,
    ne.codigo,
    ne.nombre
FROM cat_niveles_educativos ne
LEFT JOIN cat_nivel_educativo cn ON (
    UPPER(ne.codigo) = cn.codigo OR
    UPPER(ne.nombre) LIKE '%' || REPLACE(cn.codigo, '_', '%') || '%' OR
    cn.descripcion ILIKE '%' || ne.nombre || '%'
);

-- Paso 2.3: Verificar el mapeo
-- Descomentar para revisar:
-- SELECT * FROM temp_nivel_mapping;

-- Paso 2.4: Agregar columna temporal en escuelas
ALTER TABLE escuelas 
    ADD COLUMN id_nivel_new SMALLINT;

-- Paso 2.5: Migrar los datos usando el mapeo
UPDATE escuelas e
SET id_nivel_new = m.id_nivel_new
FROM temp_nivel_mapping m
WHERE e.id_nivel = m.id_nivel_old;

-- Paso 2.6: Verificar que todos los registros se migraron
-- Descomentar para revisar:
-- SELECT COUNT(*) as sin_migrar 
-- FROM escuelas 
-- WHERE id_nivel_new IS NULL;

-- Si hay registros sin migrar, asignar un valor por defecto:
-- Descomentar si es necesario:
-- UPDATE escuelas 
-- SET id_nivel_new = (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
-- WHERE id_nivel_new IS NULL;

-- Paso 2.7: Establecer NOT NULL y agregar FK
ALTER TABLE escuelas 
    ALTER COLUMN id_nivel_new SET NOT NULL;

ALTER TABLE escuelas
    ADD CONSTRAINT fk_escuelas_nivel 
    FOREIGN KEY (id_nivel_new) 
    REFERENCES cat_nivel_educativo(id);

-- Paso 2.8: Eliminar la columna antigua y renombrar la nueva
ALTER TABLE escuelas 
    DROP COLUMN id_nivel,
    RENAME COLUMN id_nivel_new TO id_nivel;

-- Paso 2.9: Eliminar la tabla obsoleta
DROP TABLE cat_niveles_educativos;

-- Paso 2.10: Crear índice en la nueva columna
CREATE INDEX IF NOT EXISTS idx_escuelas_nivel ON escuelas(id_nivel);

COMMIT;

-- =====================================================================
-- VERIFICACIÓN FINAL
-- =====================================================================

-- Verificar estructura de usuarios
\d usuarios

-- Verificar estructura de escuelas
\d escuelas

-- Verificar datos en cat_nivel_educativo
SELECT * FROM cat_nivel_educativo ORDER BY orden;

-- Verificar distribución de niveles en escuelas
SELECT 
    cn.codigo,
    cn.descripcion,
    COUNT(e.id) as total_escuelas
FROM cat_nivel_educativo cn
LEFT JOIN escuelas e ON e.id_nivel = cn.id
GROUP BY cn.id, cn.codigo, cn.descripcion, cn.orden
ORDER BY cn.orden;

-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================
-- 
-- ANTES DE EJECUTAR:
-- 1. Hacer backup completo de la base de datos
-- 2. Ejecutar en ambiente de desarrollo/pruebas primero
-- 3. Revisar los SELECT comentados para validar los datos
-- 4. Ajustar la lógica de división de nombres según formato real
-- 5. Verificar que no haya aplicaciones conectadas durante la migración
--
-- DESPUÉS DE EJECUTAR:
-- 1. Actualizar modelos ORM/TypeORM en la aplicación
-- 2. Actualizar queries GraphQL que referencien estos campos
-- 3. Actualizar tests unitarios e integración
-- 4. Actualizar seeds/fixtures si existen
-- 5. Comunicar cambios al equipo de desarrollo
--
-- ROLLBACK:
-- Si necesitas revertir, ejecuta:
-- BEGIN;
-- -- Para usuarios: restaurar desde backup
-- -- Para niveles: recrear cat_niveles_educativos y revertir escuelas.id_nivel
-- ROLLBACK;
-- =====================================================================
