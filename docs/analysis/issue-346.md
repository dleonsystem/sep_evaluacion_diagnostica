# Análisis del Issue #346

## 1. Resumen y Datos
- **Título/Estado**: [Cleanup] Eliminar archivos de debug y scripts temporales / **✅ Resuelto**
- **Componentes afectados**: `graphql-server/` (Raíz), `.gitignore`
- **Resumen Ejecutivo**: Eliminación completa de 24 archivos (scripts `.js/.ts`, reports `.txt` y dumps `.json`) en la raíz del servidor. Se reforzó el `.gitignore` para prevenir futuras regresiones de seguridad (OWASP A05).

## 2. Datos del issue
- **Título**: [Cleanup] Eliminar archivos de debug y scripts temporales de graphql-server/ raíz
- **Estado**: Abierto
- **Labels**: `fase-1`, `media`
- **Prioridad aparente**: Media (Impacto en Seguridad por configuración inapropiada OWASP A05)
- **Fuente consultada**: `Issue #346`, `ls -R graphql-server/`

## 3. Problema reportado
Acumulación de scripts `.js`, `.ts` y archivos `.json` temporales en la raíz de `graphql-server/`. Estos archivos fueron utilizados para pruebas rápidas de base de datos, SFTP, PDF y GQL, pero no deben formar parte del repositorio en la Fase 1.

## 4. Estado actual en el código
Se detectaron 42 archivos en la raíz de `graphql-server/`, de los cuales aproximadamente el 50% son archivos de debug o temporales:
- **Scripts**: `check-columns.js`, `test-db.js`, `inspect-db-structure.js`, etc.
- **Dumps JSON**: `users.json`, `roles.json`, `tables.json`, `cols.json`.
- **Reportes**: `db-structure-report.txt`.

## 5. Comparación issue vs implementación
- **Coincidencias**: Casi todos los archivos listados en el issue están presentes físicamente en la raíz.
- **Brechas/Inconsistencias**: El archivo `db-structure-report.txt` no estaba listado explícitamente pero constituye un residuo técnico de gran tamaño que debe eliminarse.

## 6. Diagnóstico
- **Síntoma observado**: Raíz del proyecto desordenada y con potencial exposición de metadatos de DB y usuarios (vía JSONs).
- **Defecto identificado**: Falta de una directiva de "Cleanup post-development" y omisión de reglas en `.gitignore`.
- **Causa raíz principal**: Desarrollo acelerado de prototipos sin una estructura de carpetas para herramientas internas.
- **Riesgos asociados**:
  - **Seguridad**: Exposición de estructura de tablas y datos de prueba (OWASP A05).
  - **Estabilidad**: Confusión en el mantenimiento de scripts reales vs debug.

## 7. Solución propuesta
- **Objetivo de la corrección**: Sanitizar la raíz del proyecto y establecer una ubicación para herramientas de desarrollo.
- **Diseño detallado**:
  1. Crear `graphql-server/scripts/dev-tools/`.
  2. Mover archivos de inspección estructural a la nueva carpeta (excluirlos del build).
  3. Eliminar archivos de prueba `.test.js/ts` (redundantes con la suite oficial en `/tests`).
  4. Actualizar `.gitignore` para bloquear archivos `.js` accidentales.
- **Archivos a intervenir**: `.gitignore`, múltiples archivos en la raíz.

## 8. Criterios de aceptación
- [x] `git ls-tree HEAD graphql-server/ --name-only` no muestra archivos de debug.
- [x] La raíz de `graphql-server/` está sanitizada y cumple con los estándares de producción.
- [x] `.gitignore` previene la subida de scripts `.js` en la raíz (excepto `jest.config.cjs`).

## 9. Estrategia de pruebas y Evidencia
- **Definición de tests**: Verificación del árbol de Git y prueba de integridad del servicio.
- **Evidencia de validación**:
  ```bash
  # Verificación de scripts .js remanentes en raíz (debe retornar vacío excepto jest.config.cjs)
  git ls-tree -r HEAD --name-only graphql-server/ | grep -E "\.js$" | grep -v "jest.config.cjs"
  # Resultado: (Vacío)
  ```

## 10. Cumplimiento de políticas y proceso
Sigue los lineamientos de **Fase 1: Preparación para QA** y el estándar **OWASP A05 (Security Misconfiguration)**.

## 11. Documentación requerida
- [x] Actualización de este análisis tras la ejecución.
- [x] Actualización de `PLAN_TRABAJO_FASE1.md`.

## 12. Acciones en GitHub
- **Rama de trabajo**: `task/pepenautamx-issue346-cleanup-scripts`
- **Labels ajustadas**: `cleanup`, `security`
- **Comandos ejecutados**:
  ```bash
  git rm <listado_de_24_archivos>
  git commit -m "chore(cleanup): remove debug scripts and temporary JSON files from root (Issue #346)"
  git push origin task/pepenautamx-issue346-cleanup-scripts
  ```

## 13. Recomendación final
Implementar una política de "Zero files in root" para todo el equipo de desarrollo, forzando el uso de `scripts/` o `tests/`.
