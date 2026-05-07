# 📘 Guía Operativa: Tablas de Importación DBF
## Sistema de Evaluación Diagnóstica SEP

**Versión:** 1.0  
**Fecha:** 17 de marzo de 2026  
**Audiencia:** Personal operativo, validadores, supervisores de carga  
**Nivel:** No técnico - Operativo

---

## 👥 ¿Para Quién es Esta Guía?

Esta guía está diseñada para:
- ✅ **Personal operativo** que monitorea cargas de archivos
- ✅ **Validadores** que revisan errores en importaciones
- ✅ **Supervisores** que coordiman el proceso de carga
- ✅ **Coordinadores regionales** que reportan incidencias
- ❌ **NO es para desarrolladores** (ellos tienen ESTRUCTURA_DE_DATOS.md)

---

## 🎯 ¿Qué Son las Tablas de Importación?

Son **10 tablas temporales** en la base de datos que funcionan como una **"sala de espera"** para los datos que vienen de los archivos DBF del sistema SiCRER.

### Las 10 Tablas

| Tabla | Nivel Educativo | Archivo que Procesa |
|-------|----------------|---------------------|
| **PRE3** | Preescolar 3er grado | `pre3.dbf` |
| **PRI1** | Primaria 1er grado | `pri1.dbf` |
| **PRI2** | Primaria 2do grado | `pri2.dbf` |
| **PRI3** | Primaria 3er grado | `pri3.dbf` |
| **PRI4** | Primaria 4to grado | `pri4.dbf` |
| **PRI5** | Primaria 5to grado | `pri5.dbf` |
| **PRI6** | Primaria 6to grado | `pri6.dbf` |
| **SEC1** | Secundaria 1er grado | `sec1.dbf` |
| **SEC2** | Secundaria 2do grado | `sec2.dbf` |
| **SEC3** | Secundaria 3er grado | `sec3.dbf` |

---

## 🔄 Flujo de Trabajo Completo

```
┌─────────────────┐
│  1. ARCHIVOS    │
│     DBF         │  ← Archivos desde SiCRER (sistema legacy)
│  (pre3.dbf,     │
│   pri1.dbf...)  │
└────────┬────────┘
         │
         ↓ [CARGA AUTOMÁTICA]
         │
┌────────▼────────┐
│  2. TABLAS      │
│     STAGING     │  ← ÁREA DE ESPERA TEMPORAL
│  (PRE3, PRI1,   │    Datos crudos sin validar
│   PRI2...)      │
└────────┬────────┘
         │
         ↓ [VALIDACIÓN AUTOMÁTICA]
         │
         ├─→ ❌ ERRORES → Reporte de errores
         │
         ↓ ✅ DATOS VÁLIDOS
         │
┌────────▼────────┐
│  3. TABLAS      │
│     FINALES     │  ← DATOS LIMPIOS Y VALIDADOS
│  - ESTUDIANTES  │    Listos para reportes
│  - EVALUACIONES │
│  - GRUPOS       │
└────────┬────────┘
         │
         ↓ [LIMPIEZA AUTOMÁTICA]
         │
┌────────▼────────┐
│  4. STAGING     │
│     LIMPIO      │  ← Tablas vaciadas, listas para
│                 │    siguiente carga
└─────────────────┘
```

---

## 📊 ¿Qué Datos Contienen?

Cada tabla staging almacena **temporalmente**:

### Información de la Escuela
- ✅ CCT (Clave de Centro de Trabajo)
- ✅ Nombre de la escuela
- ✅ Turno
- ✅ Emails de contacto

### Información del Estudiante
- ✅ Matrícula
- ✅ Nombre completo
- ✅ Género
- ✅ Grupo
- ✅ Número de lista

### Evaluaciones
- ✅ Calificaciones EIA (Evaluación Interna de Aprendizajes)
  - Primera aplicación (eia1_c1_a1, eia1_c1_a2, etc.)
  - Segunda aplicación (eia2_c1_a1, eia2_c2_a1, etc.)
- ✅ Indicadores por materia:
  - **PLEN** - Lenguaje
  - **PSPC** - Pensamiento Científico
  - **PENS** - Enseñanza General
  - **PHYC** - Historia y Civismo

---

## ⏱️ Ciclo de Vida de los Datos

### 1️⃣ **Carga (5-15 minutos)**
- Sistema automático lee archivos DBF
- Copia datos tal cual a tablas staging
- **NO se valida nada aún**

### 2️⃣ **Validación (2-10 minutos)**
Sistema verifica automáticamente:
- ✅ CCT válido y registrado
- ✅ Nivel educativo correcto
- ✅ Calificaciones en rango 0-3
- ✅ Campos obligatorios completos
- ✅ Estructura del archivo correcta

### 3️⃣ **Procesamiento (10-30 minutos)**
Si todo es válido:
- ✅ Datos se copian a tablas finales normalizadas
- ✅ Se crean registros de estudiantes
- ✅ Se registran evaluaciones
- ✅ Se calculan promedios y estadísticas

### 4️⃣ **Limpieza (1 minuto)**
- ✅ Tablas staging se vacían automáticamente
- ✅ Quedan listas para siguiente carga

---

## ✅ ¿Qué DEBES Hacer?

### Como Personal Operativo

#### 🔍 Monitoreo Diario
```
1. Revisar logs de carga cada hora
2. Verificar que archivos DBF llegaron correctamente
3. Confirmar que validación se completó
4. Reportar cualquier anomalía
```

#### 📋 Verificaciones Básicas
- ✅ Revisar que los archivos DBF tengan el nombre correcto
  - Ejemplo correcto: `pre3.dbf`, `pri1.dbf`
  - Ejemplo incorrecto: `PRE3.DBF`, `preescolar3.dbf`
  
- ✅ Verificar tamaño de archivos (referencia):
  - Preescolar: ~45-50 KB
  - Primaria: ~45-65 KB  
  - Secundaria: ~50-60 KB

- ✅ Confirmar fecha de archivos (deben ser recientes)

#### 📞 Reportar Problemas
Contactar a equipo técnico si:
- ❌ Carga tarda más de 30 minutos
- ❌ Aparecen errores de validación repetidos
- ❌ Archivos no se procesan después de 1 hora
- ❌ Reportes de error no se generan

---

## ⛔ ¿Qué NO DEBES Hacer?

### 🚫 PROHIBIDO - Acciones Peligrosas

❌ **NO modificar datos directamente en tablas staging**
- Razón: Los cambios se perderán en la limpieza automática
- Alternativa: Solicitar corrección en archivo DBF origen

❌ **NO borrar manualmente tablas o registros**
- Razón: Interrumpes el proceso automático
- Alternativa: Esperar limpieza automática

❌ **NO ejecutar comandos SQL sin autorización**
- Razón: Puedes dañar la estructura de la base de datos
- Alternativa: Solicitar asistencia técnica

❌ **NO copiar datos de staging a tablas finales manualmente**
- Razón: Saltarías validaciones críticas
- Alternativa: Dejar que el proceso automático funcione

❌ **NO reintentar carga mientras una está en proceso**
- Razón: Crearás duplicados y errores
- Alternativa: Esperar a que termine la carga actual

---

## 🔍 Monitoreo y Alertas

### Señales de que Todo va Bien ✅

| Indicador | Estado Normal |
|-----------|---------------|
| **Tiempo de carga** | 5-15 minutos |
| **Tiempo de validación** | 2-10 minutos |
| **Tiempo de procesamiento** | 10-30 minutos |
| **Registros procesados** | 95-100% sin errores |
| **Tablas staging** | Vacías después de procesamiento |

### Señales de Alerta ⚠️

| Problema | Causa Probable | Acción |
|----------|----------------|--------|
| Carga tarda +30 min | Archivo muy grande o dañado | Reportar a técnicos |
| Validación +50% errores | Archivo mal formateado | Revisar archivo fuente |
| Staging no se limpia | Proceso interrumpido | Contactar soporte |
| Archivo no se procesa | Nombre incorrecto | Verificar nomenclatura |

---

## 📋 Procedimientos Operativos

### Procedimiento 1: Verificar Carga Exitosa

```
1. Abrir herramienta de monitoreo
2. Buscar el archivo DBF procesado
3. Verificar:
   ✅ Estado: "PROCESADO"
   ✅ Errores: "0" o menos de 5%
   ✅ Tabla staging: "LIMPIA"
4. Si todo correcto: Marcar como completado
5. Si hay errores: Pasar a Procedimiento 2
```

### Procedimiento 2: Atender Errores de Validación

```
1. Abrir reporte de errores generado
2. Identificar tipo de error:
   
   ERROR COMÚN 1: "CCT no válido"
   → Verificar CCT en catálogo oficial
   → Solicitar corrección a escuela
   
   ERROR COMÚN 2: "Valor fuera de rango (0-3)"
   → Revisar calificaciones en archivo Excel
   → Regenerar DBF correcto
   
   ERROR COMÚN 3: "Campo obligatorio vacío"
   → Completar datos faltantes
   → Volver a cargar archivo

3. Documentar error en bitácora
4. Solicitar nueva carga con archivo corregido
```

### Procedimiento 3: Escalamiento de Incidencias

```
NIVEL 1 - Personal Operativo (Tú)
├─ Verificar estado de carga
├─ Revisar logs básicos
└─ Si no se resuelve en 30 min → NIVEL 2

NIVEL 2 - Supervisor de Validación
├─ Revisar reportes de error
├─ Validar archivos fuente
└─ Si problema persiste → NIVEL 3

NIVEL 3 - Equipo Técnico
├─ Revisar base de datos
├─ Analizar logs del sistema
└─ Aplicar correcciones técnicas
```

---

## ❓ Preguntas Frecuentes (FAQ)

### 1. ¿Puedo ver los datos mientras se procesan?
✅ **Sí**, pero solo para monitoreo. **NO modifiques nada**.

### 2. ¿Por qué se borran los datos de staging?
✅ **Es normal**. Son tablas temporales que se limpian automáticamente después de procesar. Los datos **SÍ están guardados** en las tablas finales.

### 3. ¿Qué pasa si se interrumpe el proceso a la mitad?
⚠️ El sistema automáticamente reintentará o marcará como error. Reporta a soporte técnico.

### 4. ¿Puedo cargar múltiples archivos DBF al mismo tiempo?
✅ **Sí**, el sistema los procesa en cola. Pero no recargues el mismo archivo.

### 5. ¿Cómo sé si mi archivo fue procesado correctamente?
✅ Revisa:
- Log de sistema muestra "COMPLETADO"
- Tabla staging está vacía
- Reporte PDF generado sin errores

### 6. ¿Qué hago si veo datos "extraños" en staging?
⚠️ **NO los modifiques**. Reporta inmediatamente para que técnicos revisen el archivo DBF origen.

### 7. ¿Cada cuánto se limpian las tablas staging?
✅ **Automáticamente** después de cada procesamiento exitoso (normalmente cada 45-60 minutos).

### 8. ¿Puedo forzar la limpieza de staging manualmente?
❌ **NO**. Podría interrumpir un proceso en curso. Si es necesario, solicítalo a equipo técnico.

---

## 📊 Glosario de Términos

| Término | Significado |
|---------|-------------|
| **DBF** | Formato de archivo de base de datos (dBase File) usado por SiCRER |
| **SiCRER** | Sistema de Captura y Reporteo de Evaluación (sistema antiguo) |
| **Staging** | Área temporal donde llegan datos antes de validarse |
| **Tabla temporal** | Tabla que se limpia automáticamente después de usar |
| **Validación** | Proceso de verificar que datos sean correctos |
| **Normalización** | Proceso de organizar datos en estructura correcta |
| **CCT** | Clave de Centro de Trabajo (identificador único de escuela) |
| **EIA** | Evaluación Interna de Aprendizajes |
| **TRUNCATE** | Operación técnica que vacía una tabla (limpieza) |

---

## 🆘 Troubleshooting - Problemas Comunes

### Problema 1: "Archivo no se carga"

**Síntomas:**
- Archivo DBF aparece en carpeta pero no se procesa
- No hay actividad en logs después de 30 minutos

**Soluciones:**
1. ✅ Verificar nombre exacto del archivo (debe ser `pre3.dbf`, no `PRE3.DBF`)
2. ✅ Confirmar que archivo no esté abierto en otro programa
3. ✅ Revisar tamaño (no debe ser 0 KB)
4. ✅ Reportar a soporte si persiste

---

### Problema 2: "Muchos errores de validación"

**Síntomas:**
- Reporte muestra +50% de registros con error
- Datos no pasan a tablas finales

**Soluciones:**
1. ✅ Revisar archivo Excel origen en SiCRER
2. ✅ Verificar que calificaciones estén en rango 0-3
3. ✅ Confirmar que campos obligatorios estén llenos
4. ✅ Regenerar archivo DBF desde SiCRER
5. ✅ Volver a intentar carga

---

### Problema 3: "Staging no se limpia"

**Síntomas:**
- Tablas staging tienen datos viejos de días anteriores
- Nueva carga no se procesa

**Soluciones:**
1. ⚠️ **NO intentes limpiar manualmente**
2. ✅ Verificar que proceso anterior terminó (revisar logs)
3. ✅ Reportar inmediatamente a equipo técnico
4. ✅ Esperar instrucciones antes de nueva carga

---

### Problema 4: "Datos duplicados"

**Síntomas:**
- Estudiantes aparecen dos veces
- Evaluaciones repetidas

**Soluciones:**
1. ✅ Verificar que no se haya cargado el mismo archivo dos veces
2. ✅ Revisar logs para identificar carga duplicada
3. ✅ Reportar a equipo técnico para limpieza de duplicados
4. ✅ Documentar en bitácora para evitar repetir

---

## 📞 Contactos y Soporte

### Horarios de Atención
- **Lunes a Viernes:** 9:00 AM - 6:00 PM
- **Sábados:** 9:00 AM - 2:00 PM  
- **Emergencias:** 24/7 (solo incidencias críticas)

### Canales de Soporte

**Nivel 1 - Consultas Operativas**
- 📧 Email: soporte.eia@sep.gob.mx
- 📞 Teléfono: 55-XXXX-XXXX ext. 1001
- ⏱️ Tiempo de respuesta: 2-4 horas

**Nivel 2 - Incidencias Técnicas**
- 📧 Email: incidencias.eia@sep.gob.mx
- 📞 Teléfono: 55-XXXX-XXXX ext. 2001
- ⏱️ Tiempo de respuesta: 1-2 horas

**Nivel 3 - Emergencias Críticas**
- 📞 Teléfono: 55-XXXX-XXXX ext. 9999
- 💬 WhatsApp: 55-XXXX-XXXX (solo emergencias)
- ⏱️ Tiempo de respuesta: Inmediato

---

## 📝 Bitácora de Operaciones

### Registro Requerido por Carga

Para cada archivo DBF procesado, registrar:

```
Fecha: _______________
Hora de inicio: _______________
Archivo: _______________ (pre3.dbf, pri1.dbf, etc.)
Tamaño: _______________ KB
CCT: _______________
Escuela: _______________

Estado de Carga:
□ Completada sin errores
□ Completada con errores (<5%)
□ Completada con errores (>5%)
□ Fallida

Tiempo total: _______________ minutos

Observaciones:
_________________________________________________
_________________________________________________

Operador: _______________
Supervisor: _______________
```

---

## 📚 Recursos Adicionales

### Documentación Relacionada

Para más información técnica, consulta:

- 📄 **[ESTRUCTURA_DE_DATOS.md](ESTRUCTURA_DE_DATOS.md)** - Estructura técnica completa de BD
- 📄 **[README.md](README.md)** - Información general del sistema SiCRER
- 📄 **[FLUJO_OPERATIVO_OFICIAL.md](FLUJO_OPERATIVO_OFICIAL.md)** - Flujo completo del proceso
- 📄 **[ESTIMACION_INFRAESTRUCTURA_VOLUMETRIA.md](ESTIMACION_INFRAESTRUCTURA_VOLUMETRIA.md)** - Volumetría y capacidades

### Capacitación

- 🎓 **Curso básico:** "Monitoreo de Cargas DBF" (2 horas)
- 🎓 **Curso intermedio:** "Validación y Troubleshooting" (4 horas)
- 🎓 **Manual de usuario:** Sistema de monitoreo (PDF)

---

## 📅 Historial de Cambios

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 17-mar-2026 | Documento inicial | Equipo Técnico |

---

## ✅ Checklist de Inicio de Operaciones

Antes de comenzar tu turno, verifica:

- [ ] Acceso a sistema de monitoreo funcionando
- [ ] Credenciales actualizadas
- [ ] Logs del turno anterior revisados
- [ ] Bitácora de operaciones a la mano
- [ ] Contactos de soporte disponibles
- [ ] Carpeta de archivos DBF accesible
- [ ] Conexión a base de datos estable
- [ ] Herramientas de reporte funcionando

---

**🎯 Recuerda:** Tu trabajo es **monitorear y reportar**, no modificar datos directamente. Ante cualquier duda, siempre contacta a soporte técnico.

---

*Documento generado el 17 de marzo de 2026 como parte del Sistema de Evaluación Diagnóstica SEP*  
*Para sugerencias y mejoras: documentacion.eia@sep.gob.mx*
