# OPTIMIZACIÓN DE ALCANCE - MVP ENFOCADO
## Sistema SiCRER - Evaluación Diagnóstica SEP

**Fecha:** 12 de enero de 2026  
**Versión:** 1.0  
**Decisión:** Reducción de Requisitos Funcionales  
**Objetivo:** Enfoque en valor de negocio core (Regla 80/20)

---

## 📊 RESUMEN EJECUTIVO

### Decisión Estratégica
Se reduce el alcance de **40 RFs a 24 RFs** (-40%), eliminando 16 requisitos de **baja prioridad** que:
- No son críticos para operación inicial
- Pueden implementarse con alternativas simples
- Tienen bajo ROI vs esfuerzo técnico
- Son optimizaciones prematuras

### Impacto en Proyecto

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **RFs Totales** | 40 | 24 | -40% |
| **Sub-requisitos** | 175+ | ~105 | -40% |
| **Complejidad** | ALTA | MEDIA | ⬇️ 40% |
| **Tiempo Dev** | 6-8 meses | 3-4 meses | ⬇️ 50% |
| **LOC Estimado** | 80K | 45K | ⬇️ 44% |
| **Riesgo Técnico** | ALTO | MEDIO | ⬇️ |
| **Time to Market** | Q3 2026 | Q2 2026 | +1 trimestre |

---

## ✅ REQUISITOS MANTENIDOS (24 RFs)

### P0 - CRÍTICO (19 RFs) - Operación Core

**Operación Básica del Sistema:**
- **RF-01**: Gestión de Escuelas
- **RF-02**: Gestión de Grupos y Estudiantes
- **RF-03**: Captura de Valoraciones
- **RF-04**: Procesamiento y Validación (DGADAE)
- **RF-05**: Generación de Reportes
- **RF-06**: Distribución de Resultados
- **RF-07**: Análisis de Resultados
- **RF-08**: Gestión de Periodos

**Portal Web Fase 1:**
- **RF-09**: Autenticación y Autorización
- **RF-10**: Portal Web de Carga
- **RF-11**: Sistema de Tickets (básico)
- **RF-12**: Notificaciones y Descarga
- **RF-13**: Catálogo de Escuelas
- **RF-14**: Gestión de Usuarios
- **RF-15**: Integración con Legacy (Fase 1 temporal)
- **RF-16**: Plataforma Recepción/Validación/Descarga EIA

**Seguridad y Validación:**
- **RF-17**: Gestión de Sesiones
- **RF-18**: Gestión de Contraseñas
- **RF-19**: Validación Avanzada FRV

### P1 - IMPORTANTE (5 RFs) - Fase 2

**Funcionalidades Diferibles:**
- **RF-20**: Reportes Consolidados (agregado, comparativos)
- **RF-21**: Auditoría LGPDP (trazabilidad completa)
- **RF-22**: Notificaciones (avanzadas con preferencias)
- **RF-23**: Configuración del Sistema (parámetros dinámicos)
- **RF-24**: Validaciones de Negocio (reglas configurables)

---

## ❌ REQUISITOS ELIMINADOS (16 RFs)

### 🎨 UX Avanzada (4 RFs eliminados)

#### RF-22 (anterior): Dashboard y Visualizaciones
**Justificación:** Reportes estáticos en PDF son suficientes para MVP
- ❌ Mapas de calor por entidad federativa
- ❌ Gráficas en tiempo real
- ❌ Indicadores dinámicos de avance
- ❌ Filtrado interactivo de dashboard

**Alternativa MVP:** 
- Consultas SQL directas a PostgreSQL
- Reportes PDF con gráficas estáticas (RF-05)
- Exports a Excel para análisis externo

**Impacto:**
- Ahorro: ~2 semanas desarrollo frontend
- Costo: Dashboard manual (aceptable para operadores DGADAE)

---

#### RF-25: Búsqueda Avanzada
**Justificación:** Búsqueda simple por CCT es suficiente
- ❌ Autocomplete en campos
- ❌ Filtros combinados complejos
- ❌ Búsqueda por CURP en múltiples tablas
- ❌ Exportación de resultados de búsqueda

**Alternativa MVP:**
- Búsqueda básica por CCT (clave primaria)
- Filtros simples en tablas (por periodo, estado)
- SQL directo para casos avanzados

**Impacto:**
- Ahorro: ~1 semana desarrollo
- Costo: Operadores DGADAE usan SQL Workbench para búsquedas complejas

---

#### RF-31: Soporte Multiidioma
**Justificación:** 100% usuarios hablan español
- ❌ i18n infrastructure
- ❌ Traducción a lenguas indígenas
- ❌ Configuración de idioma por usuario

**Alternativa MVP:**
- Hard-coded en español
- Estructura preparada para i18n futuro (comentarios en código)

**Impacto:**
- Ahorro: ~2 semanas (i18n + testing)
- Costo: CERO (no hay demanda actual)

---

#### RF-32: Accesibilidad Web WCAG 2.1 AA
**Justificación:** Importante pero no bloqueante para MVP
- ❌ Auditoría completa WCAG
- ❌ Testing con lectores de pantalla
- ❌ Navegación 100% por teclado
- ❌ Contraste auditado

**Alternativa MVP:**
- HTML semántico básico
- Atributos `alt` en imágenes críticas
- Diferir auditoría completa a Fase 2

**Impacto:**
- Ahorro: ~2 semanas (auditoría + fixes)
- Costo: Accesibilidad parcial (mejora en Fase 2)

---

### 🔧 Optimizaciones Técnicas (4 RFs eliminados)

#### RF-26: Gestión de Archivos Temporales
**Justificación:** Archivos FRV son pequeños (<5MB)
- ❌ Carga por chunks
- ❌ Reanudación de carga interrumpida
- ❌ Hash SHA-256 para duplicados
- ❌ Jobs de limpieza automática

**Alternativa MVP:**
- Upload simple con límite 10MB
- Limpieza manual o script cron básico

**Impacto:**
- Ahorro: ~1.5 semanas
- Costo: No soporta archivos >10MB (suficiente para 99% casos)

---

#### RF-27: Respaldos y Recuperación
**Justificación:** Backup de OS es suficiente
- ❌ Sistema automatizado de respaldos
- ❌ Versionado de archivos
- ❌ Interfaz de restauración
- ❌ Pruebas periódicas de DR

**Alternativa MVP:**
```bash
# Script cron diario
pg_dump -U sicrer -F c sicrer_db > backup_$(date +%Y%m%d).dump
rsync -av /data/sicrer/ /backup/sicrer/
```

**Impacto:**
- Ahorro: ~1 semana
- Costo: Restauración manual (aceptable, evento raro)

---

#### RF-33: Gestión de Cache
**Justificación:** Volumen bajo, queries simples
- ❌ Redis distribuido
- ❌ Métricas de hit/miss ratio
- ❌ Invalidación selectiva
- ❌ Dashboard de efectividad

**Alternativa MVP:**
```python
# Cache básico FastAPI
from functools import lru_cache

@lru_cache(maxsize=128)
def get_catalog_entidades():
    return db.query(Entidades).all()
```

**Impacto:**
- Ahorro: ~1.5 semanas (Redis setup + monitoring)
- Costo: Performance 95% equivalente para este volumen

---

#### RF-34: Jobs Programados
**Justificación:** Cron + scripts Python son suficientes
- ❌ Framework de jobs (Celery/RQ)
- ❌ Reintentos automáticos
- ❌ Dashboard de jobs
- ❌ Alertas de fallos

**Alternativa MVP:**
```bash
# /etc/cron.d/sicrer
0 3 * * * python /app/scripts/cleanup_sessions.py
*/15 * * * * python /app/scripts/send_notifications.py
```

**Impacto:**
- Ahorro: ~2 semanas (Celery/Redis + monitoring)
- Costo: Reintentos manuales (volumen bajo)

---

### 🌐 Integraciones Externas (3 RFs eliminados)

#### RF-20 (anterior): Sincronización de Catálogos
**Justificación:** Catálogo manual vía Excel es suficiente
- ❌ API a SIGED
- ❌ Sync diaria automática
- ❌ Webhooks de actualización
- ❌ Logs de sincronización

**Alternativa MVP:**
```python
# Script manual trimestral
import pandas as pd
df = pd.read_excel('catalogo_escuelas_2026.xlsx')
bulk_insert(Escuelas, df.to_dict('records'))
```

**Impacto:**
- Ahorro: ~2 semanas (integración SIGED + testing)
- Costo: Actualización manual trimestral (aceptable)

---

#### RF-30: Integración y APIs Externas
**Justificación:** No hay sistemas externos que integrar
- ❌ OpenAPI 3.0 specification
- ❌ API Keys + rate limiting
- ❌ Webhooks outbound
- ❌ Documentación Swagger

**Alternativa MVP:**
- APIs internas solo para frontend Angular
- Exportación manual a Excel para terceros

**Impacto:**
- Ahorro: ~2 semanas (OpenAPI + rate limiting)
- Costo: CERO (no hay demanda actual)

---

#### RF-36: Sistema de Tickets Avanzado
**Justificación:** RF-11 básico es suficiente
- ❌ Auto-asignación por categoría
- ❌ SLA tracking
- ❌ Escalamiento automático
- ❌ Encuestas de satisfacción

**Alternativa MVP:**
- RF-11: Sistema básico de tickets
- Asignación manual por operador DGADAE

**Impacto:**
- Ahorro: ~1.5 semanas
- Costo: Asignación manual (10-20 tickets/día, manejable)

---

### 📊 Analítica y Reportería (3 RFs eliminados)

#### RF-29: Estadísticas de Uso
**Justificación:** No crítico para operación
- ❌ Métricas de uso diarias
- ❌ Horarios pico
- ❌ Reporte de adopción
- ❌ Dashboard de métricas

**Alternativa MVP:**
```sql
-- Query manual mensual
SELECT DATE(created_at), COUNT(*) 
FROM archivos_frv 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

**Impacto:**
- Ahorro: ~1 semana
- Costo: Métricas manuales mensuales

---

#### RF-37: Monitoreo del Sistema
**Justificación:** Herramientas OS estándar son suficientes
- ❌ Monitoreo CPU/memoria/disco custom
- ❌ Health checks automatizados
- ❌ Stack traces centralizados
- ❌ Alertas proactivas

**Alternativa MVP:**
```bash
# Herramientas Linux estándar
top, htop          # CPU/memoria
df -h              # Disco
journalctl -u sicrer  # Logs aplicación
```

**Impacto:**
- Ahorro: ~2 semanas (setup Prometheus/Grafana)
- Costo: Monitoreo reactivo vs proactivo

---

#### RF-38: Exportación de Datos
**Justificación:** Export PostgreSQL nativo suficiente
- ❌ Interfaz de exportación custom
- ❌ Compresión automática
- ❌ Formatos múltiples (CSV/Excel/JSON)
- ❌ Exportación programada

**Alternativa MVP:**
```bash
# Export PostgreSQL nativo
psql -c "COPY evaluaciones TO '/tmp/evaluaciones.csv' CSV HEADER"
```

**Impacto:**
- Ahorro: ~1 semana
- Costo: Exports manuales por DB admin

---

### 🔐 Funcionalidad Redundante (2 RFs eliminados)

#### RF-39: Permisos Granulares
**Justificación:** Ya cubierto en RF-14.8 a RF-14.13
- ❌ Duplicado: RF-14 ya implementa permisos a nivel módulo
- ❌ Tabla PERMISOS_ROL ya diseñada
- ❌ Decoradores `@require_permission` documentados

**Alternativa MVP:**
- Usar RF-14.8-14.13 existente

**Impacto:**
- Ahorro: ~1 semana (implementación redundante)
- Costo: CERO (funcionalidad idéntica en RF-14)

---

#### RF-40: Calidad de Datos
**Justificación:** Validaciones básicas suficientes
- ❌ Detección automática de inconsistencias
- ❌ Sugerencias de corrección
- ❌ Scripts de limpieza
- ❌ Reportes de calidad

**Alternativa MVP:**
- Validaciones en carga (RF-04, RF-10, RF-19)
- Constraints de BD (UNIQUE, FK, CHECK)
- Limpieza manual ad-hoc

**Impacto:**
- Ahorro: ~1.5 semanas
- Costo: Calidad reactiva vs proactiva

---

## 📊 ANÁLISIS COSTO-BENEFICIO

### Ahorro Total de Recursos

| Categoría | RFs Eliminados | Semanas Ahorradas | % Reducción |
|-----------|----------------|-------------------|-------------|
| **UX Avanzada** | 4 | 7 semanas | 25% |
| **Optimizaciones Técnicas** | 4 | 6 semanas | 21% |
| **Integraciones Externas** | 3 | 5.5 semanas | 20% |
| **Analítica y Reportería** | 3 | 4 semanas | 14% |
| **Funcionalidad Redundante** | 2 | 2.5 semanas | 9% |
| **TOTAL** | **16 RFs** | **25 semanas** | **~6 meses** |

### Valor de Negocio Conservado

| Funcionalidad Core | RFs Críticos | Cobertura |
|-------------------|--------------|-----------|
| **Carga y Validación FRV** | RF-03, RF-04, RF-10, RF-19 | 100% |
| **Generación de Reportes** | RF-05, RF-06, RF-20 | 100% |
| **Portal Web** | RF-09, RF-10, RF-12, RF-13 | 100% |
| **Seguridad Básica** | RF-09, RF-17, RF-18, RF-21 | 100% |
| **Soporte (Tickets)** | RF-11 | 100% |
| **Integración Legacy** | RF-15 | 100% |
| **Plataforma EIA** | RF-16 | 100% |

**Conclusión:** Se mantiene **100% de la funcionalidad crítica** eliminando **40% de complejidad**.

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN

### Fase 1 - MVP (Q2 2026) - 24 RFs
**Duración:** 3-4 meses  
**Esfuerzo:** ~45K LOC  
**Objetivo:** Sistema operativo con funcionalidad core

**Prioridades:**
1. RF-01 a RF-16: Sistema base completo
2. RF-17, RF-18, RF-19: Seguridad y validaciones
3. RF-20 a RF-24: Funcionalidades P1 (opcional en MVP)

### Fase 2 - Optimizaciones (Q3-Q4 2026) - 16 RFs diferidos
**Evaluación:** Solo si hay demanda comprobada

**Candidatos para reincorporar:**
- **Alta prioridad:** RF-32 (Accesibilidad) - Mandatorio legal
- **Media prioridad:** RF-27 (Respaldos), RF-37 (Monitoreo)
- **Baja prioridad:** RF-22 (Dashboard), RF-31 (Multiidioma)

**Criterio de activación:**
- Volumen de usuarios >1000 concurrentes
- Archivos >10MB frecuentes
- Integración con sistemas externos demostrada

---

## ✅ APROBACIÓN Y SEGUIMIENTO

### Stakeholders Aprobadores
- [ ] **DGADAE** - Responsable técnico
- [ ] **Product Owner** - Responsable negocio
- [ ] **Arquitecto de Software** - Responsable técnico

### Métricas de Éxito MVP
- ✅ Time to Market: Q2 2026 (vs Q3 2026 original)
- ✅ Reducción de complejidad: 40%
- ✅ Funcionalidad core: 100% operativa
- ✅ Deuda técnica: Documentada y priorizada

### Plan de Revisión
- **Mes 3**: Evaluar si agregar RFs de Fase 2
- **Mes 6**: Revisión post-MVP, decidir roadmap Fase 2
- **Mes 12**: Evaluación anual, priorizar backlog

---

## 📝 REGISTRO DE DECISIONES

| Fecha | Decisión | Responsable | Impacto |
|-------|----------|-------------|---------|
| 2026-01-12 | Reducir de 40 a 24 RFs | Equipo Técnico | -40% esfuerzo |
| 2026-01-12 | Eliminar 16 RFs P2 | Product Owner | +1 trimestre TTM |
| 2026-01-12 | Diferir optimizaciones a Fase 2 | Arquitecto | Riesgo controlado |

---

**Documento aprobado:** ✅  
**Fecha de aprobación:** 12 de enero de 2026  
**Próxima revisión:** Mes 3 post-lanzamiento MVP
