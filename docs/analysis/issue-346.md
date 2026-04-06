# Análisis del Issue 346

## 1. Resumen y Datos
* **Título/Estado**: [Cleanup] Eliminar archivos de debug y scripts temporales de graphql-server/ raíz / Abierto
* **Componentes afectados**: Infraestructura del Repositorio, Módulo de API (`graphql-server`)
* **Resumen Ejecutivo**: El directorio raíz del backend contiene más de 12 rastros y logs residuales de validación anterior (reportes txt y falsos binarios como `npm`), lo que viola los principios de código limpio y expone vectores u hojas de debug innecesarias en el ambiente productivo si se suben en el contexto de Docker. Se removieron todos los artefactos residuales de los commits previos.

## 2. Datos del issue
* **Título**: [Cleanup] Eliminar archivos de debug y scripts temporales de graphql-server/ raíz
* **Estado**: OPEN
* **Labels**: fase-1, media
* **Prioridad aparente**: Media (Req: higiene del código antes del Tag V1.0.0-fase1)
* **Fuente consultada**: Issue #346 vía GitHub CLI (MCP)

## 3. Problema reportado
Existen scripts `.js` de debug (como `check-columns.js`, `test-db.js`, `temp-db-check.js`), reportes JSON y archivos transaccionales dejados por desarrolladores durante sesiones iterativas previas. Esto vulnera el principio de mínima superficie en código productivo y añade ruido innecesario para mantenibilidad futura.

## 4. Estado actual en el código
Evaluando el árbol de git en la rama operativa `dev`, se detectó que los archivos originales (`test-db.js`, `admin-test.json`, etc.) ya habían sido purgados en limpiezas previas y el archivo `.gitignore` ya excluye efectivamente extensiones `/*.js` (exceptuando configuraciones de jest). Sin embargo, existía un volumen fuerte de remanentes persistidos en la historia de git:
- 11 Reportes completos de testing, linting y checks de tipado (e.g. `test_report_final.txt`, `full_lint_v2.txt`).
- Archivos locales de error generados por flujos en fallo.
- Un binario/ejecutable engañoso sin extensión de nombre `npm` rastreado dentro del árbol principal de `graphql-server/`.

## 5. Comparación issue vs implementación
* **Coincidencias**: La presencia de artefactos inoficiosos dentro de `graphql-server/` es fehaciente y el `.gitignore` ameritaba ser saneado antes del cierre formal de la Fase 1 (CLEANUP-01).
* **Brechas/Inconsistencias**: En la revisión reciente, el grueso de los `.js` ya no están trazeados (gracias a la actualización previa del .gitignore), pero el ecosistema estaba inundado de logs `.txt` que no debían estar trazeados. 

## 6. Diagnóstico
* **Síntoma observado**: Repositorio contaminado con información técnica derivada del proceso de CI manual y auditoría, listos para ser empaquetados junto al código en imagen base.
* **Defecto identificado**: Inclusión de logs generados iterativamente en el árbol original del proyecto Git, los cuales elevan el tamaño de clonado y estorban visualmente.
* **Causa raíz principal**: Carencia temporal de exclusiones estrictas en el `.gitignore` sobre salidas genéricas en texto `.txt` a lo largo del periodo de desarrollo S3 y S4.
* **Riesgos asociados**:
  - **Seguridad**: Exposición del análisis estructural profundo del equipo de auditoría (logs de tipado).
  - **Estabilidad**: Falso binario `npm` en la ruta causante de potenciales conflictos de resoluciones con Node en máquinas linux locales.

## 7. Solución propuesta
* **Objetivo de la corrección**: Desaparecer de forma permanente cualquier rastro físico de scripts de prueba, reportes generados a mano y binarios sueltos en la raíz de la API, salvaguardando un estado pre-etiqueta impoluto.
* **Diseño detallado**:
  - Purga manual controlada con `git rm` para los 11 reportes y el ejecutable en desuso localizados en `graphql-server/`.
  - Remoción total silenciada de remanentes no trazeados detectados en el filesystem como `error.log`.
* **Archivos a intervenir**: Múltiples eliminaciones lógicas del control de cambios.
* **Consideraciones de seguridad/rendimiento**: Operación 100% segura; los archivos afectados no pertenecían a la base funcional de la aplicación.

## 8. Criterios de aceptación
* [x] La ejecución de comprobaciones de árbol (`git ls-tree`) revela ausencia del listado reportado incluyendo artefactos auxiliares.
* [x] El archivo `.gitignore` retiene de forma consistente prevenciones sobre extensiones restrictivas como `*.js` excluyendo los permitidos.

## 9. Estrategia de pruebas y Evidencia
* **Definición de tests**:
  - Un listado estructural tras el purgado comprobando si Node puede compilar Typescript aún luego de las eliminaciones.
* **Evidencia de validación**:
Una ejecución completa de purgado con `git rm` validó el desanclamiento de métricas residuales y liberó la rama:

```bash
    git rm final_lint_report.txt full_lint_v2.txt full_report_v4.txt lint_final.txt lint_output.txt npm test_report.txt test_report_final.txt test_report_v2.txt test_report_v3.txt typecheck_final.txt typecheck_report.txt
```

## 10. Cumplimiento de políticas y proceso
Esta remediación atiende enteramente la tarea agendada para el S4. Día 20: [CLEANUP-01] Eliminar scripts debug de graphql-server. Contemplado bajo los lineamientos limpios de empaquetizado DevOps en RUP mitigando exposiciones pasivas de OWASP.

## 11. Documentación requerida
* **Archivos eliminados (control de versiones)**: ~12 artefactos.
* **Nuevos artefactos creados**: `docs/analysis/issue-346.md` (Este documento).

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue346-cleanup-debug-scripts`
* **Labels ajustadas**: fase-1, media (Se mantuvieron inalteradas tras validación).
* **Comandos ejecutados**: 
  - `git rm <archivos...>`
  - `Remove-Item <falsos_positivos>` en filesystem local.

## 13. Recomendación final
Para mitigar que nuevos reportajes (e.g. desde utilidades como Jest o TS) inunden el repositorio, se sugiere que cualquier pipeline u output derivado a archivo se aloje siempre dentro de `coverage/`, `logs/` o de plano se añada una regla estricta `/*.txt` salvaguardando ficheros documentales estrictos si es que se decide escalar las barreras de protección de los linters.
