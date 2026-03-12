# 📊 Comparación: DEV_VLP_EstructuraDeDatos vs QA

**Fecha de análisis:** 12 de marzo de 2026  
**Rama actual:** `DEV_VLP_EstructuraDeDatos`  
**Rama base:** `origin/qa`  
**Objetivo:** Identificar diferencias para integración con QA

---

## 🎯 RESUMEN EJECUTIVO

### Estado General

| Métrica | Valor |
|---------|-------|
| **Commits adelante de QA** | 32 commits |
| **Commits exclusivos en QA** | 1 commit |
| **Archivos nuevos en DEV_VLP** | 22 archivos |
| **Archivos modificados** | 3 archivos |
| **Total de cambios** | 25 archivos |
| **Líneas añadidas** | ~236,000+ líneas |
| **Líneas eliminadas** | ~100 líneas |

### Divergencia

```
      QA (origin/qa)
       |
       o  b6f03d4 - Políticas de desarrollo de software
       |
       | DEV_VLP_EstructuraDeDatos (HEAD)
       |/
       o  ed2a91e - (Common ancestor)
       |  |
       |  o  88db260 - 20260311_02
       |  o  e50d092 - 20260311_01
       |  o  70da7a0 - docs: add comprehensive merge report
       |  o  eeb6c1a - docs: add branch comparison documentation
       |  o  427ec41 - 2020
       |  o  ddff3e3 - 20260219_01
       |  ... (26 commits más)
```

**⚠️ IMPORTANTE:** Las ramas han divergido. QA tiene cambios que DEV_VLP no tiene, y viceversa.

---

## 📋 ANÁLISIS DETALLADO

### 1. Commits Exclusivos en DEV_VLP (32 commits)

#### Commits Recientes (más importantes)

| Hash | Fecha | Mensaje |
|------|-------|---------|
| 88db260 | 2026-03-11 | 20260311_02 |
| e50d092 | 2026-03-11 | 20260311_01 |
| 70da7a0 | 2026-03-11 | docs: add comprehensive merge report for pepenauta integration |
| eeb6c1a | 2026-03-11 | docs: add branch comparison documentation and update index |
| 427ec41 | 2026-02-20 | 2020 |
| ddff3e3 | 2026-02-19 | 20260219_01 |

#### Commits Históricos (26 adicionales)

- 71d5aec - 20260211_03
- 578cd15 - 20260211_01
- 9406cbc - 20260210_02
- cec9bad - 20260210
- 60c837a - VLP20260209
- e93b53d - Actualiza flujo RF-04 y niveles por asignatura
- a5d6fd4 - Unify EIA2 authentication criteria
- 1b1be41 - Actualizar variantes FRV y escala de valoracion
- fea1c4f - Clarify login unlock flow and null user attempts
- 53508b3 - Actualiza unicidad de grupos
- 9493f4d - Define period overlap rules and exception
- dab2890 - Actualizar mensajes de email en API
- 1845da3 - Actualizar volumetria por grupo
- c39cbad - Refine integration level rules for evaluations
- 46d8489 - Actualizar reglas de credenciales EIA2
- 0ca7fb3 - Actualizar reglas de integridad para usuarios y CCT
- 67ec41c - Actualizar unicidad de CCT por turno
- 25fd6ee - 20260122_1906
- ... y 8 commits más

### 2. Commits Exclusivos en QA (1 commit)

| Hash | Fecha | Mensaje | Archivos Afectados |
|------|-------|---------|-------------------|
| b6f03d4 | 2026-03-05 | Políticas de desarrollo de software | +1 nuevo: `politicas_desarrollo_software.md` (559 líneas)<br>-2 eliminados: Informes de arquitectura y criterios técnicos |

**⚠️ CONFLICTO POTENCIAL:** Este commit elimina 2 archivos de documentación que podrían existir en otras ramas.

---

## 📂 ARCHIVOS MODIFICADOS

### Archivos Nuevos en DEV_VLP (22 archivos)

#### 📖 Documentación Técnica (9 archivos)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `ANALISIS_CONSISTENCIA_BD_VS_DOCS.md` | ~656 | Análisis detallado de inconsistencias entre BD y documentación |
| `BITACORA_CAMBIOS_BRANCH.md` | ~39 | Registro de cambios en la rama |
| `COMANDOS_GIT_COMPARACION.md` | ~382 | Comandos Git utilizados para comparaciones |
| `COMPARACION_BRANCHES_DEV_VLP_VS_PEPENAUTA.md` | ~685 | Comparación con rama pepenauta |
| `GUIA_EJECUCION_MIGRACION.md` | ~488 | Guía general de migraciones |
| `GUIA_EJECUCION_MIGRACION_NIA.md` | ~1,126 | **Guía detallada para migración del modelo NIA** |
| `MERGE_REPORT_20260311.md` | ~462 | Reporte de merge del 11 de marzo |
| `RESUMEN_VISUAL_COMPARACION.md` | ~254 | Resumen visual de comparaciones |

#### 💾 Scripts de Migración de Base de Datos (5 archivos)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `migration_implementar_modelo_nia.sql` | ~989 | **CRÍTICO:** Implementación del modelo NIA (Niveles de Integración del Aprendizaje) |
| `migration_agregar_archivos_tickets.sql` | ~261 | Agregar soporte de archivos a tickets |
| `migration_agregar_direccion_escuelas.sql` | ~158 | Agregar campos de dirección a escuelas |
| `migration_consolidacion_catalogos.sql` | ~198 | Consolidación de catálogos |
| `migration_consolidacion_niveles.sql` | ~315 | Consolidación de niveles educativos |

#### 🗄️ Scripts de Base de Datos (8 archivos)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `scripts/import/01_create_staging_escuelas.sql` | ~33 | Crear tabla staging para escuelas |
| `scripts/import/02_transform_upsert_escuelas_from_staging.sql` | ~71 | Transformar e insertar escuelas desde staging |
| `scripts/import_escuelas_from_csv.sql` | ~109 | Importación completa de escuelas desde CSV |
| `scripts/import_escuelas_from_csv_sample50.sql` | ~107 | Importación de muestra de 50 escuelas |
| `scripts/migrations/2026-02-11_alter_escuelas_add_address.sql` | ~19 | Migración: agregar dirección a escuelas |
| `scripts/migrations/2026-02-11_alter_escuelas_unique_cct_turno.sql` | ~30 | Migración: unicidad CCT por turno |
| `scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql` | ~48 | Crear tabla de preguntas frecuentes |
| `scripts/seeds/2026-02-26_seed_preguntas_frecuentes.sql` | ~31 | Seed de preguntas frecuentes |

#### 📊 Datos (1 archivo - MUY GRANDE)

| Archivo | Líneas | Tamaño Estimado | Descripción |
|---------|--------|----------------|-------------|
| `data/ESCUELAS_VLP.csv` | ~232,369 | ~20-50 MB | **Base de datos completa de escuelas de México** |

---

### Archivos Modificados (3 archivos)

| Archivo | Cambios | Descripción |
|---------|---------|-------------|
| `ddl_generated.sql` | +38/-0 | Actualización del DDL generado (posiblemente incluye tablas NIA) |
| `ESTRUCTURA_DE_DATOS.md` | +73/-0 | Actualización de documentación de estructura de datos |
| `INDICE_DOCUMENTACION.md` | +33/-0 | Actualización del índice de documentación |

---

## 🔍 ANÁLISIS POR CATEGORÍAS

### Cambios Críticos en Base de Datos

#### 1. Modelo NIA (Niveles de Integración del Aprendizaje)

**Archivos involucrados:**
- `migration_implementar_modelo_nia.sql` (989 líneas)
- `GUIA_EJECUCION_MIGRACION_NIA.md` (1,126 líneas)
- `ANALISIS_CONSISTENCIA_BD_VS_DOCS.md` (656 líneas)

**Cambios estructurales:**
- ✅ Creación de 3 nuevas tablas:
  - `cat_campos_formativos` (5 registros)
  - `cat_niveles_integracion` (4 registros: ED, EP, ES, SO)
  - `niveles_integracion_estudiante` (tabla transaccional)
- ⚠️ Eliminación de 2 campos deprecados en tabla `evaluaciones`:
  - `nivel_integracion` (VARCHAR)
  - `competencia_alcanzada` (BOOLEAN)
- ✅ Corrección de constraints UNIQUE:
  - `grupos`: UNIQUE(escuela_id, nombre) - sin grado_id
  - `evaluaciones`: UNIQUE(estudiante_id, materia_id, periodo_id) - sin solicitud_id
- ✅ Backup automático de datos históricos en `backup_evaluaciones_nia_historico`

**⚠️ IMPACTO:** Este cambio es **estructural crítico** y afectará:
- Modelos/Entities de TypeORM
- Schemas GraphQL
- Consultas existentes
- Lógica de negocio relacionada con evaluaciones

#### 2. Escuelas y Direcciones

**Archivos:**
- `migration_agregar_direccion_escuelas.sql`
- `scripts/migrations/2026-02-11_alter_escuelas_add_address.sql`
- `data/ESCUELAS_VLP.csv` (232,369 líneas)
- Scripts de importación

**Cambios:**
- Agregar campos de dirección a tabla `escuelas`
- Importación masiva de ~232,000 escuelas desde CSV
- Unicidad de CCT por turno

#### 3. Consolidación de Catálogos

**Archivos:**
- `migration_consolidacion_catalogos.sql`
- `migration_consolidacion_niveles.sql`

**Cambios:**
- Consolidación de catálogos diversos
- Estandarización de niveles educativos

#### 4. Tickets y Preguntas Frecuentes

**Archivos:**
- `migration_agregar_archivos_tickets.sql`
- `scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql`
- `scripts/seeds/2026-02-26_seed_preguntas_frecuentes.sql`

**Cambios:**
- Soporte de archivos adjuntos en tickets
- Nueva tabla de preguntas frecuentes (FAQ)

---

## ⚠️ RIESGOS Y CONFLICTOS POTENCIALES

### 1. Conflicto de Documentación

**Archivo en QA (eliminados):**
- `INFORME_MENSUAL_ARQUITECTURA_DIC_ENE_2025_2026.md`
- `CRITERIOS_TECNICOS_FRONTEND_DIC_ENE_2025_2026.md`

**Archivo nuevo en QA:**
- `politicas_desarrollo_software.md` (559 líneas)

**Riesgo:** Si estos archivos existen en DEV_VLP, habrá conflictos al mergear.

**Recomendación:** Verificar existencia de estos archivos antes del merge.

### 2. Divergencia de Base de Datos

**Problema:** Si QA tiene su propia instancia de BD, podría tener un esquema diferente.

**Preguntas críticas:**
- ¿QA tiene las 60 tablas actuales?
- ¿QA ya ejecutó alguna migración de las que están en DEV_VLP?
- ¿QA tiene datos de producción o datos de prueba?

**Recomendación:** **Comparar el esquema de BD de QA con el de DEV_VLP antes de mergear.**

### 3. Script de Migración NIA

**Riesgo CRÍTICO:** El script `migration_implementar_modelo_nia.sql` realiza cambios destructivos:
- Elimina 2 columnas de `evaluaciones`
- Cambia constraints UNIQUE
- Crea backup pero los datos antiguos quedan inaccesibles tras la migración

**Recomendación:** 
- ✅ **NO ejecutar este script en QA sin antes:**
  1. Hacer backup completo de la BD de QA
  2. Probar en ambiente de desarrollo
  3. Verificar que el código de aplicación en QA es compatible
  4. Coordinar con el equipo de QA

### 4. Archivo CSV Grande

**Archivo:** `data/ESCUELAS_VLP.csv` (232,369 líneas)

**Riesgos:**
- Tamaño del repositorio aumentará significativamente
- Pull/clone serán más lentos
- Podría exceder límites de GitHub si es muy grande

**Recomendación:** Verificar si Git LFS está configurado para archivos CSV grandes.

---

## 📋 ESTRATEGIA DE INTEGRACIÓN

### Opción 1: Merge DEV_VLP → QA (Recomendado)

**Proceso:**

1. **Preparación (2-3 horas):**
   ```bash
   # Crear rama de trabajo
   git checkout -b integration/dev-vlp-to-qa
   
   # Traer cambios más recientes de QA
   git fetch origin qa
   git merge origin/qa
   
   # Resolver conflictos manualmente
   # (Principalmente en documentación)
   ```

2. **Revisión de Conflictos:**
   - Verificar si existen los archivos que QA eliminó
   - Decidir qué hacer con `politicas_desarrollo_software.md`
   - Verificar que el índice de documentación incluya todos los archivos

3. **Validación de Base de Datos:**
   - Comparar esquema de BD de QA con DDL en DEV_VLP
   - Revisar si QA ya tiene las 60 tablas
   - **NO ejecutar migraciones aún**

4. **Merge a QA:**
   ```bash
   # Después de resolver conflictos y validar
   git checkout qa
   git merge integration/dev-vlp-to-qa
   git push origin qa
   ```

5. **Aplicar Migraciones en QA (con cuidado):**
   - Ejecutar migraciones en este orden:
     1. `migration_agregar_direccion_escuelas.sql`
     2. `migration_consolidacion_catalogos.sql`
     3. `migration_consolidacion_niveles.sql`
     4. `migration_agregar_archivos_tickets.sql`
     5. Importar escuelas (`scripts/import_escuelas_from_csv.sql`)
     6. Crear preguntas frecuentes (`scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql`)
     7. **ÚLTIMO:** `migration_implementar_modelo_nia.sql` ⚠️

### Opción 2: Rebase DEV_VLP sobre QA

**Ventaja:** Historia lineal, más limpia.

**Desventaja:** Reescribe historia (requiere force push).

**Proceso:**
```bash
git checkout DEV_VLP_EstructuraDeDatos
git rebase origin/qa

# Resolver conflictos commit por commit
# (puede ser tedioso con 32 commits)

git push --force-with-lease origin DEV_VLP_EstructuraDeDatos
```

**⚠️ Solo usar si DEV_VLP no está compartida con otros desarrolladores.**

### Opción 3: Cherry-pick Selectivo

Si solo quieres ciertos cambios en QA:

```bash
git checkout qa
git cherry-pick <commit-hash>  # Repetir para cada commit deseado
```

**Ventaja:** Control granular.  
**Desventaja:** Tedioso con 32 commits.

---

## 🎯 CHECKLIST PRE-MERGE

### Base de Datos

- [ ] Comparar esquema de BD de QA vs DEV_VLP con este comando:
  ```bash
  # Desde pgAdmin, exportar esquema de QA y comparar con ddl_generated.sql
  ```
- [ ] Verificar que QA tiene backup completo y reciente
- [ ] Revisar si QA ya ejecutó alguna de las migraciones
- [ ] Identificar tablas en QA que no están en DEV_VLP (y viceversa)
- [ ] Validar constraints actuales en QA

### Código de Aplicación

- [ ] Verificar compatibilidad del código en QA con modelo NIA
- [ ] Revisar si TypeORM entities en QA tienen los campos `nivel_integracion` y `competencia_alcanzada`
- [ ] Verificar que GraphQL schemas están sincronizados
- [ ] Ejecutar tests en QA antes del merge

### Documentación

- [ ] Verificar existencia de archivos que QA eliminó:
  - `INFORME_MENSUAL_ARQUITECTURA_DIC_ENE_2025_2026.md`
  - `CRITERIOS_TECNICOS_FRONTEND_DIC_ENE_2025_2026.md`
- [ ] Decidir qué hacer con `politicas_desarrollo_software.md` (mantener, fusionar, o eliminar)
- [ ] Actualizar índice de documentación con nuevos archivos

### Git

- [ ] Crear rama de respaldo de DEV_VLP actual:
  ```bash
  git tag backup-dev-vlp-pre-qa-merge-20260312
  git push origin backup-dev-vlp-pre-qa-merge-20260312
  ```
- [ ] Notificar al equipo del merge planeado
- [ ] Coordinar ventana de tiempo para el merge (en QA puede ser crítico)

---

## 📊 IMPACTO ESTIMADO

### Por Componente

| Componente | Impacto | Nivel de Riesgo | Tiempo Estimado |
|------------|---------|----------------|-----------------|
| **Base de Datos** | 🔴 Alto | Alto | 4-6 horas (con migraciones) |
| **Backend/API** | 🟡 Medio | Medio | 2-3 horas (ajustes de código) |
| **Frontend** | 🟢 Bajo | Bajo | 1 hora (si GraphQL cambia) |
| **Documentación** | 🟡 Medio | Bajo | 1 hora (resolver conflictos) |
| **CI/CD** | 🟢 Bajo | Bajo | 30 min (validar pipelines) |

### Timeline Sugerido

**Fase 1: Preparación (Día 1)**
- Análisis de esquema de BD de QA
- Backup completo de QA
- Resolución de conflictos en documentación

**Fase 2: Merge de Código (Día 2)**
- Merge de rama
- Validación de tests
- Deploy a ambiente de QA

**Fase 3: Migraciones de BD (Día 3)**
- Ejecutar migraciones no-NIA
- Validar integridad de datos
- Ejecutar migración NIA (última)

**Fase 4: Validación (Día 4)**
- Tests end-to-end
- Validación con equipo de QA
- Rollback si es necesario

---

## 🔄 COMANDOS ÚTILES

### Comparación Detallada

```bash
# Ver diferencias en un archivo específico
git diff origin/qa...HEAD -- ddl_generated.sql

# Ver commits con detalles
git log origin/qa..HEAD --oneline --graph --decorate

# Ver archivos que cambiaron en un commit específico
git show <commit-hash> --stat

# Ver diferencias línea por línea
git diff origin/qa...HEAD
```

### Merge

```bash
# Merge con estrategia de resolución
git merge origin/qa --strategy=ort --strategy-option=patience

# Abortar merge si hay problemas
git merge --abort

# Ver estado del merge
git status
```

### Verificación de Esquema de BD

```sql
-- Ejecutar en pgAdmin de QA

-- Listar todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar si existen campos específicos
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'evaluaciones' 
  AND column_name IN ('nivel_integracion', 'competencia_alcanzada');

-- Listar constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'grupos'::regclass OR conrelid = 'evaluaciones'::regclass;
```

---

## 📞 RECOMENDACIONES FINALES

### 🚨 CRÍTICAS

1. **NO ejecutar migration_implementar_modelo_nia.sql en QA sin coordinación**
   - Es un cambio estructural destructivo
   - Requiere actualización simultánea del código de aplicación
   - Debe hacerse en ventana de mantenimiento

2. **Hacer backup completo de BD de QA antes de ANY migración**
   ```sql
   -- Desde pgAdmin:
   -- Click derecho en base de datos → Backup...
   -- Format: Custom
   -- Filename: sep_diagnostica_qa_backup_20260312.backup
   ```

3. **Verificar esquema de BD de QA antes del merge**
   - Exportar DDL de QA
   - Comparar con `ddl_generated.sql` de DEV_VLP
   - Identificar diferencias

### 🟡 IMPORTANTES

4. **Considerar Git LFS para el archivo CSV grande**
   - 232,369 líneas pueden ser problemáticas

5. **Actualizar tests para modelo NIA**
   - Tests unitarios
   - Tests de integración
   - Tests end-to-end

6. **Documentar decisiones sobre archivos de documentación**
   - Decidir qué hacer con archivos eliminados por QA
   - Incorporar `politicas_desarrollo_software.md` si es relevante

### 🟢 OPCIONALES

7. **Crear ambiente de staging para pruebas**
   - Clonar QA a un ambiente de prueba
   - Ejecutar merge y migraciones allí primero

8. **Automatizar validaciones pre-merge**
   - Script que compare esquemas de BD
   - Validación de integridad de datos

9. **Establecer política de ramas**
   - Definir flujo de trabajo: feature → dev → qa → main
   - Documentar en `politicas_desarrollo_software.md`

---

## 📚 ARCHIVOS DE REFERENCIA

- `ANALISIS_CONSISTENCIA_BD_VS_DOCS.md` - Análisis técnico de inconsistencias
- `GUIA_EJECUCION_MIGRACION_NIA.md` - Guía paso a paso para migración NIA
- `ddl_generated.sql` - DDL actualizado con 60 tablas
- `ESTRUCTURA_DE_DATOS.md` - Documentación de estructura de datos
- `INDICE_DOCUMENTACION.md` - Índice de toda la documentación

---

**Fin del Análisis**  
**Autor:** GitHub Copilot  
**Fecha:** 12 de marzo de 2026  
**Versión:** 1.0
