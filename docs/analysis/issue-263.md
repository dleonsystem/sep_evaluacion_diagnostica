# Análisis del Issue 263

## 1. Resumen ejecutivo
El Issue #263 establece que, al superar un umbral de intentos fallidos de carga masiva, el sistema desencadene un ticket. Actualmente el backend y frontend ya soportan y abren un modal tras 3 fallos. La brecha para cerrar este Issue consiste en completar el requerimiento de "Vínculo con evidencia y solicitud" y "Umbral configurable", ya que el usuario reportante hoy en día tiene un formulario vacío y debe adjuntar manualmente su archivo y escribir su descripción, sin aprovechar la telemetría del error que el Frontend ya generó y consumió.

## 2. Datos del issue
- Título: CU-13 | Generacion automatica de ticket por intentos fallidos
- Estado: Open
- Labels: enhancement, fase-1, critico, tickets
- Prioridad aparente: Alta (crítico)
- Componentes afectados: `CargaMasivaComponent` (Frontend), UI modal de incidencias.
- Fuente consultada: Issue #263, `carga-masiva.component.ts`, Requerimientos del usuario directo.

## 3. Problema reportado
"Disparar creacion automatica de ticket al superar el umbral de intentos fallidos de carga... Vinculo con evidencia y solicitud... Umbral configurable."

## 4. Estado actual en el código
Actualmente, dentro de `CargaMasivaComponent.ts`, `intentosFallidos` cuenta los rechazos. Al llegar a 3 (hardcoded), invoca el `abrirModalIncidencia()`. Este componente de UI presenta al usuario en la pantalla un formulario vacío (salvo el correo). 

## 5. Comparación issue vs implementación
### Coincidencias
- El umbral de eventos fallidos dispara el proceso.
- La pantalla obliga/sugiere la generación del ticket mediante un modal funcional e integrado.
### Brechas
- **Evidencia Desvinculada:** El formulario de incidencia está limpio; el usuario se ve obligado a volver a explorar en su dispositivo y adjuntar el Excel defectuoso.
- **Pérdida de Traza:** El campo "Descripción del problema" está vacío, por lo que el usuario carece del argot técnico para explicar al evaluador por qué su archivo falló (o qué regla del Validador detonó).
- **Umbral Rígido:** El valor "3" está hardcodeado, dificultando cumplir "Umbral configurable".

## 6. Diagnóstico
### Síntoma observado
El modal de incidencia requiere un reproceso del usuario final para capturar la evidencia (`File`) y redactar el error, propiciando tickets nulos, faltos de contexto, o sin documento adjunto.
### Defecto identificado
Incompleta automatización del estado en el lado del cliente (Frontend no transfiere pasivamente el archivo encolado del componente de validación al array de incidencias).
### Causa raíz principal
Falta propagación de dependencias temporales. Cuando falla `ExcelValidationService`, su arreglo de resultados arrojado (con mensajes string específicos de validación) y el objeto original de subida (`this.archivosSeleccionados[0]`) no son mapeados a `evidenciasIncidencia` y al `patchValue()` de descripción en el FormGroup de incidencia antes de activar el modal.
### Causas contribuyentes
El límite "3" se insertó como número mágico `if (this.intentosFallidos >= 3)`.

## 7. Solución propuesta
### Objetivo de la corrección
Interconectar el estado del error local de validación con el estado del formulario de incidencia, pre-adjuntando el archivo rechazado al listado de incidencias y redactando la traza técnica para la revisión del Nivel 2.
### Diseño detallado
1. En el script `carga-masiva.component.ts`, interceptar `abrirModalIncidencia()`.
2. Convertir u obtener el archivo actual iterado en el DropZone (`this.archivosSeleccionados[0]`) y pushearlo directamente a `this.evidenciasIncidencia` con el objeto `{ archivo: file, id: 'auto' }`.
3. Concatenar los mensajes de error recogidos en el histórico local de la vista. Realizar un `patchValue({ descripcion: 'Registros técnicos: \n' + errores.join('\n') })`.
4. Mover el umbral a una variable global exportada (ej. `environment.umbralFallosTicket = 3`).
### Archivos o módulos a intervenir
- `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
### Cambios de datos / migraciones
- Ninguno requerido en DB.
### Consideraciones de rendimiento
- Minimas precauciones. El archivo está localmente en el ArrayBuffer del navegador. Evitar reprocesar.

## 8. Criterios de aceptación
- [ ] El Modal emergente muestra en "Descripción" los errores arrojados por el motor validador en las subidas anteriores.
- [ ] El Modal emergente tiene pre-asociado el documento origen (`.xlsx`) como evidencia sin intervención del ratón.
- [ ] El código referencía el umbral de disparo desde una constante de configuración.

## 9. Estrategia de pruebas
### Unitarias
- Afirmar que `evidenciasIncidencia.length == 1` al dispararse `abrirModalIncidencia()`.
### Integración
- N/A
### E2E/manual
- Subir un archivo malo 3 veces. Validar que el Modal aparece listando en la parte baja el archivo ya listo para ser enviado, y la descripción con el log de fallos, completando Nombre y CCT para generar el T-XXXXX final.

## 10. Cumplimiento de políticas y proceso
- Situación actual: Solución original entregada sin Vínculo Activo de Evidencia (Brecha Arquitectónica).
- Cómo se cumple con la solución: Mitigación a nivel estado UI de Angular inyectando trazabilidad al usuario, beneficiándolo de transparencia de errores, mejorando el Reporte de Incidentes de Soporte Técnico.

## 11. Documentación requerida
- Archivos a actualizar: Este propio archivo en control de cambios `docs/analysis/issue-263.md`.
- Issue comment a publicar: Fe de erratas / Addendum al issue.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: no
- Comandos ejecutados: `git commit --amend` 

## 13. Recomendación final
Implementar pre-vuelco de archivo y descripciones, y posteriormente enviar el código a PR como cierre del Issue.
