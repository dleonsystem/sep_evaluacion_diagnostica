# Análisis del Issue 245

## 1. Resumen ejecutivo
El issue CU-07 requiere validar el formato FRV importado por el portal y distribuirlo hacia carpetas SFTP compartidas para su procesamiento por 10 equipos Legacy, dejando el proceso de forma trazable. El backend actual extrae y valida los datos exitosamente en la BD, pero la lógica de envío asíncrono al SFTP y la asignación del equipo validador se encuentra inactiva (comentada) en el resolver `subirArchivoMasivo`, rompiendo la trazabilidad y la integración de procesamiento Legacy.

## 2. Datos del issue
- Título: CU-07: Validar y Procesar Valoraciones
- Estado: Abierto
- Labels: enhancement, caso-de-uso, legacy, media
- Prioridad aparente: Alta (Bloqueante para el flujo de Fase 1 Legacy)
- Componentes afectados: GraphQL Server (`subirArchivoMasivo`), BD (`solicitudes_eia2`)
- Fuente consultada: `REQUERIMIENTOS_Y_CASOS_DE_USO.md` (RF-15.1, Firmware Legacy Fase 1, RF-04)

## 3. Problema reportado
El flujo contempla importación y validación de FRV. Se deben detectar errores de integridad y consistencia, generar salidas procesadas listas para reporteo y mantener el procesamiento trazable de cara a la Fase 1 Híbrida/Legacy.

## 4. Estado actual en el código
Actualmente, el resolver `subirArchivoMasivo` en `graphql-server/src/schema/resolvers.ts` ejecuta de forma correcta la validación del Excel con `excel-parser.ts`, y almacena las valoraciones en la base de datos (post-trigger de cálculo NIA `trg_calcular_nia_auto`). Sin embargo, en las líneas 2285-2300, el método `syncSftp` está mockeado localmente con el filesystem y la carga por SFTP hacia `sftpService` está comentada. Aunado a esto, nunca se invoca la inyección de contexto de `DistributionService.logDistribution`, dejando trunco el `equipo_asignado` para el historial.

## 5. Comparación issue vs implementación
### Coincidencias
- El flujo sí contempla la importación de FRV vía web exitosamente validando su firma local y NIA.
- Se detectan efectivamente errores de integridad, nivel educativo, estructura, vacíos y consistencias.
### Brechas
- "El procesamiento queda trazable": Este proceso tiene una clara brecha al finalizar la petición web sin asignar al emisor el equipo del lado Legacy responsable. 
- "Se generan salidas procesadas listas para reporteo": Falsa premisa en BD, porque no hay evidencia de que el equipo reciba el insumo en el canal (SFTP compartido) ya que esa parte del flujo de datos se omitió/comentó.
### Inconsistencias
- La sincronización simula la subida borrando y re-creando un archivo local temporal que desaparece y no llega a su repositorio compartido pertinente.

## 6. Diagnóstico
### Síntoma observado
El portal responde con éxito "Tu archivo ha sido validado correctamente." y la información se graba, pero el archivo FRV es desechado de memoria e ignorado para el ecosistema de validación externa Legacy.
### Defecto identificado
La omisión del trigger al servicio de SFTP e inyección de contexto de `DistributionService.logDistribution(solicitudId, team.id)`.
### Causa raíz principal
Se comentó/mockeó la lógica final asincrónica (`resolvers.ts` línea ~2292) para fines de prisa/staging y se ignoró conectar el servicio `distributionService` al resolver.
### Causas contribuyentes
- Falta de un hook unificado; la ruta de correo electrónico (email watcher) implementaba el distribution logic pero el web request lo omitió completamente por falta de DRY.
### Riesgos asociados
- Pérdida silenciosa de registros de Excel válidos importados, sin notificar alerta alguna en el portal hacia los analistas y directores.
- Incongruencias severas en las métricas de cargas si los registros de `solicitudes_eia2.equipo_asignado` continúan nulos.

## 7. Solución propuesta
### Objetivo de la corrección
Habilitar completamente la exportación del archivo subido hacia la red Legacy SFTP integrando estrechamente el identificador de trazabilidad que exige RUP para resolver la integración.
### Diseño detallado
1. En `subirArchivoMasivo`, llamar a `DistributionService` usando el `context`: `const team = context.distributionService.getTeamForCCT(cct)`.
2. Refactorizar la validación interna borrando llamadas temporales `fs.writeFile`, utilizando `const success = await sftpService.uploadBuffer(buffer, remotePath)` directamente y a la carpeta `team.sftpPath`.
3. Validar el estado devuelto (booleano) e invocar `await context.distributionService.logDistribution(solicitudId, team.id)` finalizando la trazabilidad hacia postgres (`solicitudes_eia2` y `log_actividades`).
### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.ts`
### Cambios de datos / migraciones
- No aplicable (tablas y columnas necesarias se encuentran operativas).
### Consideraciones de seguridad
- Operar la inyección SFTP mediante SSH sin persistir información local en el /tmp/ del contenedor Node que aloja las credenciales o identificadores PIA.
### Consideraciones de rendimiento
- Al usar la instrucción Fire-and-Forget (No esperar Promise internamente a menos que sea crucial o gestionado por queue), el response HTTPS/GraphQL no añade latencia de subida SFTP al Front-End Angular y provee feedback al usuario rápidamente.
### Consideraciones de compatibilidad
- Todo el framework de Node soporta el buffer streaming ya programado en `uploadBuffer()`.

## 8. Criterios de aceptación
- [ ] La carga desde URL pública invoca correctamente a SFTP guardando en los repositorios de Validacion `storage/teams/equipoX/...`.
- [ ] La tabla `solicitudes_eia2` obtiene un ID de equipo y valor en `distributed_at` (gracias a logDistribution).
- [ ] El issue en github queda formalizado mostrando alineación rigurosa a arquitectura Legacy F1.

## 9. Estrategia de pruebas
### Unitarias
- Ejecución limpia de `npm run build` en servidor GQL.
### Integración
- Subir un payload binario en BD y verificar bitácora e ingresos del servidor de logs observando la estampa "Distribución registrada".
### E2E/manual
- Desde portal del Maestro: importar el archivo FRV válido de primaria/secundaria y corroborar que el ticket no revoca estado 500 sino 200 de éxito. Acceder a DBeaver verificando `equipo_asignado`.
### Casos borde
- Timeout del puente SFTP local o mal buffer: documentar en logger.error `SFTP sync error` la excepción.

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Integración Legacy / Fase 1 RF-15.1 Documentación Operacional.
- Situación actual: Ignoraba el traspaso para evaluación (Mock Code).
- Cómo se cumple con la solución: Incorpora la invocación completa de Trazabilidad RUP/PSP dejando bitácora limpia y cerrando huecos detectables.

## 11. Documentación requerida
- Archivos a actualizar: N/A adicionales.
- Issue comment a publicar: Formato ejecutivo sintetizando causa y diseño.
- Artefactos técnicos a adjuntar o referenciar: `docs/analysis/issue-245.md`.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: no
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue245-validar-procesar-valoraciones`
  - `git add docs/analysis/issue-245.md`
  - `git commit -m "docs: anexa plan tecnico para CU-07 issue 245 trazabilidad SFTP"`

## 13. Recomendación final
Efectuar a la brevedad los cambios programáticos en `resolvers.ts` (Implementación) y proceder a hacer un Pull Request sobre el branch `dev` / `qa` validando el ciclo.
