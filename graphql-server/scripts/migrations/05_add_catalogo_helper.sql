-- Migración REM-DB-01: Implementación de función auxiliar para catálogos
-- Objetivo: Eliminar el uso de IDs mágicos en la capa de aplicación

BEGIN;

CREATE OR REPLACE FUNCTION fn_catalogo_id(p_tabla text, p_clave text)
RETURNS integer AS $$
DECLARE
    v_id integer;
BEGIN
    -- 1. Intentar con columna 'clave' (predeterminado)
    BEGIN
        EXECUTE format('SELECT id FROM %I WHERE clave = $1', p_tabla)
        INTO v_id
        USING p_clave;
    EXCEPTION WHEN undefined_column THEN
        v_id := NULL;
    END;

    -- 2. Intentar con columna 'codigo' if v_id is still null
    IF v_id IS NULL THEN
        BEGIN
            EXECUTE format('SELECT id FROM %I WHERE codigo = $1', p_tabla)
            INTO v_id
            USING p_clave;
        EXCEPTION WHEN undefined_column THEN
            v_id := NULL;
        END;
    END IF;

    -- 3. Variaciones de esquema legacy (id_nivel, id_entidad, etc.)
    IF v_id IS NULL THEN
        IF p_tabla = 'cat_niveles_integracion' THEN
            SELECT id_nia INTO v_id FROM cat_niveles_integracion WHERE clave = p_clave;
        ELSIF p_tabla = 'cat_nivel_educativo' THEN
            SELECT id_nivel INTO v_id FROM cat_nivel_educativo WHERE clave = p_clave;
        END IF;
    END IF;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el elemento con clave/codigo % en la tabla %', p_clave, p_tabla;
    END IF;

    RETURN v_id;
EXCEPTION
    WHEN undefined_table THEN
        RAISE EXCEPTION 'La tabla de catálogo % no existe', p_tabla;
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_catalogo_id(text, text) IS 'Retorna el ID de un catálogo dada su tabla y clave alfanumérica.';

COMMIT;
