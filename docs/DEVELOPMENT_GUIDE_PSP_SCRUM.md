# Guía de Desarrollo Unificada (PSP, Scrum & GitFlow)

## 1. Metodología Scrum
*   **Sprints:** Duración de 2 semanas.
*   **Tablero:** Gestionado en `docs/KANBAN_BOARD.md`.
*   **Daily:** Sincronización diaria de 15 min.

## 2. Personal Software Process (PSP)
Para asegurar la calidad, cada desarrollador debe seguir el registro de métricas:
*   **Estimación:** Antes de iniciar una tarea, registrar tiempo estimado en el Sprint Backlog.
*   **Registro de Tiempos:** Usar `docs/PSP_METRICS_TEMPLATE.md`.
*   **Registro de Defectos:** Documentar errores encontrados en revisión o pruebas en `docs/DEFECT_LOG.md`.

## 3. Estándares de GitFlow
*   `main`: Rama de producción (estable).
*   `develop`: Integración de características.
*   `feature/US-X`: Rama para la historia de usuario X.
*   **Commit Messages:** Deben seguir el formato: `feat(scope): description (E: 2h, R: 2.5h)`.

## 4. Estándares de Código
*   **Backend:** Node.js (TypeScript), seguir patrones de Arquitectura Limpia.
*   **Frontend:** Angular (Standalone Components), Vanilla CSS para estilos.
*   **Linting:** `npm run lint` antes de cada push.
