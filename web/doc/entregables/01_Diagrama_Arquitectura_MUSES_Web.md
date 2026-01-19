# DIAGRAMA DE ARQUITECTURA Y COMPONENTES DE LOS SISTEMAS WEB EN DESARROLLO

**Unidad de Administración y Finanzas**  
**Dirección General de Tecnologías de la Información y Comunicaciones**

---

## 1. Propósito y alcance (noviembre 2025)

Documentar el estado arquitectónico y los componentes entregados durante noviembre 2025, resaltando el cambio estratégico de backend y su impacto en los flujos del proyecto **MUSES Web**.

---

## 2. Resumen ejecutivo de avances

- **Cambio estratégico de backend:** Se sustituyó la API GraphQL planificada en Node.js por un backend en **Python + FastAPI**, manteniendo el frontend en Angular y la base de datos corporativa en PostgreSQL.
- **Servicios de catálogos listos:** Endpoints REST versionados (`/api/v1/catalogos/*`) que exponen los catálogos de inscripción.
- **Modelado consistente:** Modelos ORM alineados al esquema `sep_muses`.
- **Frontend estable:** Componentes standalone de Angular con transición de GraphQL a REST.

---

## 3. Comparativo octubre vs noviembre

| Elemento | Octubre (planeado) | Noviembre (ejecutado) |
|--------|-------------------|----------------------|
| Backend | Node.js + GraphQL | Python + FastAPI |
| Contratos | GraphQL | REST + Pydantic |
| Conectividad | Apollo Client | HttpClient |
| Base de datos | PostgreSQL | PostgreSQL + SQLAlchemy |
| Identidad | Llave MX (diseño) | Pendiente |

---

## 4. Arquitectura lógica

```mermaid
flowchart TB
    subgraph Frontend
        A[Angular 18]
        B[Servicios REST]
        A --> B
    end
    B -->|HTTP| C[FastAPI]
    C --> D[Servicios de dominio]
    D -->|SQLAlchemy| E[(PostgreSQL sep_muses)]
```

---

## 4.2 Flujo de publicación de catálogos

```mermaid
sequenceDiagram
    participant A as Angular
    participant B as FastAPI
    participant C as PostgreSQL

    A->>B: GET /estatus-inscripcion?solo_activos=true
    B->>C: Consulta CTMU014
    C-->>B: Registros
    B-->>A: JSON tipado
```

---

## 4.3 Flujo de datos corporativo

```mermaid
flowchart TB
    A[sep_ides Raw]
    B[ETL tbae*]
    C[Core tbmu* sep_muses]
    D[API REST / GraphQL]
    E[Angular MUSES]

    A --> B --> C --> D --> E
```

---

## 5. Componentes entregados

| Capa | Componente | Evidencia |
|-----|-----------|----------|
| Backend | Routers catálogos | webservice/app/api/routes |
| Backend | Servicios dominio | webservice/app/services |
| Backend | ORM | webservice/app/models |
| Backend | Schemas | webservice/app/schemas |
| Frontend | Angular | web/ |

---

## 6. Servicios REST

- `/api/v1/catalogos/*`
- Parámetro `solo_activos`
- Versionado `/api/v1`

---

## 7. Gestión de datos y seguridad

- SQLAlchemy + PostgreSQL
- Control de vigencia (`activo`)
- Pendiente integración Llave MX
