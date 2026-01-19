# Arquitectura del Servidor GraphQL EIA

## Versión: 1.0.0
## Fecha: 19 de enero de 2026
## Autor: SEP - Evaluación Diagnóstica

---

## 1. Visión General

El servidor GraphQL EIA implementa una arquitectura de capas (layered architecture) que separa responsabilidades y facilita el mantenimiento, testing y escalabilidad del sistema.

## 2. Diagrama de Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cliente (Frontend Angular)                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/HTTPS
                                 │ GraphQL Queries/Mutations
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js + Apollo Server                              │  │
│  │  - CORS, Helmet, Compression                             │  │
│  │  - Authentication Middleware                             │  │
│  │  - Rate Limiting                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   GraphQL Schema Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Type Definitions (typeDefs)                             │  │
│  │  - Queries, Mutations, Types                             │  │
│  │  - Input validations                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Resolvers                                               │  │
│  │  - Query resolvers                                       │  │
│  │  - Mutation resolvers                                    │  │
│  │  - Field resolvers                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services                                                │  │
│  │  - UserService                                           │  │
│  │  - AuthService                                           │  │
│  │  - EvaluacionService                                     │  │
│  │  - ValidationService                                     │  │
│  │  - ReportService                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Data Access Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database Configuration                                  │  │
│  │  - Connection Pool                                       │  │
│  │  - Query Helpers                                         │  │
│  │  - Transaction Management                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Models & Interfaces                                     │  │
│  │  - TypeScript Interfaces                                 │  │
│  │  - Enums                                                 │  │
│  │  - Type Definitions                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                      │
│  - Tables (usuarios, centros_trabajo, evaluaciones, etc.)      │
│  - Views                                                        │
│  - Stored Procedures                                            │
│  - Triggers                                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Cross-Cutting Concerns                       │
│  - Logging (Winston)                                            │
│  - Error Handling                                               │
│  - Security                                                     │
│  - Monitoring                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Capas de la Arquitectura

### 3.1 API Gateway Layer

**Responsabilidad**: Punto de entrada único para todas las solicitudes HTTP.

**Componentes**:
```typescript
// src/index.ts
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Plugins de logging, metrics, etc.
  ],
});
```

**Características**:
- Middleware de seguridad (Helmet, CORS)
- Compresión de respuestas
- Rate limiting
- Health check endpoints

### 3.2 GraphQL Schema Layer

**Responsabilidad**: Definición del contrato de la API y manejo de solicitudes.

**Type Definitions**:
```graphql
type Query {
  getUser(id: ID!): User
  listUsers(limit: Int, offset: Int): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

**Resolvers**:
```typescript
const resolvers = {
  Query: {
    getUser: async (_, { id }, context) => {
      return await userService.findById(id);
    },
  },
  Mutation: {
    createUser: async (_, { input }, context) => {
      return await userService.create(input);
    },
  },
};
```

### 3.3 Business Logic Layer

**Responsabilidad**: Lógica de negocio, validaciones y orquestación de operaciones.

**Patrón Service Layer**:
```typescript
class UserService {
  async create(input: CreateUserInput): Promise<User> {
    // 1. Validar datos de entrada
    await this.validateUserInput(input);
    
    // 2. Verificar reglas de negocio
    await this.checkBusinessRules(input);
    
    // 3. Persistir en base de datos
    const user = await userRepository.create(input);
    
    // 4. Ejecutar acciones post-creación
    await this.sendWelcomeEmail(user);
    
    return user;
  }
}
```

### 3.4 Data Access Layer

**Responsabilidad**: Acceso a base de datos y gestión de transacciones.

**Database Configuration**:
```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});
```

**Query Helper**:
```typescript
async function query(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  logger.debug('Query executed', { text, duration, rows: result.rowCount });
  
  return result;
}
```

## 4. Patrones de Diseño Aplicados

### 4.1 Repository Pattern

```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  update(id: string, user: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<boolean>;
}

class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  
  // ...otras implementaciones
}
```

### 4.2 Service Layer Pattern

```typescript
class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: IJWTService
  ) {}
  
  async authenticate(email: string, password: string): Promise<AuthResult> {
    // Lógica de autenticación
  }
}
```

### 4.3 DataLoader Pattern (N+1 Prevention)

```typescript
const userLoader = new DataLoader<string, User>(
  async (userIds: readonly string[]) => {
    const users = await query(
      'SELECT * FROM usuarios WHERE id = ANY($1)',
      [Array.from(userIds)]
    );
    
    const userMap = new Map(users.rows.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) || null);
  }
);

// Uso en resolver
const user = await userLoader.load(userId);
```

### 4.4 Dependency Injection

```typescript
// Constructor injection
class UserService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger
  ) {}
}

// Factory pattern para crear instancias
function createUserService(): UserService {
  return new UserService(
    new UserRepository(),
    new EmailService(),
    logger
  );
}
```

## 5. Flujo de Datos

### 5.1 Query Flow

```
Cliente
  ↓ GraphQL Query
Express/Apollo Server
  ↓ Parse & Validate
GraphQL Schema
  ↓ Resolve
Resolver
  ↓ Call Service
Service Layer
  ↓ Business Logic
Repository
  ↓ SQL Query
PostgreSQL
  ↓ Result
Repository
  ↓ Map to Model
Service
  ↓ Transform
Resolver
  ↓ Format
GraphQL Response
  ↓ JSON
Cliente
```

### 5.2 Mutation Flow

```
Cliente
  ↓ GraphQL Mutation
Express/Apollo Server
  ↓ Parse & Validate Input
GraphQL Schema
  ↓ Resolve
Resolver
  ↓ Call Service
Service Layer
  ├─ Validate Business Rules
  ├─ Start Transaction
  ├─ Execute Operations
  ├─ Trigger Side Effects
  └─ Commit Transaction
Repository
  ↓ SQL Commands
PostgreSQL
  ↓ Result
Service
  ↓ Post-processing
Resolver
  ↓ Format Response
Cliente
```

## 6. Gestión de Errores

### 6.1 Jerarquía de Errores

```typescript
class ApplicationError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message: string = 'No autenticado') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

class AuthorizationError extends ApplicationError {
  constructor(message: string = 'No autorizado') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 'NOT_FOUND', 404);
  }
}
```

### 6.2 Error Handling en GraphQL

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    logger.error('GraphQL Error', {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
    });
    
    // No exponer detalles internos en producción
    if (process.env.NODE_ENV === 'production') {
      return {
        message: error.message,
        code: error.extensions?.code,
      };
    }
    
    return error;
  },
});
```

## 7. Seguridad

### 7.1 Autenticación

```typescript
// Middleware de autenticación
async function authMiddleware(req: Request): Promise<User | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.findById(payload.userId);
    return user;
  } catch (error) {
    logger.warn('Invalid token', { error });
    return null;
  }
}
```

### 7.2 Autorización

```typescript
// Decorator para verificar permisos
function requireRole(role: UserRole) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const context = args[2]; // GraphQL context
      
      if (!context.user) {
        throw new AuthenticationError();
      }
      
      if (context.user.rol !== role) {
        throw new AuthorizationError();
      }
      
      return originalMethod.apply(this, args);
    };
  };
}

// Uso
class UserResolver {
  @requireRole(UserRole.COORDINADOR_FEDERAL)
  async deleteUser(id: string) {
    // Solo coordinadores federales pueden eliminar usuarios
  }
}
```

### 7.3 Validación de Inputs

```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

class CreateUserInput {
  @IsEmail({}, { message: 'Correo inválido' })
  correo: string;
  
  @IsNotEmpty({ message: 'Nombre requerido' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  nombre: string;
  
  // ...
}

async function validateInput<T>(input: T): Promise<void> {
  const errors = await validate(input);
  
  if (errors.length > 0) {
    throw new ValidationError(
      errors.map(e => Object.values(e.constraints || {})).flat().join(', ')
    );
  }
}
```

## 8. Performance y Escalabilidad

### 8.1 Caching Strategy

```typescript
// Redis cache para datos frecuentemente accedidos
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
});

async function getCachedUser(id: string): Promise<User | null> {
  // Intentar obtener de cache
  const cached = await redis.get(`user:${id}`);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Si no está en cache, obtener de DB
  const user = await userRepository.findById(id);
  
  if (user) {
    // Almacenar en cache por 5 minutos
    await redis.setex(`user:${id}`, 300, JSON.stringify(user));
  }
  
  return user;
}
```

### 8.2 Connection Pooling

```typescript
const pool = new Pool({
  min: 2,        // Conexiones mínimas siempre abiertas
  max: 10,       // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 8.3 Query Optimization

```typescript
// Evitar N+1 con DataLoader
const cctLoader = new DataLoader(async (userIds) => {
  const ccts = await query(`
    SELECT 
      uct.usuario_id,
      json_agg(ct.*) as centros_trabajo
    FROM usuarios_centros_trabajo uct
    JOIN centros_trabajo ct ON ct.id = uct.centro_trabajo_id
    WHERE uct.usuario_id = ANY($1)
    GROUP BY uct.usuario_id
  `, [userIds]);
  
  const cctMap = new Map(ccts.rows.map(r => [r.usuario_id, r.centros_trabajo]));
  return userIds.map(id => cctMap.get(id) || []);
});
```

## 9. Monitoring y Observabilidad

### 9.1 Logging

```typescript
// Winston logger con múltiples transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 9.2 Metrics

```typescript
// Prometheus metrics
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
});

const graphqlOperations = new Counter({
  name: 'graphql_operations_total',
  help: 'Total number of GraphQL operations',
  labelNames: ['operation', 'type'],
});

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 10. Testing Strategy

### 10.1 Pirámide de Testing

```
      /\
     /E2E\       10% - End-to-End (Cypress)
    /------\
   /Integr.\    20% - Integration (Supertest)
  /----------\
 /   Unit     \ 70% - Unit (Jest)
/--------------\
```

### 10.2 Ejemplo de Test Unitario

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      // ...
    } as any;
    
    userService = new UserService(mockUserRepository);
  });
  
  describe('create', () => {
    it('should create user with valid data', async () => {
      const input: CreateUserInput = {
        correo: 'test@sep.gob.mx',
        nombre: 'Test',
        apellidoPaterno: 'User',
        rol: UserRole.RESPONSABLE_CCT,
      };
      
      mockUserRepository.create.mockResolvedValue({
        id: 'uuid',
        ...input,
      } as User);
      
      const result = await userService.create(input);
      
      expect(result).toBeDefined();
      expect(result.correo).toBe(input.correo);
      expect(mockUserRepository.create).toHaveBeenCalledWith(input);
    });
  });
});
```

## 11. Deployment

### 11.1 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

### 11.2 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: eia_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  graphql-server:
    build: .
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: eia_db
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
    ports:
      - "4000:4000"

volumes:
  postgres_data:
```

## 12. Referencias

- GraphQL Best Practices: https://graphql.org/learn/best-practices/
- Apollo Server Documentation: https://www.apollographql.com/docs/apollo-server/
- TypeScript Deep Dive: https://basarat.gitbook.io/typescript/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

---

**Última actualización**: 19 de enero de 2026  
**Versión**: 1.0.0  
**Autor**: Equipo de Arquitectura EIA
