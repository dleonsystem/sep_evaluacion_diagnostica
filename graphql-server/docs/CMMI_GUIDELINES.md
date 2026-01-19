# Guías CMMI (Capability Maturity Model Integration)

## Versión: 1.0.0
## Fecha: 19 de enero de 2026
## Autor: SEP - Evaluación Diagnóstica

---

## 1. Introducción

Este documento describe cómo el proyecto GraphQL EIA implementa prácticas de CMMI Level 3, enfocándose en la gestión de procesos y mejora continua.

## 2. Niveles CMMI y Cumplimiento

### 2.1 Nivel 1: Initial (Cumplido)
✅ Procesos impredecibles, mal controlados y reactivos

**Cumplimiento**: El proyecto ha superado este nivel estableciendo procesos documentados.

### 2.2 Nivel 2: Managed (Cumplido)
✅ Proyectos gestionados
✅ Requisitos gestionados
✅ Planificación de proyectos

**Áreas de Proceso Implementadas**:
- Requirements Management (REQM)
- Project Planning (PP)
- Project Monitoring and Control (PMC)
- Configuration Management (CM)
- Process and Product Quality Assurance (PPQA)

### 2.3 Nivel 3: Defined (Objetivo Actual)
🎯 Procesos caracterizados y bien entendidos
🎯 Procesos estándar de la organización

**Áreas de Proceso a Implementar**:
- Requirements Development (RD) ✅
- Technical Solution (TS) ✅
- Product Integration (PI) ⏳
- Verification (VER) ✅
- Validation (VAL) ⏳
- Organizational Process Focus (OPF) ⏳
- Organizational Process Definition (OPD) ⏳
- Organizational Training (OT) ⏳

## 3. Áreas de Proceso CMMI Nivel 3

### 3.1 Requirements Development (RD)

#### Prácticas Específicas

**SP 1.1: Develop Customer Requirements**
```markdown
Ubicación: REQUERIMIENTOS_Y_CASOS_DE_USO.md

Proceso:
1. Reuniones con stakeholders (SEP)
2. Documentación de necesidades
3. Validación con usuarios finales
4. Priorización de requisitos
```

**SP 1.2: Develop Product Requirements**
```typescript
/**
 * Requisito funcional documentado
 * @requirements RF-01: Control de acceso basado en roles
 * @priority Alta
 * @stakeholder SEP - Coordinación Federal
 * @validation Casos de uso CU-01, CU-02
 */
```

**SP 2.1: Establish Operational Concepts**
```markdown
Concepto operacional definido en:
- vision_document.md
- casos_uso.md
- FLUJO_OPERATIVO_OFICIAL.md
```

**SP 3.1: Analyze Requirements**
```markdown
Análisis de requisitos incluye:
- Trazabilidad bidireccional
- Matriz de dependencias
- Análisis de impacto de cambios
```

### 3.2 Technical Solution (TS)

#### Prácticas Específicas

**SP 1.1: Develop Alternative Solutions**
```markdown
## Alternativas Evaluadas

### Opción 1: REST API
Pros: Estándar, ampliamente conocido
Contras: Over-fetching, múltiples endpoints

### Opción 2: GraphQL (SELECCIONADA)
Pros: Flexibilidad, single endpoint, type-safe
Contras: Curva de aprendizaje

### Justificación:
GraphQL seleccionado por:
- Optimización de queries
- Tipado fuerte
- Mejor experiencia de desarrollo con agentes IA
```

**SP 2.1: Design Product or Product Component**
```typescript
/**
 * Diseño de componente documentado
 * @design-decision Usar Apollo Server por:
 *   - Soporte maduro
 *   - Plugins extensibles
 *   - Integración con TypeScript
 * @alternatives Consideradas: Express-GraphQL, Type-GraphQL
 * @rationale Apollo tiene mejor ecosistema y documentación
 */
```

**SP 3.1: Implement Design**
```markdown
Implementación siguiendo:
- Estándares de código PSP
- Principios SOLID
- Patrones de diseño documentados
- Code reviews obligatorias
```

### 3.3 Product Integration (PI)

#### Estrategia de Integración

**SP 1.1: Prepare for Product Integration**
```markdown
## Plan de Integración

### Secuencia de Integración
1. Módulos de base de datos
2. Capa de servicios
3. Resolvers de GraphQL
4. Autenticación y autorización
5. Validaciones de negocio

### Ambiente de Integración
- Docker Compose para servicios locales
- CI/CD pipeline en GitHub Actions
- Ambiente de staging en Azure
```

**SP 2.1: Assemble Product Components**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    # ...
  
  graphql-server:
    build: .
    depends_on:
      - postgres
    # ...
  
  pgadmin:
    image: dpage/pgadmin4
    # ...
```

### 3.4 Verification (VER)

#### Prácticas Específicas

**SP 1.1: Select Work Products for Verification**
```markdown
Productos de trabajo a verificar:
- Código fuente (100%)
- Documentación técnica
- Scripts de base de datos
- Configuraciones de despliegue
```

**SP 2.1: Perform Peer Reviews**
```markdown
## Proceso de Code Review

### Checklist de Revisión
1. Funcionalidad correcta
2. Estándares de código
3. Cobertura de pruebas
4. Documentación actualizada
5. Seguridad

### Criterios de Aprobación
- Mínimo 1 revisor aprueba
- Todas las pruebas pasan
- Cobertura >= 80%
- Sin issues críticos de SonarQube
```

**SP 3.1: Verify Selected Work Products**
```bash
# Verificación automatizada
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test          # Jest
npm run test:coverage # Cobertura
```

### 3.5 Validation (VAL)

#### Prácticas Específicas

**SP 1.1: Select Products for Validation**
```markdown
Productos a validar con usuarios finales:
- API GraphQL (schema y queries)
- Flujos de carga de archivos
- Reportes generados
- Interfaz de consulta
```

**SP 2.1: Establish Validation Environment**
```markdown
## Ambiente de Validación

### Staging Environment
- URL: https://eia-staging.sep.gob.mx
- Datos: Copia anonimizada de producción
- Acceso: Usuarios piloto seleccionados

### Criterios de Validación
- Funcionalidad completa según casos de uso
- Performance aceptable (< 2s por query)
- Usabilidad validada por usuarios
```

**SP 2.2: Establish Validation Procedures**
```markdown
## Procedimientos de Validación

### 1. Validación Funcional
- Ejecutar casos de uso completos
- Verificar resultados esperados
- Documentar discrepancias

### 2. Validación de Usabilidad
- Encuesta de satisfacción
- Análisis de tiempos de tarea
- Feedback cualitativo

### 3. Validación de Performance
- Pruebas de carga
- Análisis de métricas
- Optimización según resultados
```

## 4. Process Areas de Gestión

### 4.1 Configuration Management (CM)

**CM 1.1: Identify Configuration Items**
```markdown
Items de configuración controlados:
- Código fuente (Git)
- Documentación (Git)
- Esquemas de base de datos (Versionados)
- Variables de entorno (.env.example)
- Dependencias (package.json, package-lock.json)
```

**CM 1.2: Establish Configuration Management System**
```markdown
Herramientas:
- Git: Control de versiones
- GitHub: Repositorio remoto
- Semantic Versioning: Esquema de versionado
- CHANGELOG.md: Registro de cambios
```

**CM 1.3: Create or Release Baselines**
```bash
# Tags de versión
git tag -a v1.0.0 -m "Release 1.0.0 - Initial Production Release"
git push origin v1.0.0

# Baselines documentadas en CHANGELOG.md
```

### 4.2 Process and Product Quality Assurance (PPQA)

**PPQA 1.1: Objectively Evaluate Processes**
```markdown
## Auditorías de Proceso

### Frecuencia
- Auditoría interna: Cada iteración
- Auditoría externa: Cada release

### Aspectos Evaluados
- Cumplimiento de estándares PSP
- Adherencia a RUP
- Métricas de calidad CMMI

### Acciones Correctivas
Documentadas en: docs/quality-audit/findings.md
```

**PPQA 1.2: Objectively Evaluate Work Products**
```markdown
## Evaluación de Calidad

### Criterios Objetivos
- Cobertura de pruebas >= 80%
- Complejidad ciclomática <= 10
- Duplicación de código < 3%
- Issues críticos = 0

### Herramientas
- Jest (coverage)
- ESLint (code quality)
- SonarQube (static analysis)
```

**PPQA 2.1: Communicate and Resolve Noncompliance Issues**
```markdown
## Gestión de No Conformidades

### Proceso
1. Identificar no conformidad
2. Documentar en issue tracker
3. Asignar responsable
4. Implementar corrección
5. Verificar efectividad
6. Cerrar issue

### Template de No Conformidad
**ID**: NC-2026-001
**Tipo**: Proceso
**Descripción**: Falta documentación en módulo X
**Impacto**: Medio
**Acción Correctiva**: Completar JSDoc
**Responsable**: Developer A
**Fecha Límite**: 2026-01-25
**Estado**: Abierta
```

### 4.3 Organizational Process Focus (OPF)

**OPF 1.1: Determine Process Improvement Opportunities**
```markdown
## Mejora de Procesos

### Fuentes de Oportunidades
- Retrospectivas de iteración
- Análisis de métricas PSP
- Feedback de equipo
- Benchmarking con industria

### Proceso de Mejora
1. Identificar oportunidad
2. Analizar causa raíz
3. Proponer solución
4. Pilotar cambio
5. Medir impacto
6. Estandarizar si es efectivo
```

**OPF 1.2: Plan and Implement Process Improvements**
```markdown
## Plan de Mejora (Ejemplo)

### Oportunidad
Reducir tiempo de setup de ambiente de desarrollo

### Propuesta
Crear Docker Compose para ambiente completo

### Piloto
Iteración 3 - 2 desarrolladores

### Métricas
- Tiempo de setup: 4h → 30min
- Errores de configuración: 15 → 2

### Decisión
✅ Estandarizar para todo el equipo
```

### 4.4 Organizational Process Definition (OPD)

**OPD 1.1: Establish Standard Processes**
```markdown
## Procesos Estándar de la Organización

### Ubicación
docs/standard-processes/

### Procesos Definidos
1. Proceso de Desarrollo (PSP + RUP)
2. Proceso de Code Review
3. Proceso de Testing
4. Proceso de Despliegue
5. Proceso de Gestión de Incidentes
6. Proceso de Gestión de Cambios

### Tailoring Guidelines
Guías para adaptar procesos según:
- Tamaño del proyecto
- Criticidad
- Equipo disponible
```

**OPD 1.2: Establish Work Environment Standards**
```markdown
## Estándares de Ambiente de Trabajo

### Hardware Mínimo
- RAM: 16GB
- Storage: 256GB SSD
- Procesador: i5/Ryzen 5 o superior

### Software Requerido
- Node.js 18+
- PostgreSQL 15+
- Visual Studio Code
- Git 2.40+

### Extensiones de VSCode
Ver: .vscode/extensions.json
```

## 5. Métricas y Mediciones

### 5.1 Métricas de Proceso
```typescript
interface ProcessMetrics {
  // Productividad
  locsPerHour: number;
  defectDensity: number; // defectos / KLOC
  
  // Calidad
  testCoverage: number;
  codeReviewEfficiency: number;
  
  // Tiempo
  averageCycleTime: number; // horas
  leadTime: number; // días
  
  // Conformidad
  processComplianceRate: number; // %
  standardsAdherenceRate: number; // %
}
```

### 5.2 Dashboards de Métricas
```markdown
Ubicación: docs/metrics/dashboards/

Dashboards disponibles:
- Process Performance Dashboard
- Quality Metrics Dashboard
- Team Productivity Dashboard
- CMMI Compliance Dashboard
```

## 6. Auditorías y Evaluaciones

### 6.1 Self-Assessment
```markdown
## CMMI Self-Assessment

### Frecuencia
- Mensual: Quick assessment
- Trimestral: Comprehensive assessment

### Template
Ver: docs/cmmi/self-assessment-template.md

### Scoring
1 = Not Performed
2 = Partially Performed
3 = Largely Performed
4 = Fully Performed
```

### 6.2 External Appraisal Readiness
```markdown
## Preparación para Evaluación Externa

### Evidencias Requeridas
- [ ] Documentación de procesos
- [ ] Registros de métricas
- [ ] Resultados de auditorías
- [ ] Planes de mejora
- [ ] Capacitación del equipo

### Gap Analysis
Identificar brechas entre prácticas actuales y objetivos CMMI
```

## 7. Capacitación y Competencias

### 7.1 Plan de Capacitación
```markdown
## Organizational Training (OT)

### Capacitaciones Requeridas
1. **PSP Fundamentals**
   - Duración: 16 horas
   - Audiencia: Todo el equipo
   - Frecuencia: Nueva incorporación

2. **RUP Overview**
   - Duración: 8 horas
   - Audiencia: Desarrolladores
   - Frecuencia: Anual

3. **CMMI Level 3 Practices**
   - Duración: 12 horas
   - Audiencia: Líderes de proyecto
   - Frecuencia: Anual

4. **GraphQL & TypeScript**
   - Duración: 24 horas
   - Audiencia: Desarrolladores
   - Frecuencia: Nueva incorporación
```

### 7.2 Matriz de Competencias
```markdown
| Competencia          | Requerido | Actual | Gap | Acción       |
|---------------------|-----------|--------|-----|--------------|
| PSP                 | Advanced  | Inter. | 1   | Capacitación |
| GraphQL             | Expert    | Adv.   | 1   | Mentoría     |
| PostgreSQL          | Advanced  | Adv.   | 0   | Mantener     |
| CMMI                | Inter.    | Basic  | 1   | Capacitación |
```

## 8. Mejora Continua

### 8.1 PDCA Cycle
```markdown
## Plan-Do-Check-Act

### Plan
- Definir objetivos de mejora
- Establecer métricas
- Diseñar experimento

### Do
- Implementar cambio en piloto
- Recopilar datos

### Check
- Analizar resultados
- Comparar con baseline

### Act
- Si es efectivo: Estandarizar
- Si no: Ajustar y repetir
```

### 8.2 Lessons Learned
```markdown
Registro en: docs/lessons-learned/

Template:
- Situación
- Problema encontrado
- Solución aplicada
- Resultado
- Recomendación para futuro
```

## 9. Referencias

- CMMI for Development, Version 2.0
- SCAMPI Method Definition Document
- CMMI Model Foundation
- SEI Technical Reports

---

**Última actualización**: 19 de enero de 2026
**Responsable**: Equipo de Desarrollo EIA
**Próxima revisión**: 19 de abril de 2026
