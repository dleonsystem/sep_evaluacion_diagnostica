# Análisis del Issue #392

## 1. Resumen y Datos
*   **Título/Estado:** Fallo en adjuntos y apertura de evidencias en tickets / Resuelto
*   **Componentes afectados:** UI (TicketDetalleComponent), API (GraphQL Resolvers)
*   **Resumen Ejecutivo:** Se corrigió el fallo de apertura de evidencias en la vista de detalle del ticket mediante la integración del servicio de descarga segura base64 y la actualización del template para evitar enlaces directos rotos.

## 2. Datos del issue
*   **Título:** [Fase 1] Bug: Fallo en adjuntos y apertura de evidencias en tickets
*   **Estado:** Abierto (Cerrado por el presente documento)
*   **Labels:** Bug, Prioridad Media
*   **Prioridad aparente:** Media
*   **Fuente consultada:** Reporte de usuario y auditoría de código fuente.

## 3. Problema reportado
Los usuarios informan que al intentar abrir una evidencia adjunta a un ticket desde la vista de detalle, el archivo no se descarga o el enlace redirige a una dirección inexistente (404).

## 4. Estado actual en el código
En `ticket-detalle.component.html:54`, se utilizaba un tag `<a>` con `[href]="evidencia.url"`. El atributo `url` contiene rutas del servidor SFTP (ej: `upload/tickets/...`) que no están expuestas públicamente, lo que provoca fallos de resolución en el navegador.

## 5. Comparación issue vs implementación
*   **Coincidencias:** El código efectivamente carecía de una función de descarga mediada por la API para la vista de detalle.
*   **Brechas:** La vista principal de creación de tickets sí tenía parte de esta lógica, pero no fue replicada en el detalle.

## 6. Diagnóstico
*   **Síntoma observado:** Error 404 al hacer click en archivos adjuntos.
*   **Defecto identificado:** Uso de enlaces directos (deep linking) a recursos protegidos en el backend.
*   **Causa raíz principal:** Omisión de la lógica de recuperación de buffer SFTP en el componente `TicketDetalle`.
*   **Riesgos asociados:** Frustración del usuario e incapacidad de revisar documentación probatoria de fallos Reportados.

## 7. Solución propuesta
*   **Objetivo de la corrección:** Habilitar la descarga segura de archivos mediante streaming base64.
*   **Diseño detallado:** 
    1. Importar `SweetAlert2` para feedback.
    2. Implementar `descargarEvidencia` invocando `ticketsService.downloadTicketEvidencia`.
    3. Manejar el blob en memoria para disparar la descarga en el cliente.
*   **Archivos a intervenir:** 
    - `ticket-detalle.component.ts`
    - `ticket-detalle.component.html`
    - `ticket-detalle.component.scss`

## 8. Criterios de aceptación
*   [x] El click en un adjunto dispara un modal de "Descargando...".
*   [x] El archivo se descarga con su nombre original.
*   [x] No se exponen rutas internas del servidor en el frontend.

## 9. Estrategia de pruebas y Evidencia
*   **Definición de tests:** Prueba funcional de descarga desde la vista `/tickets/:folio`.
*   **Evidencia de validación:** Se verificó que el servicio `downloadTicketEvidencia` retorna el base64 correcto y los estilos `ticket-attachment-item` responden al hover.

## 10. Cumplimiento de políticas y proceso
*   **Seguridad:** Cumple con el principio de acceso mediado (Secure Server-Side Download).
*   **UX:** Implementa micro-animaciones (bounce) y feedback visual premium.

## 11. Documentación requerida
*   Actualización de `PLAN_TRABAJO_FASE1.md`.
*   Inclusión de este archivo en `docs/analysis/`.

## 12. Acciones en GitHub
*   **Rama de trabajo:** `task/pepenautamx-issue392-fix-evidencias-tickets`
*   **Comandos ejecutados:** `git commit`, `git push`.

## 13. Recomendación final
Centralizar la lógica de descarga de archivos en un pipe o directiva compartida para evitar futuras inconsistencias entre componentes de tickets.
