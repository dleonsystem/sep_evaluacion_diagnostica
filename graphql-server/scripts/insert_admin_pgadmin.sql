-- Script SQL para crear usuario Administrador
-- Compatible con pgAdmin 4
-- Password generado para: 'admin123'

DO $$
DECLARE
    role_id_lookup integer;
    table_exists boolean;
BEGIN
    -- 1. Determinar si existe tabla de roles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cat_roles_usuario'
    ) INTO table_exists;

    IF table_exists THEN
        -- Buscar ID del rol y asignarlo como ENTERO
        SELECT id_rol INTO role_id_lookup 
        FROM cat_roles_usuario 
        WHERE codigo IN ('COORDINADOR_FEDERAL', 'ADMIN', 'ADMINISTRADOR') 
        LIMIT 1;

        IF role_id_lookup IS NULL THEN
             RAISE NOTICE 'Tabla roles existe pero no se encontró COORDINADOR_FEDERAL. Usando ID 1 por defecto.';
             role_id_lookup := 1;
        END IF;

        RAISE NOTICE 'Tabla de roles detectada. Insertando con ID de rol: %', role_id_lookup;

        -- INSERT usando el valor INTEGER directo
        INSERT INTO usuarios (
            email, 
            nombre, 
            apepaterno, 
            apematerno, 
            rol, 
            password_hash, 
            activo, 
            fecha_registro
        ) VALUES (
            'admin@sep.gob.mx', 
            'Administrador', 
            'Sistema', 
            NULL, 
            role_id_lookup, -- Aquí pasamos un ENTERO
            '60fb31b891235e1baff62b1b7038e334:e9f0fdc873cd9135d27bf094b2b823a211fb0cfb57b76634864332b3836b4bed1a084c1f2449636af2d8bb8fc0b648436c2166a9f722257c4fbffa679990798d', 
            true, 
            NOW()
        );

    ELSE
        -- Modo String (Schema legacy)
        RAISE NOTICE 'Tabla de roles NO detectada. Insertando con código de rol TEXTO.';

        INSERT INTO usuarios (
            email, 
            nombre, 
            apepaterno, 
            apematerno, 
            rol, 
            password_hash, 
            activo, 
            fecha_registro
        ) VALUES (
            'admin@sep.gob.mx', 
            'Administrador', 
            'Sistema', 
            NULL, 
            'COORDINADOR_FEDERAL', -- Aquí pasamos un STRING
            '60fb31b891235e1baff62b1b7038e334:e9f0fdc873cd9135d27bf094b2b823a211fb0cfb57b76634864332b3836b4bed1a084c1f2449636af2d8bb8fc0b648436c2166a9f722257c4fbffa679990798d', 
            true, 
            NOW()
        );
    END IF;
    
    RAISE NOTICE '✅ Usuario admin@sep.gob.mx creado exitosamente.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error al crear usuario: %', SQLERRM;
END $$;
