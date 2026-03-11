# 📊 Comparación de Branches: DEV_VLP_EstructuraDeDatos vs task/pepenautamx-001-correo-electronico

**Fecha de Análisis:** 11 de marzo de 2026  
**Branch Actual:** DEV_VLP_EstructuraDeDatos  
**Branch Comparado:** task/pepenautamx-001-correo-electronico  
**Repositorio:** dleonsystem/sep_evaluacion_diagnostica

---

## 🎯 Resumen Ejecutivo

El branch **DEV_VLP_EstructuraDeDatos** contiene principalmente **trabajo de reestructuración de base de datos y documentación**, eliminando funcionalidades de correo electrónico, SFTP y servicios auxiliares que están presentes en el branch **task/pepenautamx-001-correo-electronico**.

### Estadísticas Generales
- **Archivos modificados:** 149 archivos
- **Líneas añadidas:** +237,252 líneas
- **Líneas eliminadas:** -32,172 líneas
- **Archivos eliminados:** 62 archivos
- **Archivos añadidos:** 24 archivos nuevos

---

## 📁 1. CAMBIOS EN BASE DE DATOS Y ESTRUCTURA

### 1.1 Nuevas Tablas y Catálogos (DEV_VLP)

#### ✅ CAT_ESTADO_ARCHIVO_TICKET
- **Nueva tabla catálogo** para estados de archivos adjuntos a tickets
- Estados: ACTIVO, ELIMINADO, CORRUPTO, EN_CUARENTENA
- Tipo: SMALLINT IDENTITY con patrón ENUM mirror

#### ✅ ARCHIVOS_TICKETS
- **Nueva tabla** para almacenar metadata de archivos adjuntos en tickets
- Campos: id, numero_ticket, nombre_archivo, tamanio, extension, ruta, estado
- Relación: 1:N con TICKETS_SOPORTE
- Constraint: FK con ON DELETE CASCADE
- Validaciones: tamanio > 0, extension alfanumérica

### 1.2 Consolidación de Catálogos

#### 🔄 CAT_NIVELES_EDUCATIVOS → CAT_NIVEL_EDUCATIVO
- **Eliminado:** `cat_niveles_educativos` (INT PRIMARY KEY)
- **Consolidado en:** `cat_nivel_educativo` (SMALLINT IDENTITY)
- Migración: `migration_consolidacion_niveles.sql`
- Códigos: PREESCOLAR, PRIMARIA, SECUNDARIA, TELESECUNDARIA
- Patrón: ENUM mirror con gestión de códigos canónicos

### 1.3 Modificaciones en Tabla ESCUELAS

#### 📍 Nuevos Campos de Dirección
Añadidos 8 campos para dirección completa:
- `municipio` VARCHAR(100)
- `localidad` VARCHAR(100)
- `calle` VARCHAR(100)
- `num_exterior` VARCHAR(20)
- `entre_la_calle` VARCHAR(100)
- `y_la_calle` VARCHAR(100)
- `calle_posterior` VARCHAR(100)
- `colonia` VARCHAR(100)

**Migración:** `migration_agregar_direccion_escuelas.sql`

#### 🔗 Cambio de Relación
- **Antes:** `id_nivel INT REFERENCES cat_niveles_educativos(id_nivel)`
- **Ahora:** `id_nivel SMALLINT REFERENCES cat_nivel_educativo(id)`

### 1.4 Modificaciones en Tabla GRUPOS

#### 🔑 Cambio en Constraint UNIQUE
- **Antes:** `UNIQUE (escuela_id, grado_id, nombre)`
- **Ahora:** `UNIQUE (escuela_id, nombre)`
- **Índice actualizado:** `idx_grupos_escuela_nombre` (UNIQUE)

**Razón:** Permitir mayor flexibilidad en la creación de grupos

### 1.5 Cambios en SOLICITUDES_EIA2

#### ❌ Campos Eliminados
- `hash_archivo` VARCHAR(64)
- `usuario_id` UUID REFERENCES usuarios(id)
- `resultados` JSONB DEFAULT '[]'::JSONB

**Impacto:** Simplifica la tabla eliminando redundancias

### 1.6 Cambios en EVALUACIONES

#### 🔄 Constraint Simplificado
- **Antes:** `CONSTRAINT uq_evaluaciones_solicitud UNIQUE (estudiante_id, materia_id, periodo_id, solicitud_id)`
- **Ahora:** `CONSTRAINT uq_evaluaciones UNIQUE (estudiante_id, materia_id, periodo_id)`
- **Campo eliminado de constraint:** `solicitud_id`

### 1.7 Archivos de Migración Nuevos

4 scripts de migración creados en DEV_VLP:
1. ✅ `migration_consolidacion_niveles.sql` (315 líneas)
2. ✅ `migration_consolidacion_catalogos.sql` (198 líneas)
3. ✅ `migration_agregar_direccion_escuelas.sql` (158 líneas)
4. ✅ `migration_agregar_archivos_tickets.sql` (261 líneas)

### 1.8 Scripts de Importación

Nuevos scripts en `scripts/`:
- `import_escuelas_from_csv.sql` (109 líneas)
- `import_escuelas_from_csv_sample50.sql` (107 líneas)
- `import/01_create_staging_escuelas.sql` (33 líneas)
- `import/02_transform_upsert_escuelas_from_staging.sql` (71 líneas)

### 1.9 Scripts de Seeds

- `scripts/migrations/2026-02-26_create_preguntas_frecuentes.sql` (48 líneas)
- `scripts/seeds/2026-02-26_seed_preguntas_frecuentes.sql` (31 líneas)

---

## 🖥️ 2. CAMBIOS EN GRAPHQL SERVER

### 2.1 Servicios Eliminados en DEV_VLP

#### ❌ mailing.service.ts
- **Eliminado completamente** del branch DEV_VLP
- **Presente en:** task/pepenautamx-001-correo-electronico
- **Funcionalidad:** Envío de correos con Nodemailer
  - Recuperación de contraseñas
  - Notificaciones del sistema
  - Configuración SMTP

#### ❌ sftp.service.ts
- **Eliminado completamente**
- Funcionalidad de transferencia segura de archivos

#### ❌ data-loaders.ts
- **Eliminado** del directorio utils
- Optimizaciones para consultas GraphQL con DataLoader

#### ❌ worker-excel.ts
- **Eliminado** del directorio workers
- Procesamiento asíncrono de archivos Excel

### 2.2 Archivos de Configuración Eliminados

- ❌ `swagger.def.js` - Definición de documentación Swagger
- ❌ `admin-test.json`
- ❌ `cols.json`
- ❌ `graphql-res.json`
- ❌ `roles.json`
- ❌ `tables.json`
- ❌ `users.json`

### 2.3 Scripts Eliminados del Servidor

**Eliminados de `graphql-server/scripts/`:**
- ❌ `add_resultados_solicitudes.sql`
- ❌ `add_soft_delete_tickets.sql`
- ❌ `add_ticket_evidencias.sql`
- ❌ `add_usuario_id_solicitudes.sql`
- ❌ `crear_usuario_admin.sql`
- ❌ `create-admin.js`
- ❌ `fix_duplicate_uploads.sql`
- ❌ `fix_grupos_constraint.sql`
- ❌ `fix_grupos_index.sql`
- ❌ `generate-admin-sql.js`
- ❌ `insert_admin_pgadmin.sql`
- ❌ `migrate_email_length.sql`
- ❌ `peek-catalogs.cjs` / `peek-catalogs.ts`
- ❌ `run_migration.js`
- ❌ `seed-catalogs.cjs`
- ❌ `test-sftp-dist.js` / `test-sftp.ts`
- ❌ `verify-upload.cjs`

### 2.4 Archivos de Test Eliminados

- ❌ `temp-db-check.cjs` / `temp-db-check.js`
- ❌ `test-db.js`
- ❌ `test-gql.js`
- ❌ `test-graphql.js`
- ❌ `test-login.js`
- ❌ `test-metrics.js`

### 2.5 Modificaciones en Archivos Core

#### 📝 Modificados:
- **database.ts** - Configuración de base de datos
- **index.ts** - Punto de entrada del servidor (151 cambios)
- **resolvers.ts** - Resolvers GraphQL (1,364 cambios)
- **typeDefs.ts** - Definiciones de tipos GraphQL (282 cambios)

### 2.6 Cambios en Configuración

#### .eslintrc y .prettierrc
- **Renombrados:** `.cjs` → `.js`
- Simplificación de configuración de linting

#### package.json
- **33 cambios** en dependencias
- Posible eliminación de paquetes relacionados con:
  - Nodemailer (correo electrónico)
  - SFTP/SSH2
  - Workers

---

## 🎨 3. CAMBIOS EN FRONTEND (Angular)

### 3.1 Componentes Añadidos

#### ✅ admin-login
**Nuevo componente** para login de administradores:
- `admin-login.component.html` (71 líneas)
- `admin-login.component.scss` (180 líneas)
- `admin-login.component.ts` (56 líneas)

### 3.2 Componentes Eliminados

#### ❌ archivos-evaluacion
- Eliminado completamente
- Reemplazado por `archivos-guardados`

#### ❌ dashboard
- `dashboard.component.html` (150 líneas eliminadas)
- `dashboard.component.scss` (474 líneas eliminadas)
- `dashboard.component.ts` (43 líneas eliminadas)

#### ❌ preguntas-frecuentes
- Componente completo eliminado
- 4 archivos (HTML, SCSS, TS, SPEC)

#### ❌ recuperar-password
- Componente completo eliminado
- Funcionalidad de recuperación de contraseña removida

### 3.3 Componentes Renombrados/Reemplazados

#### 🔄 archivos-evaluacion → archivos-guardados
- **Renombrado con cambios sustanciales:**
  - `archivos-guardados.component.html` (155 líneas)
  - `archivos-guardados.component.scss` (128 cambios)
  - `archivos-guardados.component.spec.ts` (57 líneas)
  - `archivos-guardados.component.ts` (308 líneas)

### 3.4 Componentes Modificados

#### 📝 admin-panel
- **HTML:** 546 cambios
- **SCSS:** 888 cambios
- **TypeScript:** 584 cambios
- **Impacto:** Refactorización completa del panel administrativo

#### 📝 carga-masiva
- **HTML:** 183 cambios
- **TypeScript:** 324 cambios
- **SCSS:** 76 líneas eliminadas
- **Impacto:** Simplificación y mejoras en carga de archivos

#### 📝 inicio
- **HTML:** 65 cambios
- **SCSS:** 573 cambios
- **TypeScript:** 52 cambios
- **Impacto:** Rediseño de página de inicio

#### 📝 login
- **HTML:** 68 cambios
- **SCSS:** 37 cambios
- **TypeScript:** 33 cambios

#### 📝 tickets-historial
- **HTML:** 36 cambios
- **SCSS:** 78 cambios
- **TypeScript:** 68 cambios

#### 📝 tickets
- **HTML:** 51 cambios
- **TypeScript:** 211 cambios

### 3.5 Servicios Modificados

#### 📝 Servicios con Cambios:
- `admin-auth.service.ts` (55 cambios)
- `archivo-storage.service.ts` (271 cambios) - **Mayor impacto**
- `auth.service.ts` (54 cambios)
- `excel-validation.service.ts` (27 cambios)
- `graphql.service.ts` (27 cambios)
- `usuarios.service.ts` (83 cambios)

#### ❌ Servicios Eliminados:
- `dashboard.service.ts` (38 líneas)
- `evaluaciones.service.ts` (130 líneas)
- `session-timer.service.ts` (113 líneas)
- `tickets.service.ts` (131 líneas)

### 3.6 Guards Eliminados

- ❌ `admin.guard.ts` (20 líneas)
- ❌ `login.guard.ts` (27 líneas)

### 3.7 Operaciones GraphQL Eliminadas

- ❌ `operations/mutation.ts` (31 líneas)
- ❌ `operations/query.ts` (70 líneas)

**Impacto:** Posible refactorización hacia inline queries o cambio de patrón

### 3.8 Cambios en Navegación y UI

- **nav.component.html:** 90 cambios
- **nav.component.ts:** 16 cambios
- **styles.scss:** 296 cambios (estilos globales)
- **index.html:** 10 cambios

### 3.9 Configuración de Angular

- **angular.json:** 8 cambios
- **app.component.ts:** 13 cambios
- **app.routes.ts:** 50 cambios (rutas modificadas sustancialmente)

---

## 📚 4. CAMBIOS EN DOCUMENTACIÓN

### 4.1 Documentos Añadidos en DEV_VLP

#### ✅ Nuevos Documentos:
1. **BITACORA_CAMBIOS_BRANCH.md** (39 líneas)
   - Registro de cambios del branch
   
2. **GUIA_EJECUCION_MIGRACION.md** (488 líneas)
   - Guía completa de ejecución de migraciones
   - Incluye procedimientos y verificaciones

### 4.2 Documentos Eliminados en DEV_VLP

#### ❌ Planes de Proyecto:
- `Plan_Ejecucion_Fase1.md` (111 líneas)
- `Plan_Estabilizacion_Tecnica.md` (128 líneas)

#### ❌ Reportes:
- `REPORTE_CALIDAD_SPRINT_1.md` (38 líneas)

#### ❌ Análisis:
- `ANALISIS_FRONTEND_FALTANTE_VS_PAGINAS_EIA.md` (110 líneas)
- `AVANCES_APIS_CONECTADAS_DB.md` (104 líneas)

#### ❌ Bitácora:
- `BITACORA_CAMBIOS_DB.md` (26 líneas)

#### ❌ Documentación PSP:
- `docs/DEFECT_LOG.md`
- `docs/DEVELOPMENT_GUIDE_PSP_SCRUM.md`
- `docs/KANBAN_BOARD.md`
- `docs/PSP_METRICS_TEMPLATE.md`

### 4.3 Documentos Modificados

- **ESTRUCTURA_DE_DATOS.md:** 73 cambios
  - Actualización de catálogos consolidados
  - Documentación de nuevas tablas (ARCHIVOS_TICKETS)
  - Actualización de campos de dirección en ESCUELAS

---

## ⚙️ 5. CAMBIOS EN INFRAESTRUCTURA Y CONFIGURACIÓN

### 5.1 Archivos de CI/CD Eliminados

- ❌ `.github/workflows/ci.yml` (59 líneas)
- ❌ `.husky/pre-commit.disabled`

**Impacto:** Eliminación de integración continua y pre-commit hooks

### 5.2 Docker

- ❌ `docker-compose.yml` eliminado (13 líneas)

**Impacto:** Posible cambio en estrategia de containerización

### 5.3 Configuración de Workspace

#### Carpeta `web/` simplificada:
- ❌ Eliminados archivos de configuración raíz de `web/`:
  - `.editorconfig`
  - `.gitignore`
  - `.vscode/` (completo)
  - `angular.json`
  - `package.json` / `package-lock.json`
  - `tsconfig.*.json`
  - `README.md`

**Impacto:** Consolidación hacia `web/frontend/` como única estructura Angular

### 5.4 Archivos package.json

- ❌ `package-lock.json` (raíz) eliminado (7,138 líneas)
- ❌ `web/package-lock.json` eliminado (14,841 líneas)
- **Modificados:**
  - `package.json` (raíz): 37 cambios
  - `graphql-server/package.json`: 33 cambios

### 5.5 .gitignore

- **Modificado:** 7 cambios en reglas de exclusión

---

## 📊 6. DATOS Y ASSETS

### 6.1 Nuevos Archivos de Datos

#### ✅ data/ESCUELAS_VLP.csv
- **Tamaño:** +232,369 líneas
- **Contenido:** Listado de escuelas para importación
- **Propósito:** Testing de migración de direcciones

### 6.2 Assets Eliminados

- ❌ `web/public/favicon.ico` (15,086 bytes)

---

## 🔍 7. ANÁLISIS DE DIVERGENCIA

### 7.1 Funcionalidades Presentes SOLO en task/pepenautamx-001-correo-electronico

#### ✅ Sistema de Correo Electrónico
- Servicio `mailing.service.ts` con Nodemailer
- Recuperación de contraseñas por email
- Notificaciones por correo
- Componente `recuperar-password`

#### ✅ SFTP
- Servicio `sftp.service.ts`
- Scripts de prueba de SFTP

#### ✅ Dashboard Completo
- Componente dashboard con métricas
- Servicio `dashboard.service.ts`

#### ✅ Preguntas Frecuentes
- Componente completo de FAQ

#### ✅ Sistema de Evaluaciones Completo
- Servicio `evaluaciones.service.ts`

#### ✅ CI/CD y Quality Assurance
- Workflow CI/CD
- Pre-commit hooks
- Documentación PSP/SCRUM
- Métricas de calidad

### 7.2 Funcionalidades Presentes SOLO en DEV_VLP_EstructuraDeDatos

#### ✅ Gestión de Archivos de Tickets
- Tabla `ARCHIVOS_TICKETS`
- Catálogo `CAT_ESTADO_ARCHIVO_TICKET`
- Migración completa

#### ✅ Direcciones Completas de Escuelas
- 8 campos nuevos de dirección
- Script de importación desde CSV
- Migración con 50 escuelas de ejemplo

#### ✅ Consolidación de Catálogos
- `CAT_NIVEL_EDUCATIVO` con patrón ENUM mirror
- Eliminación de duplicados
- Función helper `fn_catalogo_id()`

#### ✅ Componente de Admin Login Separado
- Login administrativo independiente

#### ✅ Documentación de Migraciones
- `GUIA_EJECUCION_MIGRACION.md` detallada
- Bitácora de cambios del branch

---

## 📈 8. COMMITS Y TIMELINE

### 8.1 Commits Únicos en DEV_VLP_EstructuraDeDatos

**Total:** ~40 commits desde la divergencia

**Commits Destacados:**
- `5790168` - Merge más reciente (HEAD)
- `427ec41` - 20260219_01
- `ddff3e3` - 20260219_01
- `71d5aec` - 20260211_03
- `578cd15` - 20260211_01
- `9406cbc` - 20260210_02
- `cec9bad` - 20260210
- `60c837a` - VLP20260209

### 8.2 Commits Únicos en task/pepenautamx-001-correo-electronico

**Total:** ~30 commits desde la divergencia

**Commits Destacados:**
- `b3ee19a` - Delete roles_output.txt (HEAD del branch)
- `690d427` - Delete psql_output.txt
- `d2506fa` - Crear usuario nuevo
- `c6b3e9c` - **Configuración de Correo electrónico** ⭐
- `78fbd22` - Quitando entregables febrero
- `67f808e` - Respuesta de tickets y resultados
- `3126978` - login correcto
- `ad59618` - Implementación de persistencia centralizada
- `5c4e504` - feat: implement mock login, administrative roles
- `0f499f6` - feat: implement sprint 1 remediation

---

## ⚠️ 9. CONFLICTOS POTENCIALES Y CONSIDERACIONES

### 9.1 Alto Riesgo de Conflictos

#### 🔴 ESTRUCTURA_DE_DATOS.md
- Ambos branches tienen cambios significativos
- Merge manual requerido

#### 🔴 ddl_generated.sql
- Cambios estructurales importantes en ambos
- Require revisión cuidadosa de constraints

#### 🔴 graphql-server/src/schema/resolvers.ts
- 1,364 cambios en DEV_VLP
- Probables conflictos con funcionalidad de correo

#### 🔴 graphql-server/src/schema/typeDefs.ts
- 282 cambios en DEV_VLP
- Tipos GraphQL modificados

### 9.2 Funcionalidades Incompatibles

#### ⚠️ Servicios Eliminados vs Usados
- `mailing.service.ts` eliminado en DEV_VLP, usado en pepenauta
- `sftp.service.ts` eliminado en DEV_VLP
- **Pregunta:** ¿Se deben recuperar o sustituir?

#### ⚠️ Componentes de UI
- `dashboard` eliminado en DEV_VLP
- `recuperar-password` eliminado en DEV_VLP
- `preguntas-frecuentes` eliminado en DEV_VLP
- **Pregunta:** ¿Son requeridos para funcionalidad de correo?

### 9.3 Cambios en Base de Datos

#### ⚠️ Tabla SOLICITUDES_EIA2
- Campos `usuario_id`, `hash_archivo`, `resultados` eliminados en DEV_VLP
- **Impacto:** Posible incompatibilidad con funcionalidad de correo

#### ⚠️ Tabla EVALUACIONES
- Constraint modificado (eliminado `solicitud_id`)
- **Impacto:** Cambio en lógica de negocio

---

## 🎯 10. RECOMENDACIONES

### 10.1 Estrategia de Merge

#### Opción 1: Merge de task/pepenautamx a DEV_VLP (Recomendado)
**Ventajas:**
- Mantiene estructura de BD mejorada de DEV_VLP
- Incorpora funcionalidad de correo de pepenauta
- Base sólida de migraciones

**Pasos:**
1. Crear branch de integración: `integration/correo-electronico-estructura-datos`
2. Merge DEV_VLP → integration (base)
3. Cherry-pick commits de correo de pepenauta
4. Resolver conflictos priorizando estructura de DEV_VLP
5. Adaptar `mailing.service.ts` a nueva estructura
6. Testing exhaustivo

#### Opción 2: Sincronización Bidireccional
**Ventajas:**
- Mantiene ambos branches independientes
- Menor riesgo inmediato

**Desventajas:**
- Divergencia continúa creciendo
- Mantenimiento duplicado

### 10.2 Servicios a Recuperar

#### 🔄 Críticos para Funcionalidad de Correo:
1. **mailing.service.ts** - Restaurar y adaptar
2. **recuperar-password component** - Evaluar si es necesario
3. **Configuración SMTP en .env.example**

#### 📋 A Evaluar:
- `sftp.service.ts` - ¿Es requerido en funcionalidad actual?
- `dashboard component` - ¿Requerido o opcional?
- `preguntas-frecuentes` - ¿Requerido o puede postergarse?

### 10.3 Verificaciones Post-Merge

#### ✅ Base de Datos:
- [ ] Ejecutar migraciones en orden correcto
- [ ] Verificar constraints de EVALUACIONES
- [ ] Verificar campos de SOLICITUDES_EIA2
- [ ] Testing de ARCHIVOS_TICKETS

#### ✅ Backend:
- [ ] Restaurar mailing.service.ts
- [ ] Actualizar resolvers para correo electrónico
- [ ] Actualizar typeDefs con tipos de notificaciones
- [ ] Configurar variables de entorno SMTP

#### ✅ Frontend:
- [ ] Resolver conflictos en componentes modificados
- [ ] Evaluar necesidad de recuperar-password
- [ ] Testing de flujos de usuario
- [ ] Validar rutas en app.routes.ts

#### ✅ Documentación:
- [ ] Actualizar ESTRUCTURA_DE_DATOS.md con merge
- [ ] Documentar funcionalidad de correo en README
- [ ] Actualizar GUIA_EJECUCION_MIGRACION.md

### 10.4 Plan de Testing

#### 🧪 Testing Crítico:
1. **Funcionalidad de Correo:**
   - Envío de notificaciones
   - Recuperación de contraseñas
   - Templates de correo

2. **Gestión de Archivos en Tickets:**
   - Upload de archivos
   - Validaciones de tamaño y extensión
   - Estados de archivos

3. **Importación de Escuelas:**
   - CSV con direcciones completas
   - Migración de datos existentes

4. **Integridad de Datos:**
   - Constraints de unicidad
   - Foreign keys
   - Cascade deletes

---

## 📋 11. CHECKLIST DE INTEGRACIÓN

### Antes de Merge:
- [ ] Backup de base de datos
- [ ] Documentar estado actual de ambos branches
- [ ] Identificar dependencias críticas
- [ ] Planificar rollback si es necesario

### Durante Merge:
- [ ] Resolver conflictos en archivos de configuración
- [ ] Priorizar cambios de estructura de BD de DEV_VLP
- [ ] Incorporar servicios de correo de pepenauta
- [ ] Actualizar documentación

### Después de Merge:
- [ ] Ejecutar migraciones en entorno de desarrollo
- [ ] Testing completo de funcionalidades críticas
- [ ] Actualizar README con nuevos features
- [ ] Crear tag de versión
- [ ] Notificar al equipo de cambios

---

## 📞 12. CONCLUSIONES

### Estado Actual:
- **DEV_VLP_EstructuraDeDatos:** Enfoque en estructura de datos, migraciones y documentación técnica
- **task/pepenautamx-001-correo-electronico:** Enfoque en funcionalidad de usuario (correo, dashboard, FAQ)

### Objetivos del Merge:
1. Mantener mejoras estructurales de DEV_VLP
2. Incorporar funcionalidad de correo de pepenauta
3. Unificar en un branch principal actualizado

### Próximos Pasos:
1. **Decisión del equipo:** ¿Qué funcionalidades son prioritarias?
2. **Crear branch de integración**
3. **Merge planificado con testing exhaustivo**
4. **Documentación de cambios finales**

---

**Generado:** 11 de marzo de 2026  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)  
**Branch Actual:** DEV_VLP_EstructuraDeDatos
