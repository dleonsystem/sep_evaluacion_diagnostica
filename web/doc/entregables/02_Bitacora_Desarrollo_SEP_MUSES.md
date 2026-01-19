# BITÁCORA DE DESARROLLO  
## Detalle de tareas realizadas por sprint o módulo entregado

**Unidad de Administración y Finanzas**  
**Dirección General de Tecnologías de la Información y Comunicaciones**

---

## 1. Propósito

Registrar las tareas ejecutadas durante **noviembre 2025** para el proyecto **SEP–MUSES**, destacando:

- Transición estratégica a backend **Python + FastAPI**
- Habilitación de catálogos REST
- Trazabilidad de commits, problemáticas atendidas y Pull Requests

**Alcance:** Sprints **4 a 6**, cerrando el **08 de diciembre de 2025**.

**Contexto de sprints:**  
Los sprints 1–3 se ejecutaron en octubre (definición inicial de arquitectura y pruebas con GraphQL).  
Este documento inicia en **Sprint 4**, primer sprint de noviembre.

---

## 2. Bitácora de desarrollo – noviembre 2025

### Sprint 4 · 06–17 de noviembre — Transición a FastAPI

| Objetivo | Actividades realizadas | Evidencia |
|--------|----------------------|----------|
| Migrar el backend planeado en GraphQL a Python + FastAPI manteniendo Angular y PostgreSQL | - Consolidación de aplicación FastAPI en `webservice/` con routers versionados `/api/v1` y endpoint `/health`.<br>- Modelado de esquemas **Pydantic** y servicios de dominio.<br>- Configuración de acceso a PostgreSQL `sep_muses` mediante **SQLAlchemy**, respetando tablas `CTMU*` y el indicador `activo`. | - Commits GitHub: `a8c4fc4`, `adfd8bf`.<br>- Servicios y routers en `webservice/` y `api/`.<br>- Modelos ORM alineados a `bd/`. |

---

### Sprint 5 · 20–30 de noviembre — Publicación de catálogos REST

| Objetivo | Actividades realizadas | Evidencia |
|--------|----------------------|----------|
| Exponer catálogos priorizados para el módulo de inscripción | - Publicación de endpoints REST para **opciones educativas**, **tipos de discapacidad**, **aptitudes sobresalientes** y **origen de estudios**.<br>- Aplicación de filtros de vigencia y ordenamiento estándar.<br>- Documentación de contratos REST y alineación con Angular (HttpClient).<br>- Pruebas manuales y revisión en equipo. | - Commits: `879760c`, `dece65c`, `f6ee9a3`, `1a2d4e5`.<br>- Pull Requests: `#197`, `#199`, `#200`, `#201`, `#202`.<br>- Documentación de arquitectura actualizada. |

---

### Sprint 6 · 01–08 de diciembre — Cierre y documentación

| Objetivo | Actividades realizadas | Evidencia |
|--------|----------------------|----------|
| Dejar trazabilidad y guías de prueba para los catálogos entregados | - Elaboración de guías **Postman** para endpoints REST (`docs/postman`).<br>- Documentación de ajustes de entorno local y payloads de ejemplo.<br>- Actualización de bitácoras y recopilación de evidencia de PRs y merges. | - Commits: `7ccafd1`, `df14d85`.<br>- Merges a `main` registrados en PRs y bitácora. |

---

## 3. Observaciones y acuerdos

1. El cambio estratégico a **FastAPI** permitió consolidar contratos REST tipados con **Pydantic** sin afectar el frontend Angular ni PostgreSQL.
2. Los catálogos aplican el filtro de vigencia (`activo = true`) y ordenamiento consistente, reduciendo reprocesos en la UI.
3. Permanece pendiente la integración con **Llave MX** y la automatización de pruebas REST.

---

## 4. Próximos pasos (diciembre 2025)

- Incorporar pruebas automatizadas con **Pytest** para `/api/v1/catalogos/*`.
- Validar contratos mediante **schemathesis**.

---

**Elaboró:** José Guadalupe Gutiérrez Arévalo  
**Revisó:** David León Gómez  
