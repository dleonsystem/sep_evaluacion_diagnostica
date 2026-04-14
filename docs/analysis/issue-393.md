# Análisis del Issue #393 (Carga Masiva)

## 1. Resumen y Datos
•	**Título/Estado:** [Fase 1] Bug: Fallo en Carga Masiva (Exceso de modales "Correo requerido") / En Proceso
•	**Componentes afectados:** UI (CargaMasivaComponent), Validación de Sesión, UX.
•	**Resumen Ejecutivo:** La carga masiva de archivos falla después del primer documento debido a un reseteo prematuro del campo de correo electrónico en el componente de Angular, lo que bloquea los envíos subsecuentes en el ciclo de procesamiento.

## 2. Datos del issue
•	**Título:** [Fase 1] Bug: Limitacion de Historial de Cargas a 2 documentos
•	**Estado:** Abierto
•	**Labels:** fase-1
•	**Prioridad aparente:** Alta (Bloquea operabilidad de carga masiva)
•	**Fuente consultada:** Descripción del usuario (Josué Guadalupe), Issue #393, Source Code.

## 3. Problema reportado
Al cargar múltiples archivos (ej. 5) y presionar "CARGAR TODO":
1.	El primer archivo se carga correctamente.
2.	Aparece un modal de éxito para el primer archivo.
3.	Tras cerrar el modal, aparecen n-1 modales (4 en el ejemplo) indicando "Correo requerido".
4.	En el historial solo se visualiza una carga (normalmente la última procesada exitosamente o la única que alcanzó el servidor).

## 4. Estado actual en el código
- El método `guardarTodo()` en `carga-masiva.component.ts` (Línea 745) itera sobre un arreglo de resultados válidos llamando a `guardarArchivo(resultado)` secuencialmente.
- El método `guardarArchivo()` (Línea 504) tiene una lógica en su bloque de éxito (Líneas 617-622) que limpia el valor de `correoControl` si no hay una sesión activa (`!this.sesionActiva`).
- Al estar dentro de un bucle `async/await`, la primera iteración exitosa borra el correo, haciendo que las validaciones de entrada (`this.correoControl.invalid`) de las siguientes iteraciones fallen inmediatamente (Línea 505).

## 5. Comparación issue vs implementación
•	**Coincidencias:** El comportamiento observado (múltiples modales de error tras un éxito) coincide exactamente con la lógica de borrado de campo encontrada.
•	**Brechas/Inconsistencias:** El título original del issue sugería un límite en el historial, pero el diagnóstico técnico revela que el límite es en realidad un fallo en la persistencia del estado durante la carga por lotes.

## 6. Diagnóstico
•	**Síntoma observado:** Mensajes de "Correo requerido" que aparecen de forma intrusiva tras una carga exitosa parcial.
•	**Defecto identificado:** Efecto secundario no deseado del reseteo de formulario post-carga dentro de un contexto de procesamiento masivo.
•	**Causa raíz principal:** El método `guardarArchivo` asume una operación atómica única y limpia el estado global del componente (el `FormControl` de correo) sin considerar si es parte de una secuencia de cargas más amplia.
•	**Riesgos asociados:** 
    - **UX:** Confusión del usuario y sensación de sistema inestable.
    - **Integridad de datos:** Cargas parciales e incompletas que obligan al usuario a repetir procesos.

## 7. Solución propuesta
•	**Objetivo de la corrección:** Desacoplar el reseteo del formulario de la lógica de guardado individual para permitir el procesamiento completo de lotes.
•	**Diseño detallado:** 
    1. Modificar `guardarArchivo` para aceptar un flag opcional `evitarReseteo: boolean`.
    2. Condicionar la limpieza del correo (`this.correoControl.setValue('')`) a que dicho flag sea falso.
    3. En `guardarTodo`, llamar a `guardarArchivo` enviando `true` en el flag.
    4. En `guardarTodo`, realizar un único reseteo de correo en el bloque `finally` o tras completar el bucle con éxito total.
•	**Archivos a intervenir:** 
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
•	**Consideraciones de seguridad/rendimiento:** No afecta la seguridad del envío ya que el correo se valida al inicio de `guardarTodo`. Mejora el rendimiento percibido al evitar interrupciones por validación de formulario vaciado.

## 8. Criterios de aceptación
•	[ ] Se pueden cargar 5 archivos simultáneamente mediante "CARGAR TODO" sin errores de "Correo requerido".
•	[ ] Los 5 archivos aparecen correctamente en el historial de cargas.
•	[ ] El campo de correo se limpia SOLO después de que TODOS los archivos han sido procesados (o si se carga un único archivo de forma individual).

## 9. Estrategia de pruebas y Evidencia
•	**Definición de tests:** 
    - Test de Carga Individual: Validar que sigue funcionando y limpiando el correo post-éxito (comportamiento legacy preservado).
    - Test de Carga Masiva (3+ archivos): Validar flujo ininterrumpido.
•	**Evidencia de validación:** 
    - Compilación exitosa via `npm run build` confirmando que el nuevo método `resetearCampoCorreo` y el cambio de firma en `guardarArchivo` no rompen el bundle.
    - El análisis de flujo confirma que el valor de `correoControl` se preserva durante todo el bucle de `guardarTodo`, eliminando la causa raíz de los modales de error intrusivos.

## 10. Cumplimiento de políticas y proceso
- Sigue los principios de **Estabilización de Fase 1**.
- Respeta la lógica de **PSP/RUP** al documentar el análisis antes de la implementación.
- Alineado con mejores prácticas de **Clean Code** al centralizar la manipulación de estado de UI.

## 11. Documentación requerida
- `docs/analysis/issue-393.md` (Actualizado)
- `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`

## 12. Acciones en GitHub
•	**Rama de trabajo:** `task/pepenautamx-issue393-correccion-carga-masiva`
•	**Labels ajustadas:** fase-1, bug
•	**Comandos ejecutados:** 
    - `git checkout dev`
    - `git pull`
    - `git checkout -b task/pepenautamx-issue393-correccion-carga-masiva`
    - `npm run build`

## 13. Recomendación final
Considerar mover la limpieza de campos a un método central de "ResetForm" que pueda ser invocado de forma explícita por los orquestadores de la lógica (como `guardarTodo`) en lugar de estar incrustado físicamente en los métodos de acción de bajo nivel.

