# Análisis del Issue #263 (Refinamiento)

## 1. Resumen y Datos
•	**Título/Estado:** CU-13 | Refinamiento de Contador de Fallos para Incidencias / En Proceso
•	**Componentes afectados:** UI (CargaMasivaComponent), Validación de Archivos, Gestión de Sesión.
•	**Resumen Ejecutivo:** El contador de fallos actual es global y agnóstico al archivo/usuario, lo que provoca la apertura prematura del formulario de incidencias. Se requiere una granularidad por ID de archivo y por correo electrónico del usuario.

## 2. Datos del issue
•	**Título:** CU-13 | Generacion automatica de ticket por intentos fallidos
•	**Estado:** Cerrado (Reabierto para refinamiento en rama de tarea)
•	**Labels:** enhancement, fase-1, critico, tickets
•	**Prioridad aparente:** Alta
•	**Fuente consultada:** GitHub Issue #263 y solicitud directa de usuario (Josué Guadalupe).

## 3. Problema reportado
1.	**Indistinción de Archivos:** El sistema suma fallos de archivos diferentes como si fueran del mismo, disparando el formulario tras 3 errores cualesquiera.
2.	**Indistinción de Usuarios:** Los fallos se suman a nivel de componente sin importar si el usuario cambió su correo eletrónico en el input, permitiendo que errores de un usuario afecten a otro en la misma terminal.

## 4. Estado actual en el código
- El archivo [carga-masiva.component.ts](file:///c:/ANGULAR/sep_evaluacion_diagnostica/web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts) posee una variable `intentosFallidos: number = 0` (Línea 91).
- El método `registrarIntentoFallido` (Línea 343) incrementa este contador globalmente sin validar contexto.
- El reseteo se realiza en `cerrarModalIncidencia` (Línea 383), pero afecta al estado global.

## 5. Comparación issue vs implementación
•	**Coincidencias:** El umbral de 3 fallos ya existe y dispara el modal correctamante.
•	**Brechas/Inconsistencias:** Falta trazabilidad (Key-Value pairing) entre el usuario/archivo y su histórico de errores específico.

## 6. Diagnóstico
•	**Síntoma observado:** El formulario de incidencias aparece tras fallos de archivos distintos o usuarios compartiendo la misma sesión de navegador.
•	**Defecto identificado:** Uso de un acumulador escalar (`number`) en lugar de una estructura asociativa (`Map`) para el rastreo de fallos.
•	**Causa raíz principal:** Diseño simplificado del contador de reintentos que no contempló escenarios de uso compartido o cargas de múltiples plantillas diferentes.
•	**Riesgos asociados:** 
    - **UX:** Frustración del usuario al ver un formulario de incidencia cuando solo ha fallado una vez con un archivo específico.
    - **Integridad de Datos:** Tickets de soporte generados con descripciones mezcladas de archivos diferentes.

## 7. Solución propuesta
•	**Objetivo de la corrección:** Implementar un rastreo matricial [Usuario x Archivo] para el conteo de fallos.
•	**Diseño detallado:** 
    1. Reemplazar `intentosFallidos` por un `Map<string, Map<string, number>>`.
    2. Identificar el archivo mediante un hash/ID compuesto: `nombre_archivo + tamaño + fecha_modificacion`.
    3. Asegurar que `registrarIntentoFallido` use el correo normalizado (trim/lowercase) como llave primaria del mapa.
    4. Resetear solo el par específico [Usuario, ID_Archivo] al cerrar el modal exitosamente.
•	**Archivos a intervenir:** 
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
•	**Consideraciones de seguridad/rendimiento:** El uso de Maps en memoria es eficiente para el ciclo de vida del componente. No se requiere persistencia en DB para este contador de UI.

## 8. Criterios de aceptación
•	[ ] El formulario NO aparece si se fallan 3 archivos diferentes 1 vez cada uno.
•	[ ] El formulario SÍ aparece si el MISMO archivo (identificado por metadatos) falla 3 veces para el mismo usuario.
•	[ ] Los fallos de `usuario1@gmail.com` NO se suman a los de `usuario2@gmail.com`.
•	[ ] El contador se resetea correctamente tras cerrar el modal de incidencia.

## 9. Estrategia de pruebas y Evidencia
•	**Definición de tests:** 
    - Prueba 1: Cargar Archivo A (Error 1), Archivo B (Error 2), Archivo C (Error 3) -> Verificar que `intentosFallidos` para cada uno sea 1 y no se abra el modal.
    - Prueba 2: Cargar Archivo A (Error 1, 2, 3) -> Verificar apertura de modal.
    - Prueba 3: Usuario A (2 fallos), Usuario B (1 fallo) -> Verificar que no se abra el modal.
•	**Evidencia de validación:** 
    - Compilación exitosa via `npm run build` en el frontend ([build logs proof]).
    - Revisión de lógica: Estructura `historialFallos` (Map anidado) garantiza que `usuario A` en `archivo A` tenga su propio contador independiente de `usuario B` o `archivo B`.

## 10. Cumplimiento de políticas y proceso
- Sigue el estándar de **Arquitectura Granular** para telemetría de errores.
- Cumple con **Fase 1 (Estabilización)** al mejorar la precisión de los reportes de soporte.
- Implementado bajo metodología **PSP/RUP** con análisis de causa raíz y diseño técnico previo.

## 11. Documentación requerida
- `docs/analysis/issue-263.md` (Actualizado)
- `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts` (Código modificado)
- `walkthrough.md` (Resumen de cambios y lógica)

## 12. Acciones en GitHub
•	**Rama de trabajo:** `task/pepenautamx-issue263-refinado-contador-fallos`
•	**Labels ajustadas:** enhancement, tickets, fase-1
•	**Comandos ejecutados:** 
    - `git checkout dev`
    - `git pull origin dev`
    - `git checkout -b task/pepenautamx-issue263-refinado-contador-fallos`
    - `npm run build` (Verificación de integridad)

## 13. Recomendación final
Monitorear si el ID de archivo basado en nombre y tamaño es suficiente. Si hay colisiones extremas (poco probable en plantillas SEP), considerar un hash del contenido parcial. Se recomienda integrar un sistema de logging en Phase 2 para auditar cuántas veces los usuarios llegan al umbral de incidencia.
