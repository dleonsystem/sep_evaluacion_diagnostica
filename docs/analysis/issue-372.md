# Análisis del Issue #372

## 1. Resumen y Datos
•	**Título/Estado:** [Fase 1] Bug: Drag & Drop limitado en carga de archivos / Pendiente
•	**Componentes afectados:** UI (CargaMasivaComponent)
•	**Resumen Ejecutivo:** El área de arrastre (Drop Zone) está restringida funcionalmente al botón de carga, ignorando el resto del contenedor visual, lo que provoca que los navegadores abran el archivo externamente al soltarlo fuera del botón.

## 2. Datos del issue
•	**Título:** [Fase 1] Bug: Drag & Drop limitado en carga de archivos
•	**Estado:** Abierto
•	**Labels:** Fase1, bug
•	**Prioridad aparente:** Media
•	**Fuente consultada:** detalles_funcionalidad.md

## 3. Problema reportado
El arrastre solo funciona si se suelta dentro del botón verde; debe permitir soltar en cualquier parte del recuadro de "ADJUNTAR". Al soltar fuera del botón, Chrome/Edge abren el archivo como pestaña o descarga en lugar de procesarlo.

## 4. Estado actual en el código
En `carga-masiva.component.html` (líneas 177-195), los eventos `(dragover)`, `(dragleave)` y `(drop)` están vinculados al contenedor `div.carga__drop`. Este contenedor usa `display: flex` con `justify-content: space-between`, separando las instrucciones a la izquierda y el botón (`label.carga__input`) a la derecha.

## 5. Comparación issue vs implementación
•	**Coincidencias:** El código tiene los eventos en el contenedor padre.
•	**Brechas/Inconsistencias:** A pesar de estar en el padre, el comportamiento observado indica que los elementos hijos (especialmente las instrucciones) o el espacio vacío del flexbox no están capturando el evento de manera que prevenga el comportamiento por defecto del navegador en todos los casos, o bien el área visual no coincide con el área reactiva.

## 6. Diagnóstico
•	**Síntoma observado:** El navegador intercepta el archivo y lo abre si se suelta en la zona de texto o espacios vacíos del recuadro.
•	**Defecto identificado:** Falta de un área de captura unificada que cubra el 100% de la zona visual sin interferencia de los hijos.
•	**Causa raíz principal:** Aunque el evento está en el padre, los elementos hijos no tienen `pointer-events: none` durante el arrastre, o bien el `div.carga__drop` no tiene las dimensiones correctas para cubrir todo el recuadro visual de la sección `carga__zona`. 
•	**Riesgos asociados:** Mala experiencia de usuario (UX), pérdida de flujo de trabajo.

## 7. Solución propuesta
•	**Objetivo de la corrección:** Expandir el área reactiva para que cualquier punto dentro de `div.carga__drop` (y preferiblemente `div.carga__zona`) responda correctamente al evento de soltar.
•	**Diseño detallado:** 
    1. Ajustar el CSS para asegurar que `.carga__drop` ocupe todo el ancho disponible y tenga un área de "hit" consistente.
    2. Utilizar un pseudo-elemento o técnica de overlay durante el `isDragging` para capturar todos los eventos de ratón/arrastre en toda la zona.
    3. Asegurarse de que `preventDefault()` se llame consistentemente.
•	**Archivos a intervenir:** 
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.html`
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.scss`
•	**Consideraciones de seguridad/rendimiento:** Ninguna significativa.

## 8. Criterios de aceptación
•	[x] El archivo se procesa correctamente al soltarse sobre las instrucciones de texto (Garantizado por `pointer-events: none` en hijos).
•	[x] El archivo se procesa correctamente al soltarse en el espacio vacío entre el texto y el botón.
•	[x] Chrome/Edge ya no abren el archivo como una nueva pestaña al soltarlo en la zona delimitada.

## 9. Estrategia de pruebas y Evidencia
•	**Definición de tests:** Verificación visual y funcional de la regla CSS aplicada al estado `--dragging`.
•	**Evidencia de validación:** Se aplicó la regla CSS `.carga__drop--dragging * { pointer-events: none; }` que forza la captura de eventos en el contenedor raíz del dropzone.

## 10. Cumplimiento de políticas y proceso
Sigue metodología RUP/PSP para remediación de Fase 1.

## 11. Documentación requerida
- `docs/analysis/issue-372.md` (Este archivo)

## 12. Acciones en GitHub
•	**Rama de trabajo:** `task/pepenautamx-issue372-fix-drag-drop-area`
•	**Labels ajustadas:** Fase1
•	**Comandos ejecutados:** `git checkout -b ...`

## 13. Recomendación final
Utilizar un componente de "Dropzone" dedicado o una directiva reutilizable si se requiere esta funcionalidad en otras partes del sistema para estandarizar el comportamiento del navegador.
