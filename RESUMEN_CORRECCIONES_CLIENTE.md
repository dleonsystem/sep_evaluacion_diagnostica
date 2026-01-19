# Resumen Ejecutivo de Correcciones - Observaciones del Cliente

**Fecha:** 19 de enero de 2026  
**Origen:** DGTIC/DGADAE - Área Solicitante  
**Estado:** ✅ CORRECCIONES APLICADAS (Fase 1 de 2)

---

## I. CORRECCIONES COMPLETADAS ✅

### 1. Reglas de Negocio - Contradicciones Resueltas

#### A. Cargas Múltiples por Periodo
**Problema identificado:**  
❌ RF-24.1 limitaba "1 archivo FRV por periodo"  
❌ RF-16.6 indicaba "cada carga como solicitud independiente con consecutivo"  

**Corrección aplicada:**  
✅ **RF-24.1** actualizado: Permite múltiples cargas por CCT y periodo  
✅ **RF-24.3** agregado: Mantener historial completo (válidas e inválidas)  
✅ Cada envío registrado con consecutivo único, sin sobreescritura

**Archivos modificados:**
- [REQUERIMIENTOS_Y_CASOS_DE_USO.md](REQUERIMIENTOS_Y_CASOS_DE_USO.md) - RF-24.1, RF-24.3

---

#### B. Modelo de Usuarios y Credenciales
**Problema identificado:**  
❌ "Un CCT solo puede tener una credencial" (contradicción institucional)  
❌ "Usuario = CCT, Contraseña = correo" (modelo erróneo)  
❌ No contemplaba supervisores gestionando múltiples escuelas

**Corrección aplicada:**  
✅ **RF-14.2** actualizado: Relación Usuario ↔ CCT es **1:N**  
✅ **RF-14.3** agregado: Tabla intermedia USUARIO_CCT para permisos granulares  
✅ **RF-14.4** actualizado: Rol "Supervisor" para múltiples escuelas  
✅ **RF-16.4** corregido: Usuario = correo (reutilizable multi-CCT)  
✅ **RF-16.11** agregado: Consulta consolidada de resultados bajo un login  

**Modelo definitivo:**
- **Usuario**: Identificado por correo electrónico (único)
- **Credenciales**: Asociadas al usuario, no al CCT
- **Relación**: Un usuario puede gestionar N CCT
- **Casos de uso**: Supervisor de zona, director con varios planteles

**Archivos modificados:**
- [REQUERIMIENTOS_Y_CASOS_DE_USO.md](REQUERIMIENTOS_Y_CASOS_DE_USO.md) - RF-14, RF-16
- [ESTRUCTURA_DE_DATOS.md](ESTRUCTURA_DE_DATOS.md) - Descripción CREDENCIALES_EIA2

---

#### C. Contraseñas - Flujo Unificado
**Problema identificado:**  
❌ "Contraseña = correo electrónico" (ESTRUCTURA_DE_DATOS línea 2089)  
❌ Contraseña temporal aleatoria (RF-16.4, RF-18.1)  
❌ Conflicto con reglas de hashing, expiración, bloqueo

**Corrección aplicada:**  
✅ **RF-16.4** actualizado: Contraseña aleatoria de 12 caracteres (mayúsculas, minúsculas, números, símbolos)  
✅ **RF-18.1** completado: Generación automática en primera carga válida  
✅ **RF-18.6** agregado: Almacenamiento con bcrypt ≥12 rounds o argon2id  
✅ **RF-18.7** agregado: Notificación por email + PDF descargable  

**Flujo definitivo:**
1. Primera carga válida → Sistema genera contraseña aleatoria 12 chars
2. Envío por email + PDF con credenciales
3. Primer login → Forzar cambio de contraseña
4. Aplicar reglas completas: hashing, expiración 90 días, bloqueo 5 intentos

**Archivos modificados:**
- [REQUERIMIENTOS_Y_CASOS_DE_USO.md](REQUERIMIENTOS_Y_CASOS_DE_USO.md) - RF-16.4, RF-18.1, RF-18.6, RF-18.7
- [ESTRUCTURA_DE_DATOS.md](ESTRUCTURA_DE_DATOS.md) - Descripción CREDENCIALES_EIA2

---

### 2. Niveles de Integración del Aprendizaje (NIA) - Modelo Rediseñado

#### Problema identificado:
❌ Campo `nivel_integracion VARCHAR(20)` único en EVALUACIONES  
❌ **Realidad**: NIA es por estudiante Y por Campo Formativo (4 NIAs por alumno)  
❌ Campo `competencia_alcanzada BOOLEAN` sin fundamento institucional  
❌ Dos marcos mezclados: "niveles de logro" vs "niveles de integración"  

#### Corrección aplicada:

**A. Nuevo Catálogo: CAT_NIVELES_INTEGRACION**
```sql
CREATE TABLE CAT_NIVELES_INTEGRACION (
    id_nia          SERIAL PRIMARY KEY,
    clave           VARCHAR(2) UNIQUE,     -- ED, EP, ES, SO
    nombre          VARCHAR(50),            -- En Desarrollo, En Proceso...
    descripcion     TEXT,
    rango_min       INT,                    -- 0-3
    rango_max       INT,                    -- 0-3
    color_hex       VARCHAR(7),
    orden_visual    INT,
    vigente         BOOLEAN
);
```

**Datos oficiales:**
- **ED** (En Desarrollo): rango 0, requiere apoyo adicional
- **EP** (En Proceso): rango 1, muestra avances, requiere refuerzo
- **ES** (Esperado): rango 2, cumple aprendizajes esperados
- **SO** (Sobresaliente): rango 3, supera aprendizajes esperados

**B. Nuevo Catálogo: CAT_CAMPOS_FORMATIVOS**
```sql
CREATE TABLE CAT_CAMPOS_FORMATIVOS (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(10) UNIQUE,    -- ENS, HYC, LEN, SPC, F5
    nombre          VARCHAR(100),
    descripcion     TEXT,
    orden_visual    INT,
    vigente         BOOLEAN
);
```

**Datos oficiales:**
- **ENS**: Enseñanza (Español y Matemáticas)
- **HYC**: Historia y Civismo (Ética, Naturaleza y Sociedades)
- **LEN**: Lenguaje y Comunicación (Lenguajes)
- **SPC**: Saberes y Pensamiento Científico
- **F5**: Formato 5 (Reporte individual consolidado)

**C. Nueva Tabla: NIVELES_INTEGRACION_ESTUDIANTE**
```sql
CREATE TABLE NIVELES_INTEGRACION_ESTUDIANTE (
    id                   UUID PRIMARY KEY,
    id_estudiante        UUID REFERENCES ESTUDIANTES(id),
    id_campo_formativo   INT REFERENCES CAT_CAMPOS_FORMATIVOS(id),
    id_periodo           INT REFERENCES PERIODOS_EVALUACION(id),
    id_nia               INT REFERENCES CAT_NIVELES_INTEGRACION(id_nia),
    valoracion_promedio  NUMERIC(4,2),
    total_materias       INT,
    materias_evaluadas   INT,
    calculado_en         TIMESTAMP,
    calculado_por        VARCHAR(50),    -- SISTEMA, MANUAL, AJUSTE
    validado             BOOLEAN,
    validado_por         UUID,
    validado_en          TIMESTAMP,
    
    UNIQUE (id_estudiante, id_campo_formativo, id_periodo)
);
```

**D. Modificación a EVALUACIONES**
```sql
-- ❌ ELIMINADOS (obsoletos):
ALTER TABLE EVALUACIONES 
    DROP COLUMN nivel_integracion,
    DROP COLUMN competencia_alcanzada;
```

**E. Trigger Automático**
- Trigger `calcular_nia_estudiante()` ejecuta tras validación de evaluación
- Calcula promedio por campo formativo
- Determina NIA según rangos del catálogo
- Inserta/actualiza en NIVELES_INTEGRACION_ESTUDIANTE

**Beneficios:**
- ✅ Modelo normalizado y trazable
- ✅ 4 NIAs por estudiante (ENS, HYC, LEN, SPC)
- ✅ Auditoría completa (quién, cuándo, cómo se calculó)
- ✅ Escalable para nuevos campos formativos
- ✅ Reportes optimizados con índices especializados

**Archivos modificados:**
- [ESTRUCTURA_DE_DATOS.md](ESTRUCTURA_DE_DATOS.md) - Nuevas tablas + modificación EVALUACIONES
- [CORRECCIONES_MODELO_NIA.md](CORRECCIONES_MODELO_NIA.md) - Documento técnico completo

---

## II. CORRECCIONES PENDIENTES ⏳

### 3. Normalización de Base de Datos (EN PROCESO)

**Problemas identificados:**
❌ Uso de ENUM donde existen catálogos oficiales:
- `nivel ENUM` → debe ser `id_nivel_educativo FK`
- `estado ENUM` → debe ser `id_estado FK`
- `ciclo_escolar VARCHAR` → debe ser `id_ciclo FK`

❌ Duplicidad de campos territoriales en ESCUELAS  
❌ Valores literales en lugar de llaves foráneas  
❌ Longitudes VARCHAR inconsistentes (CURP, CCT, email)  
❌ Tabla EVALUACIONES con uso redundante vs tablas PRE/PRI/SEC  

**Correcciones planificadas:**
- Crear CAT_ESTADOS_SOLICITUD
- Actualizar todas las referencias ENUM → FK
- Consolidar campos territoriales con id_entidad
- Estandarizar longitudes: CURP=18, CCT=10, email=255
- Revisar necesidad de tabla EVALUACIONES

**Esfuerzo estimado:** 12 horas

---

### 4. Catálogos Oficiales EIA 2025 y CCT SIGED

**Insumos recibidos:**
- 📥 Catálogos EIA 2025 (estructura validada DGTIC)
- 📥 Catálogo CCT SIGED (fuente oficial actualizada)

**Acciones requeridas:**
- Actualizar seeds de base de datos con catálogos oficiales
- Implementar validaciones automáticas basadas en catálogos
- Sincronización con API SIGED para actualizaciones
- Redefinir reglas de negocio alineadas a catálogos

**Esfuerzo estimado:** 4 horas

---

## III. IMPACTO EN DOCUMENTACIÓN

### Archivos actualizados en esta fase:

| Documento | Secciones Modificadas | Estado |
|-----------|----------------------|--------|
| **BITACORA_CAMBIOS.md** | Nueva entrada 2026-01-19 con observaciones cliente | ✅ |
| **REQUERIMIENTOS_Y_CASOS_DE_USO.md** | RF-14, RF-16, RF-18, RF-24 | ✅ |
| **ESTRUCTURA_DE_DATOS.md** | EVALUACIONES, CREDENCIALES_EIA2, MATERIAS, 3 tablas nuevas | ✅ |
| **CORRECCIONES_MODELO_NIA.md** | Documento técnico completo (nuevo) | ✅ |
| **RESUMEN_CORRECCIONES_CLIENTE.md** | Este documento (nuevo) | ✅ |

### Pendientes de actualización:

| Documento | Cambios Requeridos | Prioridad |
|-----------|-------------------|-----------|
| **web/doc/casos_uso.md** | CU-16, CU-17, CU-18 (flujos de credenciales/NIAs) | 🔴 P0 |
| **web/doc/srs.md** | Especificaciones técnicas de NIAs | 🟡 P1 |
| **FLUJO_OPERATIVO_OFICIAL.md** | Proceso de cálculo NIAs actualizado | 🟡 P1 |
| **ANALISIS_CALIDAD_PSP_RUP.md** | Impacto de correcciones en score | 🟡 P1 |
| **Triggers y SP** | Eliminar referencias a campos obsoletos | 🔴 P0 |
| **Reportes** | Actualizar consultas para usar nueva tabla NIAs | 🔴 P0 |

---

## IV. MÉTRICAS DE CORRECCIÓN

| Categoría | Problemas Identificados | Problemas Corregidos | Pendientes |
|-----------|------------------------|---------------------|------------|
| **I. Reglas de Negocio** | 3 contradicciones | 3 | 0 |
| **II. Modelo NIA** | 4 problemas conceptuales | 4 | 0 |
| **III. Normalización BD** | 6 problemas estructurales | 0 | 6 |
| **IV. Catálogos Oficiales** | 2 insumos pendientes | 0 | 2 |
| **Total** | **15** | **7 (47%)** | **8 (53%)** |

---

## V. PRÓXIMOS PASOS INMEDIATOS

### Fase 2 de Correcciones (Estimado: 16 horas)

1. **Normalización completa de ENUMs** (8h)
   - Crear CAT_ESTADOS_SOLICITUD
   - Reemplazar todos los ENUM por FK
   - Migración de datos existentes

2. **Integración catálogos oficiales** (4h)
   - Importar CAT_EIA_2025
   - Importar CAT_CCT_SIGED
   - Actualizar validaciones automáticas

3. **Actualización de triggers y SPs** (2h)
   - Eliminar referencias a `nivel_integracion` obsoleto
   - Eliminar referencias a `competencia_alcanzada`
   - Actualizar lógica de validación

4. **Actualización de casos de uso** (2h)
   - CU-16: Plataforma EIA (credenciales multi-CCT)
   - CU-17: Gestión de sesiones
   - CU-18: Gestión de contraseñas

---

## VI. VALIDACIÓN Y APROBACIÓN

**Correcciones Fase 1:**
- ✅ Reglas de negocio unificadas
- ✅ Modelo NIA institucional definido
- ✅ Modelo usuario-credencial corregido
- ✅ Documentación técnica actualizada

**Requiere validación de:**
- 📋 DGADAE: Confirmar modelo NIA (4 niveles, 4 campos formativos)
- 📋 DGTIC: Validar catálogos oficiales recibidos
- 📋 Área Solicitante: Aprobar modelo usuario-CCT (1:N)

**Estado general:** ✅ **FASE 1 COMPLETADA** - 47% de correcciones aplicadas  
**Siguiente entrega:** Fase 2 - Normalización BD + Catálogos (16h)

---

**Actualizado:** 19 de enero de 2026  
**Responsable:** Equipo de Desarrollo  
**Próxima revisión:** 20 de enero de 2026
