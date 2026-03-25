# Issue 294 - Analisis tecnico y plan de implementacion

## Metadatos
- Issue: `#294` - `[Bug][Backend] Corregir generateComprobante por columnas SQL inexistentes`
- URL: `https://github.com/dleonsystem/sep_evaluacion_diagnostica/issues/294`
- Estado en GitHub al analizar: `OPEN`
- Asignado a: `@pepenautamx`
- Labels actuales: `bug`, `critico`, `fase-1`, `portal-web`, `reportes`
- Fecha de analisis: `2026-03-24`

## 1. Analisis del issue

### Resumen funcional
El issue reporta que `generateComprobante`:
- consulta columnas inexistentes en `solicitudes_eia2`;
- devuelve texto Base64 con extension `.txt` en lugar de PDF real;
- no cumple el alcance de Sprint 2 definido en `PLAN_TRABAJO_FASE1.md`.

### Contexto GitHub verificado
- El issue no tiene comentarios tecnicos previos.
- El issue ya esta relacionado en descripcion con `#254` y `#271`.
- El issue esta abierto y sigue vigente.

## 2. Analisis del codigo actual

### Backend GraphQL
En `graphql-server/src/schema/resolvers.ts:938-1011`, el resolver actual:
- consulta `s.folio`, `s.nombre_archivo` y `s.md5`;
- deja la generacion PDF como `TODO`;
- arma un texto plano en memoria;
- lo retorna como Base64 con nombre `Comprobante_<folio>.txt`.

Evidencia:
- `graphql-server/src/schema/resolvers.ts:950-954`
- `graphql-server/src/schema/resolvers.ts:971-1001`
- `graphql-server/src/schema/resolvers.ts:1003-1010`

### Schema GraphQL
El contrato GraphQL si expone el caso de uso:
- `graphql-server/src/schema/typeDefs.ts:90` define `generateComprobante(solicitudId: ID!): FileDownload!`
- `graphql-server/src/schema/typeDefs.ts:712-716` define `FileDownload { success, fileName, contentBase64 }`

### Esquema de base de datos
El esquema vigente documentado en `ddl_generated.sql` para `solicitudes_eia2` contiene:
- `consecutivo`
- `archivo_original`
- `hash_archivo`

No hay evidencia en ese DDL de columnas `folio`, `nombre_archivo` o `md5`.

Evidencia:
- `ddl_generated.sql:559-581`
- `ddl_generated.sql:561`
- `ddl_generated.sql:564`
- `ddl_generated.sql:576`

### Frontend actual
No existe consumo real de `generateComprobante` en `web/frontend/src`.

Busqueda en el repo:
- `generateComprobante` solo aparece en documentacion, `typeDefs.ts` y `resolvers.ts`.

En cambio, el frontend actual usa dos flujos distintos:
1. Descarga de resultados reales por `downloadAssessmentResult`.
   - `web/frontend/src/app/services/evaluaciones.service.ts:123-140`
   - `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.ts:150-164`
2. PDF de confirmacion/errores generado localmente con `MockPdfService`.
   - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts:867-925`
   - `web/frontend/src/app/services/mock-pdf.service.ts`

Adicionalmente, `descargas.component.ts` usa `application/octet-stream` para descargas genericas:
- `web/frontend/src/app/components/descargas/descargas.component.ts:100-113`

### Pruebas actuales
No existe una prueba dedicada a `generateComprobante`.

Actualmente en `graphql-server/tests` solo se encontraron:
- `graphql-server/tests/utils/cct-validator.test.ts`
- `graphql-server/tests/workers/excel-parser.test.ts`

### Estado de dependencias y build local
Se ejecuto `npm run build` en `graphql-server` y fallo antes de compilar por dependencias no instaladas en el workspace actual:
- `jsonwebtoken`
- `swagger-ui-express`
- `swagger-jsdoc`
- `imap-simple`
- `mailparser`
- `nodemailer`
- `ssh2-sftp-client`
- `xlsx`

Adicionalmente:
- `graphql-server/package.json` declara `pdfmake`
- `npm ls pdfmake` devuelve arbol vacio
- `graphql-server/package-lock.json` no contiene entradas de `pdfmake`

Esto bloquea la validacion compilada local del fix hasta normalizar dependencias con `npm ci` y sincronizar lockfile.

## 3. Comparacion issue vs codigo

### Coincidencias con el issue
El issue es correcto y esta vigente:
- El resolver si consulta columnas inexistentes.
- El resolver si devuelve `.txt` y no PDF.
- No existe prueba automatizada para este caso.

### Diferencias relevantes detectadas
El issue asume un ajuste frontend directo del componente Angular de descarga, pero en el codigo actual:
- no existe consumo de `generateComprobante` en frontend;
- el flujo de PDF de confirmacion de carga publica sigue siendo local con `MockPdfService`;
- el flujo de descargas autenticadas actual usa `downloadAssessmentResult`, no `generateComprobante`.

Conclusion:
- el bug backend es real;
- la integracion frontend para comprobante no esta implementada todavia, no solo esta mal configurada.

## 4. Causa raiz

### Causa raiz principal
Deriva del desalineamiento entre el resolver GraphQL y el esquema real de `solicitudes_eia2`. El codigo del resolver quedo acoplado a nombres de columnas legacy o intermedios (`folio`, `nombre_archivo`, `md5`) que ya no existen en el modelo vigente (`consecutivo`, `archivo_original`, `hash_archivo`).

### Causas contribuyentes
1. Implementacion incompleta del Sprint 2:
   - el resolver quedo con `TODO` y mock textual.
2. Falta de cobertura automatizada:
   - no existe `generateComprobante.test.ts`.
3. Falta de convergencia entre frontend y backend:
   - el frontend sigue con PDF local temporal y no consume el resolver.
4. Higiene deficiente de dependencias:
   - `package.json`, `package-lock.json` y `node_modules` no estan sincronizados, lo que dificulta validar el cambio por build.
5. Riesgo de autorizacion:
   - `generateComprobante` solo valida que exista `context.user`, pero no valida propiedad de la solicitud ni rol admin, a diferencia de `downloadAssessmentResult`.

## 5. Solucion propuesta

### 5.1 Backend
Actualizar `generateComprobante` para:
- consultar columnas reales:
  - `s.consecutivo`
  - `s.archivo_original`
  - `s.hash_archivo`
  - `s.fecha_carga`
  - `s.cct`
  - `s.usuario_id`
  - `u.email`
- validar autorizacion como en `downloadAssessmentResult`:
  - permitir al dueno de la solicitud;
  - permitir a roles admin definidos;
  - rechazar otros accesos.
- validar el borde `hash_archivo IS NULL` y responder con error controlado.
- generar PDF real y retornar:
  - `success: true`
  - `fileName: Comprobante_<consecutivo>.pdf`
  - `contentBase64` con contenido PDF valido

### 5.2 Generacion PDF
Implementar una utilidad backend dedicada, por ejemplo:
- `graphql-server/src/services/comprobante-pdf.service.ts`

Responsabilidades:
- recibir DTO de datos del comprobante;
- construir `docDefinition`;
- encapsular la generacion Base64;
- evitar que el resolver contenga logica de presentacion.

Contenido minimo del comprobante:
- titulo institucional;
- consecutivo;
- fecha de recepcion;
- CCT;
- usuario/correo;
- nombre original del archivo;
- hash SHA-256 visible;
- leyenda de certificacion;
- fecha/hora de emision.

### 5.3 Dependencias
Antes de implementar, normalizar dependencias:
1. ejecutar `npm ci` en `graphql-server`;
2. confirmar presencia real de `pdfmake`;
3. actualizar `package-lock.json` si `pdfmake` aun no esta reflejado;
4. validar la API exacta soportada por la version instalada antes de codificar el servicio PDF.

### 5.4 Frontend
No conviene reemplazar a ciegas el flujo actual de `MockPdfService` sin alinear producto y arquitectura.

Plan seguro:
1. mantener el mock del flujo publico mientras siga siendo la implementacion temporal aprobada en `vision_document.md`;
2. agregar consumo explicito de `generateComprobante` en el punto correcto del flujo autenticado de CU-16 o historial de solicitudes;
3. para ese consumo:
   - crear query GraphQL dedicada;
   - usar `application/pdf`;
   - respetar el nombre devuelto por backend.

Si se decide reutilizar la UI actual de descargas, el ajuste debe ser explicito y no implantar el resolver en un flujo distinto por accidente.

### 5.5 Logging y errores
Mejorar `logger.error` del resolver para registrar:
- `solicitudId`
- `userId`
- causa tecnica resumida

Sin exponer datos sensibles en la respuesta al cliente.

## 6. Criterios de aceptacion propuestos
- La query de `generateComprobante` usa columnas existentes del esquema vigente.
- Un usuario no administrador solo puede generar el comprobante de su propia solicitud.
- Un administrador puede generar comprobantes de cualquier solicitud valida.
- Si `hash_archivo` es `NULL`, el resolver responde con error controlado y no con crash.
- `fileName` termina en `.pdf` y contiene el `consecutivo`.
- `contentBase64` decodifica un PDF cuyo header inicia con `%PDF` / `JVBER`.
- Existe prueba automatizada para exito, autorizacion y caso `hash_archivo = NULL`.
- Existe evidencia de descarga correcta en navegador para el flujo frontend que finalmente consuma el resolver.

## 7. Estrategia de pruebas

### Unitarias / integracion backend
Crear `graphql-server/tests/generateComprobante.test.ts` con al menos:
- caso exitoso con solicitud valida;
- solicitud inexistente;
- usuario sin permiso;
- `hash_archivo = NULL`;
- validacion de `fileName`;
- validacion de header `%PDF` tras `Buffer.from(base64, 'base64')`.

### Integracion frontend
Una vez exista consumidor real del resolver:
- validar descarga en Chrome y Edge;
- validar `Blob` con `application/pdf`;
- validar nombre final `Comprobante_<consecutivo>.pdf`.

### No funcionales
- build backend despues de `npm ci`;
- smoke test autenticado: login -> solicitud -> generar comprobante.

## 8. Validacion de cumplimiento de politicas

### Requerimientos y trazabilidad
Cumple parcialmente:
- el issue referencia `CU-16`, `RF-12` y `PLAN_TRABAJO_FASE1.md`;
- este documento refuerza trazabilidad tecnica y criterios verificables.

### Arquitectura
Cumple parcialmente:
- `vision_document.md:97-100` exige PDF automatico;
- la implementacion actual sigue en modo temporal con `MockPdfService`, por lo que backend y frontend aun no convergen.

### PSP / RUP
Cumple parcialmente:
- existe identificacion del defecto (`DEF-007`) y alcance por sprint;
- faltaba artefacto de analisis tecnico detallado previo a implementacion.

### Politicas de desarrollo
Cumple parcialmente:
- el issue tiene desarrollador asignado;
- no tiene tester asignado segun matriz de `politicas_desarrollo_software.md:27` y regla `3.2` (`politicas_desarrollo_software.md:42-44`);
- no usa la taxonomia oficial de labels (`type:*`, `priority:*`, `module:*`, `status:*`) definida en `politicas_desarrollo_software.md:119-157`.

### Buenas practicas
No cumple todavia:
- falta validacion de autorizacion por propiedad de la solicitud;
- falta prueba automatizada;
- falta integracion real del flujo frontend;
- falta consistencia de dependencias para build reproducible.

## 9. Documentacion tecnica requerida
- Mantener este archivo como evidencia de analisis.
- Actualizar `BITACORA_CAMBIOS.md` cuando se implemente.
- Actualizar `BITACORA_CAMBIOS_DB.md` solo si se toca SQL o seeds.
- Documentar en README o documento funcional si el flujo publico deja de usar `MockPdfService`.

## 10. Plan de implementacion recomendado

1. Normalizar dependencias del backend:
   - `cd graphql-server`
   - `npm ci`
2. Crear servicio reutilizable de PDF.
3. Corregir SQL y autorizacion de `generateComprobante`.
4. Implementar control de `hash_archivo = NULL`.
5. Agregar pruebas backend.
6. Validar `npm run build` y `npm run test`.
7. Implementar consumidor frontend real de `generateComprobante` en el flujo correcto.
8. Ejecutar smoke test end-to-end.

## Riesgos y supuestos

### Riesgos
- La version real de `pdfmake` a instalar puede no coincidir con la API asumida en el comentario del resolver.
- El frontend puede requerir definicion funcional adicional si se decide sustituir el mock actual.
- La falta de lockfile consistente puede romper reproducibilidad del fix.

### Supuestos
- `ddl_generated.sql` representa el esquema vigente de referencia.
- El flujo de comprobante debe quedar protegido por autenticacion y control de propiedad.
- El mock frontend actual sigue siendo temporal y no definitivo.

## Comandos ejecutados durante el analisis
- `gh issue view 294 --comments --json ...`
- `gh issue view 294`
- inspeccion estatica de:
  - `graphql-server/src/schema/resolvers.ts`
  - `graphql-server/src/schema/typeDefs.ts`
  - `web/frontend/src/app/services/evaluaciones.service.ts`
  - `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.ts`
  - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
  - `web/frontend/src/app/services/mock-pdf.service.ts`
  - `ddl_generated.sql`
  - `PLAN_TRABAJO_FASE1.md`
  - `politicas_desarrollo_software.md`
  - `web/doc/vision_document.md`
- `npm ls pdfmake`
- `npm run build` en `graphql-server`

## Conclusion
El issue `#294` sigue abierto con fundamento tecnico. El defecto backend esta confirmado por evidencia estatica y el alcance real es mayor a un simple renombre de columnas: tambien hay implementacion PDF incompleta, falta de pruebas, falta de consumo frontend real y una brecha de autorizacion que conviene corregir en el mismo cambio.

## Actualizacion de implementacion - 2026-03-24

### Cambios realizados
- Se instalaron dependencias locales:
  - `web/frontend`: `npm ci --legacy-peer-deps`
  - `graphql-server`: `npm install`
- Se implemento generacion PDF real en backend con `pdfmake` mediante `graphql-server/src/services/comprobante-pdf.service.ts`.
- Se actualizo `generateComprobante` para usar columnas vigentes:
  - `consecutivo`
  - `archivo_original`
  - `hash_archivo`
- Se agrego control de autorizacion por propietario o rol admin en `generateComprobante`.
- Se manejo el borde `hash_archivo = NULL` con error controlado.
- Se actualizo el flujo frontend autenticado de historial para consumir `generateComprobante` y descargar PDF real con `application/pdf`.
- Se agregaron pruebas automatizadas dedicadas para:
  - servicio PDF;
  - resolver `generateComprobante`.
- Se ajusto la configuracion de Jest para soportar correctamente el modulo ESM del backend y los nuevos tests.

### Validacion ejecutada
- `cd graphql-server && npm run build` -> OK
- `cd graphql-server && npx jest tests/services/comprobante-pdf.service.test.ts tests/schema/generateComprobante.test.ts --runInBand` -> OK
- `cd web/frontend && npm run build -- --configuration production` -> OK con warnings preexistentes de budget y `sweetalert2`

### Hallazgos de calidad
- La suite completa `cd graphql-server && npm test -- --runInBand` no queda en verde por causas ajenas al fix de `generateComprobante`:
  - fallan pruebas preexistentes en `tests/workers/excel-parser.test.ts`;
  - el proyecto mantiene thresholds globales de cobertura (`80%`) que hoy no se cumplen.
- Los tests nuevos del issue `#294` pasan y el backend compila con el cambio.

### Riesgos remanentes
- `graphql-server/src/schema/resolvers.ts` aun conserva comentarios legacy del enfoque anterior alrededor de `generateComprobante`; no afectan ejecucion, pero conviene limpiarlos en una pasada de higiene.
- El build frontend sigue reportando budget excedido; no fue introducido por este cambio.
