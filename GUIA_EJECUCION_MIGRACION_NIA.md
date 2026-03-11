# 📋 Guía de Ejecución: Migración Modelo NIA (pgAdmin)

**Fecha:** 11 de marzo de 2026  
**Script:** `migration_implementar_modelo_nia.sql`  
**Plataforma:** pgAdmin 4 (GUI)  
**Objetivo:** Implementar modelo de Niveles de Integración del Aprendizaje (NIA)  
**Duración estimada:** 15-30 minutos (incluye backups y verificaciones)

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### Antes de comenzar:

1. ✅ Esta migración realiza **cambios estructurales críticos** en la tabla `evaluaciones`
2. ✅ Se eliminarán las columnas `nivel_integracion` y `competencia_alcanzada` (con backup automático)
3. ✅ Se cambiarán constraints UNIQUE en `grupos` y `evaluaciones`
4. ✅ **NUNCA ejecutar directamente en producción sin probar en DEV/STAGING**
5. ✅ **OBLIGATORIO hacer backup completo antes de ejecutar**
6. ✅ Todo se ejecuta desde **pgAdmin Query Tool** - No requiere línea de comandos

---

## 📝 CHECKLIST PRE-MIGRACIÓN

Antes de ejecutar, verifica que tienes:

- [ ] Acceso a pgAdmin 4 con permisos de administrador
- [ ] Permisos de superusuario o propietario de la base de datos
- [ ] Espacio en disco suficiente para backup (estimado: tamaño actual DB × 1.5)
- [ ] Tiempo de ventana de mantenimiento (si es producción)
- [ ] pgAdmin 4 instalado y conectado a la base de datos
- [ ] Equipo de desarrollo notificado del cambio
- [ ] Ambiente de DEV/STAGING para probar primero

---

## 🔄 PASO 1: PREPARACIÓN DEL AMBIENTE (pgAdmin)

### 1.1. Abrir pgAdmin y Conectar a la Base de Datos

1. **Abrir pgAdmin 4**
2. **Expandir el árbol:** Servers → [Tu servidor] → Databases → `sep_diagnostica`
3. **Click derecho en la base de datos → Query Tool** (o presionar F5)

### 1.2. Verificar Estado de la Base de Datos

En el Query Tool, ejecuta la siguiente consulta (copia y pega todo el bloque):

```sql
-- =====================================================================
-- VERIFICACIONES PREVIAS - Copiar y ejecutar en Query Tool
-- =====================================================================

-- 1. Verificar total de tablas actual
SELECT 'Total de tablas:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
-- Debería retornar: 60 tablas
SELECT 'Esperado:', '60';

-- 2. Verificar que existen las tablas requeridas
SELECT 'Tablas requeridas encontradas:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.tables
WHERE table_name IN ('evaluaciones', 'estudiantes', 'periodos_evaluacion', 'grupos')
  AND table_schema = 'public'
UNION ALL
SELECT 'Esperado:', '4';

-- 3. Verificar si ya existen las tablas NIA (NO deberían existir)
SELECT 'Tablas NIA existentes (debe ser 0):' as verificacion, COUNT(*)::text as resultado
FROM information_schema.tables
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
  AND table_schema = 'public';

-- 4. Verificar campos deprecados en evaluaciones (DEBEN existir)
SELECT 'Campos deprecados en evaluaciones:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada')
UNION ALL
SELECT 'Esperado:', '2';

-- 5. Contar evaluaciones existentes
SELECT 'Total evaluaciones:' as verificacion, COUNT(*)::text as resultado
FROM evaluaciones;

-- 6. Verificar duplicados en GRUPOS (según nuevo constraint)
SELECT 'Duplicados en GRUPOS:' as verificacion, COUNT(*)::text as resultado
FROM (
    SELECT escuela_id, nombre
    FROM grupos
    GROUP BY escuela_id, nombre
    HAVING COUNT(*) > 1
) dup;
-- Debe retornar: 0 (si retorna > 0, hay duplicados que corregir)

-- 7. Verificar duplicados en EVALUACIONES (según nuevo constraint)
SELECT 'Duplicados en EVALUACIONES:' as verificacion, COUNT(*)::text as resultado
FROM (
    SELECT estudiante_id, materia_id, periodo_id
    FROM evaluaciones
    GROUP BY estudiante_id, materia_id, periodo_id
    HAVING COUNT(*) > 1
) dup;
-- Debe retornar: 0 (si retorna > 0, hay duplicados que corregir)
```

**Presiona F5 o el botón ▶️ para ejecutar**

**Resultado esperado:** 
- Total de tablas: 60
- Tablas requeridas: 4
- Tablas NIA existentes: 0
- Campos deprecados: 2
- Duplicados en grupos: 0
- Duplicados en evaluaciones: 0

⚠️ **Si hay duplicados (> 0):** DETENTE y corrígelos antes de continuar. Ver sección "Apéndice A" al final.

---

## 💾 PASO 2: CREAR BACKUP COMPLETO (OBLIGATORIO - pgAdmin)

### 2.1. Crear Backup con pgAdmin

1. **En el árbol de navegación izquierdo:**
   - Click derecho en la base de datos `sep_diagnostica`
   - Seleccionar **"Backup..."**

2. **En la ventana de Backup:**
   
   **Pestaña "General":**
   - **Filename:** Click en 📁 y elegir ubicación y nombre:
     ```
     backup_pre_migracion_nia_20260311.backup
     ```
   - **Format:** Seleccionar **"Custom"** (recomendado) o **"Tar"**
   - **Compression ratio:** 6 (valor medio)
   - **Encoding:** UTF8

   **Pestaña "Dump Options":**
   - ✅ Marcar **"Pre-data"** (estructura)
   - ✅ Marcar **"Data"** (datos)
   - ✅ Marcar **"Post-data"** (índices, triggers)
   - ✅ Marcar **"Blobs"** (si aplica)
   
   **Pestaña "Objects":**
   - Seleccionar: **"All objects"**

3. **Click en "Backup"**

4. **Esperar a que termine:** Verás una ventana de progreso
   - Si es exitoso, verás: "Backup job completed successfully"
   - El archivo estará en la ubicación que elegiste

### 2.2. Verificar el Backup

1. **Navegar a la carpeta donde guardaste el backup**
2. **Verificar:**
   - ✅ El archivo existe
   - ✅ Tiene tamaño > 0 bytes
   - ✅ La fecha de modificación es actual

**Tamaño esperado:** Depende de tu base de datos
- Pequeña (< 100 MB): 5-20 MB comprimido
- Mediana (100 MB - 1 GB): 20-200 MB comprimido
- Grande (> 1 GB): 200+ MB comprimido

⚠️ **SI EL BACKUP FALLA:** 
- Verificar permisos de escritura en la carpeta
- Verificar espacio en disco
- Intentar con formato "Plain" (SQL)
- No continuar hasta tener un backup exitoso

---

## 🚀 PASO 3: EJECUTAR MIGRACIÓN (pgAdmin Query Tool)

## 🚀 PASO 3: EJECUTAR MIGRACIÓN (pgAdmin Query Tool)

### 3.1. Abrir el Script en pgAdmin

**Opción A: Desde pgAdmin**
1. En Query Tool, click en **"📁 Open File"** (o Ctrl+O)
2. Navegar a: `C:\VLP\GitHub\sep_evaluacion_diagnostica\`
3. Seleccionar: `migration_implementar_modelo_nia.sql`
4. Click **"Abrir"**

**Opción B: Copiar y pegar**
1. Abrir `migration_implementar_modelo_nia.sql` en Notepad++ o VS Code
2. Seleccionar todo (Ctrl+A)
3. Copiar (Ctrl+C)
4. Pegar en Query Tool de pgAdmin (Ctrl+V)

### 3.2. Revisar el Script Antes de Ejecutar

Verificar que el script contiene:
- ✅ Mensajes con SELECT que muestran progreso
- ✅ Comentarios explicativos en cada paso
- ✅ Pasos del 0 al 8.5
- ✅ Paso 4.5 crea backup de datos históricos
- ✅ Verificaciones de duplicados antes de cambiar constraints

### 3.3. Ejecutar el Script Completo

1. **Asegurar que todo el script está seleccionado** (o cursor al inicio)
2. **Click en el botón ▶️ "Execute/Refresh"** (o presionar F5)
3. **Esperar a que termine** - Verás mensajes en la pestaña "Messages" y "Data Output"

### 3.4. Monitorear la Ejecución

Durante la ejecución verás en la pestaña **"Messages":**

```
NOTICE:  ✓ Todas las tablas requeridas existen
NOTICE:  ✓ Tablas NIA no existen, se crearán
NOTICE:  ✓ Campos deprecados encontrados en EVALUACIONES, se eliminarán
```

Y en la pestaña **"Data Output"** verás tablas con resultados como:

```
╔════════════════════════════════════╗
║           mensaje                   ║
╠════════════════════════════════════╣
║ PASO 1: Crear catálogo CAT_CAMPOS  ║
║         FORMATIVOS                  ║
╚════════════════════════════════════╝
```

Luego verás los datos insertados:

```
╔════╦═══════╦════════════════════════════════╗
║ id ║ clave ║           nombre               ║
╠════╬═══════╬════════════════════════════════╣
║  1 ║  ENS  ║ Ética, Naturaleza y Sociedades ║
║  2 ║  HYC  ║ De lo Humano y lo Comunitario  ║
║  3 ║  LEN  ║ Lenguajes                      ║
║  4 ║  SPC  ║ Saberes y Pensamiento...       ║
║  5 ║  F5   ║ Campo Formativo 5              ║
╚════╩═══════╩════════════════════════════════╝
```

### 3.5. Verificar Mensajes de Éxito

Al finalizar, en "Data Output" deberías ver:

```
╔════════════════════════════════════════════╗
║                 mensaje                     ║
╠════════════════════════════════════════════╣
║ ✓ MIGRACIÓN COMPLETADA EXITOSAMENTE        ║
║                                             ║
║ Cambios aplicados:                          ║
║   ✓ Tabla cat_campos_formativos (5 reg.)   ║
║   ✓ Tabla cat_niveles_integracion (4 reg.) ║
║   ✓ Tabla niveles_integracion_estudiante   ║
║   ✓ Campos deprecados eliminados           ║
║   ✓ Constraints corregidos                 ║
║                                             ║
║ DATOS PRESERVADOS:                          ║
║   ✓ Backup: backup_evaluaciones_nia_...    ║
║   ✓ Evaluaciones existentes mantenidas     ║
╚════════════════════════════════════════════╝
```

### 3.6. Tiempo Esperado

- **Ambiente pequeño** (< 10,000 evaluaciones): 30 segundos - 1 minuto
- **Ambiente mediano** (10,000 - 100,000 evaluaciones): 1-3 minutos
- **Ambiente grande** (> 100,000 evaluaciones): 3-5 minutos

### 3.7. Si Hay Errores

**Error común: Duplicados detectados**

Si ves un mensaje de error como:
```
ERROR: No se puede aplicar constraint UNIQUE con datos duplicados
```

1. **No intentes ejecutar de nuevo** - El script se detuvo a propósito
2. **Ir a Apéndice A** al final de esta guía
3. **Corregir los duplicados** usando los scripts proporcionados
4. **Volver a ejecutar** el script completo desde el inicio

**Otros errores:**
- **"permission denied"**: Necesitas permisos de superusuario o propietario de la BD
- **"relation already exists"**: Alguna tabla NIA ya existe, posible ejecución parcial previa
- **"timeout"**: Aumentar timeout en pgAdmin: File → Preferences → Query Tool → Query execution timeout

---

## ✅ PASO 4: VERIFICACIÓN POST-MIGRACIÓN (pgAdmin)

### 4.1. Ejecutar Verificaciones

En Query Tool, ejecuta este bloque completo:

```sql
-- =====================================================================
-- VERIFICACIONES POST-MIGRACIÓN - Ejecutar en Query Tool
-- =====================================================================

-- 1. Verificar que las 3 nuevas tablas NIA existen
SELECT 'Nuevas tablas NIA creadas:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.tables
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante')
  AND table_schema = 'public'
UNION ALL
SELECT 'Esperado:', '3';

-- 2. Verificar datos en catálogos
SELECT 'Registros en cat_campos_formativos:' as verificacion, COUNT(*)::text as resultado
FROM cat_campos_formativos
UNION ALL
SELECT 'Esperado:', '5';

SELECT 'Registros en cat_niveles_integracion:' as verificacion, COUNT(*)::text as resultado
FROM cat_niveles_integracion
UNION ALL
SELECT 'Esperado:', '4';

-- 3. Ver los campos formativos creados
SELECT '=== Campos Formativos Creados ===' as titulo;
SELECT id, clave, nombre, orden_visual, vigente
FROM cat_campos_formativos 
ORDER BY orden_visual;

-- 4. Ver los niveles de integración creados
SELECT '=== Niveles de Integración (NIA) Creados ===' as titulo;
SELECT id_nia, clave, nombre, rango_min, rango_max, color_hex, orden_visual
FROM cat_niveles_integracion 
ORDER BY orden_visual;

-- 5. Verificar que campos deprecados NO existen en evaluaciones
SELECT 'Campos deprecados en evaluaciones:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada')
UNION ALL
SELECT 'Esperado:', '0';

-- 6. Verificar que tabla de backup existe y tiene datos
SELECT 'Registros en backup histórico:' as verificacion, COUNT(*)::text as resultado
FROM backup_evaluaciones_nia_historico;

-- 7. Ver muestra del backup (primeros 5 registros)
SELECT '=== Muestra del Backup Histórico ===' as titulo;
SELECT id, valoracion, nivel_integracion, competencia_alcanzada, 
       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as fecha_creacion
FROM backup_evaluaciones_nia_historico
LIMIT 5;

-- 8. Verificar constraints corregidos en GRUPOS
SELECT '=== Constraints en GRUPOS ===' as titulo;
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
-- Debe mostrar: uq_grupos_escuela_nombre con columnas: escuela_id, nombre

-- 9. Verificar constraints corregidos en EVALUACIONES
SELECT '=== Constraints en EVALUACIONES ===' as titulo;
SELECT 
    tc.constraint_name,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columnas
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'evaluaciones' 
  AND tc.constraint_type = 'UNIQUE'
  AND tc.constraint_name LIKE '%estudiante_materia%'
GROUP BY tc.constraint_name;
-- Debe mostrar: uq_evaluaciones_estudiante_materia_periodo
-- con columnas: estudiante_id, materia_id, periodo_id

-- 10. Verificar total de tablas
SELECT 'Total de tablas en BD:' as verificacion, COUNT(*)::text as resultado
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Debe retornar: 63 tablas (60 + 3 nuevas)

-- RESUMEN FINAL
SELECT '===============================================' as resumen
UNION ALL SELECT '✓ VERIFICACIÓN COMPLETA'
UNION ALL SELECT '==============================================='
UNION ALL SELECT 'Si todos los valores coinciden con lo esperado,'
UNION ALL SELECT 'la migración fue EXITOSA'
UNION ALL SELECT '===============================================';
```

**Presiona F5 para ejecutar**

### 4.2. Checklist de Verificación

Mark cada ítem revisando los resultados del Query anterior:

- [ ] ✅ 3 nuevas tablas NIA creadas (cat_campos_formativos, cat_niveles_integracion, niveles_integracion_estudiante)
- [ ] ✅ cat_campos_formativos tiene 5 registros (ENS, HYC, LEN, SPC, F5)
- [ ] ✅ cat_niveles_integracion tiene 4 registros (ED, EP, ES, SO)
- [ ] ✅ niveles_integracion_estudiante existe (vacía por ahora - es normal)
- [ ] ✅ Campos deprecados eliminados de evaluaciones (debe ser 0)
- [ ] ✅ Tabla backup_evaluaciones_nia_historico creada con datos
- [ ] ✅ Constraint en grupos: UNIQUE(escuela_id, nombre)
- [ ] ✅ Constraint en evaluaciones: UNIQUE(estudiante_id, materia_id, periodo_id)
- [ ] ✅ Total de tablas: 63

**Si todas las verificaciones pasan:** ✅ Migración exitosa - Continuar con Paso 5

**Si algo falla:** Ver sección "Paso 6: Rollback" más abajo.

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

## 📊 PASO 6: CALCULAR NIAS INICIALES (OPCIONAL - pgAdmin)

Si deseas calcular NIAs para estudiantes existentes desde pgAdmin:

### Opción A: Usar el código comentado del script

El archivo `migration_implementar_modelo_nia.sql` tiene una sección comentada (Paso 8.5) con código para calcular NIAs automáticamente.

**Para activarlo:**

1. **Abrir** `migration_implementar_modelo_nia.sql` en un editor de texto
2. **Buscar** la sección `PASO 8.5: MIGRACIÓN DE DATOS`
3. **Descomentar** el código de OPCIÓN A (quitar los `--` al inicio de cada línea)
4. **Ajustar** el mapeo de materia → campo_formativo según tu estructura
5. **Copiar** solo esa sección descomentada
6. **Pegar** en Query Tool de pgAdmin
7. **Ejecutar** (F5)

### Opción B: Calcular desde la aplicación

Implementa un proceso batch en tu aplicación Node.js/NestJS para calcular NIAs.

Ver sección 5.2 de esta guía para código de ejemplo.

---

## 🔙 PASO 7: ROLLBACK (En caso de problemas)

### Opción A: Restaurar desde Backup con pgAdmin (Recomendado)

Si la migración falló o causó problemas:

1. **Cerrar todas las conexiones activas a la base de datos:**
   - En pgAdmin, click derecho en `sep_diagnostica`
   - Seleccionar **"Disconnect Database"**

2. **Eliminar la base de datos actual:**
   - Click derecho en `sep_diagnostica`
   - Seleccionar **"Delete/Drop"**
   - Confirmar

3. **Crear base de datos nueva:**
   - Click derecho en **"Databases"**
   - Seleccionar **"Create → Database..."**
   - Nombre: `sep_diagnostica`
   - Owner: (tu usuario)
   - Encoding: UTF8
   - Click "Save"

4. **Restaurar desde backup:**
   - Click derecho en la nueva BD `sep_diagnostica`
   - Seleccionar **"Restore..."**
   - Buscar tu archivo: `backup_pre_migracion_nia_20260311.backup`
   - Click "Restore"

⚠️ **ADVERTENCIA:** Esto eliminará TODOS los cambios posteriores al backup.

### Opción B: Rollback Manual SQL (Solo estructura - pgAdmin)

Si solo quieres revertir cambios estructurales:

**Copiar y ejecutar este script completo en Query Tool:**

```sql
-- =====================================================================
-- ROLLBACK MANUAL - Revertir cambios de la migración
-- Ejecutar en Query Tool de pgAdmin
-- =====================================================================

BEGIN;

SELECT 'Iniciando rollback...' as estado;

-- 1. Restaurar campos en evaluaciones
ALTER TABLE evaluaciones 
    ADD COLUMN IF NOT EXISTS nivel_integracion VARCHAR(20),
    ADD COLUMN IF NOT EXISTS competencia_alcanzada BOOLEAN DEFAULT FALSE;

-- 2. Restaurar datos desde backup (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_evaluaciones_nia_historico') THEN
        UPDATE evaluaciones e
        SET 
            nivel_integracion = b.nivel_integracion,
            competencia_alcanzada = COALESCE(b.competencia_alcanzada, FALSE)
        FROM backup_evaluaciones_nia_historico b
        WHERE e.id = b.id;
        
        RAISE NOTICE '✓ Datos restaurados desde backup';
    ELSE
        RAISE NOTICE '⚠ Tabla de backup no encontrada';
    END IF;
END $$;

-- 3. Eliminar tablas NIA
DROP TABLE IF EXISTS niveles_integracion_estudiante CASCADE;
DROP TABLE IF EXISTS cat_niveles_integracion CASCADE;
DROP TABLE IF EXISTS cat_campos_formativos CASCADE;

SELECT '✓ Tablas NIA eliminadas' as estado;

-- 4. Restaurar constraint en grupos
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS uq_grupos_escuela_nombre;
ALTER TABLE grupos 
    ADD CONSTRAINT grupos_escuela_id_grado_id_nombre_key 
    UNIQUE (escuela_id, grado_id, nombre);

SELECT '✓ Constraint en grupos restaurado' as estado;

-- 5. Restaurar constraint en evaluaciones
ALTER TABLE evaluaciones DROP CONSTRAINT IF EXISTS uq_evaluaciones_estudiante_materia_periodo;
ALTER TABLE evaluaciones 
    ADD CONSTRAINT uq_evaluaciones_solicitud 
    UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id);

SELECT '✓ Constraint en evaluaciones restaurado' as estado;

-- 6. Recrear trigger (si es necesario)
-- [Aquí iría el código del trigger original si lo conoces]

COMMIT;

SELECT '======================================' as resultado
UNION ALL SELECT '✓ ROLLBACK COMPLETADO'
UNION ALL SELECT '======================================'
UNION ALL SELECT 'Base de datos restaurada al estado anterior'
UNION ALL SELECT 'Se recomienda reiniciar la aplicación';
```

**Ejecutar con F5**

### Verificar Rollback

Después del rollback, verificar:

```sql
-- Verificar que campos están de vuelta
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada');
-- Debe retornar: 2 filas

-- Verificar que tablas NIA no existen
SELECT COUNT(*) as tablas_nia
FROM information_schema.tables
WHERE table_name IN ('cat_campos_formativos', 'cat_niveles_integracion', 'niveles_integracion_estudiante');
-- Debe retornar: 0
```

---

## 📝 PASO 8: DOCUMENTACIÓN Y COMUNICACIÓN

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

## 📚 APÉNDICE A: Corrección de Duplicados (pgAdmin)

### Si hay duplicados en GRUPOS:

**1. Identificar duplicados:**

Ejecutar en Query Tool:

```sql
--Ver duplicados detallados
SELECT escuela_id, nombre, COUNT(*) as total, 
       STRING_AGG(id::text, ', ') as ids_duplicados,
       STRING_AGG(grado_nombre, ', ') as grados
FROM grupos
GROUP BY escuela_id, nombre
HAVING COUNT(*) > 1
ORDER BY total DESC;
```

**2. Opción 1: Eliminar duplicados manteniendo el más antiguo**

```sql
BEGIN;

-- Eliminar duplicados (mantiene el de created_at más antiguo)
WITH duplicados AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY escuela_id, nombre 
               ORDER BY created_at ASC
           ) as rn
    FROM grupos
)
DELETE FROM grupos
WHERE id IN (
    SELECT id FROM duplicados WHERE rn > 1
);

-- Verificar resultado
SELECT 'Duplicados restantes:' as verificacion, COUNT(*)::text as total
FROM (
    SELECT escuela_id, nombre
    FROM grupos
    GROUP BY escuela_id, nombre
    HAVING COUNT(*) > 1
) dup;
-- Debe retornar: 0

COMMIT;

SELECT '✓ Duplicados en GRUPOS eliminados exitosamente' as resultado;
```

**3. Opción 2: Renombrar duplicados agregando grado**

```sql
BEGIN;

-- Renombrar duplicados agregando sufijo del grado
UPDATE grupos
SET nombre = nombre || '_' || COALESCE(grado_nombre, 'G' || grado_numero::text)
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY escuela_id, nombre 
                   ORDER BY created_at
               ) as rn
        FROM grupos
    ) dup
    WHERE rn > 1
);

-- Verificar
SELECT 'Duplicados restantes:' as verificacion, COUNT(*)::text as total
FROM (
    SELECT escuela_id, nombre
    FROM grupos
    GROUP BY escuela_id, nombre
    HAVING COUNT(*) > 1
) dup;

COMMIT;

SELECT '✓ Duplicados en GRUPOS renombrados exitosamente' as resultado;
```

---

### Si hay duplicados en EVALUACIONES:

**1. Identificar duplicados:**

```sql
-- Ver duplicados con detalle
SELECT estudiante_id, materia_id, periodo_id, 
       COUNT(*) as total,
       STRING_AGG(id::text, ', ') as ids_duplicados,
       STRING_AGG(TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI'), ', ') as fechas
FROM evaluaciones
GROUP BY estudiante_id, materia_id, periodo_id
HAVING COUNT(*) > 1
ORDER BY total DESC
LIMIT 20;
```

**2. Opción 1: Mantener evaluación más reciente**

```sql
BEGIN;

-- Eliminar duplicados (mantiene el de updated_at más reciente)
WITH duplicados AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY estudiante_id, materia_id, periodo_id 
               ORDER BY updated_at DESC, created_at DESC
           ) as rn
    FROM evaluaciones
)
DELETE FROM evaluaciones
WHERE id IN (
    SELECT id FROM duplicados WHERE rn > 1
);

-- Verificar resultado
SELECT 'Duplicados restantes:' as verificacion, COUNT(*)::text as total
FROM (
    SELECT estudiante_id, materia_id, periodo_id
    FROM evaluaciones
    GROUP BY estudiante_id, materia_id, periodo_id
    HAVING COUNT(*) > 1
) dup;
-- Debe retornar: 0

COMMIT;

SELECT '✓ Duplicados en EVALUACIONES eliminados exitosamente' as resultado;
```

**3. Opción 2: Promediar valoraciones antes de eliminar**

```sql
BEGIN;

-- Crear tabla temporal con promedios
CREATE TEMP TABLE evaluaciones_promediadas AS
SELECT 
    estudiante_id,
    materia_id,
    periodo_id,
    ROUND(AVG(valoracion)::numeric, 2) as valoracion,
    MAX(updated_at) as updated_at,
    MIN(created_at) as created_at,
    STRING_AGG(DISTINCT observaciones, ' | ') as observaciones_combinadas
FROM evaluaciones
GROUP BY estudiante_id, materia_id, periodo_id
HAVING COUNT(*) > 1;

-- Eliminar duplicados originales
WITH duplicados AS (
    SELECT id
    FROM evaluaciones e
    WHERE EXISTS (
        SELECT 1 
        FROM evaluaciones_promediadas ep
        WHERE e.estudiante_id = ep.estudiante_id
        AND e.materia_id = ep.materia_id
        AND e.periodo_id = ep.periodo_id
    )
)
DELETE FROM evaluaciones
WHERE id IN (SELECT id FROM duplicados);

-- Insertar registros promediados
INSERT INTO evaluaciones (
    estudiante_id, materia_id, periodo_id, 
    valoracion, observaciones, created_at, updated_at
)
SELECT 
    estudiante_id, materia_id, periodo_id,
    valoracion, observaciones_combinadas, created_at, updated_at
FROM evaluaciones_promediadas;

-- Verificar
SELECT 'Duplicados restantes:' as verificacion, COUNT(*)::text as total
FROM (
    SELECT estudiante_id, materia_id, periodo_id
    FROM evaluaciones
    GROUP BY estudiante_id, materia_id, periodo_id
    HAVING COUNT(*) > 1
) dup;

COMMIT;

SELECT '✓ Duplicados en EVALUACIONES consolidados (promediados)' as resultado;
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
