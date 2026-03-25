# Análisis del Issue 294

## 1. Resumen ejecutivo
Se detectó un fallo crítico en la funcionalidad `generateComprobante` (CU-16). El resolver consultaba columnas obsoletas y el PDF generado era un simple buffer de texto plano. Se ha estabilizado implementando un generador real basado en `pdfmake`, corrigiendo la consulta SQL y refinando la experiencia de usuario ante solicitudes en proceso.

## 2. Datos del issue
- Título: [Bug][Backend] Corregir generateComprobante por columnas SQL inexistentes
- Estado: Resuelto (Estabilizado)
- Labels: `bug`, `fase-1`, `critico`, `portal-web`, `reportes`
- Prioridad aparente: Crítica
- Componentes afectados: `resolvers.ts`, `comprobante-pdf.service.ts`, `ArchivosEvaluacionComponent`
- Fuente consultada: `PLAN_TRABAJO_FASE1.md` (DEF-007, Sprint 2)

## 3. Problema reportado
Uso de columnas `s.folio`, `s.nombre_archivo` y `s.md5` en lugar de `s.consecutivo`, `s.archivo_original` y `s.hash_archivo`. Adicionalmente, el comprobante se entregaba como `.txt` en Base64.

## 4. Estado actual en el código
Se ha implementado una arquitectura de servicios para la generación de PDFs. La consulta SQL ha sido corregida y auditada contra el esquema `solicitudes_eia2`. El frontend maneja la descarga con el MIME type correcto y alerta al usuario si el documento aún no está listo.

## 5. Comparación issue vs implementación
### Coincidencias
- Uso de `consecutivo`, `archivo_original` y `hash_archivo`.
- Generación de PDF real.
- Retorno de JSON `{success, fileName, contentBase64}`.
### Brechas
- Ninguna técnica persistente tras la última estabilización.
### Inconsistencias
- Había una duda inicial sobre si usar MD5 o SHA-256; se optó por SHA-256 (`hash_archivo`) para mantener la integridad criptográfica moderna.

## 6. Diagnóstico
### Síntoma observado
- Error "column s.folio does not exist" en el backend al intentar descargar el comprobante.
### Defecto identificado
- Discrepancia entre el DDL generado en enero 2026 y el código del resolver escrito previamente.
### Causa raíz principal
- Falta de sincronización entre el diseño del esquema de datos y el desarrollo del módulo de reportes.
### Causas contribuyentes
- Mockeo inicial de la funcionalidad que nunca fue reemplazado por la implementación real de `pdfmake`.
### Riesgos asociados
- Incumplimiento del requerimiento legal/oficial de entrega de comprobantes de carga.

## 7. Solución propuesta
### Objetivo de la corrección
Garantizar la descarga de un PDF válido y estéticamente profesional del comprobante de carga.
### Diseño detallado
1. Corregir alias SQL en `generateComprobante`.
2. Crear `ComprobantePdfService` con `pdfmake`.
3. Configurar fuentes Roboto locales en el servidor.
4. Refinar `ArchivosEvaluacionComponent` para manejo de errores de validación pendiente.
### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.ts`
- `graphql-server/src/services/comprobante-pdf.service.ts`
- `web/frontend/src/app/components/archivos-evaluacion/archivos-evaluacion.component.ts`
### Cambios de datos / migraciones
- No requiere migraciones (el esquema ya era correcto, el código era el que fallaba).
### Consideraciones de seguridad
- Se valida que el `usuario_id` de la solicitud coincida con el usuario en sesión o posea rol administrativo.
### Consideraciones de rendimiento
- La generación de PDF se realiza en memoria (buffers) para minimizar operaciones de E/S en disco.
### Consideraciones de compatibilidad
- El PDF generado es compatible con lectores estándar (Chrome, Edge, Adobe Reader).

## 8. Criterios de aceptación
- [x] Query SQL sin errores de columnas.
- [x] Binario inicia con `%PDF`.
- [x] Descarga automática en el navegador tras clic.
- [x] Mensaje informativo si `hash_archivo` es NULL.

## 9. Estrategia de pruebas
### Unitarias
- Prueba de servicio con `test-pdf.js` para validar cabeceras del buffer.
### Integración
- Prueba completa desde el módulo de Historial en el frontend.
### E2E/manual
- Carga de archivo Excel -> Espera de validación -> Descarga de Comprobante.
### Casos borde
- Solicitud inexistente: debe mostrar error 404/not found controlado.
- Solicitud sin hash: debe mostrar advertencia de "en proceso".

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Desarrollo bajo RUP/PSP.
- Situación actual: Cumplimiento de RF-12 y CU-16.
- Cómo se cumple con la solución: Documentando la trazabilidad desde el issue hasta el commit.

## 11. Documentación requerida
- Archivos a actualizar: `docs/analysis/issue-294.md`.
- Issue comment a publicar: (Ver sección de comentario).
- Artefactos técnicos a adjuntar o referenciar: `walkthrough.md`.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: sí
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue#294-comprobantePDF`
  - `git commit -m "feat: stabilize PDF generation and improve error handling #294"`

## 13. Recomendación final
Proceder con la implementación de pruebas automatizadas E2E en Cypress para este flujo, dado que es el comprobante oficial de cara al usuario final.
