# GUÍA DE EJECUCIÓN - Migración Consolidación Catálogos

**Base de datos:** [TU_BD_AQUI]  
**Fecha:** 09-feb-2026  
**Ejecutor:** [TU_NOMBRE]

---

## ⚠️ ANTES DE EMPEZAR

- [ ] **BACKUP COMPLETO** de la base de datos realizado
- [ ] Confirmar que estás en ambiente de **desarrollo/pruebas**
- [ ] No hay aplicaciones conectadas a la BD
- [ ] Tener script de rollback a mano (al final de migration_consolidacion_niveles.sql)

---

## 📋 PASO 0: VERIFICACIONES PREVIAS

**Objetivo:** Ver el estado actual de los catálogos y escuelas

### Copiar y ejecutar en pgAdmin Query Tool:

```sql
-- Verificar estructura actual
SELECT 'Verificando tabla cat_niveles_educativos...' as paso;
SELECT id_nivel, nombre, codigo, descripcion FROM cat_niveles_educativos ORDER BY id_nivel;

SELECT 'Verificando tabla cat_nivel_educativo...' as paso;
SELECT id, codigo, descripcion, orden FROM cat_nivel_educativo ORDER BY orden;

SELECT 'Verificando distribución actual en escuelas...' as paso;
SELECT 
    e.id_nivel,
    ne.nombre,
    ne.codigo,
    COUNT(*) as total_escuelas
FROM escuelas e
JOIN cat_niveles_educativos ne ON e.id_nivel = ne.id_nivel
GROUP BY e.id_nivel, ne.nombre, ne.codigo
ORDER BY e.id_nivel;
```

### ✅ Checklist Paso 0:
- [ ] Se muestran datos en `cat_niveles_educativos` (anotar cuántos registros: _____)
- [ ] Se muestran datos en `cat_nivel_educativo` (anotar cuántos registros: _____)
- [ ] Se muestra distribución de escuelas por nivel (anotar totales)
- [ ] **Tomar screenshot** de los resultados

### 📸 Resultados esperados:
```
cat_niveles_educativos: 4 registros (Preescolar, Primaria, Secundaria, Telesecundaria)
cat_nivel_educativo: 4 registros (PREESCOLAR, PRIMARIA, SECUNDARIA, TELESECUNDARIA)
escuelas: Ver distribución por nivel
```

---

## 📋 PASO 1: ASEGURAR DATOS EN cat_nivel_educativo

**Objetivo:** Garantizar que el catálogo destino tiene todos los registros necesarios

### Copiar y ejecutar:

```sql
BEGIN;

-- Insertar valores si no existen
INSERT INTO cat_nivel_educativo (codigo, descripcion, orden, activo)
VALUES 
    ('PREESCOLAR', 'Preescolar', 1, true),
    ('PRIMARIA', 'Primaria', 2, true),
    ('SECUNDARIA', 'Secundaria', 3, true),
    ('TELESECUNDARIA', 'Telesecundaria', 4, true)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar inserción
SELECT 'Catálogo cat_nivel_educativo actualizado:' as paso;
SELECT id, codigo, descripcion, orden, activo FROM cat_nivel_educativo ORDER BY orden;

COMMIT;
```

### ✅ Checklist Paso 1:
- [ ] Ejecución sin errores
- [ ] Se muestran 4 registros en el SELECT final
- [ ] Todos los registros tienen `activo = true`
- [ ] **Anotar los IDs** generados:
  - PREESCOLAR: id = _____
  - PRIMARIA: id = _____
  - SECUNDARIA: id = _____
  - TELESECUNDARIA: id = _____

### 🚨 Si hay error:
- Verificar que la tabla `cat_nivel_educativo` existe
- Verificar estructura (debe tener columnas: id, codigo, descripcion, orden, activo)
- **NO CONTINUAR** hasta resolver

---

## 📋 PASO 2: CREAR MAPEO ENTRE CATÁLOGOS

**Objetivo:** Generar tabla temporal con la correspondencia entre ambos catálogos

### Copiar y ejecutar:

```sql
BEGIN;

-- Crear tabla temporal con mapeo basado en códigos y nombres
CREATE TEMP TABLE temp_nivel_mapping AS
SELECT 
    ne.id_nivel as id_old,
    CASE 
        -- Mapeo por código exacto (PRE, PRI, SEC, TEL)
        WHEN UPPER(ne.codigo) = 'PRE' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN UPPER(ne.codigo) = 'PRI' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN UPPER(ne.codigo) = 'SEC' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN UPPER(ne.codigo) = 'TEL' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        -- Mapeo por código completo
        WHEN UPPER(ne.codigo) = 'PREESCOLAR' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN UPPER(ne.codigo) = 'PRIMARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN UPPER(ne.codigo) = 'SECUNDARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN UPPER(ne.codigo) = 'TELESECUNDARIA' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        -- Mapeo por nombre
        WHEN LOWER(ne.nombre) LIKE '%preescolar%' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PREESCOLAR')
        WHEN LOWER(ne.nombre) LIKE '%primaria%' THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA')
        WHEN LOWER(ne.nombre) LIKE '%secundaria%' AND LOWER(ne.nombre) NOT LIKE '%tele%' 
            THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'SECUNDARIA')
        WHEN LOWER(ne.nombre) LIKE '%telesecundaria%' OR LOWER(ne.nombre) LIKE '%tele%secundaria%'
            THEN (SELECT id FROM cat_nivel_educativo WHERE codigo = 'TELESECUNDARIA')
        ELSE NULL
    END as id_new,
    ne.codigo as codigo_old,
    ne.nombre as nombre_old
FROM cat_niveles_educativos ne;

-- Verificar el mapeo
SELECT 'Mapeo generado (REVISAR ANTES DE CONTINUAR):' as paso;
SELECT * FROM temp_nivel_mapping;

-- Contar registros sin mapeo
SELECT 'Total registros sin mapeo:' as paso;
SELECT COUNT(*) as sin_mapeo FROM temp_nivel_mapping WHERE id_new IS NULL;

-- Si hay registros sin mapeo, DETENER AQUÍ y revisar
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_nivel_mapping WHERE id_new IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Existen % registros sin mapeo. Revisar temp_nivel_mapping y ajustar lógica.', v_count;
    END IF;
END $$;

COMMIT;
```

### ✅ Checklist Paso 2:
- [ ] Se crea tabla `temp_nivel_mapping` sin errores
- [ ] El primer SELECT muestra **todos los registros** con mapeo correcto
- [ ] El segundo SELECT muestra `sin_mapeo = 0`
- [ ] **NO hay excepción** (si aparece, DETENER)
- [ ] **Tomar screenshot** de temp_nivel_mapping

### 📊 Ejemplo de mapeo esperado:
```
id_old | id_new | codigo_old | nombre_old
-------|--------|------------|-------------
   1   |   1    |    PRE     | Preescolar
   2   |   2    |    PRI     | Primaria
   3   |   3    |    SEC     | Secundaria
   4   |   4    |    TEL     | Telesecundaria
```

### 🚨 Si hay error "registros sin mapeo":
1. **DETENER** - NO ejecutar COMMIT
2. Ver qué registros tienen `id_new IS NULL`:
   ```sql
   SELECT * FROM temp_nivel_mapping WHERE id_new IS NULL;
   ```
3. Ajustar la lógica CASE en el CREATE TEMP TABLE
4. **Ejecutar ROLLBACK** y reintentar PASO 2

---

## 📋 PASO 3: MIGRAR ESCUELAS.ID_NIVEL

**Objetivo:** Cambiar escuelas.id_nivel de INT a SMALLINT con nueva FK

### ⚠️ PUNTO CRÍTICO - Leer antes de ejecutar:
Este paso modifica la tabla `escuelas`. Si falla, ejecutar ROLLBACK inmediatamente.

### Copiar y ejecutar:

```sql
BEGIN;

-- Paso 3.1: Agregar columna temporal
ALTER TABLE escuelas ADD COLUMN id_nivel_temp SMALLINT;

-- Paso 3.2: Poblar la columna temporal con el mapeo
UPDATE escuelas e
SET id_nivel_temp = m.id_new
FROM temp_nivel_mapping m
WHERE e.id_nivel = m.id_old;

-- Paso 3.3: Verificar la migración
SELECT 'Verificando migración de datos:' as paso;
SELECT 
    e.id_nivel as id_old,
    e.id_nivel_temp as id_new,
    ne_old.codigo as codigo_old,
    cn_new.codigo as codigo_new,
    COUNT(*) as total
FROM escuelas e
LEFT JOIN cat_niveles_educativos ne_old ON e.id_nivel = ne_old.id_nivel
LEFT JOIN cat_nivel_educativo cn_new ON e.id_nivel_temp = cn_new.id
GROUP BY e.id_nivel, e.id_nivel_temp, ne_old.codigo, cn_new.codigo
ORDER BY e.id_nivel;

-- Paso 3.4: Verificar que NO haya NULLs
SELECT 'Registros con id_nivel_temp NULL:' as paso;
SELECT COUNT(*) as total_null FROM escuelas WHERE id_nivel_temp IS NULL;

DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM escuelas WHERE id_nivel_temp IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Existen % escuelas con id_nivel_temp NULL. Revisar migración.', v_count;
    END IF;
END $$;

-- Paso 3.5: Establecer NOT NULL
ALTER TABLE escuelas ALTER COLUMN id_nivel_temp SET NOT NULL;

-- Paso 3.6: Eliminar FK y columna antigua
ALTER TABLE escuelas DROP CONSTRAINT IF EXISTS escuelas_id_nivel_fkey;
ALTER TABLE escuelas DROP COLUMN id_nivel;

-- Paso 3.7: Renombrar columna temporal
ALTER TABLE escuelas RENAME COLUMN id_nivel_temp TO id_nivel;

-- Paso 3.8: Agregar nueva FK
ALTER TABLE escuelas 
    ADD CONSTRAINT fk_escuelas_nivel_educativo 
    FOREIGN KEY (id_nivel) 
    REFERENCES cat_nivel_educativo(id);

-- Paso 3.9: Crear índice
CREATE INDEX IF NOT EXISTS idx_escuelas_nivel ON escuelas(id_nivel);

SELECT 'Migración de escuelas completada.' as paso;

COMMIT;
```

### ✅ Checklist Paso 3:
- [ ] Se crea columna `id_nivel_temp` sin errores
- [ ] UPDATE ejecuta correctamente (anotar filas afectadas: _____)
- [ ] Paso 3.3: Verificar que **todos los códigos coinciden** (codigo_old = codigo_new)
- [ ] Paso 3.4: `total_null = 0` (MUY IMPORTANTE)
- [ ] No hay excepciones
- [ ] Se elimina columna `id_nivel` antigua
- [ ] Se crea nueva FK sin errores
- [ ] Mensaje final: "Migración de escuelas completada"

### 📊 Ejemplo verificación Paso 3.3:
```
id_old | id_new | codigo_old | codigo_new | total
-------|--------|------------|------------|-------
   1   |   1    |    PRE     | PREESCOLAR | 15
   2   |   2    |    PRI     | PRIMARIA   | 50
   3   |   3    |    SEC     | SECUNDARIA | 20
   4   |   4    |    TEL     |TELESECUND..| 10
```

### 🚨 Si hay error:
1. **Ejecutar ROLLBACK inmediatamente**
2. Revisar mensaje de error específico
3. Verificar que temp_nivel_mapping sigue disponible
4. Consultar en chat antes de reintentar

---

## 📋 PASO 4: ELIMINAR TABLA OBSOLETA

**Objetivo:** Eliminar cat_niveles_educativos

### Copiar y ejecutar:

```sql
BEGIN;

-- Verificar que no hay otras FKs apuntando a cat_niveles_educativos
SELECT 'Verificando dependencias de cat_niveles_educativos:' as paso;
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'cat_niveles_educativos';

-- Si el SELECT anterior retorna registros, NO CONTINUAR
-- Si está vacío, proceder a eliminar

DROP TABLE cat_niveles_educativos CASCADE;

SELECT 'Tabla cat_niveles_educativos eliminada exitosamente.' as paso;

COMMIT;
```

### ✅ Checklist Paso 4:
- [ ] SELECT de dependencias retorna **0 filas** (debe estar vacío)
- [ ] DROP TABLE ejecuta sin errores
- [ ] Mensaje: "Tabla cat_niveles_educativos eliminada exitosamente"

### 🚨 Si el SELECT muestra dependencias:
**NO EJECUTAR DROP TABLE**
1. Anotar qué tablas tienen FK a cat_niveles_educativos
2. Migrar esas tablas primero
3. Consultar en chat

---

## 📋 PASO 5: VERIFICACIÓN FINAL

**Objetivo:** Confirmar que todo quedó correcto

### Copiar y ejecutar:

```sql
-- Verificar estructura de escuelas
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'escuelas' AND column_name = 'id_nivel';

-- Verificar datos en cat_nivel_educativo
SELECT 'Catálogo cat_nivel_educativo:' as paso;
SELECT * FROM cat_nivel_educativo ORDER BY orden;

-- Verificar distribución final en escuelas
SELECT 'Distribución de niveles en escuelas:' as paso;
SELECT 
    cn.id,
    cn.codigo,
    cn.descripcion,
    COUNT(e.id) as total_escuelas
FROM cat_nivel_educativo cn
LEFT JOIN escuelas e ON e.id_nivel = cn.id
GROUP BY cn.id, cn.codigo, cn.descripcion, cn.orden
ORDER BY cn.orden;

-- Verificar que no existe cat_niveles_educativos
SELECT 'Verificando eliminación de cat_niveles_educativos:' as paso;
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'cat_niveles_educativos'
) as tabla_existe;

-- Resumen final
SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado,
    'Catálogo consolidado: cat_nivel_educativo' as catalogo_activo,
    'Tabla eliminada: cat_niveles_educativos' as tabla_eliminada,
    'Columna migrada: escuelas.id_nivel (INT → SMALLINT)' as cambio_estructura;
```

### ✅ Checklist Paso 5:
- [ ] escuelas.id_nivel es tipo `smallint` (NO integer)
- [ ] cat_nivel_educativo tiene 4 registros
- [ ] Distribución de escuelas **coincide** con totales del PASO 0
- [ ] `tabla_existe = false` (cat_niveles_educativos eliminada)
- [ ] Mensaje: "MIGRACIÓN COMPLETADA EXITOSAMENTE"
- [ ] **Tomar screenshot final**

### 📊 Verificación esperada:
```
✅ escuelas.id_nivel: data_type = smallint
✅ cat_nivel_educativo: 4 registros
✅ Totales de escuelas por nivel coinciden
✅ cat_niveles_educativos no existe
```

---

## 🎯 RESUMEN DE EJECUCIÓN

| Paso | Estado | Tiempo | Notas |
|------|--------|--------|-------|
| 0. Verificaciones | ⬜ | ___ min | |
| 1. Datos cat_nivel_educativo | ⬜ | ___ min | |
| 2. Mapeo | ⬜ | ___ min | |
| 3. Migrar escuelas | ⬜ | ___ min | |
| 4. Eliminar tabla | ⬜ | ___ min | |
| 5. Verificación | ⬜ | ___ min | |

**Duración total:** _____ minutos  
**Finalizado:** __/__/____ __:__

---

## 📝 TAREAS POST-MIGRACIÓN

### Inmediatas (antes de liberar a producción):
- [ ] Actualizar modelos TypeORM/Sequelize
- [ ] Cambiar queries que usen `cat_niveles_educativos`
- [ ] Actualizar tipo `escuelas.id_nivel` en DTOs (number → smallint)
- [ ] Modificar seeds/fixtures
- [ ] Ejecutar suite de tests
- [ ] Actualizar documentación técnica

### Código específico a revisar:
```typescript
// ANTES
interface Escuela {
  id_nivel: number; // FK a cat_niveles_educativos
}

// DESPUÉS
interface Escuela {
  id_nivel: number; // SMALLINT, FK a cat_nivel_educativo
}
```

### Queries a actualizar:
```sql
-- ANTES
SELECT * FROM cat_niveles_educativos WHERE codigo = 'PRI';

-- DESPUÉS
SELECT * FROM cat_nivel_educativo WHERE codigo = 'PRIMARIA';
```

---

## 🆘 EN CASO DE PROBLEMAS

### Si algo sale mal DURANTE la ejecución:

1. **DETENER** - No continuar con siguientes pasos
2. **Ejecutar ROLLBACK**:
   ```sql
   ROLLBACK;
   ```
3. **Verificar estado**:
   ```sql
   SELECT 
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='escuelas' AND column_name='id_nivel_temp') as tiene_temp,
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_name='cat_niveles_educativos') as tabla_vieja_existe;
   ```
4. **Contactar DBA o consultar en chat**

### Si necesitas REVERTIR TODO después de completar:

El script de rollback completo está en `migration_consolidacion_niveles.sql` líneas 268-316.

⚠️ **ADVERTENCIA:** El rollback solo funciona si aún tienes backup y no han pasado muchas transacciones.

---

## ✅ MIGRACIÓN EXITOSA

**Firma:** ________________  
**Fecha:** __/__/____  
**Observaciones:** 

_______________________________________________
_______________________________________________
_______________________________________________
