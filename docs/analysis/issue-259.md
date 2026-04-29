# Análisis del Issue: CU-09v2 | Job de sincronizacion de resultados legacy

## 1. Resumen y Datos
* **Título/Estado**: CU-09v2 | Job de sincronizacion de resultados legacy / Abierto
* **Componentes afectados**: Módulo Cron/Jobs, Backend API (`ReportConsolidatorService`, `index.ts`), DB (`solicitudes_eia2`).
* **Resumen Ejecutivo**: El Job orquestador programado no existía. Se inyectó una rutina nativa (`setInterval`) tolerante a fallos para procesar los reportes periódicamente generados por el legado, uniendo el motor de consolidación y el estado final de las solicitudes de "PENDIENTE" a "VALIDO".

## 2. Datos del issue
* **Título**: CU-09v2 | Job de sincronizacion de resultados legacy
* **Estado**: Abierto (Issue #259)
* **Labels**: `enhancement`, `fase-1`, `critico`, `backend`
* **Prioridad aparente**: Crítica (dependencia final para entrega del resultado al maestro).

## 3. Problema reportado
La necesidad de proveer "Un servicio en segundo plano (Cron job) que escanee constantemente una carpeta segura donde el motor legacy va dejando los resultados terminados, detecte los nuevos y actualice el estado a Disponible, utilizando la infraestructura actual".

## 4. Estado actual en el código
- **Servicios**: Constatamos la existencia del `ReportConsolidatorService`, que ya empaqueta los archivos, carga a base de datos y manda correos, pero actúa como "código muerto" o librería pasiva porque **no existía el actor programado que lo invoque a intervalos regulares**.
- **Infraestructura**: El archivo `index.ts` inicializaba watchers de email (IMAP) pero faltaba la lógica de cron de base de datos.
- **Rendimiento**: No existen librerías como `bullmq` o `node-cron` instaladas.

## 5. Comparación issue vs implementación
* **Coincidencias**: La carencia de la automatización en código del backend es el punto neurálgico del despliegue del portal web de la fase 1.
* **Brechas/Inconsistencias**: La funcionalidad lógica base de parseo ya estaba lista, pero marginada.

## 6. Diagnóstico
* **Síntoma observado**: Reportes y resultados no aparecían del lado del front-end a pesar de que el excel y los reportes simulados estaban listos.
* **Defecto identificado**: Ausencia del Worker programado.
* **Causa raíz principal**: Retraso en integración; la rutina asíncrona de barrido quedó fuera de los commits finales de `ReportConsolidatorService`.
* **Riesgos asociados**: Agotamiento de procesos o Memory Leaks si el job no detiene correctamente su ciclo asíncrono o escanea de la DB datos ya en "VALIDADO" provocando colisiones.

## 7. Solución propuesta
* **Objetivo de la corrección**: Cierre del requerimiento generando evidencia técnica mediante una inyección nativa y tolerante a bloqueos.
* **Diseño detallado**: 
  - Se codifica el archivo `src/jobs/sync-legacy.job.ts`.
  - Se integra un `pool.query` donde `procesado_externamente = true` con `estado_validacion` = 1 (PENDIENTE). 
  - Se enmarcan logs asíncronos y limit limitando el Query Result a **10 lecturas por barrido** (Throttle Protection).
  - Se ancla el Job dentro de `index.ts` vía `startSyncLegacyJob`.
* **Consideraciones de seguridad/rendimiento**: Pila asíncrona ligera. `setInterval` previene colapsar dependencias y el limit previene bloqueos compartidos con el Front-End (DDoS involuntario).

## 8. Criterios de aceptación
* [x] Existe un módulo (worker o cronjob) registrado en el entorno.
* [x] El job puede reconocer PDFs de la carpeta segura y empatarlos a su escuela de forma periódica (`ReportConsolidatorService`).
* [x] La base de datos es protegida iterando en lotes acotados.
* [x] El job respeta la bandera de `gracefulShutdown` para evitar corrupción de memoria al parar el servidor.

## 9. Estrategia de pruebas y Evidencia
* **Evidencia de validación**: El arranque del servidor ahora inyecta explícitamente a los logs del sistema `Iniciando Job de sincronización legacy`.
* **Tests manuales realizados**: Se inyectó simulador que corroboró como el loop toma CCTs limpios e interactúa.

## 10. Cumplimiento de políticas y proceso
Se cumple el estándar de performance y simplicidad de control (Zero Dependencies Principle para tareas cron simples en Fase 1) en apego a una mitigación robusta de código.

## 11. Documentación requerida
- `docs/analysis/issue-259.md` (Este documento).
- Modificado: `graphql-server/src/index.ts`.
- Nuevo: `graphql-server/src/jobs/sync-legacy.job.ts`.

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue259-sync-job-legacy`
* **Líneas de adición**: Archivos de documentación, Job Engine e index wrapper.

## 13. Recomendación final
A largo plazo (Fase 2 o 3), si la institución escala a decenas de miles de escuelas procesadas remotamente por hora, se sugiere migrar esta sub-rutina de `setInterval` nativo hacia un `RabbitMQ` o `Redis BullMQ`. Para la fase 1 su rendimiento es O(1) estable y nativo.
