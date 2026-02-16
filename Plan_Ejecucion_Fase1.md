# Plan de Ejecución - Fase 1: Portal Híbrido (SiCRER 24/25)

## SECCIÓN A: Status Report (Auditoría Técnica)

### Resumen Ejecutivo
El sistema se encuentra en una etapa avanzada de desarrollo de la Fase 1. La arquitectura base (Angular + NestJS/GraphQL + PostgreSQL) está establecida. Los módulos críticos (Autenticación, Carga Masiva de Excel, Tickets) tienen implementación funcional tanto en Backend como en Frontend.

**Hallazgos Principales:**
1.  **Backend Sólido**: La lógica de `resolvers.ts` es robusta, manejando validaciones, hash de archivos para evitar duplicados y transacciones BD.
2.  **Frontend Estructurado**: Angular cuenta con rutas claras y componentes para cada caso de uso principal.
3.  **Deuda Técnica (Queries)**: Se detectó el uso frecuente de `SELECT *` y selecciones manuales de columnas en lugar de un builder optimizado o un ORM completo, lo que puede dificultar el mantenimiento y rendimiento a futuro.
4.  **Procesamiento Síncrono**: La carga de Excel (`uploadExcelAssessment`) procesa el archivo en el hilo principal. Para archivos grandes, esto bloqueará el servidor Node.js.

### Semáforo de Estado por Módulo

| Módulo | Funcionalidad Requerida | Estado Actual | Riesgo | Notas Técnicas |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación** | Login, Roles (Admin/Escuela), JWT/Session | **Completo** | 🟢 Verde | Implementado `authenticateUser`, `createUser` con hashing y roles. |
| **Carga Masiva** | Subida Excel, Validación Formato, Parsing, Guardado BD | **Completo** | 🟢 Verde | Lógica compleja de parsing implementada en Backend. Frontend `CargaMasivaComponent` existe. |
| **Tickets** | Crear Ticket, Adjuntar Evidencia, Responder (Admin), Listar | **Completo** | 🟢 Verde | Flujo completo implementado. Manejo de evidencias como rutas de archivo. |
| **Dashboard** | Visualización métricas, Gráficas de avance, KPIs | **En Progreso** | 🟡 Amarillo | Existe `AdminPanelComponent` pero el Backend carece de queries de agregación (COUNT, GROUP BY) para métricas. |
| **Validación** | Reglas de negocio (CURP, Grados), Rechazo de duplicados | **Completo** | 🟢 Verde | Implementado hash SHA256 para detectar duplicados y validación de CCT/Nivel. |
| **Integración Legacy** | Exposición de API para consulta e inserción desde Legacy | **Pendiente** | 🟡 Amarillo | Se requiere API REST/GraphQL para que los sistemas legacy consulten solicitudes y suban respuestas/archivos. |
| **Infraestructura SFTP** | Servidor de archivos seguro y cliente en Node.js | **Pendiente** | 🔴 Rojo | Falta configurar ambiente Docker SFTP y desarrollar el servicio de conexión en Backend. |
| **Descargas** | Generación de reportes, descarga de comprobantes | **En Progreso** | 🟡 Amarillo | Componente `DescargasComponent` existe, pero falta confirmar la generación de PDFs en Backend. |

---

## SECCIÓN B: Plan de Sprints (Scrum)

**Objetivo General Fase 1**: Estabilizar el Portal Híbrido, optimizar el rendimiento de cargas masivas y asegurar la exposición de servicios para integración con sistemas legacy.

### Sprint 1: Optimización y Experiencia de Usuario (Estabilización)
**Objetivo**: Pulir la experiencia de carga de archivos (feedback visual), optimizar queries críticas, refactorizar el manejo de archivos grandes y preparar entornos de pruebas.

| ID | User Story | Capa | Estimación | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **US-1.1** | Optimizar queries de usuarios y CCT usando selección de campos específica. | Backend | 3 Pts | - Reemplazar queries manuales con Query Builder o función helper.<br>- Reducir tiempo de respuesta en `listUsers`. |
| **US-1.2** | Implementar feedback de progreso en Carga Masiva (Spinner/Barra). | Frontend | 5 Pts | - Mostrar estado "Procesando" durante la mutación GraphQL.<br>- Manejar errores de timeout o validación amigablemente. |
| **US-1.3** | Refactorizar `uploadExcelAssessment` para stream o worker thread. | Backend | 8 Pts | - El parsing de Excel no debe bloquear el Event Loop.<br>- Soporte para archivos >10MB sin crash. |
| **US-1.4** | Crear Guard de Autenticación para rutas protegidas en Angular. | Frontend | 3 Pts | ✅ **Completo** - Rutas `/admin`, `/carga-masiva` redirigen a login. |
| **US-1.7** | Implementar recuperación de contraseña (usuario y admin). | Fullstack | 5 Pts | ✅ **Completo** - Vista pública y gestión en Admin Panel. |
| **US-1.5** | Implementar borrado lógico de Tickets y Usuarios (Soft Delete). | DB/Back | 2 Pts | - `deleteUser` ya hace soft delete. Extender a Tickets si es necesario. |
| **US-1.6** | Configurar ambiente Docker para servidor SFTP (Pruebas Integrales). | DevOps | 3 Pts | - `docker-compose.yml` incluye servicio `atmoz/sftp` o similar.<br>- Usuarios y permisos de prueba configurados. |

### Sprint 2: Dashboard y Servicios de Integración (API y SFTP)
**Objetivo**: Proveer métricas para administradores e implementar los canales de comunicación (API + SFTP) para sistemas externos.

| ID | User Story | Capa | Estimación | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **US-2.1** | Crear Query GraphQL `getDashboardMetrics`. | Backend | 8 Pts | - Retornar conteos: Total Escuelas, Total Alumnos, % Avance por Estado, Tickets Abiertos. |
| **US-2.2** | Implementar Widgets de Métricas en `AdminPanelComponent`. | Frontend | 5 Pts | - Tarjetas con KPIs (Números grandes).<br>- Gráfica de barras (Solicitudes por día). |
| **US-2.3** | Exportar listado de Tickets a CSV/Excel. | Front/Back | 5 Pts | - Botón "Exportar" en historial de tickets.<br>- Generar archivo descargable. |
| **US-2.4** | Vista de detalle de Solicitud de Carga. | Frontend | 5 Pts | - Ver errores específicos de un archivo rechazado (línea, motivo). |
| **US-2.5** | Exponer Endpoints de API para consumo Legacy. | Backend | 8 Pts | - Endpoint (GET) para que Legacy consulte solicitudes por CCT.<br>- Endpoint (POST) para que Legacy suba estatus de procesamiento. |
| **US-2.6** | Implementar Servicio Cliente SFTP en Node.js. | Backend | 8 Pts | - Módulo para conectar, subir y listar archivos en SFTP.<br>- Integrar en flujo de carga masiva (guardar en SFTP además/en lugar de local). |

### Sprint 3: Integración Final y Despliegue
**Objetivo**: Validar la integración completa (API + SFTP), asegurar la integridad de datos y preparar el ambiente de producción.

| ID | User Story | Capa | Estimación | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **US-3.1** | Documentación de API y Protocolo SFTP para Integración Legacy. | Doc | 3 Pts | - Swagger para API.<br>- Guía de estructura de carpetas SFTP para equipo Legacy. |
| **US-3.2** | Pruebas de Carga (Load Testing) para subida de archivos. | QA | 5 Pts | - Simular 50 usuarios subiendo Excel simultáneamente.<br>- Asegurar integridad de BD y SFTP. |
| **US-3.3** | Validación de flujo de integración API + SFTP. | QA | 5 Pts | - Simular cliente Legacy consumiendo API y descargando de SFTP.<br>- Verificar integridad de archivos transferidos. |
| **US-3.4** | Configuración de Docker/PM2 para producción. | DevOps | 3 Pts | - Dockerfile optimizado.<br>- Variables de entorno seguras (Credenciales SFTP). |

### Dependencias Críticas
1.  **US-1.3 (Refactor Upload)** es prerequisito para **US-3.2 (Load Test)**.
2.  **US-1.6 (Docker SFTP)** es prerequisito para **US-2.6 (Servicio Backend SFTP)**.
3.  **US-2.5 y US-2.6** son indispensables para la integración con sistemas Legacy.

---

## SECCIÓN C: Estándares y Metodología (PSP / Scrum / CI/CD)

Para asegurar la calidad y mantenibilidad del software, se integrarán los siguientes estándares en el flujo de trabajo.

### 1. Personal Software Process (PSP)
Se requerirá el registro de métricas individuales para mejorar la estimación y calidad.
*   **Artefactos a Crear**: `docs/PSP_METRICS_TEMPLATE.md`, `docs/DEFECT_LOG.md`.
*   **Política**: Cada commit cerrando una feature debe incluir en el mensaje tiempos reales vs estimados (ej: `feat: login modules (E: 2h, R: 2.5h)`).

### 2. Scrum & GitFlow
*   **Gestión Visual**: Tablero Kanban en archivo Markdown (`docs/KANBAN_BOARD.md`) gestionado en el repo.
*   **Ramas**: `main` (prod), `develop` (integ), `feature/us-x` (dev).
*   **Ceremonias**: Daily Standup (15 min), Sprint Review & Retrospective.
*   **Artefactos**: `docs/DEVELOPMENT_GUIDE_PSP_SCRUM.md` (Unificación de guías PSP, Scrum y GitFlow).

### 3. CI/CD (Integración y Despliegue Continuo)
Automatización de pruebas y despliegue usando GitHub Actions (o similar).
*   **Pipeline de Calidad (CI)**:
    *   Linting (ESLint/Prettier).
    *   Unit Tests (Jest/Karma).
    *   Build Check (Angular/Nest build).
*   **Pipeline de Despliegue (CD)**:
    *   Build Docker Image.
    *   Deploy automático a ambiente de desarrollo (`dev`).

### Actualización Plan de Sprints (Tareas de Gobernanza Tecnológica)

**Agregar a Sprint 1 (Foundation):**
| ID | User Story | Estimación | Criterios de Aceptación |
| :--- | :--- | :--- | :--- |
| **US-0.1** | Establecer Configuración CI/CD. | 3 Pts | - Archivo `.github/workflows/ci.yml` creado.<br>- Ejecuta linter y tests en cada Push a `develop`. |
| **US-0.2** | Definir Guías Unificadas y Tablero de Proyecto. | 2 Pts | - Archivo `docs/DEVELOPMENT_GUIDE_PSP_SCRUM.md` creado.<br>- Archivo `docs/KANBAN_BOARD.md` inicializado con columnas (ToDo, WIP, Done). |
| **US-0.3** | Configurar Husky/Pre-commit hooks. | 2 Pts | - No permite commits con errores de sintaxis (lint).<br>- Valida formato de mensaje de commit. |

### Recomendación Inmediata
Iniciar con **US-0.1** y **US-0.2** para establecer la gobernanza técnica. Luego proceder con **US-1.3** y **US-1.2** como prioridades funcionales.
