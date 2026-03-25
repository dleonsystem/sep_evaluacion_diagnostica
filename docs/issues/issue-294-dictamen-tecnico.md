# Dictamen técnico - Issue 294

## Metadatos
- Issue: `#294`
- Título: `[Bug][Backend] Corregir generateComprobante por columnas SQL inexistentes`
- URL: `https://github.com/dleonsystem/sep_evaluacion_diagnostica/issues/294`
- Fecha de revisión: `2026-03-24`
- Revisor: Codex
- Dictamen: **Cumple parcialmente**

## 1. Alcance revisado
Se revisó el issue en GitHub con `gh issue view 294 --comments --json ...` y se contrastó contra la implementación actual presente en el workspace.

Se evaluaron:
- descripción, comentarios, labels y criterios de aceptación del issue;
- resolver GraphQL y contrato `FileDownload`;
- integración frontend que consume el comprobante;
- DDL de `solicitudes_eia2`;
- pruebas automatizadas;
- build local de backend y frontend;
- cumplimiento de políticas del proyecto;
- impactos colaterales en CI/CD, Docker y documentación.

## 2. Evidencia revisada

### Issue GitHub
- El issue sigue `OPEN`.
- Tiene asignado solo al desarrollador `@pepenautamx`.
- Labels actuales: `bug`, `fase-1`, `critico`, `portal-web`, `reportes`.
- No usa la taxonomía oficial de labels definida en `politicas_desarrollo_software.md`.

### Backend
- `graphql-server/src/schema/typeDefs.ts:87-90`
- `graphql-server/src/schema/typeDefs.ts:712-715`
- `graphql-server/src/schema/resolvers.ts:935-1039`
- `graphql-server/src/services/comprobante-pdf.service.ts:1-173`
- `graphql-server/src/types/pdfmake.d.ts:1`
- `graphql-server/jest.config.cjs:1-42`

### Frontend
- `web/frontend/src/app/operations/query.ts:80-87`
- `web/frontend/src/app/services/evaluaciones.service.ts:143-160`
- `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.ts:178-236`
- `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.html:74-87`

### Base de datos
- `ddl_generated.sql:559-581`

### Políticas / visión
- `politicas_desarrollo_software.md:15-45`
- `politicas_desarrollo_software.md:113-170`
- `web/doc/vision_document.md:4.2`

### Validaciones ejecutadas
- `cd graphql-server && npm run build` -> OK
- `cd graphql-server && npx jest tests/services/comprobante-pdf.service.test.ts tests/schema/generateComprobante.test.ts --runInBand` -> OK
- `cd graphql-server && npm test -- --runInBand` -> FAIL
- `cd web/frontend && npm run build -- --configuration production` -> OK con warnings

## 3. Comparación issue vs implementación real

### 3.1 Criterio: query con columnas existentes
**Estado:** Cumple

Evidencia:
- El resolver ahora usa `s.consecutivo`, `s.archivo_original`, `s.hash_archivo`, `s.fecha_carga`, `s.cct`, `s.usuario_id`.
- El DDL vigente define `consecutivo`, `archivo_original`, `hash_archivo` en `solicitudes_eia2`.

### 3.2 Criterio: retorno de PDF real
**Estado:** Cumple

Evidencia:
- `generateComprobante` retorna `fileName: Comprobante_<consecutivo>.pdf`.
- `comprobantePdfService` genera buffer PDF real con `pdfmake`.
- Las pruebas verifican header `%PDF`.

### 3.3 Criterio: MIME y descarga frontend
**Estado:** Cumple parcialmente

Evidencia:
- El frontend autenticado usa `application/pdf` al descargar el comprobante.
- Existe botón y flujo para descarga en `archivos-evaluacion`.

Brecha:
- No hay evidencia automatizada ni registro manual verificable de apertura real en Chrome y Edge.

### 3.4 Criterio: manejo de `hash_archivo = NULL`
**Estado:** Cumple

Evidencia:
- El resolver retorna error controlado.
- Existe prueba dedicada.

### 3.5 Criterio: prueba automatizada y smoke test integrado
**Estado:** Cumple parcialmente

Evidencia:
- Sí existen pruebas nuevas específicas del caso.

Brechas:
- No existe evidencia de smoke test end-to-end integrado.
- No existe integración de estas pruebas en CI actual.
- El workflow de GitHub Actions sigue sin job de test.

## 4. Hallazgos técnicos

### Hallazgo 1. Solicitudes válidas con `usuario_id` nulo pueden quedar excluidas
**Severidad:** Alta

Evidencia:
- `ddl_generated.sql:577` define `usuario_id` como nullable.
- `graphql-server/src/schema/resolvers.ts:1824`, `:1839`, `:1870`, `:1886`, `:1976` insertan `userToLink || null`.
- `graphql-server/src/schema/resolvers.ts:955-956` usa `JOIN usuarios u ON s.usuario_id = u.id`.

Impacto:
- Una solicitud válida sin `usuario_id` no será encontrada por `generateComprobante`, aunque exista en `solicitudes_eia2`.
- Para esos casos el resolver devolverá `Solicitud no encontrada`, lo cual es incorrecto semánticamente.

Recomendación:
- Cambiar a `LEFT JOIN usuarios u ON s.usuario_id = u.id`.
- Definir la política de acceso para solicitudes sin propietario:
  - admin permitido;
  - usuario final solo si existe vinculación verificable por credencial/correo/CCT.

### Hallazgo 2. El resolver sigue con comentarios legacy que contradicen la implementación
**Severidad:** Media

Evidencia:
- `graphql-server/src/schema/resolvers.ts:965-1002` conserva comentarios y `TODO` del enfoque viejo (`.txt`, columnas legacy, PDF simulado).

Impacto:
- Dificulta mantenimiento, revisiones y futuras correcciones.
- La implementación real es correcta, pero el bloque comentado induce a error.

Recomendación:
- Eliminar ese bloque muerto en la siguiente pasada de higiene.

### Hallazgo 3. La suite completa del backend no queda en verde
**Severidad:** Alta

Evidencia:
- `npm test -- --runInBand` falla por:
  - `tests/workers/excel-parser.test.ts`
  - thresholds globales de cobertura (`80%`) no cumplidos

Impacto:
- La corrección del issue funciona localmente, pero el repositorio no queda en estado de calidad liberable.
- La validación integral del cambio no puede darse por cerrada bajo política de pruebas.

Recomendación:
- Resolver pruebas rotas preexistentes o aislar el scope del pipeline por módulo antes de cierre.

### Hallazgo 4. El pipeline CI no integra las pruebas nuevas
**Severidad:** Media

Evidencia:
- `.github/workflows/ci.yml` solo ejecuta lint/build backend y build frontend.
- No existe job de pruebas.

Impacto:
- La cobertura del fix depende de ejecución manual local.
- El criterio del issue sobre prueba automatizada integrada no queda completo a nivel DevOps.

Recomendación:
- Agregar job de test backend en CI.

### Hallazgo 5. Incumplimiento de políticas de issue tracking
**Severidad:** Media

Evidencia:
- `politicas_desarrollo_software.md:21`, `:27`, `:42-44` requieren desarrollador y tester por módulo.
- El issue solo tiene asignado a `@pepenautamx`.
- `politicas_desarrollo_software.md:168-170` exige labels mínimas de tipo, prioridad y módulo usando la taxonomía oficial.
- El issue usa labels ad hoc (`bug`, `critico`, `portal-web`, etc.) en lugar de `type:*`, `priority:*`, `module:*`, `status:*`.

Impacto:
- La trazabilidad operativa y el flujo QA no cumplen la política formal del proyecto.

Recomendación:
- Asignar tester del módulo API (`@polethvillegas`) y alinear labels/estado.

### Hallazgo 6. Evidencia de smoke test navegador insuficiente
**Severidad:** Media

Evidencia:
- El issue exige descarga y apertura en Chrome y Edge.
- No hay script E2E, prueba UI automatizada ni registro manual versionado de esa validación.

Impacto:
- El cierre funcional del criterio de aceptación no es demostrable con la evidencia actual.

Recomendación:
- Adjuntar evidencia manual o automatizada del flujo:
  - login;
  - abrir historial;
  - descargar comprobante;
  - abrir PDF en navegador.

## 5. Evaluación por dimensión

### Funcional
**Resultado:** Parcialmente conforme

Lo que sí cumple:
- corrige columnas;
- genera PDF real;
- descarga con nombre `.pdf`;
- maneja `hash_archivo = NULL`;
- controla acceso owner/admin.

Lo que no queda completamente demostrado:
- smoke test integrado;
- apertura real en Chrome/Edge;
- comportamiento con solicitudes sin `usuario_id`.

### Seguridad
**Resultado:** Parcialmente conforme

Fortalezas:
- validación de autenticación;
- control owner/admin;
- política explícita de `pdfmake` para bloquear descargas URL externas.

Brecha:
- el `INNER JOIN` con `usuarios` puede degradar control de acceso/visibilidad en registros sin usuario.

### Base de datos
**Resultado:** Parcialmente conforme

Fortaleza:
- el resolver ya usa columnas compatibles con el DDL.

Brecha:
- no contempla correctamente que `usuario_id` es nullable en el modelo.

### Pruebas
**Resultado:** Parcialmente conforme

Fortalezas:
- tests nuevos del caso existen y pasan.

Brechas:
- falta prueba de solicitud inexistente;
- falta prueba de caso admin;
- no hay prueba de solicitud con `usuario_id` nulo;
- suite global no está verde.

### CI/CD
**Resultado:** No conforme para cierre del issue

Evidencia:
- no hay job de test en `.github/workflows/ci.yml`.

### Docker / infraestructura
**Resultado:** No afectado / no evidenciado

No hay cambios de Docker asociados a este issue ni evidencia nueva de validación en contenedores. No bloquea la corrección funcional, pero tampoco aporta cierre integral de despliegue.

### Documentación
**Resultado:** Parcialmente conforme

Fortaleza:
- existe documentación técnica en `docs/issues/issue-294-analisis-tecnico.md`.

Brechas:
- no se actualizó `BITACORA_CAMBIOS.md`;
- no hay evidencia funcional versionada del smoke test;
- no hay nota operativa para QA/cierre.

## 6. Dictamen final
**Dictamen: Cumple parcialmente**

### Justificación
La implementación resuelve el defecto principal reportado por el issue:
- elimina columnas inexistentes;
- genera PDF real;
- integra descarga frontend autenticada;
- agrega pruebas específicas y compila localmente.

Sin embargo, no puede dictaminarse como `Cumple` ni `Cumple con observaciones menores` porque persisten brechas materiales:
- caso real no cubierto para solicitudes con `usuario_id` nulo;
- suite completa del backend en rojo;
- ausencia de integración de pruebas en CI;
- sin evidencia verificable de smoke test en Chrome/Edge;
- incumplimiento de la política de asignación/labels del issue.

## 7. Condiciones para cierre recomendado
1. Corregir el acceso a solicitudes con `usuario_id` nullable (`LEFT JOIN` o estrategia equivalente).
2. Agregar al menos estas pruebas:
   - solicitud inexistente;
   - admin autorizado;
   - solicitud con `usuario_id` nulo.
3. Documentar o ejecutar smoke test de navegador del flujo autenticado.
4. Integrar ejecución de pruebas en CI o dejar explícita la dependencia si el cierre se delega a otro issue.
5. Alinear el issue a la política del proyecto:
   - asignar tester;
   - usar labels oficiales;
   - mover estado a QA si corresponde.

## 8. Estado para continuación
- Base de trabajo actual: `dev`
- Rama de continuidad prevista: `codex/task/issue-294-comprobante`
- Siguiente bloque recomendado:
  1. corregir el `JOIN usuarios` para soportar `usuario_id` nulo sin perder control de acceso;
  2. ampliar pruebas del resolver con caso inexistente, admin y registro sin `usuario_id`;
  3. decidir si la integración de pruebas en CI se corrige en este mismo issue o se deriva formalmente a un issue DevOps relacionado;
  4. cerrar higiene pendiente del resolver y registrar evidencia de smoke test navegador.
