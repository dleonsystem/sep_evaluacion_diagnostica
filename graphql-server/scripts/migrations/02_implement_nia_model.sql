-- Migración GAP-DB-3: Implementación del Modelo NIA Institucional (Fase 1)
-- Basado en CORRECIONES_MODELO_NIA.md y RESUMEN_CORRECCIONES_CLIENTE.md

BEGIN;

-- 1. Catálogo de Niveles de Integración (NIA)
CREATE TABLE IF NOT EXISTS CAT_NIVELES_INTEGRACION (
    id_nia              SERIAL PRIMARY KEY,
    clave               VARCHAR(2) NOT NULL UNIQUE,     -- ED, EP, ES, SO
    nombre              VARCHAR(50) NOT NULL,
    descripcion         TEXT NOT NULL,
    rango_min           INT NOT NULL CHECK (rango_min >= 0 AND rango_min <= 3),
    rango_max           INT NOT NULL CHECK (rango_max >= 0 AND rango_max <= 3),
    color_hex           VARCHAR(7),
    orden_visual        INT NOT NULL,
    vigente             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_rango_valido CHECK (rango_min <= rango_max)
);

-- Sembrar Niveles NIA
INSERT INTO CAT_NIVELES_INTEGRACION (clave, nombre, descripcion, rango_min, rango_max, color_hex, orden_visual) 
VALUES
    ('ED', 'En Desarrollo', 'Requiere apoyo adicional significativo para alcanzar los aprendizajes esperados', 0, 0, '#DC3545', 1),
    ('EP', 'En Proceso', 'Muestra avances hacia los aprendizajes esperados, requiere refuerzo específico', 1, 1, '#FFC107', 2),
    ('ES', 'Esperado', 'Cumple satisfactoriamente con los aprendizajes esperados para su grado', 2, 2, '#28A745', 3),
    ('SO', 'Sobresaliente', 'Supera los aprendizajes esperados, demuestra dominio avanzado', 3, 3, '#007BFF', 4)
ON CONFLICT (clave) DO NOTHING;

-- 2. Catálogo de Campos Formativos
CREATE TABLE IF NOT EXISTS CAT_CAMPOS_FORMATIVOS (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(10) NOT NULL UNIQUE,     -- ENS, HYC, LEN, SPC, F5
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    orden_visual    INT NOT NULL,
    vigente         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sembrar Campos Formativos
INSERT INTO CAT_CAMPOS_FORMATIVOS (clave, nombre, descripcion, orden_visual) 
VALUES
    ('ENS', 'Enseñanza', 'Español y Matemáticas', 1),
    ('HYC', 'Historia y Civismo', 'Ética, Naturaleza y Sociedades', 2),
    ('LEN', 'Lenguaje y Comunicación', 'Lenguajes', 3),
    ('SPC', 'Saberes y Pensamiento Científico', 'Saberes y Pensamiento Científico', 4),
    ('F5', 'Formato 5', 'Reporte individual consolidado', 5)
ON CONFLICT (clave) DO NOTHING;

-- 3. Modificación a MATERIAS para vincular con Campos Formativos
ALTER TABLE MATERIAS ADD COLUMN IF NOT EXISTS id_campo_formativo INT REFERENCES CAT_CAMPOS_FORMATIVOS(id);

-- Actualizar mapeo de materias existentes
-- Basado en códigos actuales (LEN, SPC, ENS, HYC)
UPDATE MATERIAS SET id_campo_formativo = (SELECT id FROM CAT_CAMPOS_FORMATIVOS WHERE clave = 'LEN') WHERE codigo = 'LEN';
UPDATE MATERIAS SET id_campo_formativo = (SELECT id FROM CAT_CAMPOS_FORMATIVOS WHERE clave = 'SPC') WHERE codigo = 'SPC';
-- ENS en Materias (Ética...) mapea a HYC (Historia y Civismo) institucionalmente
UPDATE MATERIAS SET id_campo_formativo = (SELECT id FROM CAT_CAMPOS_FORMATIVOS WHERE clave = 'HYC') WHERE codigo = 'ENS';
-- HYC en Materias (Humano...) mapea a F5 o se mantiene en HYC segun criterio
UPDATE MATERIAS SET id_campo_formativo = (SELECT id FROM CAT_CAMPOS_FORMATIVOS WHERE clave = 'HYC') WHERE codigo = 'HYC' AND id_campo_formativo IS NULL;

-- 4. Tabla de Resultados NIA por Estudiante
CREATE TABLE IF NOT EXISTS NIVELES_INTEGRACION_ESTUDIANTE (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_estudiante       UUID NOT NULL REFERENCES ESTUDIANTES(id) ON DELETE CASCADE,
    id_campo_formativo  INT NOT NULL REFERENCES CAT_CAMPOS_FORMATIVOS(id),
    id_periodo          UUID NOT NULL REFERENCES PERIODOS_EVALUACION(id),
    id_nia              INT NOT NULL REFERENCES CAT_NIVELES_INTEGRACION(id_nia),
    
    valoracion_promedio NUMERIC(4,2) NOT NULL CHECK (valoracion_promedio >= 0 AND valoracion_promedio <= 3),
    total_materias      INT NOT NULL CHECK (total_materias > 0),
    materias_evaluadas  INT NOT NULL CHECK (materias_evaluadas > 0 AND materias_evaluadas <= total_materias),
    
    calculado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculado_por       VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    observaciones       TEXT,
    
    validado            BOOLEAN DEFAULT FALSE,
    validado_por        UUID REFERENCES USUARIOS(id),
    validado_en         TIMESTAMP,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_estudiante_campo_periodo UNIQUE (id_estudiante, id_campo_formativo, id_periodo)
);

-- Índices NIA
CREATE INDEX IF NOT EXISTS idx_nia_estudiante ON NIVELES_INTEGRACION_ESTUDIANTE(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_nia_periodo ON NIVELES_INTEGRACION_ESTUDIANTE(id_periodo);
CREATE INDEX IF NOT EXISTS idx_nia_campo ON NIVELES_INTEGRACION_ESTUDIANTE(id_campo_formativo);

-- 5. Limpieza de EVALUACIONES
ALTER TABLE EVALUACIONES DROP COLUMN IF EXISTS nivel_integracion;
ALTER TABLE EVALUACIONES DROP COLUMN IF EXISTS competencia_alcanzada;

-- 6. Lógica de Cálculo Automático (Trigger)
CREATE OR REPLACE FUNCTION calcular_nia_estudiante()
RETURNS TRIGGER AS $$
DECLARE
    v_id_campo_formativo INT;
    v_promedio NUMERIC(4,2);
    v_id_nia INT;
    v_total_materias INT;
    v_materias_evaluadas INT;
BEGIN
    -- Obtener campo formativo de la materia evaluada
    SELECT id_campo_formativo INTO v_id_campo_formativo
    FROM MATERIAS
    WHERE id = NEW.materia_id;
    
    IF v_id_campo_formativo IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calcular promedio de valoraciones para este estudiante, campo y periodo
    SELECT 
        AVG(e.valoracion)::NUMERIC(4,2),
        COUNT(DISTINCT m.id),
        COUNT(DISTINCT e.materia_id)
    INTO v_promedio, v_total_materias, v_materias_evaluadas
    FROM EVALUACIONES e
    INNER JOIN MATERIAS m ON e.materia_id = m.id
    WHERE e.estudiante_id = NEW.estudiante_id
      AND e.periodo_id = NEW.periodo_id
      AND m.id_campo_formativo = v_id_campo_formativo
      AND e.validado = TRUE;
    
    IF v_materias_evaluadas > 0 THEN
        -- Determinar NIA según promedio
        SELECT id_nia INTO v_id_nia
        FROM CAT_NIVELES_INTEGRACION
        WHERE v_promedio BETWEEN rango_min AND rango_max
          AND vigente = TRUE
        LIMIT 1;
        
        -- Insertar o actualizar NIA
        INSERT INTO NIVELES_INTEGRACION_ESTUDIANTE (
            id_estudiante, id_campo_formativo, id_periodo, id_nia,
            valoracion_promedio, total_materias, materias_evaluadas
        )
        VALUES (
            NEW.estudiante_id, v_id_campo_formativo, NEW.periodo_id, v_id_nia,
            v_promedio, v_total_materias, v_materias_evaluadas
        )
        ON CONFLICT (id_estudiante, id_campo_formativo, id_periodo)
        DO UPDATE SET
            id_nia = EXCLUDED.id_nia,
            valoracion_promedio = EXCLUDED.valoracion_promedio,
            total_materias = EXCLUDED.total_materias,
            materias_evaluadas = EXCLUDED.materias_evaluadas,
            calculado_en = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_nia_auto ON EVALUACIONES;
CREATE TRIGGER trg_calcular_nia_auto
AFTER INSERT OR UPDATE OF valoracion, validado ON EVALUACIONES
FOR EACH ROW
WHEN (NEW.validado = TRUE)
EXECUTE FUNCTION calcular_nia_estudiante();

COMMIT;
