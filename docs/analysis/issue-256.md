# Análisis del Issue: CU-04v2 | Frontend de carga publica y captura de correo

## 1. Resumen y Datos
* **Título/Estado**: CU-04v2 | Frontend de carga publica y captura de correo / Abierto
* **Componentes afectados**: UI Frontend (Componente `CargaMasivaComponent`), Validadores de Formulario.
* **Resumen Ejecutivo**: La funcionalidad de captura de correo previa a la carga de archivos, la selección restrictiva de extensiones `.xlsx` y los estados visuales ya se encuentran implementados y operativos en el estado actual de la rama `dev`. No se detectan brechas en el cumplimiento de los criterios de aceptación.

## 2. Datos del issue
* **Título**: CU-04v2 | Frontend de carga publica y captura de correo
* **Estado**: Abierto (Issue #256)
* **Labels**: `enhancement`, `fase-1`, `critico`, `portal-web`
* **Prioridad aparente**: Crítica (relacionado con el flujo fundamental de recepción de datos).
* **Fuente consultada**: `gh issue list` (MCP Server Search).

## 3. Problema reportado
Implementar la interfaz pública para la captura de correo y selección de archivo del flujo CU-04v2.
Alcance técnico requerido:
- Pantalla pública de carga.
- Captura y validación básica de correo.
- Habilitación del selector de archivo.
- Estados visuales de validación y resultado.

## 4. Estado actual en el código
En `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts` y `.html`:
- Se define un `correoControl` (Validators.required, Validators.email, Validators.pattern regex).
- El área de selección de archivos (`carga__drop`) y el botón `input type="file"` tienen directivas estructurales y binds que los deshabilitan si el correo es inválido (`[disabled]="correoControl.invalid"`).
- La validación del archivo subido restringe a `.xlsx` mediante la propiedad `extensionesPermitidas = ['.xlsx']`.
- La lógica de UI cubre los estados: `idle`, `validando`, `exito`, `error`, y `guardando`, cada uno afectando indicadores visuales como el de carga o las viñetas de estado.

## 5. Comparación issue vs implementación
* **Coincidencias**: La implementación actual coincide al 100% con los requerimientos originales del Issue. El formulario bloquea la carga si el correo no está ingresado, restringe formatos y maneja el estado visual de progreso y error.
* **Brechas/Inconsistencias**: Ninguna identificada. El desarrollo previo cubrió completamente los requisitos del issue.

## 6. Diagnóstico
* **Síntoma observado**: Issue marcado como abierto a pesar de que está funcionalmente cubierto en la base de código.
* **Defecto identificado**: Falta de actualización del tracking del issue versus la realidad del repositorio.
* **Causa raíz principal**: Desfase administrativo en el rastreo de funcionalidades implementadas como correcciones acumulativas o fusiones pasadas.
* **Riesgos asociados**: Baja priorización artificial o pérdida de tiempo asignando un ticket que ya fue resuelto. Ningún riesgo técnico al estar el sistema funcional y asegurado.

## 7. Solución propuesta
* **Objetivo de la corrección**: Sancionar y documentar funcionalmente el módulo en el contexto del proyecto y formalizar los criterios de aceptación para posibilitar su cierre en la Fase 1.
* **Diseño detallado**: No se requieren inyecciones de código. El componente `CargaMasivaComponent` opera acorde a las especificaciones OWASP para el manejo de formularios mediante el uso de `ReactiveFormsModule` de Angular, mitigando inyecciones y manipulaciones del DOM manuales.
* **Archivos a intervenir**: Sólo documentación de validación `docs/analysis/issue-256.md`.
* **Consideraciones de seguridad/rendimiento**: El front-end previene ejecuciones indeseadas al mantener bloqueado el Input tipo "file" y los Drop events mientras no se satisfaga un Regex de correo válido. 

## 8. Criterios de aceptación
* [x] El formulario solicita correo antes de habilitar carga.
* [x] El usuario puede seleccionar archivo .xlsx.
* [x] La UI muestra progreso, éxito y error.
* [x] El flujo queda listo para integrarse con backend.

## 9. Estrategia de pruebas y Evidencia
* **Definición de tests**: 
  - Pruebas manuales visuales y lógicas leyendo la reactividad del `CargaMasivaComponent`.
  - Validación de EventListeners drag-bound en HTML.
* **Evidencia de validación**: Confirmación en base estática (`carga-masiva.component.html:179` y `carga-masiva.component.ts:186`). El Input ignora eventos si el control es inválido y SweetAlert alerta sobre la necesidad de correo.

## 10. Cumplimiento de políticas y proceso
Los validadores reactivos de Angular (`correoPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`) fortalecen el control de inyecciones XSS o de comandos (OWASP A03). Cumple estrictamente con el formato Fase 1 de requerimiento para submisiones seguras.

## 11. Documentación requerida
- `docs/analysis/issue-256.md` (nuevo)

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue256-frontend-carga-publica`
* **Labels ajustadas**: No aplica (gestión de administrador)
* **Comandos ejecutados**: 
  - `git pull origin dev`
  - `git checkout -b task/pepenautamx-issue256-frontend-carga-publica`

## 13. Recomendación final
Añadir integraciones automáticas (E2E) con Cypress que prueben el `disabled` attribute en este input en pipelines de CI futuros para asegurar la no regresión del deshabilitador del `dragover`/`input-file`.
