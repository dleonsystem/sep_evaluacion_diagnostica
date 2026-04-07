-- Migración REM-DB-01: Implementación de función auxiliar para catálogos
-- Objetivo: Eliminar el uso de IDs mágicos en la capa de aplicación

BEGIN;

CREATE OR REPLACE FUNCTION fn_catalogo_id(p_tabla text, p_clave text)
RETURNS integer AS $$
DECLARE
    v_id integer;
BEGIN
    -- Validación de entrada para prevenir inyección (aunque se usa %I)
    IF p_tabla IS NULL OR p_clave IS NULL THEN
        RETURN NULL;
    END IF;

    -- Ejecución dinámica segura
    EXECUTE format('SELECT id FROM %I WHERE clave = $1', p_tabla)
    INTO v_id
    USING p_clave;

    -- Si no se encuentra, intentar con id_nivel, id_entidad, etc. (variaciones de esquema legacy)
    IF v_id IS NULL THEN
        -- Intentar con 'id_' + nombre corto si aplica, o simplemente fallar si no es estándar
        -- Para Fase 1, la mayoría de las nuevas tablas usan 'id' o 'id_<nombre>'
        -- Por ahora, el estándar de normalización GAP-DB-3 usa 'id' para campos formativos
        -- y 'id_nia' para niveles de integración.
        
        IF p_tabla = 'cat_niveles_integracion' THEN
            SELECT id_nia INTO v_id FROM cat_niveles_integracion WHERE clave = p_clave;
        ELSIF p_tabla = 'cat_nivel_educativo' THEN
            SELECT id_nivel INTO v_id FROM cat_nivel_educativo WHERE clave = p_clave;
        END IF;
    END IF;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el elemento con clave % en la tabla %', p_clave, p_tabla;
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
