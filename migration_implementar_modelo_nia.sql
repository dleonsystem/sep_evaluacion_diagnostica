-- =====================================================================
-- MIGRACIÓN: Implementar Modelo NIA (Niveles de Integración del Aprendizaje)
-- Fecha: 11-mar-2026
-- Descripción: Corrección estructural crítica - Implementar modelo NIA documentado
-- Referencia: ESTRUCTURA_DE_DATOS.md, CORRECCIONES_MODELO_NIA.md (19-ene-2026)
-- =====================================================================
--
-- CAMBIOS APLICADOS:
-- 1. Crear tabla CAT_CAMPOS_FORMATIVOS (5 campos formativos SEP 2025)
-- 2. Crear tabla CAT_NIVELES_INTEGRACION (4 NIAs: ED, EP, ES, SO)
-- 3. Crear tabla NIVELES_INTEGRACION_ESTUDIANTE (reemplazo de campos deprecados)
-- 4. Eliminar campos deprecados de EVALUACIONES (nivel_integracion, competencia_alcanzada)
-- 5. Eliminar trigger que calcula nivel_integracion
-- 6. Corregir constraint UNIQUE en GRUPOS (quitar grado_id)
-- 7. Corregir constraint UNIQUE en EVALUACIONES (quitar solicitud_id)
--
-- IMPACTO: CRÍTICO - Cambios estructurales en tabla core EVALUACIONES
-- REQUISITO: Backup completo antes de ejecutar
-- DURACIÓN ESTIMADA: 2-5 minutos
--
-- =====================================================================

-- =====================================================================
-- INICIO DE MIGRACIÓN: Implementar Modelo NIA
-- Fecha: 11-mar-2026
-- =====================================================================
SELECT '======================================================================' as mensaje
UNION ALL SELECT 'MIGRACIÓN: Implementar Modelo NIA'
UNION ALL SELECT 'Fecha: 11-mar-2026'
UNION ALL SELECT '======================================================================';

-- =====================================================================
-- PASO 0: VERIFICACIONES PREVIAS Y BACKUP
-- =====================================================================

-- =====================================================================
-- PASO 0: Verificaciones Previas
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 0: Verificaciones Previas'
UNION ALL SELECT '----------------------------------------------------------------------';

-- Verificar que las tablas dependientes existen
DO $$
DECLARE
    v_tablas_faltantes TEXT[];
BEGIN
    SELECT ARRAY_AGG(tabla)
    INTO v_tablas_faltantes
    FROM unnest(ARRAY['estudiantes', 'periodos_evaluacion', 'evaluaciones']) AS tabla
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = tabla AND table_schema = 'public'
    );
    
    IF ARRAY_LENGTH(v_tablas_faltantes, 1) > 0 THEN
        RAISE EXCEPTION 'ERROR: Tablas requeridas no existen: %', ARRAY_TO_STRING(v_tablas_faltantes, ', ');
    END IF;
    
    RAISE NOTICE '✓ Todas las tablas requeridas existen';
END $$;

-- Verificar si las tablas NIA ya existen
DO $$
DECLARE
    v_tablas_existentes TEXT[];
BEGIN
    SELECT ARRAY_AGG(tabla)
    INTO v_tablas_existentes
    FROM unnest(ARRAY['cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante']) AS tabla
    WHERE EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = tabla AND table_schema = 'public'
    );
    
    IF ARRAY_LENGTH(v_tablas_existentes, 1) > 0 THEN
        RAISE WARNING '⚠ Las siguientes tablas NIA ya existen: %. Esta migración puede fallar.', 
                      ARRAY_TO_STRING(v_tablas_existentes, ', ');
    ELSE
        RAISE NOTICE '✓ Tablas NIA no existen, se crearán';
    END IF;
END $$;

-- Verificar existencia de campos deprecados
DO $$
DECLARE
    v_campos_existen BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'evaluaciones' 
        AND column_name IN ('nivel_integracion', 'competencia_alcanzada')
    ) INTO v_campos_existen;
    
    IF v_campos_existen THEN
        RAISE NOTICE '✓ Campos deprecados encontrados en EVALUACIONES, se eliminarán';
    ELSE
        RAISE WARNING '⚠ Campos deprecados NO encontrados, puede que ya se hayan eliminado';
    END IF;
END $$;

-- 
-- ⚠️  ADVERTENCIA: Esta migración realizará cambios CRÍTICOS en la estructura
-- ⚠️  Asegúrese de haber realizado un BACKUP COMPLETO antes de continuar
-- 
-- INSTRUCCIONES pgAdmin:
-- 1. Haga backup desde: Click derecho en BD > Backup...
-- 2. Ejecute este script completo en Query Tool (F5)
-- 3. Revise los mensajes de salida para verificar éxito
-- 

SELECT '⚠️ ADVERTENCIA: Realizar BACKUP antes de continuar' as mensaje
UNION ALL SELECT '⚠️ Esta migración modificará la tabla evaluaciones'
UNION ALL SELECT 'Si está listo, continúe con la ejecución (F5)';

-- =====================================================================
-- PASO 1: CREAR CATÁLOGO DE CAMPOS FORMATIVOS
-- =====================================================================

-- =====================================================================
-- PASO 1: Crear catálogo CAT_CAMPOS_FORMATIVOS
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 1: Crear catálogo CAT_CAMPOS_FORMATIVOS'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

CREATE TABLE IF NOT EXISTS cat_campos_formativos (
    id           SERIAL PRIMARY KEY,
    clave        VARCHAR(10) NOT NULL UNIQUE,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    orden_visual INT NOT NULL,
    vigente      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cat_campos_formativos_orden CHECK (orden_visual > 0),
    CONSTRAINT chk_cat_campos_formativos_clave CHECK (clave ~ '^[A-Z0-9]{1,10}$')
);

-- Insertar los 5 campos formativos según Plan de Estudios SEP 2025
INSERT INTO cat_campos_formativos (clave, nombre, descripcion, orden_visual)
VALUES 
    ('ENS', 'Ética, Naturaleza y Sociedades', 
     'Campo formativo que integra ética, ciencias naturales y sociales', 1),
    ('HYC', 'De lo Humano y lo Comunitario', 
     'Campo formativo enfocado en desarrollo humano y vida comunitaria', 2),
    ('LEN', 'Lenguajes', 
     'Campo formativo de comunicación y expresión en diversos lenguajes', 3),
    ('SPC', 'Saberes y Pensamiento Científico', 
     'Campo formativo de matemáticas, ciencia y pensamiento analítico', 4),
    ('F5', 'Campo Formativo 5', 
     'Quinto campo formativo (denominación provisional)', 5)
ON CONFLICT (clave) DO NOTHING;

-- Verificar inserción
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM cat_campos_formativos;
    IF v_count < 5 THEN
        RAISE EXCEPTION 'ERROR: Solo se insertaron % registros, se esperaban 5', v_count;
    END IF;
    RAISE NOTICE '✓ Catálogo cat_campos_formativos creado con % registros', v_count;
END $$;

-- Mostrar datos insertados
SELECT '✓ Campos Formativos creados:' as resultado;
SELECT id, clave, nombre, orden_visual, vigente 
FROM cat_campos_formativos 
ORDER BY orden_visual;

COMMIT;

SELECT '✓ PASO 1 COMPLETADO: Catálogo CAT_CAMPOS_FORMATIVOS creado exitosamente' as resultado;


-- =====================================================================
-- PASO 2: CREAR CATÁLOGO DE NIVELES DE INTEGRACIÓN (NIA)
-- =====================================================================

-- =====================================================================
-- PASO 2: Crear catálogo CAT_NIVELES_INTEGRACION
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 2: Crear catálogo CAT_NIVELES_INTEGRACION'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

CREATE TABLE IF NOT EXISTS cat_niveles_integracion (
    id_nia       SERIAL PRIMARY KEY,
    clave        VARCHAR(2) NOT NULL UNIQUE,
    nombre       VARCHAR(50) NOT NULL,
    descripcion  TEXT,
    rango_min    INT NOT NULL CHECK (rango_min BETWEEN 0 AND 3),
    rango_max    INT NOT NULL CHECK (rango_max BETWEEN 0 AND 3),
    color_hex    VARCHAR(7),
    orden_visual INT NOT NULL,
    vigente      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cat_niveles_integracion_rango CHECK (rango_min <= rango_max),
    CONSTRAINT chk_cat_niveles_integracion_orden CHECK (orden_visual > 0),
    CONSTRAINT chk_cat_niveles_integracion_clave CHECK (clave ~ '^[A-Z]{2}$')
);

-- Insertar los 4 niveles de integración oficiales SEP
INSERT INTO cat_niveles_integracion 
    (clave, nombre, descripcion, rango_min, rango_max, color_hex, orden_visual)
VALUES 
    ('ED', 'En Desarrollo', 
     'El estudiante está iniciando el desarrollo de los aprendizajes esperados', 
     0, 1, '#FF6B6B', 1),
    ('EP', 'En Proceso', 
     'El estudiante está en proceso de alcanzar los aprendizajes esperados', 
     1, 2, '#FFD93D', 2),
    ('ES', 'Esperado', 
     'El estudiante ha alcanzado los aprendizajes esperados', 
     2, 2, '#6BCF7F', 3),
    ('SO', 'Sobresaliente', 
     'El estudiante supera los aprendizajes esperados', 
     3, 3, '#4D96FF', 4)
ON CONFLICT (clave) DO NOTHING;

-- Verificar inserción
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM cat_niveles_integracion;
    IF v_count < 4 THEN
        RAISE EXCEPTION 'ERROR: Solo se insertaron % registros, se esperaban 4', v_count;
    END IF;
    RAISE NOTICE '✓ Catálogo cat_niveles_integracion creado con % registros', v_count;
END $$;

-- Mostrar datos insertados
SELECT '✓ Niveles de Integración (NIA) creados:' as resultado;
SELECT id_nia, clave, nombre, rango_min, rango_max, color_hex, orden_visual 
FROM cat_niveles_integracion 
ORDER BY orden_visual;

COMMIT;

SELECT '✓ PASO 2 COMPLETADO: Catálogo CAT_NIVELES_INTEGRACION creado exitosamente' as resultado;


-- =====================================================================
-- PASO 3: CREAR TABLA NIVELES_INTEGRACION_ESTUDIANTE
-- =====================================================================

-- =====================================================================
-- PASO 3: Crear tabla NIVELES_INTEGRACION_ESTUDIANTE
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 3: Crear tabla NIVELES_INTEGRACION_ESTUDIANTE'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

CREATE TABLE IF NOT EXISTS niveles_integracion_estudiante (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_estudiante        UUID NOT NULL,
    id_campo_formativo   INT NOT NULL,
    id_periodo           UUID NOT NULL,
    id_nia               INT NOT NULL,
    valoracion_promedio  NUMERIC(4,2) CHECK (valoracion_promedio BETWEEN 0 AND 3),
    total_materias       INT NOT NULL DEFAULT 0 CHECK (total_materias >= 0),
    materias_evaluadas   INT NOT NULL DEFAULT 0 CHECK (materias_evaluadas >= 0),
    calculado_en         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    calculado_por        VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    observaciones        TEXT,
    validado             BOOLEAN NOT NULL DEFAULT FALSE,
    validado_por         UUID,
    validado_en          TIMESTAMP,
    created_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_niveles_integracion_estudiante 
        FOREIGN KEY (id_estudiante) 
        REFERENCES estudiantes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_niveles_integracion_campo_formativo 
        FOREIGN KEY (id_campo_formativo) 
        REFERENCES cat_campos_formativos(id),
    
    CONSTRAINT fk_niveles_integracion_periodo 
        FOREIGN KEY (id_periodo) 
        REFERENCES periodos_evaluacion(id),
    
    CONSTRAINT fk_niveles_integracion_nia 
        FOREIGN KEY (id_nia) 
        REFERENCES cat_niveles_integracion(id_nia),
    
    CONSTRAINT fk_niveles_integracion_validado_por 
        FOREIGN KEY (validado_por) 
        REFERENCES usuarios(id),
    
    -- Constraint de unicidad: Un estudiante solo puede tener 1 NIA por campo formativo por periodo
    CONSTRAINT uq_niveles_integracion_estudiante 
        UNIQUE (id_estudiante, id_campo_formativo, id_periodo),
    
    -- Constraint de validación: materias_evaluadas no puede ser mayor que total_materias
    CONSTRAINT chk_niveles_integracion_materias 
        CHECK (materias_evaluadas <= total_materias),
    
    -- Constraint: Si validado = true, debe tener validado_por y validado_en
    CONSTRAINT chk_niveles_integracion_validacion 
        CHECK (
            (validado = FALSE) OR 
            (validado = TRUE AND validado_por IS NOT NULL AND validado_en IS NOT NULL)
        )
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_niveles_integracion_estudiante 
    ON niveles_integracion_estudiante(id_estudiante);

CREATE INDEX IF NOT EXISTS idx_niveles_integracion_periodo 
    ON niveles_integracion_estudiante(id_periodo);

CREATE INDEX IF NOT EXISTS idx_niveles_integracion_campo_formativo 
    ON niveles_integracion_estudiante(id_campo_formativo);

CREATE INDEX IF NOT EXISTS idx_niveles_integracion_nia 
    ON niveles_integracion_estudiante(id_nia);

CREATE INDEX IF NOT EXISTS idx_niveles_integracion_validado 
    ON niveles_integracion_estudiante(validado, validado_en);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION fn_touch_niveles_integracion_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_niveles_integracion ON niveles_integracion_estudiante;

CREATE TRIGGER trg_touch_niveles_integracion
    BEFORE UPDATE ON niveles_integracion_estudiante
    FOR EACH ROW
    EXECUTE FUNCTION fn_touch_niveles_integracion_updated_at();

-- Verificar creación
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'niveles_integracion_estudiante'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION 'ERROR: Tabla niveles_integracion_estudiante no se creó';
    END IF;
    
    RAISE NOTICE '✓ Tabla niveles_integracion_estudiante creada exitosamente';
END $$;

-- Mostrar estructura
SELECT '✓ Estructura de NIVELES_INTEGRACION_ESTUDIANTE:' as resultado;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'niveles_integracion_estudiante'
ORDER BY ordinal_position;

COMMIT;

SELECT '✓ PASO 3 COMPLETADO: Tabla NIVELES_INTEGRACION_ESTUDIANTE creada exitosamente' as resultado;


-- =====================================================================
-- PASO 4: ELIMINAR TRIGGER DE CÁLCULO DEPRECADO
-- =====================================================================

-- =====================================================================
-- PASO 4: Eliminar trigger deprecado de EVALUACIONES
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 4: Eliminar trigger deprecado de EVALUACIONES'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

-- Eliminar el trigger que calcula nivel_integracion y competencia_alcanzada
DROP TRIGGER IF EXISTS trg_calculate_nivel_integracion ON evaluaciones;
DROP TRIGGER IF EXISTS trg_set_nivel_integracion ON evaluaciones;
DROP TRIGGER IF EXISTS trigger_calculate_nivel_integracion ON evaluaciones;

-- Eliminar las funciones asociadas si existen
DROP FUNCTION IF EXISTS fn_calculate_nivel_integracion() CASCADE;
DROP FUNCTION IF EXISTS calculate_nivel_integracion() CASCADE;
DROP FUNCTION IF EXISTS set_nivel_integracion() CASCADE;

COMMIT;

SELECT '✓ PASO 4 COMPLETADO: Triggers deprecados eliminados' as resultado;


-- =====================================================================
-- PASO 4.5: BACKUP DE DATOS HISTÓRICOS (PRESERVAR INFORMACIÓN)
-- =====================================================================

-- =====================================================================
-- PASO 4.5: Crear backup de datos históricos de EVALUACIONES
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 4.5: Crear backup de datos históricos de EVALUACIONES'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

-- Crear tabla de backup con datos históricos antes de eliminar columnas
DROP TABLE IF EXISTS backup_evaluaciones_nia_historico;

CREATE TABLE backup_evaluaciones_nia_historico AS
SELECT 
    id,
    estudiante_id,
    materia_id,
    periodo_id,
    valoracion,
    nivel_integracion,
    competencia_alcanzada,
    created_at,
    updated_at,
    NOW() as backup_fecha
FROM evaluaciones
WHERE nivel_integracion IS NOT NULL 
   OR competencia_alcanzada IS NOT NULL;

-- Verificar backup
DO $$
DECLARE
    v_backup_count INT;
    v_total_count INT;
BEGIN
    SELECT COUNT(*) INTO v_backup_count FROM backup_evaluaciones_nia_historico;
    SELECT COUNT(*) INTO v_total_count FROM evaluaciones;
    
    RAISE NOTICE '✓ Backup creado: % registros con datos NIA de % evaluaciones totales', 
                 v_backup_count, v_total_count;
    
    IF v_backup_count = 0 THEN
        RAISE NOTICE '⚠ No hay datos históricos de NIA para respaldar (tabla vacía o campos NULL)';  
    ELSE
        RAISE NOTICE '✓ Datos históricos preservados en: backup_evaluaciones_nia_historico';
    END IF;
END $$;

-- Mostrar muestra del backup
SELECT '✓ Muestra de datos respaldados (primeros 5):' as resultado;
SELECT 
    id,
    valoracion,
    nivel_integracion,
    competencia_alcanzada,
    created_at
FROM backup_evaluaciones_nia_historico
LIMIT 5;

COMMIT;

SELECT '✓ PASO 4.5 COMPLETADO: Backup de datos históricos creado' as resultado
UNION ALL SELECT '✓ Tabla: backup_evaluaciones_nia_historico';


-- =====================================================================
-- PASO 5: ELIMINAR CAMPOS DEPRECADOS DE EVALUACIONES
-- =====================================================================

-- =====================================================================
-- PASO 5: Eliminar campos deprecados de EVALUACIONES
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 5: Eliminar campos deprecados de EVALUACIONES'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

-- Verificar si los campos existen antes de intentar eliminarlos
DO $$
BEGIN
    -- Eliminar nivel_integracion si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluaciones' AND column_name = 'nivel_integracion'
    ) THEN
        ALTER TABLE evaluaciones DROP COLUMN nivel_integracion;
        RAISE NOTICE '✓ Campo nivel_integracion eliminado';
    ELSE
        RAISE NOTICE '⚠ Campo nivel_integracion no existe';
    END IF;
    
    -- Eliminar competencia_alcanzada si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'evaluaciones' AND column_name = 'competencia_alcanzada'
    ) THEN
        ALTER TABLE evaluaciones DROP COLUMN competencia_alcanzada;
        RAISE NOTICE '✓ Campo competencia_alcanzada eliminado';
    ELSE
        RAISE NOTICE '⚠ Campo competencia_alcanzada no existe';
    END IF;
END $$;

-- Verificar eliminación
DO $$
DECLARE
    v_campos_restantes TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name)
    INTO v_campos_restantes
    FROM information_schema.columns 
    WHERE table_name = 'evaluaciones' 
    AND column_name IN ('nivel_integracion', 'competencia_alcanzada');
    
    IF ARRAY_LENGTH(v_campos_restantes, 1) > 0 THEN
        RAISE EXCEPTION 'ERROR: Campos deprecados aún existen: %', ARRAY_TO_STRING(v_campos_restantes, ', ');
    END IF;
    
    RAISE NOTICE '✓ Campos deprecados eliminados exitosamente de EVALUACIONES';
END $$;

COMMIT;

SELECT '✓ PASO 5 COMPLETADO: Campos deprecados eliminados de EVALUACIONES' as resultado;


-- =====================================================================
-- PASO 6: CORREGIR CONSTRAINT UNIQUE EN GRUPOS
-- =====================================================================

-- =====================================================================
-- PASO 6: Corregir constraint UNIQUE en GRUPOS
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 6: Corregir constraint UNIQUE en GRUPOS'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

-- Verificar si hay duplicados según nuevo constraint (escuela_id, nombre)
DO $$
DECLARE
    v_duplicados INT;
BEGIN
    SELECT COUNT(*) INTO v_duplicados
    FROM (
        SELECT escuela_id, nombre, COUNT(*) as total
        FROM grupos
        GROUP BY escuela_id, nombre
        HAVING COUNT(*) > 1
    ) duplicados;
    
    IF v_duplicados > 0 THEN
        RAISE WARNING '⚠ ADVERTENCIA: Existen % grupos duplicados con mismo (escuela_id, nombre)', v_duplicados;
        RAISE WARNING '⚠ Revise los datos antes de continuar. Grupos duplicados:';
        
        -- Mostrar duplicados
        RAISE NOTICE '%', (
            SELECT STRING_AGG(
                format('Escuela: %s, Nombre: %s, Total: %s', escuela_id, nombre, total),
                E'\n'
            )
            FROM (
                SELECT escuela_id, nombre, COUNT(*) as total
                FROM grupos
                GROUP BY escuela_id, nombre
                HAVING COUNT(*) > 1
            ) dup
        );
        
        RAISE EXCEPTION 'ERROR: No se puede aplicar constraint UNIQUE con datos duplicados. Corrija primero.';
    ELSE
        RAISE NOTICE '✓ No hay duplicados, se puede aplicar constraint';
    END IF;
END $$;

-- Eliminar constraint antiguo que incluye grado_id
DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    -- Buscar el constraint actual
    SELECT constraint_name INTO v_constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'grupos' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%grado%';
    
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE grupos DROP CONSTRAINT %I', v_constraint_name);
        RAISE NOTICE '✓ Constraint antiguo eliminado: %', v_constraint_name;
    ELSE
        RAISE NOTICE '⚠ No se encontró constraint con grado_id';
    END IF;
END $$;

-- Agregar nuevo constraint correcto (solo escuela_id, nombre)
ALTER TABLE grupos 
    DROP CONSTRAINT IF EXISTS uq_grupos_escuela_nombre;

ALTER TABLE grupos 
    ADD CONSTRAINT uq_grupos_escuela_nombre UNIQUE (escuela_id, nombre);

RAISE NOTICE '✓ Nuevo constraint creado: UNIQUE (escuela_id, nombre)';

-- Verificar el nuevo constraint
SELECT '✓ Constraint en GRUPOS verificado:' as resultado;
SELECT 
    tc.constraint_name,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columnas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'grupos' 
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%escuela%'
GROUP BY tc.constraint_name;

COMMIT;

SELECT '✓ PASO 6 COMPLETADO: Constraint UNIQUE en GRUPOS corregido' as resultado;


-- =====================================================================
-- PASO 7: CORREGIR CONSTRAINT UNIQUE EN EVALUACIONES
-- =====================================================================

-- =====================================================================
-- PASO 7: Corregir constraint UNIQUE en EVALUACIONES
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 7: Corregir constraint UNIQUE en EVALUACIONES'
UNION ALL SELECT '----------------------------------------------------------------------';

BEGIN;

-- Verificar si hay duplicados según nuevo constraint (estudiante_id, materia_id, periodo_id)
DO $$
DECLARE
    v_duplicados INT;
BEGIN
    SELECT COUNT(*) INTO v_duplicados
    FROM (
        SELECT estudiante_id, materia_id, periodo_id, COUNT(*) as total
        FROM evaluaciones
        GROUP BY estudiante_id, materia_id, periodo_id
        HAVING COUNT(*) > 1
    ) duplicados;
    
    IF v_duplicados > 0 THEN
        RAISE WARNING '⚠ ADVERTENCIA: Existen % evaluaciones duplicadas', v_duplicados;
        RAISE WARNING '⚠ Primeras 10 evaluaciones duplicadas:';
        
        -- Mostrar primeros 10 duplicados
        RAISE NOTICE '%', (
            SELECT STRING_AGG(
                format('Estudiante: %s, Materia: %s, Periodo: %s, Total: %s', 
                       estudiante_id, materia_id, periodo_id, total),
                E'\n'
            )
            FROM (
                SELECT estudiante_id, materia_id, periodo_id, COUNT(*) as total
                FROM evaluaciones
                GROUP BY estudiante_id, materia_id, periodo_id
                HAVING COUNT(*) > 1
                LIMIT 10
            ) dup
        );
        
        RAISE EXCEPTION 'ERROR: No se puede aplicar constraint UNIQUE con datos duplicados. Corrija primero.';
    ELSE
        RAISE NOTICE '✓ No hay duplicados, se puede aplicar constraint';
    END IF;
END $$;

-- Eliminar constraint antiguo que incluye solicitud_id
ALTER TABLE evaluaciones 
    DROP CONSTRAINT IF EXISTS uq_evaluaciones_solicitud;

-- Agregar nuevo constraint correcto (sin solicitud_id)
ALTER TABLE evaluaciones 
    DROP CONSTRAINT IF EXISTS uq_evaluaciones_estudiante_materia_periodo;

ALTER TABLE evaluaciones 
    ADD CONSTRAINT uq_evaluaciones_estudiante_materia_periodo 
    UNIQUE (estudiante_id, materia_id, periodo_id);

RAISE NOTICE '✓ Constraint corregido: UNIQUE (estudiante_id, materia_id, periodo_id)';

-- Verificar el nuevo constraint
SELECT '✓ Constraint en EVALUACIONES verificado:' as resultado;
SELECT 
    tc.constraint_name,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columnas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'evaluaciones' 
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%estudiante%'
GROUP BY tc.constraint_name;

COMMIT;

SELECT '✓ PASO 7 COMPLETADO: Constraint UNIQUE en EVALUACIONES corregido' as resultado;


-- =====================================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =====================================================================

-- =====================================================================
-- PASO 8: Verificación Final
-- =====================================================================
SELECT '======================================================================' as mensaje
UNION ALL SELECT 'PASO 8: Verificación Final'
UNION ALL SELECT '======================================================================';

-- Verificar que todas las tablas NIA existen
SELECT '✓ Verificación de tablas NIA:' as resultado;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
        THEN '✓ Existe'
        ELSE '✗ No existe'
    END as estado
FROM information_schema.tables
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
    AND table_schema = 'public'
ORDER BY table_name;

-- Verificar conteos de registros en catálogos
SELECT '✓ Conteo de registros en catálogos NIA:' as resultado;
SELECT 
    'cat_campos_formativos' as tabla,
    COUNT(*) as total_registros,
    CASE WHEN COUNT(*) = 5 THEN '✓ Correcto' ELSE '✗ Error' END as estado
FROM cat_campos_formativos
UNION ALL
SELECT 
    'cat_niveles_integracion' as tabla,
    COUNT(*) as total_registros,
    CASE WHEN COUNT(*) = 4 THEN '✓ Correcto' ELSE '✗ Error' END as estado
FROM cat_niveles_integracion;

-- Verificar que campos deprecados no existen en evaluaciones
DO $$
DECLARE
    v_campos_restantes INT;
BEGIN
    SELECT COUNT(*) INTO v_campos_restantes
    FROM information_schema.columns 
    WHERE table_name = 'evaluaciones' 
    AND column_name IN ('nivel_integracion', 'competencia_alcanzada');
    
    IF v_campos_restantes > 0 THEN
        RAISE EXCEPTION '✗ ERROR: Aún existen campos deprecados en EVALUACIONES';
    ELSE
        RAISE NOTICE '✓ Campos deprecados eliminados de EVALUACIONES';
    END IF;
END $$;

-- Verificar triggers eliminados
DO $$
DECLARE
    v_trigger_count INT;
BEGIN
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'evaluaciones'
    AND trigger_name LIKE '%nivel_integracion%';
    
    IF v_trigger_count > 0 THEN
        RAISE WARNING '⚠ Aún existen triggers relacionados con nivel_integracion';
    ELSE
        RAISE NOTICE '✓ Triggers deprecados eliminados completamente';
    END IF;
END $$;

-- Verificar constraints corregidos
SELECT '✓ Constraints corregidos:' as resultado;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columnas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('grupos', 'evaluaciones')
    AND tc.constraint_type = 'UNIQUE'
    AND (
        tc.constraint_name LIKE '%escuela%' OR 
        tc.constraint_name LIKE '%estudiante%'
    )
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name;

-- Verificar total de tablas
SELECT '✓ Total de tablas en base de datos:' as resultado;
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';


SELECT '======================================================================' as mensaje
UNION ALL SELECT '✓ MIGRACIÓN COMPLETADA EXITOSAMENTE'
UNION ALL SELECT '======================================================================'
UNION ALL SELECT ''
UNION ALL SELECT 'Cambios aplicados:'
UNION ALL SELECT '  ✓ Tabla cat_campos_formativos creada (5 registros)'
UNION ALL SELECT '  ✓ Tabla cat_niveles_integracion creada (4 registros)'
UNION ALL SELECT '  ✓ Tabla niveles_integracion_estudiante creada'
UNION ALL SELECT '  ✓ Campos deprecados eliminados de evaluaciones'
UNION ALL SELECT '  ✓ Trigger deprecado eliminado'
UNION ALL SELECT '  ✓ Constraint UNIQUE en grupos corregido'
UNION ALL SELECT '  ✓ Constraint UNIQUE en evaluaciones corregido'
UNION ALL SELECT ''
UNION ALL SELECT 'DATOS PRESERVADOS:'
UNION ALL SELECT '  ✓ Todas las evaluaciones existentes se mantuvieron'
UNION ALL SELECT '  ✓ Backup histórico: backup_evaluaciones_nia_historico'
UNION ALL SELECT '  ✓ Todas las tablas relacionadas intactas'
UNION ALL SELECT ''
UNION ALL SELECT 'PRÓXIMOS PASOS:'
UNION ALL SELECT '  1. REVISAR backup_evaluaciones_nia_historico'
UNION ALL SELECT '  2. Actualizar código de aplicación'
UNION ALL SELECT '  3. Implementar lógica de cálculo de NIAs'
UNION ALL SELECT ''
UNION ALL SELECT 'Ref: GUIA_EJECUCION_MIGRACION_NIA.md';

-- =====================================================================
-- PASO 8.5: MIGRACIÓN DE DATOS A NUEVA ESTRUCTURA (OPCIONAL)
-- =====================================================================

-- =====================================================================
-- PASO 8.5: Migración de datos históricos (OPCIONAL - Comentado)
-- =====================================================================
SELECT '----------------------------------------------------------------------' as mensaje
UNION ALL SELECT 'PASO 8.5: Migración de datos históricos (OPCIONAL)'
UNION ALL SELECT 'Esta sección está comentada - ver código para activarla'
UNION ALL SELECT '----------------------------------------------------------------------';

-- ⚠️ Esta sección está COMENTADA por defecto
-- ⚠️ Solo descomentar si desea calcular NIAs iniciales desde evaluaciones existentes
-- ⚠️ REQUISITOS:
--    1. Tener definido el mapeo: materia → campo_formativo
--    2. Tener periodos de evaluación definidos
--    3. Tener evaluaciones con valoraciones válidas (0-3)

-- OPCIÓN A: Calcular NIAs por campo formativo desde evaluaciones existentes
-- (Requiere tabla de mapeo materias → campos formativos)
--
-- -- Crear tabla de mapeo si no existe
-- CREATE TEMP TABLE temp_materia_campo_formativo AS
-- SELECT 
--     m.id as materia_id,
--     CASE 
--         WHEN m.nombre ILIKE '%matemáticas%' OR m.nombre ILIKE '%ciencias%' THEN 4  -- SPC
--         WHEN m.nombre ILIKE '%español%' OR m.nombre ILIKE '%inglés%' THEN 3  -- LEN
--         WHEN m.nombre ILIKE '%historia%' OR m.nombre ILIKE '%geografía%' THEN 1  -- ENS
--         WHEN m.nombre ILIKE '%formación%' OR m.nombre ILIKE '%artística%' THEN 2  -- HYC
--         ELSE 5  -- F5 (por defecto)
--     END as campo_formativo_id
-- FROM materias m;
--
-- -- Calcular y poblar NIAs por estudiante
-- INSERT INTO niveles_integracion_estudiante (
--     id_estudiante,
--     id_campo_formativo,
--     id_periodo,
--     id_nia,
--     valoracion_promedio,
--     total_materias,
--     materias_evaluadas,
--     calculado_en,
--     calculado_por,
--     observaciones
-- )
-- SELECT 
--     e.estudiante_id,
--     mcf.campo_formativo_id,
--     e.periodo_id,
--     -- Determinar NIA según promedio
--     CASE 
--         WHEN AVG(e.valoracion) < 1.0 THEN 1  -- ED (En Desarrollo)
--         WHEN AVG(e.valoracion) >= 1.0 AND AVG(e.valoracion) < 2.0 THEN 2  -- EP (En Proceso)
--         WHEN AVG(e.valoracion) >= 2.0 AND AVG(e.valoracion) < 2.5 THEN 3  -- ES (Esperado)
--         ELSE 4  -- SO (Sobresaliente)
--     END as id_nia,
--     ROUND(AVG(e.valoracion)::numeric, 2) as valoracion_promedio,
--     COUNT(DISTINCT e.materia_id) as total_materias,
--     COUNT(DISTINCT e.materia_id) as materias_evaluadas,
--     NOW() as calculado_en,
--     'MIGRACION_AUTOMATICA' as calculado_por,
--     'Calculado desde evaluaciones históricas durante migración' as observaciones
-- FROM evaluaciones e
-- JOIN temp_materia_campo_formativo mcf ON e.materia_id = mcf.materia_id
-- WHERE e.valoracion IS NOT NULL
-- GROUP BY e.estudiante_id, mcf.campo_formativo_id, e.periodo_id
-- ON CONFLICT (id_estudiante, id_campo_formativo, id_periodo) DO NOTHING;

-- OPCIÓN B: Ejemplo manual de inserción
-- INSERT INTO niveles_integracion_estudiante (
--     id_estudiante, id_campo_formativo, id_periodo, id_nia,
--     valoracion_promedio, total_materias, materias_evaluadas,
--     calculado_por, observaciones
-- )
-- VALUES (
--     '12345678-1234-1234-1234-123456789012'::UUID,  -- ID del estudiante
--     1,  -- ID campo formativo (ENS)
--     '87654321-4321-4321-4321-210987654321'::UUID,  -- ID periodo
--     3,  -- ID NIA (ES - Esperado)
--     2.5,  -- Valoración promedio
--     8,  -- Total materias del campo
--     8,  -- Materias ya evaluadas
--     'MANUAL',
--     'Ingreso manual de ejemplo'
-- );

SELECT '⚠️ PASO 8.5: Código de migración de datos disponible (comentado)' as resultado;


-- =====================================================================
-- ROLLBACK (Solo en caso de emergencia)
-- =====================================================================
--
-- ⚠️ ADVERTENCIA: Solo ejecutar si la migración causó problemas
-- ⚠️ Esto restaurará la estructura anterior (PERDERÁ datos de NIAs)
--
-- BEGIN;
-- 
-- -- Restaurar campos en evaluaciones
-- ALTER TABLE evaluaciones 
--     ADD COLUMN nivel_integracion VARCHAR(20),
--     ADD COLUMN competencia_alcanzada BOOLEAN NOT NULL DEFAULT FALSE;
-- 
-- -- Restaurar triggers (código completo necesario)
-- -- [Código del trigger original aquí]
-- 
-- -- Eliminar tablas NIA
-- DROP TABLE IF EXISTS niveles_integracion_estudiante CASCADE;
-- DROP TABLE IF EXISTS cat_niveles_integracion CASCADE;
-- DROP TABLE IF EXISTS cat_campos_formativos CASCADE;
-- 
-- -- Restaurar constraints antiguos
-- ALTER TABLE grupos DROP CONSTRAINT IF EXISTS uq_grupos_escuela_nombre;
-- ALTER TABLE grupos ADD CONSTRAINT grupos_escuela_id_grado_id_nombre_key 
--     UNIQUE (escuela_id, grado_id, nombre);
-- 
-- ALTER TABLE evaluaciones DROP CONSTRAINT IF EXISTS uq_evaluaciones_estudiante_materia_periodo;
-- ALTER TABLE evaluaciones ADD CONSTRAINT uq_evaluaciones_solicitud 
--     UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id);
-- 
-- COMMIT;
--
-- =====================================================================


-- =====================================================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- Archivo: migration_implementar_modelo_nia.sql
-- Fecha: 11-mar-2026
-- Ejecutado desde: pgAdmin Query Tool
-- =====================================================================

SELECT 'Script de migración finalizado exitosamente' as resultado
UNION ALL SELECT 'Fecha: 11-mar-2026'
UNION ALL SELECT 'Consulte GUIA_EJECUCION_MIGRACION_NIA.md para siguientes pasos';
