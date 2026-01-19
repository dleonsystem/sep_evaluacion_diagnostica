# Guía de Contribución

¡Gracias por tu interés en contribuir al Servidor GraphQL EIA! Este documento proporciona las guías y mejores prácticas para contribuir al proyecto.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Proceso de Pull Request](#proceso-de-pull-request)
6. [Reportar Bugs](#reportar-bugs)
7. [Sugerir Mejoras](#sugerir-mejoras)

## Código de Conducta

Este proyecto adhiere a un código de conducta que todos los contribuyentes deben seguir. Al participar, se espera que mantengas un ambiente respetuoso y profesional.

## ¿Cómo Puedo Contribuir?

### Reportar Bugs

Si encuentras un bug:

1. **Verifica** que no haya sido reportado antes en [Issues](../../issues)
2. **Crea un nuevo issue** usando la plantilla de bug report
3. **Proporciona información detallada**:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Versión del proyecto
   - Entorno (OS, Node version, etc.)

### Sugerir Mejoras

Para sugerir nuevas características:

1. **Verifica** que no haya sido sugerida antes
2. **Crea un nuevo issue** usando la plantilla de feature request
3. **Describe detalladamente**:
   - Problema que resuelve
   - Solución propuesta
   - Alternativas consideradas
   - Impacto en el sistema

## Proceso de Desarrollo

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/eia-graphql-server.git
cd eia-graphql-server

# Agrega el repositorio original como remote
git remote add upstream https://github.com/sep/eia-graphql-server.git
```

### 2. Configurar Ambiente

```bash
# Instala dependencias
npm install

# Copia y configura variables de entorno
cp .env.example .env

# Inicializa base de datos
npm run db:init
npm run db:seed
```

### 3. Crear Branch

```bash
# Actualiza tu fork
git fetch upstream
git checkout main
git merge upstream/main

# Crea branch para tu feature/fix
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-bug
```

### 4. Desarrollar

- Escribe código siguiendo los [estándares](#estándares-de-código)
- Escribe tests para tu código
- Asegúrate de que todos los tests pasen
- Documenta tu código con JSDoc
- Actualiza documentación si es necesario

### 5. Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<tipo>(<scope>): <descripción>

# Ejemplos
feat(auth): add JWT authentication
fix(resolver): correct user query pagination
docs(readme): update installation instructions
test(user): add unit tests for UserService
refactor(database): optimize connection pooling
```

**Tipos de commit**:
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato de código
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

### 6. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Crea Pull Request en GitHub
```

## Estándares de Código

### TypeScript

- Usa **strict mode** de TypeScript
- Define tipos explícitos
- Evita `any`, usa tipos específicos
- Documenta tipos complejos

```typescript
// ✅ BUENO
interface CreateUserInput {
  correo: string;
  nombre: string;
  rol: UserRole;
}

// ❌ MALO
function createUser(data: any) {
  // ...
}
```

### Naming Conventions

- **Variables/Funciones**: camelCase
- **Clases/Interfaces**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: kebab-case.ts

```typescript
// Variables y funciones
const userService = new UserService();
async function getUserById(id: string) {}

// Clases e interfaces
class UserService {}
interface IUserRepository {}

// Constantes
const MAX_RETRY_ATTEMPTS = 3;

// Archivos
user-service.ts
database-config.ts
```

### Documentación

Toda función pública debe tener JSDoc:

```typescript
/**
 * Autentica un usuario con credenciales
 * 
 * @param correo - Correo del usuario
 * @param contrasena - Contraseña en texto plano
 * @returns Promise con resultado de autenticación
 * @throws {AuthenticationError} Si credenciales inválidas
 * 
 * @example
 * ```typescript
 * const result = await authenticateUser(
 *   'user@sep.gob.mx',
 *   'password123'
 * );
 * ```
 */
async function authenticateUser(
  correo: string,
  contrasena: string
): Promise<AuthResult> {
  // ...
}
```

### Testing

- Cobertura mínima: **80%**
- Código crítico: **100%**
- Usa patrón AAA (Arrange-Act-Assert)
- Mock dependencias externas

```typescript
describe('UserService', () => {
  describe('create', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const input = {
        correo: 'test@sep.gob.mx',
        nombre: 'Test',
        rol: UserRole.RESPONSABLE_CCT,
      };
      
      // Act
      const result = await userService.create(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.correo).toBe(input.correo);
    });
  });
});
```

### Linting

Antes de hacer commit:

```bash
# Lint
npm run lint

# Fix automático
npm run lint:fix

# Format
npm run format

# Type check
npm run typecheck
```

## Proceso de Pull Request

### Checklist antes de enviar PR

- [ ] El código sigue los estándares del proyecto
- [ ] Se agregaron/actualizaron tests
- [ ] Todos los tests pasan (`npm test`)
- [ ] Linter pasa (`npm run lint`)
- [ ] Type check pasa (`npm run typecheck`)
- [ ] Se actualizó documentación si es necesario
- [ ] Se actualizó CHANGELOG.md
- [ ] Commits siguen Conventional Commits
- [ ] Branch está actualizado con main

### Descripción del PR

Usa la plantilla de Pull Request e incluye:

1. **Descripción** del cambio
2. **Tipo** de cambio (feature, fix, refactor, etc.)
3. **Motivación** y contexto
4. **Cómo se ha probado**
5. **Screenshots** (si aplica)
6. **Checklist** completado

### Revisión de Código

- Mínimo **1 revisor** debe aprobar
- Todos los comentarios deben ser resueltos
- CI/CD debe pasar exitosamente
- No merge de tu propio PR sin revisión

## Estándares PSP/RUP/CMMI

Este proyecto sigue estándares de calidad enterprise:

### PSP (Personal Software Process)
- Registra tiempo de desarrollo
- Documenta defectos encontrados
- Realiza code reviews
- Ver: [docs/PSP_STANDARDS.md](docs/PSP_STANDARDS.md)

### RUP (Rational Unified Process)
- Desarrollo iterativo
- Enfoque en arquitectura
- Casos de uso documentados
- Ver: [docs/RUP_COMPLIANCE.md](docs/RUP_COMPLIANCE.md)

### CMMI Level 3
- Procesos definidos
- Métricas de calidad
- Mejora continua
- Ver: [docs/CMMI_GUIDELINES.md](docs/CMMI_GUIDELINES.md)

## Recursos

- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)

## Preguntas

Si tienes preguntas, puedes:

1. Revisar la [documentación](docs/)
2. Buscar en [Issues](../../issues)
3. Crear un nuevo issue con la etiqueta `question`
4. Contactar al equipo: desarrollo.eia@sep.gob.mx

## Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la misma licencia del proyecto.

---

¡Gracias por contribuir al Sistema EIA! 🎓🇲🇽
