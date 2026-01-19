# Cumplimiento RUP (Rational Unified Process)

## Versión: 1.0.0
## Fecha: 19 de enero de 2026
## Autor: SEP - Evaluación Diagnóstica

---

## 1. Introducción

Este documento describe cómo el proyecto GraphQL EIA cumple con los principios y mejores prácticas del Rational Unified Process (RUP).

## 2. Principios RUP Aplicados

### 2.1 Desarrollo Iterativo e Incremental
El proyecto se desarrolla en iteraciones cortas (2-4 semanas), cada una entregando funcionalidad incremental.

**Estructura de Iteraciones**:
```
Inception (Iniciación)      - Semana 1-2
  ├─ Definir visión del proyecto
  ├─ Identificar casos de uso críticos
  └─ Establecer arquitectura base

Elaboration (Elaboración)   - Semana 3-6
  ├─ Implementar arquitectura base
  ├─ Mitigar riesgos técnicos
  └─ Refinar requisitos

Construction (Construcción) - Semana 7-14
  ├─ Iteración 1: Autenticación y usuarios
  ├─ Iteración 2: Gestión de CCTs
  ├─ Iteración 3: Carga de evaluaciones
  └─ Iteración 4: Consultas y reportes

Transition (Transición)     - Semana 15-16
  ├─ Pruebas de aceptación
  ├─ Despliegue a producción
  └─ Capacitación
```

### 2.2 Enfoque en la Arquitectura
El proyecto establece una arquitectura sólida desde las primeras iteraciones.

**Capas Arquitectónicas**:
```
┌─────────────────────────────────────┐
│  Presentation Layer (GraphQL API)   │
│  - Schema (typeDefs)                │
│  - Resolvers                        │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Business Logic Layer (Services)    │
│  - UserService                      │
│  - EvaluacionService                │
│  - ValidationService                │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Data Access Layer (Models/DB)      │
│  - Database Config                  │
│  - Query Helpers                    │
│  - Models/Interfaces                │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Infrastructure Layer               │
│  - Logger                           │
│  - Error Handling                   │
│  - Security                         │
└─────────────────────────────────────┘
```

### 2.3 Gestión de Requisitos
Todos los requisitos están trazados a casos de uso y vinculados a la implementación.

**Trazabilidad**:
```typescript
/**
 * @use-case CU-01: Autenticación de usuarios
 * @requirements RF-01: Control de acceso basado en roles
 * @rup Requirement Traceability
 */
async function authenticateUser(credentials: Credentials): Promise<User> {
  // Implementación
}
```

### 2.4 Control de Calidad Continuo
Se aplican revisiones y pruebas en cada iteración.

## 3. Disciplinas RUP

### 3.1 Business Modeling (Modelado de Negocio)
**Artefactos**:
- Modelo de dominio
- Reglas de negocio documentadas
- Glosario de términos

**Ubicación**: `web/doc/glosario.md`, `REQUERIMIENTOS_Y_CASOS_DE_USO.md`

### 3.2 Requirements (Requisitos)
**Artefactos**:
- Documento de Visión: `web/doc/vision_document.md`
- Especificación de Requisitos: `web/doc/srs.md`
- Casos de Uso: `web/doc/casos_uso.md`
- Modelo de Casos de Uso

**Estructura de Caso de Uso**:
```markdown
## CU-01: Autenticación de Usuarios

**Actor Principal**: Usuario del sistema
**Precondiciones**: Usuario tiene credenciales válidas
**Postcondiciones**: Usuario autenticado con sesión activa

### Flujo Principal
1. Usuario accede a la plataforma
2. Sistema presenta formulario de autenticación
3. Usuario ingresa correo y contraseña
4. Sistema valida credenciales
5. Sistema crea sesión y redirige a dashboard

### Flujos Alternativos
**3a. Credenciales inválidas**
3a.1. Sistema muestra mensaje de error
3a.2. Vuelve al paso 2

**5a. Primer acceso**
5a.1. Sistema solicita cambio de contraseña
5a.2. Usuario define nueva contraseña
5a.3. Continúa en paso 5
```

### 3.3 Analysis & Design (Análisis y Diseño)

#### 3.3.1 Modelo de Análisis
**Clases de Análisis**:
```
<<boundary>>          <<control>>           <<entity>>
GraphQLResolver  →  UserService      →     Usuario
                    ↓                       ↓
                AuthService           CentroTrabajo
                    ↓                       ↓
                ValidationService     Evaluacion
```

#### 3.3.2 Modelo de Diseño
**Patrones Aplicados**:

1. **Repository Pattern**
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  update(id: string, user: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<boolean>;
}
```

2. **Service Layer Pattern**
```typescript
class UserService {
  constructor(private userRepository: IUserRepository) {}
  
  async createUser(input: CreateUserInput): Promise<User> {
    // Lógica de negocio
    // Validaciones
    // Llamada a repository
  }
}
```

3. **Data Loader Pattern** (prevención N+1)
```typescript
const userLoader = new DataLoader<string, User>(async (ids) => {
  const users = await query('SELECT * FROM usuarios WHERE id = ANY($1)', [ids]);
  return ids.map(id => users.find(u => u.id === id));
});
```

#### 3.3.3 Modelo de Datos
**Diagrama ER**: Ver `ESTRUCTURA_DE_DATOS.md`

**Normalización**: Tercera Forma Normal (3NF)
- Eliminación de dependencias transitivas
- Uso de claves foráneas
- Integridad referencial

### 3.4 Implementation (Implementación)

#### 3.4.1 Organización del Código
```
src/
├── config/          # Configuración
│   └── database.ts
├── models/          # Modelos de dominio
│   └── index.ts
├── schema/          # GraphQL schema
│   ├── typeDefs.ts
│   └── resolvers.ts
├── services/        # Lógica de negocio
│   └── userService.ts
├── utils/           # Utilidades
│   └── logger.ts
└── index.ts         # Entry point
```

#### 3.4.2 Estándares de Código
- **Naming Conventions**: camelCase para variables/funciones, PascalCase para clases/interfaces
- **File Organization**: Un archivo por clase/módulo principal
- **Documentation**: JSDoc/TSDoc para todas las funciones públicas
- **Error Handling**: Try-catch con logging apropiado

### 3.5 Test (Pruebas)

#### 3.5.1 Estrategia de Pruebas
```
Pirámide de Pruebas:
        /\
       /E2E\        - 10% End-to-End Tests
      /------\
     /Integr.\     - 20% Integration Tests
    /----------\
   /   Unit     \  - 70% Unit Tests
  /--------------\
```

#### 3.5.2 Tipos de Pruebas

**Pruebas Unitarias**:
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Test implementation
    });
    
    it('should throw error if email exists', async () => {
      // Test implementation
    });
  });
});
```

**Pruebas de Integración**:
```typescript
describe('GraphQL API', () => {
  it('should execute healthCheck query', async () => {
    const query = `
      query {
        healthCheck {
          status
          database { connected }
        }
      }
    `;
    
    const result = await executeQuery(query);
    expect(result.data.healthCheck.status).toBe('OK');
  });
});
```

**Pruebas E2E**:
```typescript
describe('User Registration Flow', () => {
  it('should complete full registration process', async () => {
    // 1. Create user
    // 2. Verify email
    // 3. Login
    // 4. Access dashboard
  });
});
```

### 3.6 Deployment (Despliegue)

#### 3.6.1 Ambientes
```
Development  → Testing → Staging → Production
    ↓            ↓          ↓          ↓
  Localhost   Docker    Pre-Prod   Azure/AWS
```

#### 3.6.2 Configuración por Ambiente
```typescript
// config/environment.ts
export const config = {
  development: {
    port: 4000,
    db: 'eia_db_dev',
    logLevel: 'debug'
  },
  production: {
    port: 80,
    db: process.env.DB_NAME,
    logLevel: 'error'
  }
};
```

### 3.7 Configuration & Change Management

#### 3.7.1 Control de Versiones
```bash
# Estructura de branches
main              # Producción
├── develop       # Desarrollo
│   ├── feature/user-auth
│   ├── feature/file-upload
│   └── feature/reports
├── release/1.0.0
└── hotfix/security-patch
```

#### 3.7.2 Versionado Semántico
```
MAJOR.MINOR.PATCH
  1  .  0  .  0

MAJOR: Cambios incompatibles en API
MINOR: Nueva funcionalidad compatible
PATCH: Correcciones de bugs
```

### 3.8 Project Management (Gestión de Proyecto)

#### 3.8.1 Planificación de Iteraciones
**Documento**: `web/doc/plan_iteraciones.md`

**Estructura de Iteración**:
```markdown
## Iteración 1: Autenticación y Usuarios (2 semanas)

### Objetivos
- Implementar autenticación JWT
- CRUD de usuarios
- Gestión de roles

### Casos de Uso
- CU-01: Autenticación
- CU-02: Gestión de usuarios

### Criterios de Éxito
- [ ] Pruebas unitarias > 80%
- [ ] Autenticación funcional
- [ ] Roles implementados

### Riesgos
- Complejidad de integración con Active Directory
- Tiempo de aprendizaje de JWT
```

#### 3.8.2 Gestión de Riesgos
**Documento**: `web/doc/riesgos.md`

## 4. Artefactos RUP Generados

### 4.1 Por Fase

**Inception**:
- ✅ Documento de Visión
- ✅ Glosario
- ✅ Modelo de Casos de Uso (inicial)

**Elaboration**:
- ✅ Especificación de Requisitos de Software (SRS)
- ✅ Arquitectura de Software
- ✅ Casos de Uso (detallados)
- ✅ Modelo de Datos

**Construction**:
- ✅ Código fuente
- ✅ Pruebas unitarias
- ✅ Documentación de API
- ✅ Scripts de despliegue

**Transition**:
- ⏳ Manual de usuario
- ⏳ Guía de instalación
- ⏳ Plan de capacitación

## 5. Best Practices RUP

### 5.1 Develop Iteratively
✅ Iteraciones de 2-4 semanas
✅ Demos al final de cada iteración
✅ Feedback continuo

### 5.2 Manage Requirements
✅ Trazabilidad requisito → caso de uso → código
✅ Priorización por valor de negocio
✅ Control de cambios

### 5.3 Use Component-Based Architecture
✅ Separación de capas
✅ Componentes reutilizables
✅ Interfaces bien definidas

### 5.4 Visually Model Software
✅ Diagramas UML
✅ Diagramas de secuencia
✅ Modelos de datos

### 5.5 Verify Quality
✅ Revisiones de código
✅ Pruebas automatizadas
✅ Análisis estático de código

### 5.6 Control Changes
✅ Git para control de versiones
✅ Pull requests con revisión
✅ Changelog actualizado

## 6. Referencias

- Rational Unified Process: Best Practices for Software Development Teams
- The Rational Unified Process Made Easy
- UML Distilled (Martin Fowler)

---

**Última actualización**: 19 de enero de 2026
**Responsable**: Equipo de Desarrollo EIA
