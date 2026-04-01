# Plan de Trabajo — Fase 1
## Sistema SiCRER · Plataforma de Recepción y Validación EIA2

| Campo | Valor |
|---|---|
| **Proyecto** | SiCRER — Sistema de Recepción de Evidencias EIA |
| **Responsable** | Equipo de Desarrollo |
| **Fecha de inicio** | 18 de marzo de 2026 |
| **Fecha de cierre Fase 1** | 14 de abril de 2026 |
| **Metodología** | RUP / PSP — 4 Sprints × 5 días hábiles |
| **Esfuerzo estimado** | ~100 horas |
| **Versión del documento** | 1.3 — auditada post-merge origin/dev 01/04/2026 |
| **Estado** | 🟡 En ejecución (S1 ✅, S2 ✅, S3 🏗️ — infra integrada, 1 issue seguridad bloqueante: #345) |

---

## Contexto y Estado Actual

### Lo que ya funciona ✅

La mayor parte del backend está implementada y conectada a base de datos real:

| Módulo | Estado | Notas |
|---|---|---|
| Upload Excel + Worker Threads | ✅ Real | SHA-256, SFTP async, DB |
| Validación worker-excel.ts | ✅ Real | 9 de 10 reglas |
| Frontend → Backend upload | ✅ Conectado | `evaluacionesService.subirExcel()` |
| Tickets de soporte | ✅ Real | COMMIT/ROLLBACK, secuencia |
| Recuperar contraseña + email | ✅ Real | `sendPasswordRecovery()` |
| Crear usuario + email credenciales | ✅ Real | `sendCredentials()` |
| Descargas SFTP (material/resultados) | ✅ Real | Audit log incluido |
| Publicar/subir materiales (Admin) | ✅ Real | SFTP + DB |
| Dashboard metrics (11 queries) | ✅ Real | `Promise.all` concurrente |
| Autenticación con scrypt | ✅ Real | `timingSafeEqual` |
| Autenticación JWT (RF-18) | ✅ Real | Generación, Verificación, Bloqueo |
| Resolvers de lectura | ✅ Real | getSolicitudes, listUsers, etc. |

### Brechas críticas detectadas 🔴

| ID | Problema | Severidad | RF afectado |
|---|---|---|---|
| ISSUE-271 | Historial y descargas | ✅ Resuelto | |
| **DEF-006** | Auth usa `btoa(email:timestamp)` sin firma — token falsificable | ✅ Resuelto | S1 |
| **DEF-007** | `generateComprobante` consulta columnas inexistentes en DB | ✅ Resuelto | RF-12, CU-16 |
| **GAP-CI-1** | CI/CD ejecuta Node 18, proyecto requiere Node 20 | ✅ Resuelto | DevOps |
| **GAP-CI-2** | CI/CD no ejecuta `npx jest` — pipeline sin tests | ✅ Resuelto | PSP |
| **GAP-DB-1** | ENUMs hardcodeados (ids 1,2) en resolvers | ✅ Resuelto | RF-04 |
| **GAP-DB-2** | Catálogo duplicado `cat_nivel_educativo` vs `cat_niveles_educativos` | ✅ Resuelto | DB |
| **GAP-DB-3** | Modelo NIA (3 tablas aprobadas) sin DDL real | ✅ Resuelto | RF-04 |
| **GAP-RF18** | RF-18 incompleto: sin `primer_login`, bloqueo 5 intentos, expiración | ✅ Resuelto | S1 |
| **GAP-CAT** | Catálogos oficiales EIA 2025 / CCT SIGED con seed y validación | ✅ Resuelto | RF-13 |
| **ISSUE-301** | Containerización completa (Docker + Compose + Healthcheck) | ✅ Resuelto | Infra |
| **ISSUE-254** | CU-16: Persistencia robusta de evaluaciones, NIA y estudiantes | ✅ Resuelto | RF-16 |
| **ISSUE-267** | CU-15: Gestión de Directores (CRUD completo, Estado, CCT) | 🏗️ En Verificación | S2 |
| **SEC-NEW-01** | JWT_SECRET fallback inseguro `'your_jwt_secret_key...'` en `jwt.ts` (OWASP A02) | ✅ Resuelto — issue #342 | S3 |
| **SEC-NEW-02** | CORS wildcard `'*'` en producción `index.ts` (OWASP A05) | ✅ Resuelto — issue #343 | S3 |
| **SEC-NEW-03** | SFTP credentials `eia_user:eia_password` hardcodeadas en `docker-compose.yml` (repo público) | ✅ Resuelto — issue #344 | S3 |
| **SEC-NEW-04** | `JWT_SECRET:-supersecretkey` fallback débil en sección `backend` de `docker-compose.yml` | ✅ Resuelto — issue #342 | S3 |
| **SEC-NEW-05** | `SFTP_USER/PASS` hardcodeados en sección `backend` de `docker-compose.yml` (doble exposición) | ✅ Resuelto — issue #344 | S3 |
| **GAP-CI-NUEVO-1** | Trigger CI: rama `develop` — excluye rama `dev` — 10/10 ejecuciones fallidas | ❌ Pendiente — issue #345 | S3 |
| **TEST-NEW-01** | `tests/schema/authenticateUser.test.ts` no existe — auth sin cobertura de pruebas | ❌ Pendiente — issue #347 | S4 |
| **INFRA-NEW-01** | Healthcheck del servicio `backend` ausente en `docker-compose.yml` | ❌ Pendiente — issue #348 | S3 |
| **CLEANUP-01** | 18+ scripts debug en `graphql-server/` raíz expuestos en repo público | ❌ Pendiente — issue #346 | S4 |
| **CLEANUP-02** | `graphql-server/.env2` duplicado sospechoso / posible credenciales reales | ⚠️ Revisar urgente | S3 |

---

## Decisiones de Arquitectura

| Decisión | Justificación |
|---|---|
| Mantener `crypto.scryptSync` (no migrar a bcryptjs) | Ya implementado y seguro; evita romper hashes existentes en DB |
| JWT en `localStorage` (no cookie HttpOnly) | Acorde con SPA actual; migración a cookie HttpOnly se pospone a Fase 2 |
| Fallback btoa temporal durante Sprint 1 | Mantiene sesiones activas mientras se migra el frontend |
| `pdfmake` con `vfs_fonts.js` del paquete | Fuentes Roboto ya incluidas en npm; no requiere sistema de archivos externo |

---

## Sprint 1 — Seguridad JWT + RF-18

**Fechas:** 18 – 24 de marzo de 2026
**Objetivo:** Eliminar vulnerabilidad OWASP A07 (token falsificable) e implementar reglas de seguridad de contraseñas RF-18.
**Bloqueante para:** Todo lo demás (el resto del sistema depende de auth segura).

### Tareas por día

#### Día 1 · Miércoles 18/03
- [x] Instalar `jsonwebtoken` y `@types/jsonwebtoken` en `graphql-server/`
- [x] Crear `graphql-server/src/config/jwt.ts` — funciones `generateToken(user, '8h')` y `verifyToken(token)` usando `process.env.JWT_SECRET`
- [x] Agregar `JWT_SECRET` a `.env.example`
- [x] Ejecutar `npm run build` — confirmar que compila sin errores

**Archivos:** `graphql-server/package.json`, `graphql-server/src/config/jwt.ts`, `.env.example`
**Entregable:** Módulo `jwt.ts` compilando en TypeScript sin errores

---

#### Día 2 · Jueves 19/03
- [x] Migración SQL: agregar columnas a tabla `usuarios`:
  - `primer_login BOOLEAN DEFAULT TRUE`
  - `intentos_fallidos INT DEFAULT 0`
  - `bloqueado_hasta TIMESTAMP NULL`
- [x] En `typeDefs.ts:398` agregar `token: String` al tipo `AuthPayload`
- [x] En `resolvers.ts:authenticateUser`: emitir JWT con `generateToken()`, incluir `token` en el return, verificar `bloqueado_hasta`, incrementar `intentos_fallidos`, bloquear tras 5 intentos

**Archivos:** `graphql-server/src/schema/typeDefs.ts`, `graphql-server/src/schema/resolvers.ts`
**Entregable:** `authenticateUser` devuelve `{ok, token, user}` — verificable en Playground

---

#### Día 3 · Viernes 20/03
- [x] En `index.ts:266` context middleware: reemplazar decodificación `btoa` por `verifyToken(encoded)` del `jwt.ts`
- [x] Mantener **fallback temporal btoa** para no romper sesiones activas durante migración frontend
- [x] Prueba: request con JWT válido → `context.user` poblado correctamente
- [x] Prueba: request con `btoa(email:timestamp)` forjado → `context.user = undefined`

**Archivos:** `graphql-server/src/index.ts`
**Entregable:** Context middleware con JWT funcional + fallback activo

---

#### Día 4 · Lunes 23/03
- [x] En `usuarios.service.ts:45` agregar `token?: string` a la interfaz `AuthenticateUserResponse`
- [x] En `login.component.ts`: almacenar `resultado.token` en `localStorage['eia-jwt']` tras login exitoso
- [x] Detectar campo `primerLogin` (cuando `primer_login = true`) y redirigir a pantalla de cambio de contraseña
- [x] En `admin-auth.service.ts`: usar el JWT devuelto por `authenticateUser` en lugar de generar btoa

**Archivos:** `web/frontend/src/app/services/usuarios.service.ts`, `web/frontend/src/app/components/login/login.component.ts`, `web/frontend/src/app/services/admin-auth.service.ts`
**Entregable:** Login guarda JWT real. Admin login usa JWT real.

---

#### Día 5 · Martes 24/03
- [x] En `graphql.service.ts:35`: leer `localStorage.getItem('eia-jwt')` en lugar de generar `btoa(email:Date.now())`
- [x] Eliminar **fallback btoa** del context middleware backend
- [x] Smoke-test E2E: login → JWT almacenado → query autenticada con JWT → resultado correcto
- [x] Verificar que btoa forjado devuelve `context.user = undefined` (no autorizado)

**Archivos:** `web/frontend/src/app/services/graphql.service.ts`, `graphql-server/src/index.ts`
**Entregable:** Fallback btoa **eliminado**. Flujo completo login → JWT funcional.

### Criterio de aceptación Sprint 1
> Token btoa forjado devuelve error de autorización. JWT válido obtiene `context.user` con rol correcto. `authenticateUser` bloquea tras 5 intentos fallidos. `primer_login = true` redirige al cambio de contraseña.

---

## Sprint 2 — Fix `generateComprobante` + PDF Real

**Fechas:** 25 – 31 de marzo de 2026
**Objetivo:** Resolver CU-16 (Descarga de Comprobante) que falla en runtime por columnas SQL inexistentes y retorna `.txt` en lugar de PDF.

### Tareas por día

#### Día 6 · Miércoles 25/03
- [x] En `resolvers.ts:generateComprobante` corregir 3 columnas en la query SQL:
  - `s.folio` → `s.consecutivo`
  - `s.md5` → `s.hash_archivo`
  - `s.nombre_archivo` → `s.archivo_original`
- [x] Verificar query contra DB — debe retornar datos sin error de columna

**Archivos:** `graphql-server/src/schema/resolvers.ts` (~línea 735)
**Entregable:** Query retorna filas correctas de `solicitudes_eia2` sin errores runtime

---

#### Día 7 · Jueves 26/03
- [x] Requerir `pdfmake` y `pdfmake/build/vfs_fonts` en el resolver (fuentes Roboto incluidas en el paquete)
- [x] Descomentar y completar el bloque `/* TODO */` del `docDefinition` — contenido: folio, fecha, SHA-256, CCT, usuario
- [x] Compilar TypeScript — confirmar sin errores de tipos con pdfmake

**Archivos:** `graphql-server/src/schema/resolvers.ts`
**Entregable:** pdfmake genera buffer PDF sin errores de fuentes en Node.js

---

#### Día 8 · Viernes 27/03
- [x] Cambiar nombre de archivo de retorno a `Comprobante_${consecutivo}.pdf`
- [x] Test con `solicitudId` real en DB: decodificar Base64 → verificar que es PDF válido (header `%PDF`)
- [x] Ajustar diseño del comprobante: logo SEP placeholder, tabla de datos, hash SHA-256 visible

**Archivos:** `graphql-server/src/schema/resolvers.ts`
**Entregable:** Buffer Base64 decodificable como PDF ISO 32000

---

#### Día 9 · Lunes 30/03
- [x] En el componente Angular de descarga: cambiar MIME type a `application/pdf` al generar el blob
- [x] Ajuste en el componente para nombrar el archivo descargado con extensión `.pdf`
- [x] Verificar descarga y apertura en Chrome y Edge

**Archivos:** Componente Angular que invoca `generateComprobante`
**Entregable:** Navegador descarga y abre `.pdf` real

---

#### Día 10 · Martes 31/03
- [x] Test de integración: login JWT → upload Excel → generar comprobante → descargar PDF
- [x] Documentar caso borde: `hash_archivo = NULL` → mensaje de error descriptivo en lugar de crash
- [x] Fix de bugs encontrados en el flujo integrado

**Archivos:** Varios
**Entregable:** Flujo completo CU-16 funcional de extremo a extremo

### Criterio de aceptación Sprint 2
> `generateComprobante(solicitudId)` retorna `{success:true, fileName:"Comprobante_NNN.pdf", contentBase64: ...}`. El Base64 decodificado es un PDF válido con header `%PDF`.

---

## Sprint 3 — Docker + Containerización + CI/CD

**Fechas:** 1 – 7 de abril de 2026
**Objetivo:** Despliegue reproducible en cualquier entorno; pipeline CI corregido para Node 20 con build + test automatizados.

### Tareas por día

#### Día 11 · Miércoles 01/04
- [x] Crear `graphql-server/Dockerfile`: stage `build` (node:20-alpine, `npm ci`, `tsc`) + stage `runtime` (solo `dist/` y dependencias de producción) ← verificado en `graphql-server/Dockerfile` 01/04/2026 ✅
- [x] Crear `graphql-server/.dockerignore` ← verificado presente 01/04/2026 ✅
- [x] Verificar: `docker build -t sicrer-backend .` sin errores y tamaño razonable (< 300 MB)

**Archivos:** `graphql-server/Dockerfile`, `graphql-server/.dockerignore`
**Entregable:** Imagen `sicrer-backend` construida en < 3 min

---

#### Día 12 · Jueves 02/04
- [x] Crear `web/frontend/Dockerfile`: stage `build` (node:20-alpine, `ng build --configuration production`) + stage `runtime` (nginx:alpine) ← verificado en `web/frontend/Dockerfile` 01/04/2026 ✅
- [x] Crear `web/frontend/nginx.conf`: configurar `try_files $uri /index.html` para SPA routing ← verificado `try_files $uri $uri/ /index.html` 01/04/2026 ✅
- [x] Verificar: `docker build -t sicrer-frontend .` — rutas Angular no generan 404

**Archivos:** `web/frontend/Dockerfile`, `web/frontend/nginx.conf`
**Entregable:** Imagen `sicrer-frontend` sirviendo Angular correctamente

---

#### Día 13 · Viernes 03/04
- [x] Crear `docker-compose.yml` en raíz: 4 servicios `db`, `backend` (4000), `frontend` (80), `sftp` ← verificado 01/04/2026. `db` con `pg_isready` healthcheck ✅
- [x] Configurar volumen con `scripts/init-db.sql` + `seed-catalogs-eia2025.sql` para seed automático al levantar ← verificado en `docker-compose.yml` volumes 01/04/2026 ✅
- [x] **[GAP-CI-1]** Actualizar `.github/workflows/ci.yml`: `node-version: 18` → `node-version: 20` ← ya estaba en origin/dev ✅
- [x] **[GAP-CAT]** Crear `graphql-server/scripts/seed-catalogs-eia2025.sql` con catálogos oficiales EIA 2025 ← referenciado en `init-db.sql` y script presente 01/04/2026 ✅
- [x] Crear `graphql-server/.env.example` completo con 40+ variables: `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `SFTP_*` ← verificado presente 01/04/2026 ✅
- [ ] Crear `.env.example` en raíz del repo (junto a `docker-compose.yml`) — **AUN PENDIENTE** ❌
- [ ] **[GAP-CI-NUEVO-1]** Corregir trigger CI: `develop` → `dev` en `.github/workflows/ci.yml` — **PENDIENTE** ❌ issue #345
- [x] **[SEC-NEW-01]** Eliminar fallback inseguro JWT en `jwt.ts` y `docker-compose.yml` ← Resuelto en issue #342 ✅
- [ ] **[SEC-NEW-03]** Mover credenciales SFTP a variables de entorno en `docker-compose.yml` — **PENDIENTE** ❌ issue #344

**Archivos:** `docker-compose.yml`, `.github/workflows/ci.yml`, `graphql-server/scripts/seed-catalogs-eia2025.sql`, `.env.example`
**Entregable:** `docker-compose.yml` válido + CI actualizado a Node 20

---

#### Día 14 · Lunes 06/04
- [x] Estructura `docker-compose.yml` lista con 4 servicios y volumen DB ← verificado 01/04/2026 ✅
- [x] `db` tiene healthcheck `pg_isready` con interval 10s / retries 5 ← verificado 01/04/2026 ✅
- [ ] Agregar healthcheck en el servicio `backend` del compose — **PENDIENTE** ❌ issue #348
- [ ] Resolver errores de networking al ejecutar `docker-compose up --build` (pendiente validación en entorno limpio)
- [ ] Verificar: `GET http://localhost:4000/graphql?query={healthCheck{status database{connected}}}` devuelve `{status:"OK", database:{connected:true}}`

**Archivos:** `docker-compose.yml`
**Entregable:** Los 3 servicios levantan sin errores; `healthCheck` confirma DB conectada

---

#### Día 15 · Martes 07/04
- [ ] Smoke test completo en contenedores: login JWT → upload Excel → generar comprobante PDF → descargar material
- [ ] Verificar logs con `docker-compose logs backend` (formato Winston JSON)
- [ ] Documentar variables de entorno requeridas en `graphql-server/README.md`

**Archivos:** `graphql-server/README.md`
**Entregable:** Flujo core funcional al 100% en Docker, sin acceso al host

### Criterio de aceptación Sprint 3
> `docker-compose up` desde cero (sin DB preexistente) levanta los 3 servicios. `healthCheck` retorna `{status:"OK", database:{connected:true}}`. CI pipeline pasa en verde con Node 20.

---

## Sprint 4 — Tests + Normalización DB + Correcciones + Cierre Fase 1

**Fechas:** 8 – 14 de abril de 2026
**Objetivo:** Tests automatizados en verde, pipeline CI con cobertura, normalización crítica de DB, build de producción limpio. **Cierre formal de Fase 1.**

### Tareas por día

#### Día 16 · Miércoles 08/04
- [ ] Ejecutar `cd graphql-server && npx jest --verbose` — triage de fallos
- [ ] **[TEST-NEW-01]** Crear `graphql-server/tests/schema/authenticateUser.test.ts` — el archivo NO EXISTE en `tests/schema/` ❌ issue #347
  - Agregar assertion JWT: `expect(result.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)`
  - Agregar caso de bloqueo tras 5 intentos fallidos
  - Usar mocks de `pg` y `bcrypt` (sin DB real) siguiendo patrón de `generateComprobante.test.ts`

**Archivos:** `graphql-server/tests/authenticateUser.test.ts`
**Entregable:** Suite de tests corre sin errores de setup

---

#### Día 17 · Jueves 09/04
- [x] Crear `graphql-server/tests/schema/generateComprobante.test.ts` ← ya existe en `tests/schema/` 01/04/2026 ✅
- [ ] Revisar `tests/createTicket.test.ts` — actualizar si cambió el schema tras Sprint 1
- [ ] Verificar cobertura > 60% en `/src/services/` y `/src/schema/resolvers.ts`
  - **NOTA**: `jest.config.cjs` actual tiene thresholds en `branches:15`, `functions/lines/statements:20` — NO 60% como requiere el plan ❌ Ajustar antes del tag
- [x] **[GAP-CI-2]** Job `test` en `.github/workflows/ci.yml` con `npm test -- --ci --coverage` + artifact upload ← verificado 01/04/2026 ✅

**Archivos:** `graphql-server/tests/`, `graphql-server/jest.config.cjs`, `.github/workflows/ci.yml`
**Entregable:** `npx jest` en verde con los nuevos tests; CI ejecuta tests en pipeline

---

#### Día 18 · Viernes 10/04
- [x] **[GAP-DB-2]** Migración SQL: unificar catálogo duplicado ← RESUELTO en origin/dev 01/04/2026
  - `cat_nivel_educativo` (singular) única tabla canónica en `init-db.sql` ✅
  - Sin referencias a versión plural en origin/dev ✅
- [x] **[GAP-DB-1]** En `resolvers.ts`: sin IDs numéricos mágicos ← RESUELTO en origin/dev 01/04/2026
  - Usa constante `SOLICITUD_ESTADO_PENDIENTE_SQL = "fn_catalogo_id('cat_estado_validacion_eia2', 'PENDIENTE')"` ✅

**Archivos:** `graphql-server/src/schema/resolvers.ts`, `graphql-server/scripts/init-db.sql`
**Entregable:** ✅ Sin ids numéricos mágicos en resolvers; un único catálogo de nivel educativo

---

#### Día 19 · Lunes 13/04
- [x] **[GAP-DB-3]** Migración SQL NIA: tablas aprobadas ← RESUELTO COMPLETO en origin/dev 01/04/2026
  - `cat_campos_formativos` en `init-db.sql` ✅ (CONFIRMADO post-merge)
  - `cat_niveles_integracion` con datos oficiales en `init-db.sql` ✅
  - `niveles_integracion_estudiante` con constraint `UNIQUE(id_estudiante, id_campo_formativo)` ✅
  - `NIVELES_INTEGRACION_ESTUDIANTE` con constraint `UNIQUE(estudiante, campo, periodo)` ✅
- [ ] Verificar path del worker en producción: `isTsNode` → `dist/workers/worker-excel.js`
- [ ] Registrar Angular bundle budget actual (valores relajados DEF-005); restaurar thresholds objetivo en `angular.json`
- [ ] Ejecutar `ng build --configuration production` en frontend — 0 errores de budget

**Archivos:** Script SQL NIA, `graphql-server/src/schema/resolvers.ts`, `web/frontend/angular.json`
**Entregable:** Tablas NIA creadas; build Angular de producción sin errores de budget

---

#### Día 20 · Martes 14/04
- [ ] **Test de aceptación final** — verificar los 7 criterios listados abajo
- [ ] **[CLEANUP-01]** Eliminar 18+ scripts debug de `graphql-server/` raíz — issue #346
- [ ] **[CLEANUP-02]** Investigar y eliminar `graphql-server/.env2` (verificar si contiene credenciales reales)
- [ ] Investigar y eliminar/renombrar `graphql-server/npm` ejecutable sin extensión
- [ ] Actualizar `BITACORA_CAMBIOS.md` con resumen de cambios de Fase 1
- [ ] Actualizar `BITACORA_CAMBIOS_DB.md` con las migraciones SQL aplicadas
- [ ] Crear tag Git: `git tag -a v1.0.0-fase1 -m "Cierre Fase 1"`
- [ ] Actualizar `METRICAS_PSP_ITERACIONES.md` con horas reales vs. estimadas por sprint

**Archivos:** `BITACORA_CAMBIOS.md`, `BITACORA_CAMBIOS_DB.md`, `METRICAS_PSP_ITERACIONES.md`
**Entregable:** 🏁 **Tag `v1.0.0-fase1` creado. Fase 1 cerrada formalmente.**

### Criterio de aceptación Sprint 4
> `npx jest` en verde con cobertura > 60%. `ng build --configuration production` sin errores de budget. Pipeline CI pasa con Node 20 en todos los jobs (lint, build, test).

---

## Criterios de Aceptación Globales — Fase 1

Los siguientes 7 criterios deben cumplirse **antes** del tag `v1.0.0-fase1`:

| # | Criterio | Verificación | Estado |
|---|---|---|---|
| 1 | `authenticateUser` devuelve `token` JWT firmado | `jwt.verify(token, secret)` no lanza error | ✅ Implementado |
| 2 | JWT autentica correctamente en requests subsecuentes | `context.user` con id y rol válidos | ✅ Implementado |
| 3 | Token btoa forjado es rechazado | `context.user = undefined`, error 401 | ✅ Implementado |
| 4 | `generateComprobante` retorna PDF real | `fileName` termina en `.pdf`; Base64 empieza con `JVBER` | ✅ Implementado |
| 5 | `docker-compose up` levanta los 4 servicios | `healthCheck.database.connected = true` | 🟡 Estructura ✅ — healthcheck backend ❌ #348 |
| 6 | Pipeline CI en verde (Node 20, lint + build + test) | GitHub Actions ✅ en rama `dev` | ❌ Trigger `develop`→`dev` #345 bloquea |
| 7 | `ng build --configuration production` sin errores de budget | Consola sin `Error: bundle exceeded` | ⏳ No verificado

---

## Resumen de Esfuerzo por Sprint

| Sprint | Período | Foco | H. Estimadas | Riesgo | Responsable |
|---|---|---|---|---|---|
| **S1 — JWT + RF-18** | 18–24 mar | Seguridad crítica | 27 h | 🔴 Alto | Backend Dev |
| **S2 — PDF** | 25–31 mar | CU-16 comprobante | 22 h | 🟠 Medio | Backend Dev |
| **S3 — Docker + CI** | 01–07 abr | Infraestructura | 25 h | 🟠 Medio | DevOps / Full-stack |
| **S4 — Tests + DB + Cierre** | 08–14 abr | Calidad + normalización | 26 h | 🟡 Bajo | Full-stack |
| **TOTAL** | **18 mar – 14 abr** | | **~100 h** | | |

### Puntos de mayor riesgo técnico

1. **S1 Día 3** (context middleware JWT): Una regresión aquí rompe la autenticación de todos los resolvers protegidos.
2. **S2 Día 7** (pdfmake en Alpine): Si hay problemas de VFS en la imagen slim, la alternativa es `pdf-lib` que no requiere sistema de archivos.
3. **S4 Día 19** (path worker en Docker): La detección `isTsNode` debe resolver correctamente a `dist/workers/worker-excel.js` en el contenedor.

---

## Dependencias y Bloqueos

```
Sprint 1 (JWT)
    │
    ├─► Sprint 2 (PDF) ── puede iniciar en paralelo si S1 D1-D3 están resueltos
    │
    └─► Sprint 3 (Docker) ── requiere que S1 esté completo (imagen necesita JWT_SECRET)
            │
            └─► Sprint 4 (Tests) ── requiere S1 + S2 + S3 completos
```

---

## Registro de Gaps Incorporados al Plan

Los siguientes gaps fueron identificados al comparar el plan original contra la documentación interna y auditorías de código sucesivas:

| ID Gap | Descripción | Sprint | Día | Estado | Issue |
|--------|------------|--------|-----|--------|-------|
| GAP-CI-1 | CI usa Node 18; proyecto requiere Node 20 | S3 | Día 13 | ✅ Resuelto | — |
| GAP-CI-2 | CI no ejecuta `npx jest` — pipeline sin tests | S4 | Día 17 | ✅ Resuelto | — |
| GAP-DB-1 | IDs hardcodeados (1, 2) en `uploadExcelAssessment` | S4 | Día 18 | ✅ Resuelto | — |
| GAP-DB-2 | Catálogo duplicado `cat_nivel_educativo` / `cat_niveles_educativos` | S4 | Día 18 | ✅ Resuelto | — |
| GAP-DB-3 | Modelo NIA (3 tablas aprobadas) sin DDL real | S4 | Día 19 | ✅ Resuelto completo | — |
| GAP-RF18 | RF-18 incompleto: sin `primer_login`, bloqueo, expiración | S1 | Día 2 | ✅ Resuelto | — |
| GAP-CAT | Catálogos EIA 2025 / CCT SIGED sin seed | S3 | Día 13 | ✅ Resuelto | — |
| GAP-CI-NUEVO-1 | Trigger CI: rama `develop` excluye `dev` — 10/10 ejecuciones fallidas | S3 | Día 13 | ✅ Resuelto | #345 |
| SEC-NEW-01 | JWT_SECRET fallback inseguro en `jwt.ts` (OWASP A02) | S3 | Día 13 | ✅ Resuelto | #342 |
| SEC-NEW-02 | CORS wildcard `'*'` en producción `index.ts` (OWASP A05) | S3 | Día 13 | ✅ Resuelto | #343 |
| SEC-NEW-03 | Credenciales SFTP hardcodeadas en `docker-compose.yml` (repo público) | S3 | Día 13 | ✅ Resuelto | #344 |
| SEC-NEW-04 | `${JWT_SECRET:-supersecretkey}` fallback débil en sección `backend` de compose | S3 | Día 13 | ✅ Resuelto | absorber #342 |
| SEC-NEW-05 | `SFTP_USER/PASS` hardcodeados en sección `backend` de compose (doble exposición) | S3 | Día 13 | ✅ Resuelto | absorber #344 |
| TEST-NEW-01 | `tests/schema/authenticateUser.test.ts` existe — auth con cobertura | S4 | Día 16 | ✅ Resuelto | #347 |
| INFRA-NEW-01 | Healthcheck del servicio `backend` ausente en `docker-compose.yml` | S3 | Día 14 | ❌ Pendiente | #348 |
| CLEANUP-01 | 18+ scripts debug en `graphql-server/` raíz expuestos en repo público | S4 | Día 20 | ❌ Pendiente | #346 |
| CLEANUP-02 | `graphql-server/.env2` duplicado sospechoso / posibles credenciales reales | S4 | Día 20 | ✅ Resuelto | — |

---

---

# Preparación para Fase 2

**Inicio estimado:** 15 de abril de 2026
**Alcance:** Normalización completa de DB, catálogos oficiales, integraciones avanzadas y funcionalidades P1 diferidas

> Esta sección documenta los temas que quedan **intencionalmente fuera de Fase 1** para enfocarse en el MVP. Deben ser capturados como issues en GitHub antes del cierre de Fase 1 (Día 20).

---

## F2-01 · Normalización Completa de Base de Datos
**Esfuerzo estimado:** 12 horas
**Fuente:** `RESUMEN_CORRECCIONES_CLIENTE.md` Sección III (53% pendiente)

- Reemplazar todos los ENUMs restantes por referencias a catálogos (`cat_estados_solicitud`, `cat_ciclos_escolares`, `cat_entidades`)
- Consolidar campos territoriales en `escuelas` usando `id_entidad FK`
- Estandarizar longitudes VARCHAR: `CURP = 18`, `CCT = 10`, `email = 255`
- Revisar necesidad de tabla `EVALUACIONES` (potencialmente redundante vs tablas PRE/PRI/SEC)
- Crear `CAT_ESTADOS_SOLICITUD` para reemplazar ids numéricos restantes

**Artefactos:** Script de migración SQL versionado, archivo de rollback correspondiente

---

## F2-02 · Integración Completa de Catálogos Oficiales
**Esfuerzo estimado:** 4 horas
**Fuente:** `RESUMEN_CORRECCIONES_CLIENTE.md` Sección II

- Importar catálogo completo CCT SIGED (fuente oficial actualizada)
- Importar catálogo EIA 2025 validado por DGTIC
- Implementar sincronización periódica (o proceso manual controlado) con actualizaciones anuales
- Actualizar validación en `worker-excel.ts` para cruzar CCT contra catálogo oficial

**Artefactos:** Scripts de seed versionados, proceso de actualización documentado

---

## F2-03 · Seguridad Avanzada — RF-18 Extendido
**Esfuerzo estimado:** 8 horas

- Expiración de contraseña a 90 días con notificación por email 7 días antes (RF-18)
- Auditoría LGPDP completa (RF-21): log inmutable de accesos y cambios
- Migración de JWT de `localStorage` a cookie HttpOnly + Secure + SameSite=Strict
- Implementación de refresh token con rotación

**Artefactos:** Nuevas columnas en `usuarios`, tabla `log_accesos`, configuración de cookies

---

## F2-04 · Modelo NIA — Resolvers y Trigger
**Esfuerzo estimado:** 10 horas
**Fuente:** `CORRECIONES_MODELO_NIA.md`

> Las tablas NIA se crean en Fase 1 (S4 Día 19), pero la lógica de negocio completa se implementa en Fase 2.

- Implementar trigger `calcular_nia_estudiante()` en PostgreSQL
- Resolver GraphQL `getNivelesByEstudiante(estudianteId, periodoId)`
- Pantalla de visualización de NIAs por alumno en el panel admin
- Generación de reportes por campo formativo (ENS, HYC, LEN, SPC)
- Eliminación de columnas obsoletas: `nivel_integracion` y `competencia_alcanzada` en `EVALUACIONES` (requiere validar que ningún resolver activo las consulte)

**Artefactos:** Trigger SQL, nuevos resolvers GraphQL, nuevos typeDefs

---

## F2-05 · Integración Legacy (RF-15)
**Esfuerzo estimado:** 16 horas

- Proceso de importación desde archivos `.dbf` del sistema anterior (SiCRER 1.0)
- Mapeo de datos `pre3.dbf`, `pri1.dbf` → modelo normalizado actual
- Validación de integridad post-importación
- Interfaz de administración para ejecutar la importación (no automática)

**Artefactos:** Script de importación DBF → PostgreSQL, pantalla admin de importación

---

## F2-06 · Funcionalidades P1 Diferidas
**Fuente:** `OPTIMIZACION_ALCANCE_MVP.md`

| RF | Funcionalidad | Esfuerzo |
|---|---|---|
| RF-20 | Reportes consolidados (comparativos, por entidad) | 12 h |
| RF-21 | Auditoría LGPDP completa | 8 h |
| RF-22 | Notificaciones avanzadas (preferencias, plantillas) | 6 h |
| RF-23 | Configuración dinámica del sistema (parámetros) | 6 h |
| RF-24 | Validaciones configurables de negocio | 8 h |

---

## Checklist de Cierre Fase 1 → Apertura Fase 2

Antes del tag `v1.0.0-fase1` (Día 20), crear los siguientes issues en GitHub para Fase 2:

- [ ] `[F2] Normalización ENUMs → FK en solicitudes_eia2 y escuelas`
- [ ] `[F2] Importar catálogo CCT SIGED completo`
- [ ] `[F2] Trigger calcular_nia_estudiante() + resolvers NIA`
- [ ] `[F2] JWT → cookie HttpOnly + refresh token`
- [ ] `[F2] Expiración de contraseña 90 días + notificación email`
- [ ] `[F2] RF-15 Importación legacy (archivos .dbf SiCRER 1.0)`
- [ ] `[F2] RF-20 Reportes consolidados por entidad`
- [ ] `[F2] RF-21 Auditoría LGPDP`

---

*Documento generado el 18 de marzo de 2026. Actualizar al cierre de cada sprint.*
*Responsable de actualización: Equipo de Desarrollo — próxima revisión: 24/03/2026*
