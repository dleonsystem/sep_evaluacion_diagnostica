# Bitácora de cambios del proyecto

Este documento se actualiza con cada modificación relevante al proyecto para entregar el informe mensual solicitado.

## 2026-03-24

- Se analizó e implementó la corrección del issue `#294` sobre `generateComprobante`, sustituyendo columnas inexistentes por `consecutivo`, `archivo_original` y `hash_archivo` en el resolver GraphQL.
- Se incorporó generación de PDF real en backend mediante `pdfmake`, con servicio dedicado y política explícita para bloquear descargas de recursos externos.
- Se integró el consumo del comprobante en el frontend autenticado (`archivos-evaluacion`) para descargar `Comprobante_<consecutivo>.pdf` con MIME `application/pdf`.
- Se agregaron pruebas específicas para el resolver `generateComprobante` y para el servicio de PDF; ambas pasan en validación local.
- Se emitió dictamen técnico del issue con resultado `Cumple parcialmente` por brechas remanentes: manejo de solicitudes con `usuario_id` nulo, falta de smoke test navegador versionado, suite global de Jest en rojo y ausencia de job de tests en CI.
- Se documentó la trazabilidad técnica en `docs/issues/issue-294-analisis-tecnico.md` y `docs/issues/issue-294-dictamen-tecnico.md`.

## 2026-03-25

- **Implementación del Modelo NIA (GAP-DB-3)**: Se materializó el esquema normalizado con las tablas `CAT_NIVELES_INTEGRACION`, `CAT_CAMPOS_FORMATIVOS` y `NIVELES_INTEGRACION_ESTUDIANTE`.
- **Automatización de Cálculos**: Se implementó el trigger `trg_calcular_nia_auto` para persistir automáticamente el NIA tras la validación de evaluaciones, eliminando campos redundantes en la tabla `EVALUACIONES`.
- **Catálogos Oficiales EIA 2025 / SIGED (GAP-CAT)**: 
  - Se creó el script `seed-catalogs-eia2025.sql` con la base oficial de CCTs, entidades, niveles y turnos.
  - Se refactorizó `init-db.sql` para unificarlo con el DDL maestro, asegurando entornos reproducibles y limpios.
- **Validación Robusta de Cargas**: Se actualizó el resolver `uploadExcelAssessment` para cruzar la CCT y el Nivel Educativo contra los catálogos oficiales, rechazando archivos inconsistentes (RF-13).
- **Cierre de Issue #297**: Se eliminaron los ENUMs hardcodeados en los resolvers de GraphQL, delegando la lógica a las tablas de catálogo de la base de datos.
- **Actualización Documental**: Sincronización de `ddl_generated.sql`, `ESTRUCTURA_DE_DATOS.md` y `PLAN_TRABAJO_FASE1.md`.

## 2025-11-25

- Se instala y configura el frontend en Angular, incluyendo ajustes iniciales de caché y dependencias para asegurar builds consistentes.
- Se habilita el componente de inicio con módulos compartidos básicos y se alinea el `.gitignore` para evitar artefactos de caché en el repositorio.

## 2025-12-12

- Se integra el módulo de autenticación JWT y se agrega el componente de **carga masiva** con validación frontal de la plantilla de Preescolar.
- Se implementan flujos de guardado local: selector del navegador, automatización del guardado y listado/eliminación de archivos almacenados.
- Se añaden alertas con SweetAlert2, prevención de duplicados por hash y control de sesión (obligatorio para cargas repetidas, consulta de guardados y reenvío autenticado tras la primera carga).
- Se mejora la consistencia del guardado (confirmaciones centralizadas, almacenamiento por correo) y se ajusta el layout de carga masiva (espaciados, eliminación de tarjetas, estado visual de botones guardados).

## 2025-12-15

- Se refuerza la captura y validación de correo antes de cargar archivos, asociando metadatos por CCT y permitiendo recuperar registros aunque el correo no venga explícito en la hoja.
- Se valida que el correo del formulario coincida con la hoja ESC, se muestra el estado de sesión y se permite volver a la carga sin forzar login cuando aplica.
- Se amplía la validación de múltiples archivos antes de guardarlos y se previene la eliminación errónea de tarjetas o vínculos en el flujo de carga masiva.

## 2025-12-18

- Se precarga el correo de usuarios autenticados, se muestra cada lote de credenciales solo una vez y se mejora el formato de las credenciales en pantalla.
- Se exige un correo válido para habilitar el botón/zona de carga, se muestran mensajes durante la validación inicial y de éxito con la fecha disponible (+4 días) y se mantiene el checklist que bloquea cargas con inconsistencias de correo, CCT, hoja o estructura.
- Se corrige la generación y uso de `fechaDisponible` antes de construir mensajes de éxito para evitar errores de compilación y asegurar que la fecha calculada se refleje correctamente.

## 2026-01-19

**Observaciones del Cliente/Área Solicitante - Revisión Crítica de Documentación**

Se reciben observaciones oficiales de DGTIC/DGADAE sobre inconsistencias en las reglas de negocio, estructura de datos y conceptos del sistema. Se identifican 5 categorías críticas que requieren corrección inmediata:

### I. Reglas de Negocio - Contradicciones Identificadas

**1. Cargas de archivos por periodo:**
- ❌ **Contradicción detectada:** RF-24.1 limita "1 archivo FRV por periodo" pero RF-16.6 indica "cada carga válida como solicitud independiente con consecutivo"
- ✅ **Corrección aprobada:** Permitir múltiples envíos por periodo sin sobreescritura, cada uno con consecutivo y estado independiente
- 📋 **Impacto:** RF-24.1, SOLICITUDES_EIA2, CU-16, triggers de validación

**2. Credenciales y modelo de usuarios:**
- ❌ **Contradicción detectada:** Múltiples reglas conflictivas:
  - "Un CCT solo puede tener una credencial" (CREDENCIALES_EIA2 descripción)
  - "Usuario = CCT, Contraseña = correo" (ESTRUCTURA_DE_DATOS.md línea 1035)
  - "Usuario = correo validado (reutilizable para múltiples CCT)" (RF-16.4)
  - Caso real: supervisores cargando múltiples escuelas, directores cargando su escuela
- ✅ **Corrección aprobada:** Modelo definitivo:
  - **Usuario ≠ CCT** (un usuario puede gestionar N CCT)
  - Relación **USUARIOS ↔ CCT (1:N)** mediante tabla intermedia
  - Credenciales asociadas a **correo electrónico** (usuario), no a CCT
  - Eliminar restricción "un CCT = una credencial"
- 📋 **Impacto:** USUARIOS, CREDENCIALES_EIA2, RF-14.2, RF-16.4, esquema ER completo

**3. Contraseñas - Flujo contradictorio:**
- ❌ **Contradicción detectada:**
  - "Contraseña = correo electrónico" (ESTRUCTURA_DE_DATOS.md línea 2089)
  - Contraseña temporal aleatoria (RF-16.4, RF-18.1)
  - Reglas de expiración, bloqueo, recuperación, hashing (RF-18, triggers)
- ✅ **Corrección aprobada:** Flujo unificado:
  - Primera carga válida → genera **contraseña temporal aleatoria** (8+ caracteres)
  - Envío por email + PDF descargable
  - Forzar cambio en primer login (RF-18.1)
  - Aplicar reglas completas: hashing bcrypt, expiración 90 días, bloqueo 5 intentos
- 📋 **Impacto:** CREDENCIALES_EIA2, RF-16.4, RF-18, CU-18, triggers de seguridad

### II. Niveles de Integración del Aprendizaje (NIA) - Inconsistencias Conceptuales

**4. Modelo NIA incorrecto:**
- ❌ **Problemas identificados:**
  - Dos conjuntos distintos de niveles mezclados (logro vs integración)
  - Campo `nivel_integracion` modelado como VARCHAR(20) único en EVALUACIONES
  - NIA real es **por estudiante Y por Campo Formativo** (4 NIAs por estudiante: ENS, HYC, LEN, SPC)
  - Campo `competencia_alcanzada` (BOOLEAN) sin uso claro ni definición institucional
- ✅ **Corrección aprobada:**
  - Definir **un solo marco institucional de NIA** (4 niveles: En Desarrollo, En Proceso, Esperado, Sobresaliente)
  - Modelar NIA como **tabla normalizada** NIVELES_INTEGRACION_ESTUDIANTE:
    ```
    id_estudiante | campo_formativo | nivel_integracion | periodo | fecha_calculo
    ```
  - Eliminar campo único `nivel_integracion` en EVALUACIONES
  - Eliminar campo `competencia_alcanzada` (sin fundamento institucional)
- 📋 **Impacto:** EVALUACIONES, tablas PRE3/PRI1-6/SEC1-3, RF-04.5, triggers de cálculo, reportes

### III. Estructura de Datos - Problemas de Normalización

**5. Uso incorrecto de ENUMs y falta de catálogos:**
- ❌ **Problemas identificados:**
  - Uso de ENUM en campos con catálogos oficiales: nivel, estado, ciclo_escolar
  - Duplicidad de campos territoriales en ESCUELAS
  - Valores literales en lugar de llaves foráneas
  - Longitudes VARCHAR inconsistentes entre tablas PRE/PRI/SEC
  - Tabla EVALUACIONES redundante sin uso claro
- ✅ **Corrección aprobada:**
  - Reemplazar **todos los ENUMs** por referencias a catálogos:
    - `nivel ENUM` → `id_nivel_educativo FK → CAT_NIVELES_EDUCATIVOS`
    - `estado ENUM` → `id_estado FK → CAT_ESTADOS_SOLICITUD`
    - `ciclo_escolar VARCHAR` → `id_ciclo FK → CAT_CICLOS_ESCOLARES`
  - Consolidar campos territoriales en ESCUELAS usando `id_entidad FK`
  - Estandarizar longitudes VARCHAR (CURP=18, CCT=10, email=255)
  - Revisar uso de tabla EVALUACIONES vs tablas PRE/PRI/SEC
- 📋 **Impacto:** 15+ tablas, 30+ triggers, vistas, stored procedures, migraciones

### IV. Catálogos Oficiales - Nuevos Insumos Compartidos

**6. Catálogos EIA 2025 y CCT SIGED:**
- 📥 **Insumos oficiales recibidos:**
  - Catálogos EIA 2025 (estructura validada DGTIC)
  - Catálogo CCT SIGED (fuente oficial actualizada)
- ✅ **Acciones requeridas:**
  - Actualizar estructura BD con catálogos oficiales
  - Redefinir reglas de negocio alineadas a catálogos
  - Implementar validaciones automáticas basadas en catálogos
  - Sincronizar con API SIGED para actualizaciones
- 📋 **Impacto:** CAT_*, RF-01 a RF-04, validaciones automáticas, seeds de BD

### Resumen de Impacto

| Categoría | Documentos Afectados | Prioridad | Esfuerzo Estimado |
|-----------|---------------------|-----------|-------------------|
| I. Reglas de Negocio | REQUERIMIENTOS, casos_uso.md, SRS | 🔴 P0 | 6h |
| II. Modelo NIA | ESTRUCTURA_DE_DATOS, triggers, reportes | 🔴 P0 | 8h |
| III. Normalización BD | ESTRUCTURA_DE_DATOS, migraciones | 🔴 P0 | 12h |
| IV. Catálogos Oficiales | CAT_*, seeds, validaciones | 🟡 P1 | 4h |
| V. Actualización Docs | 8 archivos .md, ANALISIS_CALIDAD | 🟡 P1 | 4h |
| **TOTAL** | **15+ archivos** | - | **34h** |

**Estado:** ⏳ EN ANÁLISIS - Correcciones iniciadas 19-ene-2026  
**Siguiente paso:** Aplicar correcciones por prioridad (I → II → III → IV → V)
