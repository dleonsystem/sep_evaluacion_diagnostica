# Correcciones al Modelo de Niveles de Integración del Aprendizaje (NIA)

**Fecha:** 19 de enero de 2026  
**Origen:** Observaciones oficiales DGTIC/DGADAE  
**Prioridad:** 🔴 P0 - Crítico

---

## I. Problemas Identificados

### 1. Modelo NIA Incorrecto en EVALUACIONES

❌ **Estado actual (INCORRECTO):**
```sql
CREATE TABLE EVALUACIONES (
    -- ...otros campos...
    nivel_integracion VARCHAR(20),      -- ❌ Campo único cuando debería ser N:4
    competencia_alcanzada BOOLEAN,      -- ❌ Sin fundamento institucional claro
    -- ...
);
```

**Problemas:**
- Campo `nivel_integracion` modelado como atributo único por evaluación
- **Realidad:** NIA es por estudiante Y por Campo Formativo (4 NIAs por estudiante)
- Campo `competencia_alcanzada` sin definición institucional ni uso claro
- Mezcla de dos marcos de referencia: "niveles de logro" vs "niveles de integración"

### 2. Falta de Catálogo Oficial de NIAs

❌ No existe catálogo normalizado de Niveles de Integración del Aprendizaje  
❌ Valores hardcodeados en triggers y lógica de aplicación  
❌ Inconsistencia entre documentación y código

---

## II. Marco Institucional Definido

### Niveles de Integración del Aprendizaje (NIA) - Marco SEP

Según lineamientos SEP 2025 para Evaluación Diagnóstica:

| Nivel | Clave | Descripción | Rango Valoración |
|-------|-------|-------------|------------------|
| **En Desarrollo** | ED | Requiere apoyo adicional significativo | 0 |
| **En Proceso** | EP | Muestra avances, requiere refuerzo | 1 |
| **Esperado** | ES | Cumple con los aprendizajes esperados | 2 |
| **Sobresaliente** | SO | Supera los aprendizajes esperados | 3 |

**Aplicación:**
- **Por estudiante**: Cada estudiante tiene 4 NIAs (uno por campo formativo)
- **Por campo formativo**: ENS, HYC, LEN, SPC
- **Por periodo**: Diagnóstico Inicial, Intermedio, Final
- **Calculado desde**: Valoraciones (0-3) de materias del campo

---

## III. Solución Implementada

### 1. Nuevo Catálogo: CAT_NIVELES_INTEGRACION

```sql
CREATE TABLE CAT_NIVELES_INTEGRACION (
    id_nia              SERIAL PRIMARY KEY,
    clave               VARCHAR(2) NOT NULL UNIQUE,     -- ED, EP, ES, SO
    nombre              VARCHAR(50) NOT NULL,            -- En Desarrollo, En Proceso...
    descripcion         TEXT NOT NULL,
    rango_min           INT NOT NULL CHECK (rango_min >= 0 AND rango_min <= 3),
    rango_max           INT NOT NULL CHECK (rango_max >= 0 AND rango_max <= 3),
    color_hex           VARCHAR(7),                      -- Para visualización (#FF0000)
    orden_visual        INT NOT NULL,                    -- Orden para gráficas (1-4)
    vigente             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_rango_valido CHECK (rango_min <= rango_max)
);

-- Datos iniciales
INSERT INTO CAT_NIVELES_INTEGRACION 
    (clave, nombre, descripcion, rango_min, rango_max, color_hex, orden_visual) 
VALUES
    ('ED', 'En Desarrollo', 
     'Requiere apoyo adicional significativo para alcanzar los aprendizajes esperados', 
     0, 0, '#DC3545', 1),
    ('EP', 'En Proceso', 
     'Muestra avances hacia los aprendizajes esperados, requiere refuerzo específico', 
     1, 1, '#FFC107', 2),
    ('ES', 'Esperado', 
     'Cumple satisfactoriamente con los aprendizajes esperados para su grado', 
     2, 2, '#28A745', 3),
    ('SO', 'Sobresaliente', 
     'Supera los aprendizajes esperados, demuestra dominio avanzado', 
     3, 3, '#007BFF', 4);
```

### 2. Nueva Tabla: NIVELES_INTEGRACION_ESTUDIANTE

```sql
CREATE TABLE NIVELES_INTEGRACION_ESTUDIANTE (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_estudiante       UUID NOT NULL REFERENCES ESTUDIANTES(id) ON DELETE CASCADE,
    id_campo_formativo  INT NOT NULL REFERENCES CAT_CAMPOS_FORMATIVOS(id),
    id_periodo          INT NOT NULL REFERENCES PERIODOS_EVALUACION(id),
    id_nia              INT NOT NULL REFERENCES CAT_NIVELES_INTEGRACION(id_nia),
    
    -- Trazabilidad del cálculo
    valoracion_promedio NUMERIC(4,2) NOT NULL CHECK (valoracion_promedio >= 0 AND valoracion_promedio <= 3),
    total_materias      INT NOT NULL CHECK (total_materias > 0),
    materias_evaluadas  INT NOT NULL CHECK (materias_evaluadas > 0 AND materias_evaluadas <= total_materias),
    
    -- Metadatos
    calculado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculado_por       VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',  -- SISTEMA, MANUAL, AJUSTE_DGADAE
    observaciones       TEXT,
    
    -- Auditoría
    validado            BOOLEAN DEFAULT FALSE,
    validado_por        UUID REFERENCES USUARIOS(id),
    validado_en         TIMESTAMP,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricción: un solo NIA por estudiante, campo formativo y periodo
    CONSTRAINT uq_estudiante_campo_periodo 
        UNIQUE (id_estudiante, id_campo_formativo, id_periodo)
);

-- Índices para consultas frecuentes
CREATE INDEX idx_nia_estudiante ON NIVELES_INTEGRACION_ESTUDIANTE(id_estudiante);
CREATE INDEX idx_nia_periodo ON NIVELES_INTEGRACION_ESTUDIANTE(id_periodo);
CREATE INDEX idx_nia_campo ON NIVELES_INTEGRACION_ESTUDIANTE(id_campo_formativo);
CREATE INDEX idx_nia_nivel ON NIVELES_INTEGRACION_ESTUDIANTE(id_nia);
CREATE INDEX idx_nia_calculado ON NIVELES_INTEGRACION_ESTUDIANTE(calculado_en DESC);

-- Índice compuesto para reportes por escuela
CREATE INDEX idx_nia_reporte_escuela 
    ON NIVELES_INTEGRACION_ESTUDIANTE(id_periodo, id_campo_formativo, id_nia)
    WHERE validado = TRUE;
```

### 3. Catálogo de Campos Formativos

```sql
CREATE TABLE CAT_CAMPOS_FORMATIVOS (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(10) NOT NULL UNIQUE,     -- ENS, HYC, LEN, SPC, F5
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    orden_visual    INT NOT NULL,
    vigente         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO CAT_CAMPOS_FORMATIVOS (clave, nombre, descripcion, orden_visual) VALUES
    ('ENS', 'Enseñanza', 'Español y Matemáticas', 1),
    ('HYC', 'Historia y Civismo', 'Ética, Naturaleza y Sociedades', 2),
    ('LEN', 'Lenguaje y Comunicación', 'Lenguajes', 3),
    ('SPC', 'Saberes y Pensamiento Científico', 'Saberes y Pensamiento Científico', 4),
    ('F5', 'Formato 5', 'Reporte individual consolidado', 5);
```

### 4. Modificación a EVALUACIONES - Eliminar campos problemáticos

```sql
-- ❌ ELIMINAR estos campos de EVALUACIONES:
ALTER TABLE EVALUACIONES 
    DROP COLUMN IF EXISTS nivel_integracion,
    DROP COLUMN IF EXISTS competencia_alcanzada;

-- ✅ MANTENER solo lo esencial:
-- id, estudiante_id, materia_id, periodo_id, archivo_frv_id
-- valoracion (0-3), observaciones, registrado_por
-- fecha_evaluacion, fecha_captura, validado, validado_por, validado_en
-- created_at, updated_at
```

### 5. Trigger Automático para Cálculo de NIA

```sql
CREATE OR REPLACE FUNCTION calcular_nia_estudiante()
RETURNS TRIGGER AS $$
DECLARE
    v_campo_formativo INT;
    v_promedio NUMERIC(4,2);
    v_id_nia INT;
    v_total_materias INT;
    v_materias_evaluadas INT;
BEGIN
    -- Obtener campo formativo de la materia evaluada
    SELECT cf.id INTO v_campo_formativo
    FROM MATERIAS m
    INNER JOIN CAT_CAMPOS_FORMATIVOS cf ON m.campo_formativo = cf.clave
    WHERE m.id = NEW.materia_id;
    
    -- Calcular promedio de valoraciones para este estudiante, campo y periodo
    SELECT 
        AVG(e.valoracion)::NUMERIC(4,2),
        COUNT(DISTINCT m.id),
        COUNT(DISTINCT e.materia_id)
    INTO v_promedio, v_total_materias, v_materias_evaluadas
    FROM EVALUACIONES e
    INNER JOIN MATERIAS m ON e.materia_id = m.id
    INNER JOIN CAT_CAMPOS_FORMATIVOS cf ON m.campo_formativo = cf.clave
    WHERE e.estudiante_id = NEW.estudiante_id
      AND e.periodo_id = NEW.periodo_id
      AND cf.id = v_campo_formativo
      AND e.validado = TRUE;
    
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
        NEW.estudiante_id, v_campo_formativo, NEW.periodo_id, v_id_nia,
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_nia_auto
AFTER INSERT OR UPDATE OF valoracion, validado ON EVALUACIONES
FOR EACH ROW
WHEN (NEW.validado = TRUE)
EXECUTE FUNCTION calcular_nia_estudiante();
```

---

## IV. Migración de Datos Existentes

```sql
-- Script de migración para datos históricos
DO $$
DECLARE
    v_estudiante RECORD;
    v_campo RECORD;
    v_periodo RECORD;
BEGIN
    -- Para cada combinación estudiante-campo-periodo con evaluaciones
    FOR v_estudiante IN 
        SELECT DISTINCT id FROM ESTUDIANTES
    LOOP
        FOR v_campo IN 
            SELECT DISTINCT id FROM CAT_CAMPOS_FORMATIVOS WHERE vigente = TRUE
        LOOP
            FOR v_periodo IN 
                SELECT DISTINCT id FROM PERIODOS_EVALUACION
            LOOP
                -- Calcular y almacenar NIA
                PERFORM calcular_nia_estudiante_manual(
                    v_estudiante.id, 
                    v_campo.id, 
                    v_periodo.id
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
```

---

## V. Impacto en Documentación

### Archivos afectados:

1. ✅ **ESTRUCTURA_DE_DATOS.md** - Actualizar modelo completo
2. ✅ **REQUERIMIENTOS_Y_CASOS_DE_USO.md** - Actualizar RF-04.5
3. ✅ **web/doc/casos_uso.md** - Actualizar CU relacionados con NIAs
4. ✅ **web/doc/srs.md** - Actualizar especificaciones
5. ✅ **FLUJO_OPERATIVO_OFICIAL.md** - Actualizar proceso de cálculo NIAs
6. ⏳ **Triggers y stored procedures** - Eliminar referencias a campos obsoletos
7. ⏳ **Reportes** - Actualizar consultas para usar nueva tabla

---

## VI. Beneficios de la Corrección

✅ **Modelo normalizado**: 1 tabla especializada vs campos dispersos  
✅ **Trazabilidad completa**: Se registra cómo y cuándo se calculó cada NIA  
✅ **Escalabilidad**: Permite agregar nuevos campos formativos sin modificar schema  
✅ **Auditoría**: Validación y histórico de cambios por autoridad educativa  
✅ **Reportes precisos**: Consultas optimizadas con índices especializados  
✅ **Consistencia conceptual**: Un solo marco institucional de NIAs  

---

**Estado:** ✅ CORREGIDO - Modelo definitivo aprobado  
**Siguiente paso:** Implementar cambios en ESTRUCTURA_DE_DATOS.md
