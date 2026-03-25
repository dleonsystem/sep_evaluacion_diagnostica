# Servidor GraphQL - Sistema EIA (Evaluación Integral de Aprendizaje)

## 🎯 Descripción

Servidor GraphQL para el Sistema de Evaluación Integral de Aprendizaje (EIA) de la Secretaría de Educación Pública (SEP). Implementa una API moderna y eficiente para la gestión de evaluaciones educativas en niveles preescolar, primaria y secundaria.

## 📋 Características

- ✅ API GraphQL con Apollo Server 4.x
- ✅ TypeScript con tipado estricto
- ✅ Base de datos PostgreSQL 15+
- ✅ Autenticación y autorización basada en roles
- ✅ Validación de datos con class-validator
- ✅ Logging estructurado con Winston
- ✅ Tests con Jest y alta cobertura
- ✅ Desarrollo siguiendo estándares PSP, RUP y CMMI Level 3
- ✅ Optimizado para colaboración con agentes IA

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- npm >= 9.0.0

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/sep/eia-graphql-server.git
cd eia-graphql-server

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Inicializar base de datos
npm run db:init
npm run db:seed

# 5. Iniciar servidor en modo desarrollo
npm run dev
```

El servidor estará disponible en: `http://localhost:4000/graphql`

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor en modo desarrollo con hot-reload
npm run build            # Compila TypeScript a JavaScript
npm start                # Inicia servidor en producción

# Testing
npm test                 # Ejecuta tests
npm run test:watch       # Ejecuta tests en modo watch
npm run test:coverage    # Genera reporte de cobertura

# Calidad de Código
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Corrige problemas de ESLint
npm run format           # Formatea código con Prettier
npm run typecheck        # Verifica tipos TypeScript

# Base de Datos
npm run db:init          # Inicializa esquema de base de datos
npm run db:seed          # Carga datos de prueba
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│   GraphQL API Layer                 │
│   - Schema (typeDefs)               │
│   - Resolvers                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Business Logic Layer              │
│   - Services                        │
│   - Validations                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Data Access Layer                 │
│   - Database Config                 │
│   - Query Helpers                   │
│   - Models                          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
└─────────────────────────────────────┘
```

Ver documentación completa en: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 📚 Documentación

### Documentos Principales
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Estándares PSP](docs/PSP_STANDARDS.md)
- [Cumplimiento RUP](docs/RUP_COMPLIANCE.md)
- [Guías CMMI](docs/CMMI_GUIDELINES.md)
- [Colaboración con IA](docs/AI_COLLABORATION.md)

### Documentación del Proyecto General
- [Visión del Proyecto](../web/doc/vision_document.md)
- [Especificación de Requisitos](../web/doc/srs.md)
- [Casos de Uso](../web/doc/casos_uso.md)
- [Estructura de Datos](../ESTRUCTURA_DE_DATOS.md)
- [Requerimientos y Casos de Uso](../REQUERIMIENTOS_Y_CASOS_DE_USO.md)

## 🔧 Tecnologías

### Core
- **Node.js** 18+ - Runtime de JavaScript
- **TypeScript** 5.3 - Superset tipado de JavaScript
- **Apollo Server** 4.10 - Servidor GraphQL
- **GraphQL** 16.8 - Lenguaje de consulta para APIs

### Base de Datos
- **PostgreSQL** 15 - Base de datos relacional
- **pg** 8.11 - Cliente PostgreSQL para Node.js

### Calidad y Testing
- **Jest** 29.7 - Framework de testing
- **ESLint** 8.56 - Linter para JavaScript/TypeScript
- **Prettier** 3.2 - Formateador de código

### Utilidades
- **Winston** 3.11 - Logger
- **dotenv** 16.4 - Gestión de variables de entorno
- **class-validator** 0.14 - Validación de objetos

## 🔐 Seguridad

- ✅ Validación y sanitización de inputs
- ✅ Prepared statements para prevenir SQL injection
- ✅ Autenticación basada en JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Rate limiting
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado

## 📊 Queries de Ejemplo

### Health Check
```graphql
query {
  healthCheck {
    status
    timestamp
    database {
      connected
      latency
    }
    version
  }
}
```

### Obtener Usuario
```graphql
query {
  getUser(id: "uuid-here") {
    id
    correo
    nombre
    apellidoPaterno
    rol
    centrosTrabajo {
      claveCCT
      nombre
      nivel
    }
  }
}
```

### Crear Usuario
```graphql
mutation {
  createUser(input: {
    correo: "usuario@sep.gob.mx"
    nombre: "Juan"
    apellidoPaterno: "Pérez"
    apellidoMaterno: "González"
    rol: RESPONSABLE_CCT
    clavesCCT: ["09DPR0001A"]
  }) {
    id
    correo
    nombre
  }
}
```

### Listar Evaluaciones
```graphql
query {
  listEvaluaciones(
    claveCCT: "09DPR0001A"
    periodo: "2024-2025-1"
  ) {
    id
    grado
    grupo
    estadoValidacion
    fechaCarga
    estudiantes {
      curp
      nombre
    }
  }
}
```

## 🧪 Testing

El proyecto mantiene alta cobertura de pruebas:

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch
```

**Meta de cobertura**: >= 80% (crítico: 100%)

## 🤖 Integración con Agentes IA

Este proyecto está optimizado para trabajar con agentes de IA:

- **GitHub Copilot**: Autocompletado inteligente
- **Claude Sonnet**: Diseño arquitectónico y revisiones
- **Windsurf**: Navegación semántica de código
- **Cascade**: Análisis de flujo de datos

Ver guía completa: [docs/AI_COLLABORATION.md](docs/AI_COLLABORATION.md)

## 📈 Estándares de Proceso

Este proyecto sigue metodologías y estándares de ingeniería de software de nivel empresarial:

### PSP (Personal Software Process)
- Medición de métricas de desarrollo
- Registro de defectos
- Estimaciones y seguimiento de tiempo
- Mejora continua basada en datos

### RUP (Rational Unified Process)
- Desarrollo iterativo e incremental
- Enfoque en arquitectura
- Gestión de requisitos
- Control de calidad continuo

### CMMI Level 3
- Procesos definidos y documentados
- Métricas y mediciones
- Auditorías de calidad
- Capacitación del equipo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución
- Seguir estándares de código (ESLint + Prettier)
- Escribir tests para nuevo código
- Documentar funciones públicas con JSDoc
- Actualizar CHANGELOG.md
- Pasar todas las verificaciones de CI/CD

## 📝 Licencia

Este proyecto es propiedad de la Secretaría de Educación Pública (SEP) - México.

## 👥 Equipo

- **Coordinación General**: Dirección de Evaluación - SEP
- **Desarrollo**: Equipo de Tecnología EIA
- **Metodología**: Certificados en PSP/CMMI

## 📞 Contacto

- **Email**: desarrollo.eia@sep.gob.mx
- **Website**: https://eia.sep.gob.mx
- **Soporte**: soporte.eia@sep.gob.mx

## 🎓 Recursos Adicionales

- [Documentación GraphQL](https://graphql.org/learn/)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PSP Body of Knowledge](https://www.sei.cmu.edu/our-work/projects/display.cfm?customel_datapageid_4050=6063)
- [RUP Best Practices](https://www.ibm.com/docs/en/rational-unified-process)
- [CMMI for Development](https://cmmiinstitute.com/)

---

**Versión**: 1.0.0  
**Última actualización**: 19 de enero de 2026  
**Estado**: ✅ En Desarrollo Activo

---

## ⭐ Agradecimientos

Agradecemos a todos los contribuidores y a las instituciones educativas que participan en el piloto del sistema EIA.

---

**Hecho con ❤️ para mejorar la educación en México**
