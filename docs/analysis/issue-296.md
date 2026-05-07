# Análisis del Issue 296

## 1. Resumen ejecutivo
El Issue #296 reporta que el pipeline de CI/CD actual no está operacionalizando las pruebas unitarias del backend (`graphql-server`) con reporte de cobertura. Esto permite la integración de código sin validación automatizada, incumpliendo hallazgos de auditoría (GAP-CI-2). Este análisis identifica que, aunque existe una configuración nominal en `.github/workflows/ci.yml`, esta presenta inconsistencias en el manejo de rutas de artefactos y no garantiza que un fallo de cobertura detenga el despliegue.

## 2. Datos del issue
- Título: [Testing][CI] Ejecutar Jest con cobertura en GitHub Actions
- Estado: OPEN
- Labels: fase-1, alta, ci, testing
- Prioridad aparente: Alta
- Componentes afectados: `.github/workflows/ci.yml`, `graphql-server/package.json`, `graphql-server/jest.config.cjs`
- Fuente consultada: GitHub API (Issue #296)

## 3. Problema reportado
El pipeline de CI actual (GitHub Actions) no está ejecutando `npm run test -- --ci --coverage` para el backend o el resultado no se está integrando efectivamente para bloquear cambios con baja calidad. Esto compromete la trazabilidad y la estabilidad de los resolvers críticos.

## 4. Estado actual en el código
- El repositorio tiene un archivo `.github/workflows/ci.yml` con un job `backend-check`.
- El paso "Run Tests" ejecuta `npm test -- --ci --coverage`.
- Se usa `NODE_OPTIONS: "--experimental-vm-modules"`.
- El paso de "Upload Coverage Results" apunta a `graphql-server/coverage/`, lo cual puede ser erróneo si el `working-directory` del job ya es `./graphql-server`.

## 5. Comparación issue vs implementación
### Coincidencias
- El comando de ejecución de tests está presente en el YAML.
### Brechas
- No hay evidencia de que el pipeline falle explícitamente cuando la cobertura baja del umbral del 20% en el entorno de CI (aunque Jest esté configurado, en CI se requiere validación estricta de salida).
- La ruta del artefacto de cobertura es relativa de forma ambigua.
### Inconsistencias
- El runner de Ubuntu puede presentar problemas de permisos o de resolución de módulos ESM si no se configura el caché y el entorno de forma óptima para Node 20.

## 6. Diagnóstico
### Síntoma observado
El proyecto puede integrar PRs que no cumplen con los estándares de prueba.
### Defecto identificado
Desacoplamiento entre la generación del reporte y la carga del artefacto en el workflow de GitHub Actions.
### Causa raíz principal
Configuración de rutas de artefactos inconsistente con el `working-directory` definido a nivel de job.
### Causas contribuyentes
1. Falta de un paso que resuma la cobertura directamente en el dashboard de Actions (Step Summary).
2. Ausencia de logs claros sobre el fallo de umbrales en el entorno CI.
### Riesgos asociados
- Integración de código con regresiones no detectadas.
- Degradación continua de la cobertura del backend por falta de enforcement automático.

## 7. Solución propuesta
### Objetivo de la corrección
Asegurar que el pipeline de CI ejecute, valide y reporte la cobertura del backend de forma ineludible.
### Diseño detallado
1. **Normalización de Rutas**: Ajustar `upload-artifact` para usar la ruta del workspace base o simplificar el path relativo al root.
2. **Refuerzo de Umbral**: Configurar Jest para que emita un código de error de salida (exit code 1) en CI si no se cumple el 20%.
3. **Visibilidad**: Utilizar `GITHUB_STEP_SUMMARY` para publicar una tabla de resultados de prueba.
### Archivos o módulos a intervenir
- `.github/workflows/ci.yml`
### Cambios de datos / migraciones
- N/A.
### Consideraciones de seguridad
- El runner no tiene acceso a secretos sensibles durante la fase de prueba unitaria.
### Consideraciones de rendimiento
- Se mantiene el caché de `npm` para acelerar el job.
### Consideraciones de compatibilidad
- Compatible con Node.js 20 LTS.

## 8. Criterios de aceptación
- [ ] El job `backend-check` falla si la cobertura es < 20%.
- [ ] El artefacto `backend-coverage` es descargable desde GitHub Actions.
- [ ] El workflow reporta el resumen de tests en el Summary del Actions.

## 9. Estrategia de pruebas
### Unitarias
- Se ejecutarán las suites de `resolvers.test.ts` e `investigaciones.test.ts`.
### Integración
- N/A para este issue.
### E2E/manual
- Simular un fallo bajando el umbral a un valor imposible (ej. 100%) y verificar que el CI se pinte de rojo.
### Casos borde
- Ejecución sin archivos de prueba (debe fallar o avisar).

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Gobernanza DevOps (Fase 1).
- Situación actual: Implementación nominal pero no operativa.
- Cómo se cumple con la solución: Se operacionaliza el bloqueo y el reporte automático.

## 11. Documentación requerida
- Archivos a actualizar: `.github/workflows/ci.yml`.
- Issue comment a publicar: Resumen técnico del análisis y solución.
- Artefactos técnicos a adjuntar o referenciar: Reporte de cobertura generado por Jest.

## 12. Acciones en GitHub
- Comentario publicado: sí (pendiente)
- Labels ajustadas: sí
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue296-ci-backend-coverage`

## 13. Recomendación final
Integrar `peter-evans/create-or-update-comment` en el futuro para comentar directamente en los Pull Requests el estado de la cobertura.
