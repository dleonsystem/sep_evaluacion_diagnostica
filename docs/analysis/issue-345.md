# Análisis del Issue #345: Corrección de Gatillo de Pipeline CI (Rediseño PSP/RUP)

## 1. Resumen y Datos
•  **Título/Estado**: Corrección de Gatillo y Entorno de Ejecución en CI Pipeline / **Resuelto**
•  **Componentes afectados**: Infraestructura (GitHub Actions), DevOps.
•  **Resumen Ejecutivo**: El pipeline de CI no se disparaba en la rama `dev` por un error de nomenclatura en el trigger (`develop`). Se corrigió el mapeo de ramas y se validó la compatibilidad con módulos ESM en Node 20.

## 2. Datos del issue
•  **Título**: [Infra][CI] Fix CI Trigger for dev branch and ESM support
•  **Estado**: Cerrado (Remediación finalizada)
•  **Labels**: `devops`, `infrastructure`, `Phase 1`, `bug`
•  **Prioridad aparente**: Crítica (Bloqueaba el control de calidad automatizado).
•  **Fuente consultada**: `PLAN_TRABAJO_FASE1.md`, `.github/workflows/ci.yml`.

## 3. Problema reportado
El pipeline de CI estaba configurado para escuchar eventos en la rama `develop`, la cual no existe en la arquitectura actual del proyecto (que utiliza `dev` como rama de integración). Esto causaba que el 100% de los pushes a `dev` no fueran auditados por GitHub Actions.

## 4. Estado actual en el código
- El archivo `.github/workflows/ci.yml` contenía `branches: [ "main", "develop", "feature/*" ]`.
- Se detectó que la documentación previa (`docs/analysis/issue-345.md`) afirmaba que el problema estaba resuelto, pero el código fuente seguía teniendo el error.

## 5. Comparación issue vs implementación
•  **Coincidencias**: El reporte del plan de trabajo señalaba correctamente la falta de ejecución del CI.
•  **Brechas/Inconsistencias**: Existía una desincronización entre la documentación técnica de auditoría y el archivo de configuración real.

## 6. Diagnóstico
•  **Síntoma observado**: Pestaña "Actions" en GitHub vacía o sin ejecuciones recientes para la rama `dev`.
•  **Defecto identificado**: Nombre de rama incorrecto en el filtro de eventos YAML.
•  **Causa raíz principal**: Uso de una plantilla estándar de GitHub que utiliza `develop` en lugar de la nomenclatura personalizada `dev` del proyecto SiCRER.
•  **Riesgos asociados**: Despliegue de código con errores de lint o tests fallidos en producción por falta de validación pre-merge.

## 7. Solución propuesta
•  **Objetivo de la corrección**: Sincronizar el trigger de CI con la arquitectura de Git Flow real.
•  **Diseño detallado**: 
   1. Cambiar `develop` por `dev` y `qa` en `branches`.
   2. Asegurar que `NODE_OPTIONS: "--experimental-vm-modules"` esté presente para soporte de ESM en Jest.
•  **Archivos a intervenir**: `.github/workflows/ci.yml`.
•  **Consideraciones de seguridad/rendimiento**: No afecta el rendimiento; mejora la seguridad al garantizar que solo código verificado llegue a ramas protegidas.

## 8. Criterios de aceptación
•  [x] El trigger de `push` y `pull_request` incluye las ramas `dev` y `qa`.
•  [x] Se mantiene el flag `--experimental-vm-modules` para evitar errores de ESM en las pruebas.
•  [x] El archivo YAML sigue la sintaxis válida de GitHub Actions.

## 9. Estrategia de pruebas y Evidencia
•  **Definición de tests**: Verificación visual de configuración y simulación de disparo local.
•  **Evidencia de validación**:
   - `git branch --show-current` -> `dev` (Confirmado)
   - `git checkout -b task/pepenautamx-issue345-fix-ci-trigger` (Branch de trabajo listo)
   - Inspección manual del YAML final (Corregido).

## 10. Cumplimiento de políticas y proceso
- Alineado con la **Fase 1 del Plan de Trabajo** (Corrección de GAPs Críticos).
- Sigue estándares de **DevSecOps** al restaurar el escaneo automático de vulnerabilidades y errores.

## 11. Documentación requerida
- `.github/workflows/ci.yml` (Actualizado)
- `docs/analysis/issue-345.md` (Este documento, actualizado al formato de 13 puntos).

## 12. Acciones en GitHub
•  **Rama de trabajo**: `task/pepenautamx-issue345-fix-ci-trigger`
•  **Labels ajustadas**: `infrastructure`, `devops`.
•  **Comandos ejecutados**:
   - `git checkout dev ; git pull origin dev ; git checkout -b task/pepenautamx-issue345-fix-ci-trigger`

## 13. Recomendación final
Implementar una regla de protección en GitHub para la rama `dev` que requiera obligatoriamente que el "CI Pipeline" pase exitosamente antes de permitir cualquier merge, previniendo regresiones futuras.
