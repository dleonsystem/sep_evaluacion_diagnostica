# Análisis del Issue #387

## 1. Resumen y Datos
•	**Título/Estado:** [Fase 1] Bug: Reconocimiento de sesion en nuevas pestanias / Pendiente
•	**Componentes afectados:** UI (CargaMasivaComponent, LoginComponent), Seguridad (AuthService)
•	**Resumen Ejecutivo:** El sistema presenta fallos en la persistencia visual de la sesión al abrir nuevas pestañas y carece de una validación síncrona de existencia de usuario durante el flujo de carga masiva, permitiendo procesos de registro redundantes.

## 2. Datos del issue
•	**Título:** [Fase 1] Bug: Reconocimiento de sesion en nuevas pestanias
•	**Estado:** Abierto
•	**Labels:** fase-1
•	**Prioridad aparente:** Alta
•	**Fuente consultada:** GitHub Issue #387

## 3. Problema reportado
1.	**Persistencia de Sesión:** Si el usuario ya está logueado, al abrir nuevas pestañas o navegar a "Carga Masiva", el sistema en ocasiones no reconoce la sesión activa de forma inmediata o visual.
2.	**Detección de Usuario Registrado:** Si un usuario no logueado intenta subir un archivo con un correo que ya tiene credenciales en el sistema, debe ser alertado con el mensaje "USUARIO YA REGISTRADO; INICIE SESIÓN PARA CARGAR ARCHIVOS" y redirigido al login.

## 4. Estado actual en el código
- **Persistencia:** `AuthService` utiliza `localStorage` para persistir el estado (`eia-user-session-active`). `CargaMasivaComponent` escucha eventos de `storage` para actualizarse, pero se ha detectado que `LoginComponent` (línea 91) ignora el parámetro `redirect` y siempre envía al usuario a `/archivos-evaluacion`, lo que rompe el flujo esperado desde la carga masiva.
- **Validación de Usuario:** Existe un método `verificarExistenciaUsuario` en `CargaMasivaComponent` vinculado al evento `valueChanges` del correo (con debounce de 600ms). Sin embargo, las acciones de `onArchivoSeleccionado` (botón) y `onDrop` (arrastre) no validan de forma síncrona/bloqueante si el usuario existe antes de procesar el archivo, confiando únicamente en una bandera de `localStorage` (`tieneCargaExitosa`) que es volátil y local al navegador original.

## 5. Comparación issue vs implementación
•	**Coincidencias:** El mensaje de advertencia "USUARIO YA REGISTRADO" ya está definido en el resolver de Backend y parcialmente implementado en el Frontend.
•	**Brechas/Inconsistencias:** 
    1. La redirección tras el login es estática y no reconoce el origen.
    2. La validación de existencia de usuario es reactiva (solo al escribir) y no imperativa (al intentar cargar).
    3. Si el usuario limpia caché o usa otra pestaña/equipo, el sistema permite que inicie un flujo de carga sin advertirle que ya tiene cuenta hasta que el backend falla en etapas posteriores.

## 6. Diagnóstico
•	**Síntoma observado:** El usuario puede llegar a la pantalla de éxito o error de carga sin haber sido advertido de que ya tenía una sesión o registro previo.
•	**Defecto identificado:** Desacoplamiento entre el estado de autenticación de `localStorage` y el flujo de navegación, junto con una validación de usuario "debil" en el frontend (basada en eventos asíncronos no bloqueantes).
•	**Causa raíz principal:** 
    1. Hardcodeo de ruta de redirección en `LoginComponent`.
    2. Ausencia de verificación de identidad (email check) en los puntos de entrada de archivos (`onArchivoSeleccionado`/`onDrop`).
•	**Riesgos asociados:** 
    - **UX:** Confusión del usuario al ver que sus archivos no se asocian o al recibir errores de duplicado tardíos.
    - **Seguridad:** Posibilidad de intentos de fuerza bruta sobre correos electrónicos si no se maneja correctamente la redirección.

## 7. Solución propuesta
•	**Objetivo de la corrección:** Garantizar que cualquier intento de carga masiva valide primero la identidad del usuario y respete la sesión activa en todas las pestañas.
•	**Diseño detallado:** 
    1. **LoginComponent:** Actualizar la lógica de navegación post-login para que utilice `this.redirect` obtenido de los queryParams.
    2. **CargaMasivaComponent:** 
        - Integrar la llamada a `verificarExistenciaUsuario` dentro de `onArchivoSeleccionado` y `onDrop` antes de llamar a `procesarArchivo`.
        - Asegurar que `verificarExistenciaUsuario` sea una promesa que pueda ser esperada (`await`).
    3. **AuthService:** Asegurar que `requiereLoginParaNuevaCarga` sea el punto central de decisión de bloqueo.
•	**Archivos a intervenir:** 
    - `web/frontend/src/app/components/login/login.component.ts`
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
•	**Consideraciones de seguridad/rendimiento:** La validación contra el backend añade una latencia mínima (ms) pero garantiza la integridad del flujo de Fase 1.

## 8. Criterios de aceptación
•	[ ] Tras loguearse desde un redirect de Carga Masiva, el sistema regresa a Carga Masiva con el correo pre-poblado.
•	[ ] Al abrir una nueva pestaña con una sesión ya iniciada en otra, el componente Carga Masiva detecta el estado "Logueado" y bloquea/estiliza el input de correo.
•	[ ] Al ingresar un correo registrado e intentar arrastrar un archivo, aparece el Swal de "USUARIO YA REGISTRADO" antes de procesar el Excel.
•	[ ] Al soltar un archivo (Drop) sobre un correo ya registrado (sin sesión), se bloquea la carga y se redirige a Login.

## 9. Estrategia de pruebas y Evidencia
•	**Definición de tests:** 
    - Caso A: Login -> Navegar manualmente -> Abrir nueva pestaña -> Verificar Carga Masiva.
    - Caso B: Ingresar email registrado -> Botón "Seleccionar Archivo" -> Verificar Swal.
    - Caso C: Login con param `?redirect=/carga-masiva` -> Verificar destino.
•	**Evidencia de validación:** (Pendiente de ejecución tras implementación)

## 10. Cumplimiento de políticas y proceso
- Cumple con **Fase 1: Estabilización**.
- Aplica principios de **UX de RUP** (Navegación coherente).
- Refuerza la política de **"Sin rastro"** al forzar login tras el primer éxito detectado por el servidor.

## 11. Documentación requerida
- `docs/analysis/issue-387.md` (Este archivo)
- Actualización de `BITACORA_CAMBIOS.md` tras el fix.

## 12. Acciones en GitHub
•	**Rama de trabajo:** `task/pepenautamx-issue387-sesion-nuevas-pestanias`
•	**Labels ajustadas:** fase-1, bug
•	**Comandos ejecutados:** `git checkout -b task/pepenautamx-issue387-sesion-nuevas-pestanias`

## 13. Recomendación final
Implementar un Guard de Angular (`AuthGuard`) más estricto si se requiere que ciertas rutas sean absolutamente inaccesibles sin sesión, aunque para Fase 1 se prefiere la validación dinámica en componentes para no romper el flujo de usuarios anónimos.
