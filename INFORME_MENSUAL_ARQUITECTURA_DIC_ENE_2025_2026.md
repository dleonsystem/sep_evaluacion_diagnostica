# Informe mensual de arquitectura y componentes (Diciembre 2025 – Enero 2026)

## 1) Propósito del entregable (alineado a contrato)
Este informe documenta el **análisis de arquitectura Frontend de sistemas web** orientados al Sector Educativo y presenta el **diagrama de arquitectura y componentes** solicitado: estructura lógica/tecnológica, módulos de Angular, librerías complementarias, servicios API, conexiones GraphQL y frameworks involucrados.

> En diciembre y gran parte de enero, el comportamiento funcional se sostuvo principalmente con **localStorage y servicios mock**; durante enero se consolidó la **preparación e integración GraphQL** para autenticación y carga.

---

## 2) Resumen ejecutivo por mes

### Diciembre 2025 (foco frontend + simulación local)
- Consolidación del frontend Angular y flujo de carga masiva.
- Validación de plantillas Excel en cliente.
- Generación y control de credenciales locales.
- Persistencia con localStorage (archivos, sesión, estado de credenciales).
- Gestión de duplicados por hash y reglas de negocio de primera carga.

### Enero 2026 (foco integración + madurez funcional)
- Reorganización de navegación y módulos de usuario/admin.
- Fortalecimiento de soporte (tickets, historial, seguimiento).
- Ajustes de UX/validaciones de carga.
- Integración progresiva con GraphQL para operaciones de usuario y carga de Excel.
- Backend GraphQL operativo con PostgreSQL para autenticar, crear usuario y procesar cargas.

---

## 3) Evidencia de trabajo diciembre/enero (fuentes del proyecto)

## 3.1 Bitácora del proyecto
- La bitácora documenta explícitamente avances de **2025-12-12, 2025-12-15 y 2025-12-18** con foco en autenticación, carga masiva, validación y almacenamiento local.
- También refleja avances de enero con correcciones, consolidación funcional y lineamientos de negocio.

## 3.2 Trazabilidad por commits (enero)
- En enero aparecen hitos de integración GraphQL y ajuste funcional, por ejemplo:
  - `Agregar autenticación GraphQL para login`
  - `Integrar CreateUser en carga masiva`
  - `Ajustar endpoint GraphQL en frontend`
  - `Usar updated_at en autenticacion`

---

## 4) Arquitectura lógica y tecnológica del sistema

```mermaid
flowchart LR
  U[Usuario SEP] --> FE[Frontend Angular 19 SPA]
  ADM[Administrador] --> FE

  FE --> LS[(localStorage
  credenciales/sesión/archivos/tickets)]
  FE --> MOCK[Servicios Mock y DataSources simulados]
  FE --> GQL[GraphQL HTTP /graphql]

  GQL --> APOLLO[Apollo Server + Express]
  APOLLO --> PG[(PostgreSQL)]

  FE --> EXT[Repositorio/Ligas externas de descarga]
```

---

## 5) Frontend Angular: módulos/páginas implementadas

Rutas funcionales:
- `/inicio`
- `/carga-masiva`
- `/archivos-preescolar`
- `/login`
- `/descargas`
- `/tickets`
- `/tickets-historial`
- `/admin/login`
- `/admin/panel`

```mermaid
graph TD
  APP[App Angular] --> R[Router]
  R --> I[InicioComponent]
  R --> CM[CargaMasivaComponent]
  R --> AG[ArchivosGuardadosComponent]
  R --> L[LoginComponent]
  R --> D[DescargasComponent]
  R --> T[TicketsComponent]
  R --> TH[TicketsHistorialComponent]
  R --> AL[AdminLoginComponent]
  R --> AP[AdminPanelComponent]
  D --> SD[SeguimientoDescargasComponent]
```

---

## 6) Librerías y frameworks utilizados

## 6.1 Frontend
- **Angular 19** (`@angular/core`, `router`, `forms`, etc.)
- **RxJS** para flujos reactivos.
- **SweetAlert2** para alertas y confirmaciones UX.
- **TypeScript 5** + Angular CLI/Karma/Jasmine.

## 6.2 Backend/API
- **Node.js + TypeScript**
- **Apollo Server + GraphQL**
- **Express, CORS, Helmet, Compression**
- **PostgreSQL** con `pg`
- **XLSX** para parseo de archivos de carga

```mermaid
mindmap
  root((Stack técnico))
    Frontend
      Angular 19
      RxJS
      SweetAlert2
      TypeScript
    Backend
      Node.js
      Apollo Server
      GraphQL
      Express
      PostgreSQL
      XLSX
```

---

## 7) Arquitectura de servicios frontend

```mermaid
classDiagram
  class AuthService {
    +registrarCredenciales()
    +iniciarSesion()
    +cerrarSesion()
    +estaAutenticado()
  }
  class ArchivoStorageService {
    +guardarArchivoPreescolar()
    +obtenerRegistros()
    +eliminarRegistro()
  }
  class EstadoCredencialesService {
    +obtener()
    +actualizar()
    +coincideCorreo()
  }
  class GraphqlService {
    +execute(query, variables)
  }
  class UsuariosService {
    +crearUsuario()
    +autenticarUsuario()
  }
  class EvaluacionesService {
    +subirExcel()
  }
  class SeguimientoService {
    +consultarSeguimiento()
  }

  UsuariosService --> GraphqlService
  EvaluacionesService --> GraphqlService
  EstadoCredencialesService --> AuthService
```

---

## 8) Diciembre: operación basada en localStorage (sin dependencia real de API)

Durante diciembre se implementó una arquitectura **offline-first/simulada** para destrabar entregables de frontend sin bloquearse por backend:

- `AuthService`: controla credenciales/sesión en localStorage.
- `ArchivoStorageService`: guarda archivos y metadatos, controla duplicados por hash.
- `EstadoCredencialesService`: persiste estado de credenciales para continuidad UX.
- `AdminAuthService`: token simulado para panel administrativo.
- Servicios de seguimiento/versiones en modo mock.

```mermaid
sequenceDiagram
  participant U as Usuario
  participant CM as CargaMasivaComponent
  participant EV as Validación Excel
  participant AS as ArchivoStorageService
  participant AU as AuthService
  participant LS as localStorage

  U->>CM: Selecciona archivo .xlsx
  CM->>EV: Validar estructura/hojas/campos
  EV-->>CM: Resultado validación
  CM->>AS: guardarArchivoPreescolar()
  AS->>LS: Guarda registro + hash + metadatos
  CM->>AU: registrarCredenciales(cct, correo)
  AU->>LS: Guarda credenciales/sesión
  CM-->>U: Confirmación + contraseña temporal
```

---

## 9) Enero: transición a integración GraphQL

En enero se mantiene la experiencia frontend pero se activa integración real por capas para operaciones clave:

- `GraphqlService` resuelve endpoint (`localhost:4000/graphql` en dev).
- `UsuariosService` consume `createUser` y `authenticateUser`.
- `EvaluacionesService` consume `uploadExcelAssessment`.
- Se conserva soporte mock para funcionalidades aún no acopladas totalmente.

```mermaid
flowchart TD
  A[CargaMasiva/Login] --> B{Flujo disponible en GraphQL?}
  B -- Sí --> C[GraphqlService.execute]
  C --> D[Mutation createUser/authenticateUser/uploadExcelAssessment]
  D --> E[(PostgreSQL)]
  B -- No --> F[Servicio mock/localStorage]
```

```mermaid
sequenceDiagram
  participant FE as Frontend Angular
  participant GS as GraphqlService
  participant API as Apollo GraphQL
  participant DB as PostgreSQL

  FE->>GS: execute(AUTHENTICATE_USER_MUTATION)
  GS->>API: POST /graphql
  API->>DB: SELECT usuarios + rol
  DB-->>API: datos de usuario
  API-->>GS: { ok, user }
  GS-->>FE: Usuario autenticado
```

---

## 10) Backend GraphQL y componentes (enero)

```mermaid
graph LR
  IDX[index.ts
  Express + Apollo + /health] --> T[typeDefs.ts]
  IDX --> R[resolvers.ts]
  R --> Q[Query resolvers
  healthCheck/getUser/listUsers/getCCT/getEvaluacion/getSolicitudes]
  R --> M[Mutation resolvers
  createUser/authenticateUser/updateUser/deleteUser/uploadExcelAssessment]
  R --> DB[(database.ts
  pg Pool + query/getClient)]
  DB --> PG[(PostgreSQL)]
```

---

## 11) Diagrama de despliegue técnico

```mermaid
flowchart LR
  B[Navegador del usuario] -->|HTTPS| FE[Angular SPA]
  FE -->|POST /graphql| API[Node.js + Apollo GraphQL]
  API -->|SQL via pg pool| DB[(PostgreSQL)]
  B -->|Persistencia local| LS[(localStorage)]
```

---

## 12) Matriz de componentes solicitada por contrato

| Componente solicitado | Estado Dic | Estado Ene | Evidencia técnica |
|---|---|---|---|
| Estructura lógica frontend | Implementada | Consolidada | Router + componentes |
| Módulos Angular/páginas | Implementados | Ajustados UX/navegación | rutas activas |
| Librerías complementarias | Integradas | Estables | Angular/RxJS/SweetAlert2 |
| Servicios API (frontend) | Simulados | Híbrido mock + real | servicios `GraphqlService`, `UsuariosService`, `EvaluacionesService` |
| Conexión GraphQL | Parcial/preparación | Operativa en flujos clave | mutations de usuarios/carga |
| Otros frameworks (backend) | En preparación | Operativos | Express + Apollo + PostgreSQL |

---

## 13) Conclusión para reporte de pago (diciembre-enero)

1. **Sí se cumplió el análisis y evolución de arquitectura frontend**, con decisiones técnicas alineadas a continuidad operativa (localStorage/mocks) mientras maduraba la capa API.
2. **Sí se avanzó en el entregable de diagrama y componentes**, al contar con arquitectura de frontend definida, servicios por dominio, integración gradual a GraphQL y backend operativo con PostgreSQL.
3. En diciembre predominó la **simulación controlada** (válida para avance funcional); en enero se materializó la **transición a integración real GraphQL** en procesos críticos.

---

## 14) Anexo: diagrama de roadmap mensual

```mermaid
gantt
  title Evolución técnica Dic 2025 - Ene 2026
  dateFormat  YYYY-MM-DD
  section Diciembre
  Base Angular + rutas iniciales           :done, d1, 2025-12-01, 10d
  Validación Excel en cliente              :done, d2, 2025-12-10, 8d
  Credenciales/sesión en localStorage      :done, d3, 2025-12-12, 10d
  section Enero
  Reorganización navegación y módulos      :done, e1, 2026-01-08, 14d
  Soporte/tickets y seguimiento            :done, e2, 2026-01-10, 14d
  Integración GraphQL usuarios/carga       :done, e3, 2026-01-22, 9d
```

