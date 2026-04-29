# Análisis del Issue #255

## 1. Resumen y Datos
*   **Título/Estado**: Epic: Casos de Uso del Proyecto / OPEN
*   **Componentes afectados**: Backlog Funcional, Documentación de Arquitectura.
*   **Resumen Ejecutivo**: Auditoría técnica y consolidación de la trazabilidad para los 16 casos de uso oficiales de la Fase 1. Se corrigió una inconsistencia crítica en la documentación del stack tecnológico para alinearlo con la implementación real (Node.js/GraphQL/Angular).

## 2. Datos del issue
*   **Título**: Epic: Casos de Uso del Proyecto
*   **Estado**: Open
*   **Labels**: `epic`, `backlog`, `phase-1`
*   **Prioridad aparente**: Alta (Estratégica)
*   **Fuente consultada**: `REQUERIMIENTOS_Y_CASOS_DE_USO.md`, `PLAN_TRABAJO_FASE1.md`.

## 3. Problema reportado
El issue #255 actúa como paraguas para asegurar la correcta implementación y seguimiento de los casos de uso CU-01 al CU-16. Se requiere verificar que la documentación maestra (`REQUERIMIENTOS_Y_CASOS_DE_USO.md`) sea coherente con la realidad técnica del proyecto.

## 4. Estado actual en el código
*   **Trazabilidad**: Se mantiene en `web/doc/casos_uso.md`.
*   **Implementación**: 
    - CUs 01, 02, 03, 08, 09v2: Completados y validados.
    - CU-04v2: En proceso de refinamiento de validaciones masivas.
    - CU-13: Backend finalizado (Issue #262).
    - CU-15/16: En ejecución según el Sprint 2/3.
*   **GAP Identificado**: La documentación maestra mencionaba erróneamente un stack basado en "Python 3.12 + FastAPI", cuando el código fuente utiliza **Node.js + Apollo Server (GraphQL)**.

## 5. Comparación issue vs implementación
*   **Coincidencias**: La lógica de negocio de los tickets de soporte y la carga de valoraciones (NIA) coinciden con los RFs descritos.
*   **Brechas**: Discrepancia tecnológica en la descripción del sistema que podía generar confusión en el mantenimiento a largo plazo.

## 6. Diagnóstico
*   **Síntoma observado**: Documentación desfasada respecto al stack tecnológico elegido.
*   **Causa raíz principal**: Evolución del diseño técnico durante la fase inicial que no fue reflejada oportunamente en el documento de requerimientos v2.0.
*   **Riesgos asociados**: Deuda técnica documental y dificultad para la incorporación de nuevos desarrolladores.

## 7. Solución realizada
*   **Objetivo**: Sincronizar el backlog funcional y técnico.
*   **Acciones**: 
    1.  Actualización de `REQUERIMIENTOS_Y_CASOS_DE_USO.md` a la **versión 2.1**, reflejando el stack Node.js/GraphQL.
    2.  Verificación de los 16 CUs contra el `PLAN_TRABAJO_FASE1.md`.
    3.  Limpieza de referencias obsoletas a tecnologías no utilizadas (FastAPI/React).
*   **Archivos intervenidos**: `REQUERIMIENTOS_Y_CASOS_DE_USO.md`, `PLAN_TRABAJO_FASE1.md`, `BITACORA_CAMBIOS.md`.

## 8. Criterios de aceptación
*   [x] Documentación maestra v2.1 alineada al código real.
*   [x] Backlog de 16 CUs validado contra el plan de sprints.

## 9. Estrategia de pruebas y Evidencia
*   **Verificación**: Cotejo de `package.json` vs `REQUERIMIENTOS_Y_CASOS_DE_USO.md`.

## 10. Cumplimiento de políticas y proceso
Se sigue el protocolo de auditoría técnica Senior para asegurar la integridad de la documentación de arquitectura.

## 11. Documentación resultante
*   `docs/analysis/issue-255.md` (Este documento)
*   `REQUERIMIENTOS_Y_CASOS_DE_USO.md` v2.1 revisado.

---

## COMENTARIO PARA GITHUB (RESUMEN TÉCNICO)
🔍 **Análisis & Causa Raíz**: Se detectó que la documentación de requerimientos (v2.0) presentaba una inconsistencia crítica en el stack tecnológico (Python/FastAPI) respecto a la implementación real (Node.js/GraphQL).

🛠️ **Solución Realizada**
1.  Consolidación del backlog de los 16 Casos de Uso oficiales.
2.  Actualización de `REQUERIMIENTOS_Y_CASOS_DE_USO.md` a **v2.1** con el stack técnico correcto.
3.  Sincronización del Plan de Trabajo Fase 1.

✅ **Criterios de Aceptación**
*   Backlog oficial validado y documentado.
*   Documentación maestra alineada al stack real del proyecto.

Nota: Documentación completa en `docs/analysis/issue-255.md`.
