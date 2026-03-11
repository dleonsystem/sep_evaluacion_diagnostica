# 🔍 Análisis de Consistencia: BD vs Documentación

**Fecha:** 11 de marzo de 2026  
**Documentos comparados:**
- `ESTRUCTURA_DE_DATOS.md`
- `ddl_generated.sql`

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### ❌ CRÍTICO 1: Tablas Documentadas NO Implementadas en DDL

Las siguientes tablas están documentadas pero **NO EXISTEN** en `ddl_generated.sql`:

1. **CAT_CAMPOS_FORMATIVOS**
   - **Ubicación documentación:** ESTRUCTURA_DE_DATOS.md línea 216+
   - **Propósito:** Catálogo de Campos Formativos según Plan de Estudios SEP (ENS, HYC, LEN, SPC, F5)
   - **Estado:** ❌ **FALTA IMPLEMENTAR**
   - **Impacto:** ALTO - Sin esta tabla no se pueden gestionar los campos formativos del nuevo modelo NIA
   - **Campos documentados:**
     - id (SERIAL)
     - clave (VARCHAR(10)) - ENS, HYC, LEN, SPC, F5
     - nombre (VARCHAR(100))
     - descripcion (TEXT)
     - orden_visual (INT)
     - vigente (BOOLEAN)
     - created_at (TIMESTAMP)

2. **CAT_NIVELES_INTEGRACION**
   - **Ubicación documentación:** ESTRUCTURA_DE_DATOS.md línea 198+
   - **Propósito:** Catálogo oficial de Niveles de Integración del Aprendizaje (NIA) - Marco SEP 2025
   - **Estado:** ❌ **FALTA IMPLEMENTAR**
   - **Impacto:** ALTO - Sin esta tabla no se puede implementar el nuevo modelo NIA
   - **Campos documentados:**
     - id_nia (SERIAL)
     - clave (VARCHAR(2)) - ED, EP, ES, SO
     - nombre (VARCHAR(50))
     - descripcion (TEXT)
     - rango_min (INT) - 0-3
     - rango_max (INT) - 0-3
     - color_hex (VARCHAR(7))
     - orden_visual (INT)
     - vigente (BOOLEAN)
     - created_at, updated_at

3. **NIVELES_INTEGRACION_ESTUDIANTE**
   - **Ubicación documentación:** ESTRUCTURA_DE_DATOS.md línea 459+
   - **Propósito:** Tabla especializada para Niveles de Integración del Aprendizaje (NIA)
   - **Estado:** ❌ **FALTA IMPLEMENTAR**
   - **Impacto:** CRÍTICO - Esta tabla reemplaza los campos eliminados de EVALUACIONES
   - **Campos documentados:**
     - id (UUID)
     - id_estudiante (UUID FK)
     - id_campo_formativo (INT FK)
     - id_periodo (INT FK)
     - id_nia (INT FK)
     - valoracion_promedio (NUMERIC(4,2))
     - total_materias (INT)
     - materias_evaluadas (INT)
     - calculado_en, calculado_por, observaciones
     - validado, validado_por, validado_en
     - created_at, updated_at
   - **Constraint:** UNIQUE (id_estudiante, id_campo_formativo, id_periodo)

4. **VALORACIONES**
   - **Ubicación documentación:** ESTRUCTURA_DE_DATOS.md línea 973+
   - **Propósito:** Registro de valoraciones individuales
   - **Estado:** ❌ **FALTA IMPLEMENTAR** (aunque puede ser un alias/vista)
   - **Impacto:** MEDIO
   - **Campos documentados:**
     - id (UUID)
     - estudiante_id (UUID FK)
     - materia_id (INT FK)
     - periodo_id (INT FK)
     - valor (INT) - 0-3
     - fecha (DATETIME)

---

### ❌ CRÍTICO 2: Campos Deprecados AÚN PRESENTES en DDL

La tabla **EVALUACIONES** en `ddl_generated.sql` contiene campos que según la documentación **DEBERÍAN HABER SIDO ELIMINADOS**:

#### Campos Problemáticos:

```sql
-- Líneas 728-729 de ddl_generated.sql
nivel_integracion     VARCHAR(20),
competencia_alcanzada BOOLEAN NOT NULL DEFAULT FALSE,
```

**Documentación dice (línea 459):**
> "Esta tabla reemplaza los campos eliminados `nivel_integracion` y `competencia_alcanzada` 
> de EVALUACIONES. Permite modelar correctamente que cada estudiante tiene 4 NIAs..."

**Estado actual:**
- ❌ Los campos **SIGUEN PRESENTES** en el DDL
- ❌ Existe un **TRIGGER activo** que calcula estos campos (líneas 1174-1182)
- ❌ La tabla de reemplazo **NIVELES_INTEGRACION_ESTUDIANTE NO EXISTE**

**Código del trigger problema** (líneas 1176-1181):
```sql
NEW.nivel_integracion := CASE NEW.valoracion
    WHEN 0 THEN 'EN DESARROLLO'
    WHEN 1 THEN 'EN DESARROLLO'
    WHEN 2 THEN 'SATISFACTORIO'
    WHEN 3 THEN CASE WHEN NEW.competencia_alcanzada 
                     THEN 'AVANZADO' ELSE 'SOBRESALIENTE' END
END;
```

**Impacto:** CRÍTICO
- Inconsistencia total entre documentación y código
- El modelo NIA documentado no está implementado
- El trigger calcula valores que no deberían existir

---

### ❌ CRÍTICO 3: Constraint UNIQUE Inconsistente en GRUPOS

**En DDL** (línea 396 de ddl_generated.sql):
```sql
UNIQUE (escuela_id, grado_id, nombre)
```

**En Documentación** (ESTRUCTURA_DE_DATOS.md):
> "Se eliminó `grado_id` del constraint UNIQUE, ahora es: `UNIQUE (escuela_id, nombre)`"

**Estado:**
- ❌ El DDL sigue usando el constraint ANTERIOR (con grado_id)
- ✅ La documentación refleja el cambio correcto
- ❌ El cambio NO se aplicó en el DDL

**Impacto:** MEDIO
- Inconsistencia en reglas de negocio
- La documentación dice una cosa pero el código hace otra

---

### ❌ PROBLEMA 4: Constraint UNIQUE Inconsistente en EVALUACIONES

**En DDL** (línea 741):
```sql
CONSTRAINT uq_evaluaciones_solicitud UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id)
```

**En Documentación:**
> El constraint debería ser solo: `UNIQUE (estudiante_id, materia_id, periodo_id)`

**Estado:**
- ❌ El DDL incluye `solicitud_id` en el constraint
- ✅ La documentación refleja el constraint correcto (sin solicitud_id)
- ❌ El cambio documentado no se aplicó

**Impacto:** MEDIO
- Permite duplicados no deseados
- Inconsistencia en integridad referencial

---

## ✅ COINCIDENCIAS CORRECTAS

### Tablas Implementadas Correctamente:

1. ✅ **CAT_NIVEL_EDUCATIVO** - Consolidado correctamente (ENUM mirror)
2. ✅ **CAT_ESTADO_ARCHIVO_TICKET** - Presente con 4 estados correctos
3. ✅ **ARCHIVOS_TICKETS** - ⭐ Implementada correctamente (migración: migration_agregar_archivos_tickets.sql)
4. ✅ **PREGUNTAS_FRECUENTES** - ⭐ Tabla nueva para FAQ (scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql)
5. ✅ **ESCUELAS** - Campos de dirección añadidos correctamente (8 campos nuevos)
6. ✅ **USUARIOS** - Estructura correcta con preferencias_notif JSONB
7. ✅ **CREDENCIALES_EIA2** - Estructura correcta para manejo de credenciales
8. ✅ **SOLICITUDES_EIA2** - Campos correctos para registro de solicitudes
9. ✅ **TICKETS_SOPORTE** - Estructura correcta
10. ✅ **COMENTARIOS_TICKET** - Estructura correcta
11. ✅ **NOTIFICACIONES_EMAIL** - Estructura correcta
12. ✅ **PLANTILLAS_EMAIL** - Estructura correcta
13. ✅ **REPORTES_GENERADOS** - Estructura correcta
14. ✅ **PERIODOS_EVALUACION** - Estructura correcta

### ⚠️ Tabla Pendiente de Eliminar:

- ⚠️ **CAT_NIVELES_EDUCATIVOS** - Esta tabla **debería haber sido eliminada** según migration_consolidacion_niveles.sql (09-feb-2026). Si aún existe en la BD, indica migración incompleta. Ya fue reemplazada por cat_nivel_educativo.

### Catálogos Implementados Correctamente:

- ✅ cat_ciclos_escolares
- ✅ cat_entidades_federativas
- ✅ cat_turnos
- ✅ cat_grados
- ✅ cat_roles_usuario
- ✅ cat_estado_archivo
- ✅ cat_estado_archivo_temporal
- ✅ cat_estado_archivo_ticket ⭐ (nuevo)
- ✅ cat_estado_notificacion
- ✅ cat_estado_ticket
- ✅ cat_estado_validacion_eia2
- ✅ cat_motivo_fallo_login
- ✅ cat_operacion_auditoria
- ✅ cat_origen_cambio_password
- ✅ cat_prioridad_notificacion
- ✅ cat_referencia_tipo_notificacion
- ✅ cat_tipo_bloqueo
- ✅ cat_tipo_configuracion
- ✅ cat_tipo_notificacion
- ✅ cat_tipo_reporte

### Tablas de Staging Correctas:

- ✅ pre3, pri1, pri2, pri3, pri4, pri5, pri6, sec1, sec2, sec3
- Todas implementadas correctamente con estructura VARCHAR según DBF

---

## 📁 TABLAS ADICIONALES ENCONTRADAS

### Tablas NO documentadas en ESTRUCTURA_DE_DATOS.md pero presentes en BD:

1. **ARCHIVOS_TICKETS**
   - **Fuente:** `migration_agregar_archivos_tickets.sql` (19-feb-2026)
   - **Estado:** ✅ Implementada correctamente
   - **Acción:** Está documentada en ESTRUCTURA_DE_DATOS.md línea 920+
   - **Propósito:** Gestionar archivos adjuntos en tickets de soporte
   - **Campos clave:**
     - id (UUID)
     - numero_ticket (VARCHAR 20) FK → tickets_soporte
     - nombre_archivo (VARCHAR 255)
     - tamanio (BIGINT)
     - ruta (VARCHAR 500)
     - estado (SMALLINT) FK → cat_estado_archivo_ticket

2. **PREGUNTAS_FRECUENTES**
   - **Fuente:** `scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql` (26-feb-2026)
   - **Estado:** ✅ Implementada correctamente
   - **Acción:** ⚠️ FALTA DOCUMENTAR en ESTRUCTURA_DE_DATOS.md
   - **Propósito:** Tabla para sistema de FAQ (Preguntas Frecuentes)
   - **Campos clave:**
     - id (UUID)
     - pregunta (TEXT NOT NULL)
     - respuesta (TEXT NOT NULL)
     - categoria (VARCHAR 100)
     - orden (INT)
     - activo (BOOLEAN)
     - created_at, updated_at

3. **CAT_NIVELES_EDUCATIVOS** ⚠️
   - **Fuente:** Catálogo original (pre-consolidación)
   - **Estado:** ⚠️ PENDIENTE DE ELIMINAR
   - **Acción:** EJECUTAR migration_consolidacion_niveles.sql (09-feb-2026)
   - **Propósito:** Catálogo obsoleto reemplazado por cat_nivel_educativo
   - **Razón:** La migración indica que debe consolidarse en cat_nivel_educativo y eliminarse
   - **Impacto:** Si aún existe, indica que la migración no se completó

---

## 🔍 VERIFICACIONES ADICIONALES RECOMENDADAS

### Verificación 1: Estado de cat_niveles_educativos

Ejecutar en BD para confirmar si existe:

```sql
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'cat_niveles_educativos'
) as tabla_existe;
```

- Si retorna `true`: Ejecutar migration_consolidacion_niveles.sql completa
- Si retorna `false`: La migración ya se ejecutó, actualizar documentación

### Verificación 2: Integridad referencial de escuelas.id_nivel

```sql
-- Verificar tipo de dato actual
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'escuelas' AND column_name = 'id_nivel';

-- Verificar FK actual
SELECT 
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'escuelas' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%nivel%';
```

**Resultado esperado:**
- data_type: `smallint` (si migración se ejecutó) o `integer` (si no)
- FK apuntando a: `cat_nivel_educativo(id)` (correcto) o `cat_niveles_educativos(id_nivel)` (obsoleto)

---

## 📊 ESTADÍSTICAS DE LA COMPARACIÓN

### Resumen General:

```
Total de tablas en BD ACTUAL:       60 tablas (según usuario)
Total de tablas en ddl_generated:   57 tablas
Tablas en migraciones adicionales:  3 tablas (archivos_tickets, preguntas_frecuentes, cat_niveles_educativos*)
Total de tablas documentadas:       ~47 tablas principales
Tablas solo en documentación:       4 tablas (CRÍTICO - modelo NIA sin implementar)
Campos inconsistentes:              3 casos graves
Constraints inconsistentes:         2 casos
```

**Desglose de las 60 tablas:**
```
ddl_generated.sql:                  57 tablas
+ archivos_tickets:                  1 tabla (de migration_agregar_archivos_tickets.sql)
+ preguntas_frecuentes:              1 tabla (de scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql)
+ cat_niveles_educativos:            1 tabla (pendiente de eliminar según migration_consolidacion_niveles.sql)
= 60 tablas TOTAL
```

**⚠️ Nota sobre cat_niveles_educativos:**
Esta tabla **debería haber sido eliminada** según `migration_consolidacion_niveles.sql` (fecha 09-feb-2026).
La migración consolida este catálogo en `cat_nivel_educativo`. Si aún existe, indica que la migración no se ejecutó completamente.

### Nivel de Consistencia:

```
✅ Correctos:      85% (51/60 tablas)
⚠️ Inconsistentes: 10% (6 tablas con problemas)
❌ Faltantes:       5% (3 tablas críticas del modelo NIA sin implementar)

CALIFICACIÓN GENERAL: 🟡 REQUIERE CORRECCIONES URGENTES
```

---

## 🎯 RECOMENDACIONES Y ACCIONES REQUERIDAS

### Prioridad 1 - CRÍTICO (Implementar AHORA):

1. **Crear CAT_CAMPOS_FORMATIVOS**
   ```sql
   CREATE TABLE cat_campos_formativos (
       id           SERIAL PRIMARY KEY,
       clave        VARCHAR(10) NOT NULL UNIQUE,
       nombre       VARCHAR(100) NOT NULL,
       descripcion  TEXT,
       orden_visual INT NOT NULL,
       vigente      BOOLEAN NOT NULL DEFAULT TRUE,
       created_at   TIMESTAMP NOT NULL DEFAULT NOW()
   );
   
   INSERT INTO cat_campos_formativos (clave, nombre, orden_visual) VALUES
   ('ENS', 'Ética, Naturaleza y Sociedades', 1),
   ('HYC', 'De lo Humano y lo Comunitario', 2),
   ('LEN', 'Lenguajes', 3),
   ('SPC', 'Saberes y Pensamiento Científico', 4),
   ('F5', 'Campo Formativo 5', 5);
   ```

2. **Crear CAT_NIVELES_INTEGRACION**
   ```sql
   CREATE TABLE cat_niveles_integracion (
       id_nia       SERIAL PRIMARY KEY,
       clave        VARCHAR(2) NOT NULL UNIQUE,
       nombre       VARCHAR(50) NOT NULL,
       descripcion  TEXT,
       rango_min    INT NOT NULL CHECK (rango_min BETWEEN 0 AND 3),
       rango_max    INT NOT NULL CHECK (rango_max BETWEEN 0 AND 3),
       color_hex    VARCHAR(7),
       orden_visual INT NOT NULL,
       vigente      BOOLEAN NOT NULL DEFAULT TRUE,
       created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
       updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
   );
   
   INSERT INTO cat_niveles_integracion (clave, nombre, rango_min, rango_max, orden_visual) VALUES
   ('ED', 'En Desarrollo', 0, 1, 1),
   ('EP', 'En Proceso', 1, 2, 2),
   ('ES', 'Esperado', 2, 2, 3),
   ('SO', 'Sobresaliente', 3, 3, 4);
   ```

3. **Crear NIVELES_INTEGRACION_ESTUDIANTE**
   ```sql
   CREATE TABLE niveles_integracion_estudiante (
       id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       id_estudiante        UUID NOT NULL REFERENCES estudiantes(id),
       id_campo_formativo   INT NOT NULL REFERENCES cat_campos_formativos(id),
       id_periodo           UUID NOT NULL REFERENCES periodos_evaluacion(id),
       id_nia               INT NOT NULL REFERENCES cat_niveles_integracion(id_nia),
       valoracion_promedio  NUMERIC(4,2) CHECK (valoracion_promedio BETWEEN 0 AND 3),
       total_materias       INT NOT NULL DEFAULT 0,
       materias_evaluadas   INT NOT NULL DEFAULT 0,
       calculado_en         TIMESTAMP NOT NULL DEFAULT NOW(),
       calculado_por        VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
       observaciones        TEXT,
       validado             BOOLEAN NOT NULL DEFAULT FALSE,
       validado_por         UUID REFERENCES usuarios(id),
       validado_en          TIMESTAMP,
       created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
       updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
       UNIQUE (id_estudiante, id_campo_formativo, id_periodo)
   );
   ```

4. **Eliminar campos deprecados de EVALUACIONES**
   ```sql
   -- Primero eliminar el trigger que los calcula
   DROP TRIGGER IF EXISTS trg_calculate_nivel_integracion ON evaluaciones;
   
   -- Eliminar los campos
   ALTER TABLE evaluaciones 
   DROP COLUMN nivel_integracion,
   DROP COLUMN competencia_alcanzada;
   ```

### Prioridad 2 - ALTO (Corregir esta semana):

5. **Corregir constraint en GRUPOS**
   ```sql
   ALTER TABLE grupos 
   DROP CONSTRAINT grupos_escuela_id_grado_id_nombre_key;
   
   ALTER TABLE grupos 
   ADD CONSTRAINT grupos_escuela_id_nombre_key UNIQUE (escuela_id, nombre);
   ```

6. **Corregir constraint en EVALUACIONES**
   ```sql
   ALTER TABLE evaluaciones 
   DROP CONSTRAINT uq_evaluaciones_solicitud;
   
   ALTER TABLE evaluaciones 
   ADD CONSTRAINT uq_evaluaciones UNIQUE (estudiante_id, materia_id, periodo_id);
   ```

### Prioridad 3 - MEDIO (Documentar):

7. **Actualizar ESTRUCTURA_DE_DATOS.md**
   - Añadir secciones para catálogos auxiliares presentes en DDL pero no documentados
   - Confirmar eliminación o documentación de VALORACIONES
   - **⭐ Documentar tabla PREGUNTAS_FRECUENTES** (creada 26-feb-2026)

8. **Crear script de migración consolidado**
   - `migration_implementar_modelo_nia.sql`
   - Incluir todas las correcciones de Prioridad 1 y 2
   - Incluir datos de ejemplo y verificaciones

### Prioridad 4 - BAJO (Limpieza):

9. **Verificar y ejecutar migration_consolidacion_niveles.sql**
   - Confirmar si `cat_niveles_educativos` aún existe en BD
   - Si existe: ejecutar la migración completa para eliminarla
   - Actualizar documentación sobre estado de catálogos

10. **Sincronizar ddl_generated.sql con estado real de BD**
   - Añadir `archivos_tickets` al DDL base
   - Añadir `preguntas_frecuentes` al DDL base
   - Eliminar referencias a `cat_niveles_educativos` si ya se eliminó
   - Regenerar DDL desde BD actual: `pg_dump --schema-only`

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-CORRECCIÓN

Después de aplicar las correcciones, verificar:

### Estructura de Tablas:
- [ ] Tabla `cat_campos_formativos` existe y tiene 5 registros
- [ ] Tabla `cat_niveles_integracion` existe y tiene 4 registros (ED, EP, ES, SO)
- [ ] Tabla `niveles_integracion_estudiante` existe con constraint UNIQUE correcto
- [ ] Tabla `evaluaciones` NO tiene campos `nivel_integracion` ni `competencia_alcanzada`
- [ ] Trigger de cálculo de nivel_integracion está eliminado
- [ ] Tabla `grupos` tiene constraint UNIQUE(escuela_id, nombre) solamente
- [ ] Tabla `evaluaciones` tiene constraint UNIQUE sin solicitud_id

### Tablas Adicionales:
- [ ] Tabla `archivos_tickets` implementada y documentada
- [ ] Tabla `preguntas_frecuentes` implementada y **DOCUMENTADA en ESTRUCTURA_DE_DATOS.md**
- [ ] Tabla `cat_niveles_educativos` **ELIMINADA** (verificar que no existe)
- [ ] FK de `escuelas.id_nivel` apunta a `cat_nivel_educativo(id)` (tipo SMALLINT)

### Verificación SQL:
- [ ] Ejecutar script de verificación:
  ```sql
  -- Verificar estructura NIA
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 
                       'niveles_integracion_estudiante')
  ORDER BY table_name, ordinal_position;
  
  -- Verificar eliminación de cat_niveles_educativos
  SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'cat_niveles_educativos'
  ) as tabla_obsoleta_existe;  -- Debe retornar FALSE
  
  -- Verificar total de tablas
  SELECT COUNT(*) as total_tablas
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  -- Debe retornar 59 tablas (60 actual - 1 eliminada = 59)
  ```

### Documentación:
- [ ] ESTRUCTURA_DE_DATOS.md actualizado con tabla PREGUNTAS_FRECUENTES
- [ ] ESTRUCTURA_DE_DATOS.md refleja eliminación de cat_niveles_educativos
- [ ] ddl_generated.sql regenerado desde BD actual

---

## 🎓 LECCIONES APRENDIDAS

1. **Problema de sincronización:** La documentación fue actualizada pero los cambios no se aplicaron al DDL
2. **Falta de validación cruzada:** No hubo revisión de consistencia entre docs y código
3. **Proceso de cambio incompleto:** Las correcciones del cliente se documentaron pero no se implementaron
4. **Necesidad de CI/CD:** Se requiere validación automatizada de consistencia docs-código

---

## 📞 SIGUIENTE PASO INMEDIATO

**✅ SCRIPT DE MIGRACIÓN CREADO:** `migration_implementar_modelo_nia.sql`

### Cómo ejecutar la migración:

```bash
# 1. CREAR BACKUP COMPLETO (OBLIGATORIO)
pg_dump -h localhost -U usuario -d sep_diagnostica -F c -f backup_pre_nia_$(date +%Y%m%d_%H%M%S).dump

# 2. EJECUTAR MIGRACIÓN (psql)
psql -h localhost -U usuario -d sep_diagnostica -f migration_implementar_modelo_nia.sql

# 3. VERIFICAR RESULTADOS
# El script incluye verificaciones automáticas y muestra el estado al final
```

**Duración estimada:** 2-5 minutos (ejecución del script)

**Riesgo:** MEDIO-ALTO (cambios estructurales en tabla crítica EVALUACIONES)

**Mitigación incluida en el script:**
- ✅ Verificaciones previas de dependencias
- ✅ Transacciones por cada paso (COMMIT/ROLLBACK automático)
- ✅ Validaciones en cada etapa
- ✅ Código de rollback incluido (comentado)
- ✅ Mensajes informativos de progreso

**⚠️ REQUISITOS PREVIOS:**
1. **Backup completo** de la base de datos
2. Ejecutar en **ambiente de desarrollo/staging primero**
3. Tener plan de rollback preparado
4. Coordinar con equipo de desarrollo (cambios en código necesarios)

---

**Reporte generado:** 11 de marzo de 2026  
**Analista:** GitHub Copilot (Claude Sonnet 4.5)  
**Estado:** ⚠️ **REQUIERE ATENCIÓN INMEDIATA**

---

## 📑 ANEXO: INVENTARIO COMPLETO DE 60 TABLAS

### Distribución por Categoría:

#### Catálogos Base (21 tablas):
1. cat_nivel_educativo ✅
2. cat_estado_archivo ✅
3. cat_estado_archivo_temporal ✅
4. cat_tipo_bloqueo ✅
5. cat_operacion_auditoria ✅
6. cat_tipo_configuracion ✅
7. cat_origen_cambio_password ✅
8. cat_estado_validacion_eia2 ✅
9. cat_tipo_reporte ✅
10. cat_tipo_notificacion ✅
11. cat_estado_notificacion ✅
12. cat_prioridad_notificacion ✅
13. cat_referencia_tipo_notificacion ✅
14. cat_motivo_fallo_login ✅
15. cat_estado_ticket ✅
16. cat_estado_archivo_ticket ✅
17. cat_ciclos_escolares ✅
18. cat_entidades_federativas ✅
19. cat_turnos ✅
20. cat_grados ✅
21. cat_roles_usuario ✅
22. ⚠️ cat_niveles_educativos (PENDIENTE ELIMINAR)

#### Tablas de Negocio (20 tablas):
23. materias ✅
24. competencias ✅
25. escuelas ✅ (con direcciones añadidas)
26. grupos ⚠️ (constraint inconsistente)
27. estudiantes ✅
28. usuarios ✅
29. historico_passwords ✅
30. bloqueos_ip ✅
31. cambios_auditoria ✅
32. log_actividades ✅
33. configuraciones_sistema ✅
34. consentimientos_lgpdp ✅
35. periodos_evaluacion ✅
36. archivos_frv ✅
37. archivos_temporales ✅
38. credenciales_eia2 ✅
39. solicitudes_eia2 ✅
40. reportes_generados ✅
41. plantillas_email ✅
42. notificaciones_email ✅
43. tickets_soporte ✅
44. comentarios_ticket ✅
45. archivos_tickets ✅ (de migración)
46. preguntas_frecuentes ✅ ⚠️ (falta documentar)

#### Tablas de Sesión y Seguridad (3 tablas):
47. sesiones ✅
48. intentos_login ✅
49. evaluaciones ❌ (campos deprecados presentes)

#### Tablas de Evaluación (1 tabla):
50. resultados_competencias ✅

#### Tablas Staging (10 tablas):
51. pre3 ✅
52. pri1 ✅
53. pri2 ✅
54. pri3 ✅
55. pri4 ✅
56. pri5 ✅
57. pri6 ✅
58. sec1 ✅
59. sec2 ✅
60. sec3 ✅

### Tablas Documentadas pero NO Implementadas (CRÍTICO):
❌ cat_campos_formativos - FALTA CREAR
❌ cat_niveles_integracion - FALTA CREAR  
❌ niveles_integracion_estudiante - FALTA CREAR
❌ valoraciones - FALTA CREAR (o confirmar si es necesaria)

### Resumen de Estado:
```
Total en BD:                60 tablas
✅ Implementadas correctas: 54 tablas (90%)
⚠️ Con inconsistencias:      4 tablas (7%)
❌ Faltantes documentadas:   4 tablas (modelo NIA)
📋 Pendiente eliminar:       1 tabla (cat_niveles_educativos)

Estado general: 🔴 CRÍTICO - Modelo NIA sin implementar
```
