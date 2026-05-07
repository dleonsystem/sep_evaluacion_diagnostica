-- Migración GAP-DB-2: Unificación de Catálogos de Nivel Educativo
-- Consolida cat_niveles_educativos en cat_nivel_educativo

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'cat_niveles_educativos') THEN
        DROP TABLE cat_niveles_educativos CASCADE;
        RAISE NOTICE 'Tabla cat_niveles_educativos eliminada exitosamente.';
    ELSE
        RAISE NOTICE 'La tabla cat_niveles_educativos no existe, saltando eliminación.';
    END IF;
END $$;
