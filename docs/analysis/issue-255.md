# Análisis del Issue #255

## 1. Resumen y Datos
*   **Título/Estado**: Epic: Casos de Uso del Proyecto / OPEN
*   **Componentes afectados**: Backlog Funcional, Documentación de Arquitectura, Módulo de Vinculación (Nuevo).
*   **Resumen Ejecutivo**: Consolidación del backlog oficial SiCRER. Se detecta la necesidad de extender el alcance para incluir la iniciativa de "Vinculación Comunitaria y Mentoría" como un eje transversal de la Fase 1.

## 2. Datos del issue
*   **Título**: Epic: Casos de Uso del Proyecto
*   **Estado**: Open
*   **Labels**: `epic`, `backlog`, `phase-1`
*   **Prioridad aparente**: Alta (Estratégica)
*   **Fuente consultada**: `REQUERIMIENTOS_Y_CASOS_DE_USO.md`, `PLAN_TRABAJO_FASE1.md`, Propuesta José Gutiérrez Arévalo.

## 3. Problema reportado
El issue #255 actúa como paraguas para todos los casos de uso (CU-01 a CU-16). El requerimiento actual es consolidar este backlog y asegurar que la trazabilidad entre requerimientos (RF) y código sea total, incorporando las nuevas necesidades de vinculación comunitaria reportadas por la mentoría local.

## 4. Estado actual en el código
*   **Trazabilidad**: Existe una matriz parcial en `web/doc/casos_uso.md`.
*   **Implementación**: CUs 01-09 y 13 tienen bases técnicas sólidas. CUs 10-12 (Análisis) están en fase de planeación técnica. 
*   **GAPs**: No existe mención en el código ni en la base de datos de la infraestructura para el "Laboratorio de Tecnología" (WordPress/CMS) ni para el seguimiento de "Servicio Social" de los alumnos.

## 5. Comparación issue vs implementación
*   **Coincidencias**: Los casos de uso de carga (CU-04v2) y tickets (#262/CU-13) están alineados al DDL maestro.
*   **Brechas/Inconsistencias**: El backlog no contempla el "Portal Digital San Felipe de los Herreros" ni la acreditación de prácticas profesionales.

## 6. Diagnóstico
*   **Síntoma observado**: Backlog estático que no refleja el impacto social y la vinculación comunitaria solicitada.
*   **Defecto identificado**: Ausencia de requerimientos formales para la gestión de mentoría digital.
*   **Causa raíz principal**: El diseño original era estrictamente institucional sin enfoque en la retribución tecnológica a la comunidad de origen.
*   **Riesgos asociados**: Desalineación con los objetivos de impacto social del mentor y falta de incentivos para la participación de los alumnos (validez curricular).

## 7. Solución propuesta
*   **Objetivo**: Integrar el "Laboratorio de Mentoría" al SiCRER.
*   **Diseño detallado**: 
    1.  Formalizar el **CU-17: Vinculación Comunitaria y Laboratorio de Aprendizaje**.
    2.  Implementar tabla `mentoria_practicas` para registro de horas y competencias de alumnos participantes.
    3.  Desarrollar integración API con el CMS (WordPress) para publicación de crónicas y patrimonio cultural.
    4.  Mapear todos los Issues de GitHub al Checklist oficial.
*   **Archivos a intervenir**: `REQUERIMIENTOS_Y_CASOS_DE_USO.md`, `PLAN_TRABAJO_FASE1.md`, Angular (Dashboard Mentoría).

## 8. Criterios de aceptación
*   [ ] Checklist de #255 actualizado con todos los issues vinculados.
*   [ ] Nuevo `CU-17` documentado en el archivo maestro de requerimientos.
*   [ ] Diseño de persistencia para el módulo de vinculación aprobado.

## 9. Estrategia de pruebas y Evidencia
*   **Evidencia**: Listado de issues en GH alineado al nuevo plan de trabajo extendido.

## 10. Cumplimiento de políticas y proceso
Sigue metodología RUP (Refinamiento) y estándares de seguridad para protección de datos personales de alumnos mentoreados (LGPDP).

## 11. Documentación requerida
*   `docs/analysis/issue-255.md` (Este documento)
*   Actualización de `REQUERIMIENTOS_Y_CASOS_DE_USO.md` v2.1.

## 12. Acciones en GitHub
*   **Rama de trabajo**: `task/pepenautamx-issue255-epic-casos-uso`
*   **Labels**: `epic`, `community-impact`

## 13. Recomendación final
Convertir el SiCRER en un portal vivo que no solo gestione evaluaciones, sino que sirva como plataforma de preservación cultural y capacitación profesional para los jóvenes de la comunidad.

---

## COMENTARIO PARA GITHUB (RESUMEN TÉCNICO)
🔍 **Análisis & Causa Raíz**: Se identifica la necesidad estratégica de expandir el backlog oficial #255 para incluir la "Vinculación Comunitaria". El sistema actual no soporta el seguimiento de mentoría digital pactado con la comunidad.

🛠️ **Solución Propuesta**
1.  Sincronizar el backlog de GitHub con los 16 CUs oficiales.
2.  Añadir el **CU-17: Vinculación Comunitaria y Mentoría**.
3.  Implementar el registro de práticas profesionales/servicio social para alumnos.

✅ **Criterios de Aceptación**
*   Backlog de #255 sincronizado.
*   Requerimientos v2.1 incluyen módulo de Mentoría.

Nota: Documentación completa en `docs/analysis/issue-255.md`.
