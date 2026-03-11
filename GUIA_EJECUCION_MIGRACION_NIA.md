# 📋 Guía de Ejecución: Migración Modelo NIA

**Fecha:** 11 de marzo de 2026  
**Script:** `migration_implementar_modelo_nia.sql`  
**Objetivo:** Implementar modelo de Niveles de Integración del Aprendizaje (NIA)  
**Duración estimada:** 15-30 minutos (incluye backups y verificaciones)

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### Antes de comenzar:

1. ✅ Esta migración realiza **cambios estructurales críticos** en la tabla `evaluaciones`
2. ✅ Se eliminarán las columnas `nivel_integracion` y `competencia_alcanzada` (con backup)
3. ✅ Se cambiarán constraints UNIQUE en `grupos` y `evaluaciones`
4. ✅ **NUNCA ejecutar directamente en producción sin probar en DEV/STAGING**
5. ✅ **OBLIGATORIO hacer backup completo antes de ejecutar**

---

## 📝 CHECKLIST PRE-MIGRACIÓN

Antes de ejecutar, verifica que tienes:

- [ ] Acceso completo a la base de datos PostgreSQL
- [ ] Permisos de administrador (para CREATE/DROP/ALTER)
- [ ] Espacio en disco suficiente para backup (estimado: tamaño actual DB × 1.5)
- [ ] Tiempo de ventana de mantenimiento (si es producción)
- [ ] Backup reciente de la base de datos
- [ ] Equipo de desarrollo notificado del cambio
- [ ] Ambiente de DEV/STAGING para probar primero

---

## 🔄 PASO 1: PREPARACIÓN DEL AMBIENTE

### 1.1. Verificar Estado de la Base de Datos

```bash
# Conectar a PostgreSQL
psql -h localhost -U postgres -d sep_diagnostica

# Dentro de psql, ejecutar:
```

```sql
-- Verificar total de tablas actual
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Debería retornar: 60 tablas

-- Verificar que existen las tablas requeridas
SELECT table_name 
FROM information_schema.tables
WHERE table_name IN ('evaluaciones', 'estudiantes', 'periodos_evaluacion', 'grupos')
  AND table_schema = 'public'
ORDER BY table_name;
-- Deben existir las 4 tablas

-- Verificar si ya existen las tablas NIA (NO deberían existir)
SELECT table_name 
FROM information_schema.tables
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
  AND table_schema = 'public';
-- Debe retornar 0 filas (si retorna algo, la migración ya se ejecutó parcialmente)

-- Verificar campos deprecados en evaluaciones (DEBEN existir)
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada');
-- Debe retornar 2 filas

-- Contar evaluaciones existentes
SELECT COUNT(*) as total_evaluaciones FROM evaluaciones;

-- Verificar duplicados en GRUPOS (según nuevo constraint)
SELECT escuela_id, nombre, COUNT(*) as total
FROM grupos
GROUP BY escuela_id, nombre
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas (si retorna algo, hay duplicados que corregir)

-- Verificar duplicados en EVALUACIONES (según nuevo constraint)
SELECT estudiante_id, materia_id, periodo_id, COUNT(*) as total
FROM evaluaciones
GROUP BY estudiante_id, materia_id, periodo_id
HAVING COUNT(*) > 1
LIMIT 10;
-- Debe retornar 0 filas (si retorna algo, hay duplicados que corregir)

-- Salir de psql
\q
```

**Resultado esperado:** 
- 60 tablas totales
- 4 tablas requeridas existen
- 0 tablas NIA (no deben existir aún)
- 2 campos deprecados existen
- 0 duplicados en grupos y evaluaciones

**Si hay duplicados:** DETENTE y corrígelos antes de continuar. Ver sección "Apéndice A" al final.

---

## 💾 PASO 2: CREAR BACKUP COMPLETO (OBLIGATORIO)

### 2.1. Backup con pg_dump

```bash
# Crear carpeta para backups si no existe
mkdir -p backups

# Crear backup completo en formato custom (recomendado)
pg_dump -h localhost -U postgres -d sep_diagnostica \
  -F c \
  -b \
  -v \
  -f "backups/backup_pre_migracion_nia_$(date +%Y%m%d_%H%M%S).dump"

# Alternativa: Backup en formato SQL plano
pg_dump -h localhost -U postgres -d sep_diagnostica \
  -F p \
  -b \
  -v \
  -f "backups/backup_pre_migracion_nia_$(date +%Y%m%d_%H%M%S).sql"
```

### 2.2. Verificar el Backup

```bash
# Verificar que el archivo se creó y tiene tamaño > 0
ls -lh backups/backup_pre_migracion_nia_*.dump

# Verificar integridad del backup (opcional pero recomendado)
pg_restore --list backups/backup_pre_migracion_nia_*.dump | head -20
```

**Resultado esperado:**
- Archivo de backup creado con tamaño > 0 bytes
- Al listar el contenido, debe mostrar las tablas

⚠️ **SI EL BACKUP FALLA:** No continuar hasta resolver el problema.

---

## 🚀 PASO 3: EJECUTAR MIGRACIÓN

### 3.1. Revisar el Script (Recomendado)

```bash
# Ver el contenido del script
cat migration_implementar_modelo_nia.sql | less

# O abrirlo en editor
code migration_implementar_modelo_nia.sql
```

Verificar:
- ✅ Pasos del 0 al 8.5 están presentes
- ✅ Paso 4.5 crea backup de datos históricos
- ✅ Paso 6 y 7 verifican duplicados antes de cambiar constraints
- ✅ Paso 8.5 está comentado (migración de datos opcional)

### 3.2. Ejecutar el Script

```bash
# Ejecutar la migración
psql -h localhost -U postgres -d sep_diagnostica \
  -f migration_implementar_modelo_nia.sql \
  2>&1 | tee logs/migracion_nia_$(date +%Y%m%d_%H%M%S).log
```

**Durante la ejecución verás:**
```
======================================================================
MIGRACIÓN: Implementar Modelo NIA
Fecha: 11-mar-2026
======================================================================

----------------------------------------------------------------------
PASO 0: Verificaciones Previas
----------------------------------------------------------------------
✓ Todas las tablas requeridas existen
✓ Tablas NIA no existen, se crearán
✓ Campos deprecados encontrados en EVALUACIONES, se eliminarán

----------------------------------------------------------------------
PASO 1: Crear catálogo CAT_CAMPOS_FORMATIVOS
----------------------------------------------------------------------
✓ Catálogo cat_campos_formativos creado con 5 registros
[... muestra los 5 campos formativos ...]

----------------------------------------------------------------------
PASO 2: Crear catálogo CAT_NIVELES_INTEGRACION
----------------------------------------------------------------------
✓ Catálogo cat_niveles_integracion creado con 4 registros
[... muestra los 4 NIAs ...]

----------------------------------------------------------------------
PASO 3: Crear tabla NIVELES_INTEGRACION_ESTUDIANTE
----------------------------------------------------------------------
✓ Tabla niveles_integracion_estudiante creada exitosamente
[... muestra estructura ...]

----------------------------------------------------------------------
PASO 4: Eliminar trigger deprecado de EVALUACIONES
----------------------------------------------------------------------
✓ Triggers deprecados eliminados

----------------------------------------------------------------------
PASO 4.5: Crear backup de datos históricos de EVALUACIONES
----------------------------------------------------------------------
✓ Backup creado: X registros con datos NIA de Y evaluaciones totales
✓ Datos históricos preservados en: backup_evaluaciones_nia_historico

----------------------------------------------------------------------
PASO 5: Eliminar campos deprecados de EVALUACIONES
----------------------------------------------------------------------
✓ Campo nivel_integracion eliminado
✓ Campo competencia_alcanzada eliminado

----------------------------------------------------------------------
PASO 6: Corregir constraint UNIQUE en GRUPOS
----------------------------------------------------------------------
✓ No hay duplicados, se puede aplicar constraint
✓ Constraint antiguo eliminado: grupos_escuela_id_grado_id_nombre_key
✓ Nuevo constraint creado: UNIQUE (escuela_id, nombre)

----------------------------------------------------------------------
PASO 7: Corregir constraint UNIQUE en EVALUACIONES
----------------------------------------------------------------------
✓ No hay duplicados, se puede aplicar constraint
✓ Constraint corregido: UNIQUE (estudiante_id, materia_id, periodo_id)

======================================================================
PASO 8: Verificación Final
======================================================================
[... muestra tablas creadas, conteos, constraints ...]

======================================================================
✓ MIGRACIÓN COMPLETADA EXITOSAMENTE
======================================================================
```

### 3.3. Tiempo Esperado

- **Ambiente pequeño** (< 10,000 evaluaciones): 1-2 minutos
- **Ambiente mediano** (10,000 - 100,000 evaluaciones): 2-5 minutos
- **Ambiente grande** (> 100,000 evaluaciones): 5-10 minutos

---

## ✅ PASO 4: VERIFICACIÓN POST-MIGRACIÓN

### 4.1. Verificar Estado de Tablas

```bash
# Conectar a PostgreSQL
psql -h localhost -U postgres -d sep_diagnostica
```

```sql
-- Verificar que las 3 nuevas tablas NIA existen
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as total_columnas
FROM information_schema.tables t
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
  AND table_schema = 'public'
ORDER BY table_name;
-- Debe retornar 3 filas

-- Verificar datos en catálogos
SELECT COUNT(*) as total FROM cat_campos_formativos;
-- Debe retornar: 5

SELECT COUNT(*) as total FROM cat_niveles_integracion;
-- Debe retornar: 4

-- Ver los campos formativos creados
SELECT id, clave, nombre FROM cat_campos_formativos ORDER BY orden_visual;

-- Ver los niveles de integración creados
SELECT id_nia, clave, nombre, rango_min, rango_max 
FROM cat_niveles_integracion 
ORDER BY orden_visual;

-- Verificar que campos deprecados NO existen en evaluaciones
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada');
-- Debe retornar 0 filas

-- Verificar que tabla de backup existe y tiene datos
SELECT COUNT(*) as registros_respaldados 
FROM backup_evaluaciones_nia_historico;

-- Ver muestra del backup
SELECT id, valoracion, nivel_integracion, competencia_alcanzada, created_at
FROM backup_evaluaciones_nia_historico
LIMIT 5;

-- Verificar constraints corregidos en GRUPOS
SELECT constraint_name, 
       STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.key_column_usage
WHERE table_name = 'grupos' 
  AND constraint_name LIKE '%escuela%'
GROUP BY constraint_name;
-- Debe mostrar: uq_grupos_escuela_nombre con columnas: escuela_id, nombre

-- Verificar constraints corregidos en EVALUACIONES
SELECT constraint_name, 
       STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.key_column_usage
WHERE table_name = 'evaluaciones' 
  AND constraint_name LIKE '%estudiante%materia%'
GROUP BY constraint_name;
-- Debe mostrar: uq_evaluaciones_estudiante_materia_periodo 
-- con columnas: estudiante_id, materia_id, periodo_id

-- Verificar total de tablas
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Debe retornar: 63 tablas (60 + 3 nuevas)

\q
```

### 4.2. Checklist de Verificación

- [ ] ✅ 3 nuevas tablas NIA creadas
- [ ] ✅ cat_campos_formativos tiene 5 registros
- [ ] ✅ cat_niveles_integracion tiene 4 registros  
- [ ] ✅ niveles_integracion_estudiante existe (vacía por ahora)
- [ ] ✅ Campos deprecados eliminados de evaluaciones
- [ ] ✅ Tabla backup_evaluaciones_nia_historico creada con datos
- [ ] ✅ Constraint en grupos corregido
- [ ] ✅ Constraint en evaluaciones corregido
- [ ] ✅ Total de tablas: 63

**Si todas las verificaciones pasan:** ✅ Migración exitosa

**Si algo falla:** Ver sección "Rollback" más abajo.

---

## 🔧 PASO 5: ACTUALIZAR CÓDIGO DE APLICACIÓN

### 5.1. Cambios Requeridos en el Código

#### A. Actualizar Modelos TypeORM/Entities

**Archivo:** `graphql-server/src/entities/Evaluacion.entity.ts` (o similar)

```typescript
// ELIMINAR estos campos:
// @Column({ type: 'varchar', length: 20, nullable: true })
// nivel_integracion?: string;
//
// @Column({ type: 'boolean', default: false })
// competencia_alcanzada: boolean;

// Actualizar la entidad para NO incluir estos campos
```

**Crear nuevas entidades:**

```typescript
// src/entities/CatCamposFormativos.entity.ts
@Entity('cat_campos_formativos')
export class CatCamposFormativos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  clave: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'int' })
  orden_visual: number;

  @Column({ type: 'boolean', default: true })
  vigente: boolean;

  @CreateDateColumn()
  created_at: Date;
}

// src/entities/CatNivelesIntegracion.entity.ts
@Entity('cat_niveles_integracion')
export class CatNivelesIntegracion {
  @PrimaryGeneratedColumn()
  id_nia: number;

  @Column({ type: 'varchar', length: 2, unique: true })
  clave: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'int' })
  rango_min: number;

  @Column({ type: 'int' })
  rango_max: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color_hex?: string;

  @Column({ type: 'int' })
  orden_visual: number;

  @Column({ type: 'boolean', default: true })
  vigente: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// src/entities/NivelesIntegracionEstudiante.entity.ts
@Entity('niveles_integracion_estudiante')
export class NivelesIntegracionEstudiante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @ManyToOne(() => Estudiante)
  @JoinColumn({ name: 'id_estudiante' })
  id_estudiante: string;

  @Column({ type: 'int' })
  @ManyToOne(() => CatCamposFormativos)
  @JoinColumn({ name: 'id_campo_formativo' })
  id_campo_formativo: number;

  @Column({ type: 'uuid' })
  @ManyToOne(() => PeriodoEvaluacion)
  @JoinColumn({ name: 'id_periodo' })
  id_periodo: string;

  @Column({ type: 'int' })
  @ManyToOne(() => CatNivelesIntegracion)
  @JoinColumn({ name: 'id_nia' })
  id_nia: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  valoracion_promedio?: number;

  @Column({ type: 'int', default: 0 })
  total_materias: number;

  @Column({ type: 'int', default: 0 })
  materias_evaluadas: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  calculado_en: Date;

  @Column({ type: 'varchar', length: 50, default: 'SISTEMA' })
  calculado_por: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'boolean', default: false })
  validado: boolean;

  @Column({ type: 'uuid', nullable: true })
  validado_por?: string;

  @Column({ type: 'timestamp', nullable: true })
  validado_en?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

#### B. Actualizar Queries y Resolvers

```typescript
// ELIMINAR todas las referencias a:
// - nivel_integracion
// - competencia_alcanzada

// Buscar en todo el código:
grep -r "nivel_integracion" graphql-server/src/
grep -r "competencia_alcanzada" graphql-server/src/

// Reemplazar con lógica que consulte niveles_integracion_estudiante
```

#### C. Actualizar Schemas GraphQL

```graphql
# ELIMINAR del tipo Evaluacion:
# nivel_integracion: String
# competencia_alcanzada: Boolean

# AGREGAR nuevos tipos:
type CatCampoFormativo {
  id: Int!
  clave: String!
  nombre: String!
  descripcion: String
  orden_visual: Int!
  vigente: Boolean!
}

type CatNivelIntegracion {
  id_nia: Int!
  clave: String!
  nombre: String!
  descripcion: String
  rango_min: Int!
  rango_max: Int!
  color_hex: String
  orden_visual: Int!
  vigente: Boolean!
}

type NivelIntegracionEstudiante {
  id: ID!
  estudiante: Estudiante!
  campo_formativo: CatCampoFormativo!
  periodo: PeriodoEvaluacion!
  nia: CatNivelIntegracion!
  valoracion_promedio: Float
  total_materias: Int!
  materias_evaluadas: Int!
  calculado_en: DateTime!
  calculado_por: String!
  observaciones: String
  validado: Boolean!
}
```

### 5.2. Implementar Lógica de Cálculo de NIAs

```typescript
// src/services/nia-calculator.service.ts
export class NiaCalculatorService {
  /**
   * Calcula el NIA de un estudiante para un campo formativo en un periodo
   */
  async calcularNIA(
    estudianteId: string,
    campoFormativoId: number,
    periodoId: string
  ): Promise<NivelIntegracionEstudiante> {
    // 1. Obtener todas las materias del campo formativo
    // 2. Obtener evaluaciones del estudiante para esas materias en el periodo
    // 3. Calcular promedio de valoraciones
    // 4. Determinar NIA según rango
    // 5. Insertar o actualizar en niveles_integracion_estudiante
    
    const promedio = await this.calcularPromedioValoraciones(
      estudianteId, 
      campoFormativoId, 
      periodoId
    );
    
    const nia = await this.determinarNIA(promedio);
    
    return await this.guardarNIA({
      id_estudiante: estudianteId,
      id_campo_formativo: campoFormativoId,
      id_periodo: periodoId,
      id_nia: nia.id_nia,
      valoracion_promedio: promedio,
      // ... otros campos
    });
  }
}
```

### 5.3. Actualizar Tests

```typescript
// tests/evaluaciones.spec.ts

// ELIMINAR tests de:
// - nivel_integracion
// - competencia_alcanzada

// AGREGAR tests para:
describe('NIA Calculator', () => {
  it('debería calcular NIA correctamente', async () => {
    // Test de cálculo
  });
  
  it('debería asignar NIA ED para promedio < 1.0', async () => {
    // Test de reglas
  });
});
```

---

## 📊 PASO 6: CALCULAR NIAS INICIALES (OPCIONAL)

Si deseas calcular NIAs para estudiantes existentes:

### Opción A: Descomentar Paso 8.5 del Script

1. Editar `migration_implementar_modelo_nia.sql`
2. Buscar `PASO 8.5: MIGRACIÓN DE DATOS`
3. Descomentar el código de OPCIÓN A
4. Ajustar el mapeo materia → campo_formativo según tu estructura
5. Ejecutar solo esa sección:

```bash
psql -h localhost -U postgres -d sep_diagnostica <<EOF
-- Copiar aquí el código descomentado del Paso 8.5
EOF
```

### Opción B: Ejecutar Proceso Batch Desde Aplicación

```typescript
// Script one-time: calcular-nias-iniciales.ts
import { NiaCalculatorService } from './services/nia-calculator.service';

async function calcularNIAsIniciales() {
  const estudiantes = await obtenerTodosLosEstudiantes();
  const periodoActual = await obtenerPeriodoActual();
  
  for (const estudiante of estudiantes) {
    for (let campoFormativoId = 1; campoFormativoId <= 5; campoFormativoId++) {
      try {
        await niaCalculator.calcularNIA(
          estudiante.id,
          campoFormativoId,
          periodoActual.id
        );
        console.log(`✓ NIA calculado para estudiante ${estudiante.id}, campo ${campoFormativoId}`);
      } catch (error) {
        console.error(`✗ Error en estudiante ${estudiante.id}:`, error);
      }
    }
  }
}

calcularNIAsIniciales();
```

---

## 🔙 ROLLBACK (En caso de problemas)

### Si la migración falla o necesitas revertir:

```bash
# Restaurar desde backup
psql -h localhost -U postgres -d sep_diagnostica <<EOF
-- Desconectar usuarios activos
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'sep_diagnostica' AND pid <> pg_backend_pid();
EOF

# Restaurar backup
dropdb -h localhost -U postgres sep_diagnostica
createdb -h localhost -U postgres sep_diagnostica
pg_restore -h localhost -U postgres -d sep_diagnostica backups/backup_pre_migracion_nia_*.dump
```

### Código de Rollback Manual (si necesitas revertir solo la estructura):

```sql
BEGIN;

-- 1. Restaurar campos en evaluaciones
ALTER TABLE evaluaciones 
    ADD COLUMN nivel_integracion VARCHAR(20),
    ADD COLUMN competencia_alcanzada BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Restaurar datos desde backup (si existe)
UPDATE evaluaciones e
SET 
    nivel_integracion = b.nivel_integracion,
    competencia_alcanzada = b.competencia_alcanzada
FROM backup_evaluaciones_nia_historico b
WHERE e.id = b.id;

-- 3. Eliminar tablas NIA
DROP TABLE IF EXISTS niveles_integracion_estudiante CASCADE;
DROP TABLE IF EXISTS cat_niveles_integracion CASCADE;
DROP TABLE IF EXISTS cat_campos_formativos CASCADE;

-- 4. Restaurar constraint en grupos
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS uq_grupos_escuela_nombre;
ALTER TABLE grupos 
    ADD CONSTRAINT grupos_escuela_id_grado_id_nombre_key 
    UNIQUE (escuela_id, grado_id, nombre);

-- 5. Restaurar constraint en evaluaciones
ALTER TABLE evaluaciones DROP CONSTRAINT IF EXISTS uq_evaluaciones_estudiante_materia_periodo;
ALTER TABLE evaluaciones 
    ADD CONSTRAINT uq_evaluaciones_solicitud 
    UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id);

COMMIT;
```

---

## 📝 PASO 7: DOCUMENTACIÓN Y COMUNICACIÓN

### 7.1. Actualizar Documentación

- [ ] Actualizar `ESTRUCTURA_DE_DATOS.md` con las nuevas tablas (si no está)
- [ ] Documentar API endpoints nuevos/modificados
- [ ] Actualizar diagramas ER si existen
- [ ] Actualizar `README.md` del proyecto

### 7.2. Comunicar al Equipo

Enviar email/mensaje al equipo con:

```
✅ MIGRACIÓN NIA COMPLETADA

Fecha: [fecha]
Ambiente: [DEV/STAGING/PROD]

Cambios aplicados:
- ✅ 3 nuevas tablas: cat_campos_formativos, cat_niveles_integracion, niveles_integracion_estudiante
- ✅ Eliminados campos: evaluaciones.nivel_integracion, evaluaciones.competencia_alcanzada
- ✅ Backup creado: backup_evaluaciones_nia_historico (X registros)
- ✅ Constraints corregidos en grupos y evaluaciones

⚠️ Acciones requeridas:
1. Actualizar código local (git pull)
2. Revisar cambios en entidades/modelos
3. Ejecutar tests locales
4. Reportar cualquier error relacionado con evaluaciones

Referencia: GUIA_EJECUCION_MIGRACION_NIA.md
```

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué se hizo?

1. ✅ Creadas 3 nuevas tablas para modelo NIA
2. ✅ Eliminados 2 campos deprecados de evaluaciones (con backup)
3. ✅ Corregidos 2 constraints UNIQUE
4. ✅ Preservados todos los datos históricos

### ¿Qué NO se perdió?

- ✅ Evaluaciones completas (solo 2 columnas eliminadas)
- ✅ Datos históricos respaldados en `backup_evaluaciones_nia_historico`
- ✅ Todas las demás tablas intactas
- ✅ Estudiantes, grupos, escuelas, usuarios sin cambios

### Próximos Pasos

1. [ ] Actualizar código de aplicación (modelos, queries, schemas)
2. [ ] Implementar lógica de cálculo de NIAs
3. [ ] Calcular NIAs iniciales para estudiantes existentes
4. [ ] Actualizar tests
5. [ ] Desplegar cambios en código
6. [ ] Verificar que todo funciona
7. [ ] Eliminar tabla de backup cuando confirmes que todo está bien

---

## 📚 APÉNDICE A: Corrección de Duplicados

### Si hay duplicados en GRUPOS:

```sql
-- Ver duplicados
SELECT escuela_id, nombre, COUNT(*) as total, STRING_AGG(id::text, ', ') as ids
FROM grupos
GROUP BY escuela_id, nombre
HAVING COUNT(*) > 1;

-- Opción 1: Eliminar duplicados manteniendo el más antiguo
WITH duplicados AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY escuela_id, nombre ORDER BY created_at) as rn
    FROM grupos
)
DELETE FROM grupos
WHERE id IN (
    SELECT id FROM duplicados WHERE rn > 1
);

-- Opción 2: Renombrar duplicados
UPDATE grupos
SET nombre = nombre || '_' || grado_nombre
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY escuela_id, nombre ORDER BY created_at) as rn
        FROM grupos
    ) dup
    WHERE rn > 1
);
```

### Si hay duplicados en EVALUACIONES:

```sql
-- Ver duplicados
SELECT estudiante_id, materia_id, periodo_id, COUNT(*) as total, 
       STRING_AGG(id::text, ', ') as ids
FROM evaluaciones
GROUP BY estudiante_id, materia_id, periodo_id
HAVING COUNT(*) > 1
LIMIT 20;

-- Opción 1: Mantener evaluación más reciente
WITH duplicados AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY estudiante_id, materia_id, periodo_id 
               ORDER BY updated_at DESC
           ) as rn
    FROM evaluaciones
)
DELETE FROM evaluaciones
WHERE id IN (
    SELECT id FROM duplicados WHERE rn > 1
);

-- Opción 2: Promediar valoraciones y mantener una
-- (Más complejo, consultar con equipo)
```

---

## 📞 CONTACTO Y SOPORTE

**Si tienes problemas:**

1. Revisar logs de la migración
2. Verificar sección de rollback
3. Consultar documentación: `ANALISIS_CONSISTENCIA_BD_VS_DOCS.md`
4. Contactar al equipo de base de datos

**Archivos relacionados:**
- `migration_implementar_modelo_nia.sql` - Script de migración
- `ANALISIS_CONSISTENCIA_BD_VS_DOCS.md` - Análisis técnico completo
- `ESTRUCTURA_DE_DATOS.md` - Documentación del modelo de datos
- `CORRECCIONES_MODELO_NIA.md` - Especificación del modelo NIA

---

**Fin de la guía**  
**Fecha:** 11 de marzo de 2026  
**Versión:** 1.0
