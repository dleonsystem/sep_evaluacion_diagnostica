# Análisis del Issue: CU-09v2 | Catalogo de versiones y ligas de descarga

## 1. Resumen y Datos
* **Título/Estado**: CU-09v2 | Catalogo de versiones y ligas de descarga / Abierto
* **Componentes afectados**: UI (`ArchivosEvaluacionComponent`), Backend API (`Resolvers`, `downloadAssessmentResult`), DB (`solicitudes_eia2.resultados`).
* **Resumen Ejecutivo**: Tras inspeccionar la arquitectura del código fuente, se corrobora que la serialización de versiones, almacenamiento de referencias (URL) y el endpoint de descarga (vía base64) ya existen y están operando conjuntamente en backend y frontend. 

## 2. Datos del issue
* **Título**: CU-09v2 | Catalogo de versiones y ligas de descarga
* **Estado**: Abierto (Issue #260)
* **Labels**: `enhancement`, `fase-1`, `critico`, `portal-web`, `reportes`
* **Prioridad aparente**: Crítica (relacionado a la entrega de resultados evaluativos).

## 3. Problema reportado
La necesidad de proporcionar al usuario un histórico (versiones) de sus resultados de evaluación procesados, permitiéndole navegar y descargarlos. El flujo inicia cuando un Job o el motor sincronizan los reportes (PDF/ZIP) y se documentan en el gestor.

## 4. Estado actual en el código
- **Persistencia Múltiple (DB)**: En el archivo `ddl_generated.sql` se verifica que el esquema de la tabla `solicitudes_eia2` cuenta con la columna `resultados JSONB DEFAULT '[]'::JSONB`. Esta columna funciona como el catálogo/historial de versiones para albergar diferentes archivos y entregables procesados vinculados a la misma evaluación.
- **Backend Resolvers**: `getSolicitudes` extrae el arreglo `resultados`. A su vez, `downloadAssessmentResult` está implementado y cruza el arreglo `resultados` por `fileName`, descargando el binario desde SFTP (o volumen local dependiente) y retornándolo al Front en `Base64`. Incluye verificación `isAdmin` para prevenir inyección insegura de ID. (Control OWASP A01).
- **Frontend Interfaz**: `ArchivosEvaluacionComponent` itera estructuralmente (`*ngFor="let res of registro.resultados"`) y expone los botones de descarga invocando `(click)="descargarArchivo(registro.id, res.nombre)"`.

## 5. Comparación issue vs implementación
* **Coincidencias**: La funcionalidad completa del catálogo y descarga solicitadas en en CU-09v2 se encuentra cubierta; el código reestructura visual y lógicamente varias versiones a la vez porque la DB fue normalizada desde antes hacia el motor de persistencia JSONB.
* **Brechas/Inconsistencias**: Ninguna identificada. El front está protegido para únicamente mostrar los enlaces si realmente existen resultados procesados.

## 6. Diagnóstico
* **Síntoma observado**: Ticket administrativo abierto de una característica implementada implícitamente durante los pases al backend en sprints anteriores.
* **Defecto identificado**: Issue tracking asíncrono con el estado del despliegue en Github. 
* **Causa raíz principal**: Fusión previa de componentes base de resultados (Resolvers de SFTP y UI Frontend `cargas-evaluacion`) que englobaron implícitamente este requerimiento lógico.

## 7. Solución propuesta
* **Objetivo de la corrección**: Cierre del requerimiento generando evidencia técnica para cumplimiento y trazabilidad PSP/RUP. 
* **Diseño detallado**: No se requieren inyecciones. La solución propuesta en el diseño general en `archivos-evaluacion.component.html:117-133` exhibe una correcta separación de versiones.
* **Archivos a intervenir**: Sólo documentación de validación `docs/analysis/issue-260.md`.
* **Consideraciones de seguridad/rendimiento**: Control de fallos directos a accesos de objetos referenciados mitigados en Back-End (`if (!isAdmin && sol.usuario_id !== context.user.id) throw API_ERROR`). 

## 8. Criterios de aceptación
* [x] Catálogo con histórico de entregables almacenado en DB (Campo `JSONB` utilizado).
* [x] Interfaz permite visualizar N versiones de resultados (vía `*ngFor` iterator sobre arreglo `resultados`).
* [x] Botones de acceso a la descarga invocan el backend GraphQL/Rest pasando credencial de portador.
* [x] Control de roles prohíbe que escuelas distintas descarguen resultados ajenos (Mitigación IDOR).

## 9. Estrategia de pruebas y Evidencia
* **Validación de mitigación (IDOR)**: Se evaluó estáticamente que el query de permisos de archivo (`downloadAssessmentResult`) utiliza contexto transaccional GraphQL `context.user` protegiendo contra secuestro de IDs.

## 10. Cumplimiento de políticas y proceso
El endpoint cumple con el estándar de control de accesos OWASP 2021 (A01: Broken Access Control) asegurando el recurso con `isAdmin` + comparativa de tenencia (`usuario_id == user.id`), demostrando robustez de Fase 1.

## 11. Documentación requerida
- `docs/analysis/issue-260.md` (nuevo)

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue260-ligas-descarga`
* **Líneas de adición**: Archivos de documentación exclusivamente.

## 13. Recomendación final
Como el catálogo es dependiente del poblado de objetos dentro de `resultados JSONB`, es vital asegurar que el Sync Job (Issue #259) pueble este array correctamente, insertando estructuradamente nombre, URL, y metadatos, evitando un esquema malformado en el JSON que quiebre al cliente.
