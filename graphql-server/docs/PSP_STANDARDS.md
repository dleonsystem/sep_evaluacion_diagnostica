# Estándares PSP (Personal Software Process)

## Versión: 1.0.0
## Fecha: 19 de enero de 2026
## Autor: SEP - Evaluación Diagnóstica

---

## 1. Introducción

Este documento define los estándares del Personal Software Process (PSP) aplicados al desarrollo del servidor GraphQL para el Sistema de Evaluación Integral de Aprendizaje (EIA).

## 2. Objetivos PSP

### 2.1 Objetivos Principales
- **Calidad del código**: Minimizar defectos mediante revisiones sistemáticas
- **Predictibilidad**: Estimar tiempos de desarrollo con precisión
- **Productividad**: Optimizar el rendimiento personal del desarrollo
- **Mejora continua**: Aprender de métricas y defectos históricos

### 2.2 Métricas Clave
```typescript
interface PSPMetrics {
  // Métricas de tamaño
  linesOfCode: number;
  totalFunctions: number;
  totalClasses: number;
  
  // Métricas de tiempo (minutos)
  planningTime: number;
  designTime: number;
  codingTime: number;
  reviewTime: number;
  testingTime: number;
  
  // Métricas de calidad
  defectsInjected: number;
  defectsRemoved: number;
  defectsEscaped: number;
  
  // Métricas de proceso
  reviewEfficiency: number; // defectos encontrados / tiempo de revisión
  testEfficiency: number;   // defectos encontrados / tiempo de prueba
}
```

## 3. Fases del Proceso PSP

### 3.1 Planning (Planificación)
**Actividades**:
- Revisar requisitos del módulo/feature
- Estimar tamaño (LOC)
- Estimar tiempo por fase
- Identificar riesgos potenciales

**Entregables**:
- Estimaciones documentadas en `docs/psp-metrics/planning-{feature}.md`
- Checklist de revisión de requisitos

### 3.2 Design (Diseño)
**Actividades**:
- Diseñar estructura de clases/módulos
- Definir interfaces y contratos
- Documentar decisiones arquitectónicas
- Revisar diseño antes de codificar

**Entregables**:
- Diagramas de diseño (UML, secuencia)
- Documentación de interfaces TypeScript
- Design Review Checklist completado

**Ejemplo de Design Review Checklist**:
```markdown
- [ ] ¿Las interfaces están claramente definidas?
- [ ] ¿Se siguió el principio de responsabilidad única?
- [ ] ¿Se consideraron casos de error?
- [ ] ¿El diseño es testeable?
- [ ] ¿Se documentaron las decisiones de diseño?
```

### 3.3 Code (Codificación)
**Actividades**:
- Implementar siguiendo estándares de código
- Documentar código con JSDoc/TSDoc
- Aplicar principios SOLID
- Registrar defectos encontrados

**Estándares de Codificación**:
```typescript
/**
 * Estándar de documentación de funciones
 * 
 * @module nombre_modulo
 * @description Descripción detallada de la función
 * @param {Type} paramName - Descripción del parámetro
 * @returns {ReturnType} Descripción del retorno
 * @throws {ErrorType} Condiciones de error
 * @psp Time logged: XX minutos
 * @psp Defects found: N
 */
```

### 3.4 Code Review (Revisión de Código)
**Actividades**:
- Revisar código contra checklist
- Identificar defectos de lógica
- Verificar cumplimiento de estándares
- Documentar defectos encontrados

**Code Review Checklist**:
```markdown
## Funcionalidad
- [ ] ¿El código hace lo que se supone debe hacer?
- [ ] ¿Se manejan correctamente los casos extremos?
- [ ] ¿Se validan todas las entradas?

## Calidad
- [ ] ¿El código es legible y mantenible?
- [ ] ¿Las funciones tienen una única responsabilidad?
- [ ] ¿Se evita duplicación de código?

## Seguridad
- [ ] ¿Se validan y sanitizan las entradas?
- [ ] ¿Se manejan correctamente las credenciales?
- [ ] ¿Se previenen inyecciones SQL?

## Rendimiento
- [ ] ¿Se evitan consultas N+1?
- [ ] ¿Se usan índices de base de datos apropiadamente?
- [ ] ¿Se implementa caché cuando es necesario?

## Documentación
- [ ] ¿Todas las funciones públicas están documentadas?
- [ ] ¿Se documentaron decisiones no obvias?
- [ ] ¿Los comentarios añaden valor?
```

### 3.5 Compile (Compilación)
**Actividades**:
- Compilar código TypeScript
- Resolver errores de compilación
- Verificar tipos estáticos

**Comandos**:
```bash
npm run typecheck  # Verificar tipos sin compilar
npm run build      # Compilar a JavaScript
```

### 3.6 Test (Pruebas)
**Actividades**:
- Ejecutar pruebas unitarias
- Ejecutar pruebas de integración
- Registrar defectos encontrados
- Verificar cobertura de código

**Estándares de Pruebas**:
```typescript
/**
 * Test estándar PSP
 * @psp Test case ID: TC-XXX
 * @psp Expected defects: N (basado en histórico)
 */
describe('Feature Name', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = ...;
    
    // Assert
    expect(result).toBe(...);
  });
  
  it('should handle edge case', () => {
    // ...
  });
  
  it('should handle error case', () => {
    // ...
  });
});
```

### 3.7 Postmortem (Análisis Post-Mortem)
**Actividades**:
- Comparar estimaciones vs. reales
- Analizar defectos por tipo y fase
- Identificar áreas de mejora
- Actualizar base histórica de datos

**Plantilla de Postmortem**:
```markdown
## Postmortem: [Feature Name]

### Métricas
| Métrica | Estimado | Real | Variación |
|---------|----------|------|-----------|
| LOC     | XXX      | XXX  | ±XX%      |
| Tiempo  | XXX min  | XXX  | ±XX%      |
| Defectos| X        | X    | ±X        |

### Análisis de Defectos
| Fase Inyectada | Fase Removida | Tipo | Tiempo Corrección |
|----------------|---------------|------|-------------------|
| Design         | Code Review   | Logic| 15 min            |

### Lecciones Aprendidas
1. ...
2. ...

### Acciones de Mejora
1. ...
2. ...
```

## 4. Registro de Defectos

### 4.1 Clasificación de Defectos
```typescript
enum DefectType {
  DOCUMENTATION = 'Documentación',
  SYNTAX = 'Sintaxis',
  BUILD = 'Compilación',
  ASSIGNMENT = 'Asignación',
  INTERFACE = 'Interfaz',
  CHECKING = 'Validación',
  DATA = 'Datos',
  FUNCTION = 'Función',
  SYSTEM = 'Sistema',
  ENVIRONMENT = 'Ambiente'
}

enum DefectSeverity {
  CRITICAL = 'Crítico',
  HIGH = 'Alto',
  MEDIUM = 'Medio',
  LOW = 'Bajo'
}

interface Defect {
  id: string;
  date: Date;
  type: DefectType;
  severity: DefectSeverity;
  injectedPhase: string;
  removedPhase: string;
  fixTime: number; // minutos
  description: string;
}
```

### 4.2 Plantilla de Registro de Defecto
```markdown
## Defecto ID: DEF-YYYYMMDD-XXX

**Fecha**: 2026-01-19
**Tipo**: Logic Error
**Severidad**: Medium
**Fase Inyectada**: Design
**Fase Removida**: Code Review
**Tiempo de Corrección**: 20 minutos

**Descripción**:
[Descripción detallada del defecto]

**Causa Raíz**:
[Análisis de la causa]

**Corrección**:
[Descripción de la solución]

**Prevención Futura**:
[Cómo evitar este tipo de defecto]
```

## 5. Herramientas PSP

### 5.1 Scripts de Medición
```bash
# Contar líneas de código
npm run psp:loc

# Generar reporte de métricas
npm run psp:metrics

# Analizar cobertura de pruebas
npm run test:coverage
```

### 5.2 Plantillas
- `docs/psp-templates/planning.md`
- `docs/psp-templates/design-review.md`
- `docs/psp-templates/code-review.md`
- `docs/psp-templates/postmortem.md`

## 6. Mejora Continua

### 6.1 Ciclo de Mejora
1. **Medir**: Recopilar métricas de cada desarrollo
2. **Analizar**: Identificar patrones y áreas de mejora
3. **Actuar**: Implementar cambios en el proceso
4. **Verificar**: Medir impacto de los cambios

### 6.2 Base Histórica de Datos
Mantener registro histórico en `docs/psp-metrics/historical-data.json`:
```json
{
  "features": [
    {
      "name": "User Authentication",
      "date": "2026-01-15",
      "loc": 250,
      "timeMinutes": 480,
      "defects": 5,
      "productivity": 31.25
    }
  ]
}
```

## 7. Referencias

- PSP Handbook (Watts Humphrey)
- A Discipline for Software Engineering
- PSP Body of Knowledge (Software Engineering Institute)

---

**Última actualización**: 19 de enero de 2026
**Responsable**: Equipo de Desarrollo EIA
