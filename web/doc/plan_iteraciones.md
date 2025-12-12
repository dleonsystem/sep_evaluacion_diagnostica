# Plan de Iteraciones – RUP
## Plataforma de Recepción, Validación y Descarga de Archivos EIA (2ª aplicación)

---

# 1. Fase de Inicio (Inception)

**Objetivos:**
- Definir visión y alcances conforme al documento `plataforma_recepcion_validacion_descarga_EIA.md`.
- Identificar actores: escuela anónima/autenticada, sistema externo y operador técnico SEP.
- Acordar reglas de validación (9 verificaciones) y lineamientos de credenciales/PDFs.

**Entregables:**
- Documento de Visión v2.0.
- Lista inicial de riesgos.
- Modelo de casos de uso actualizado.

---

# 2. Fase de Elaboración (Elaboration)

## Iteración E1 – Requerimientos y modelo de datos

**Objetivos:**
- Completar SRS v2.0 con reglas de validación, generación de credenciales y repositorios separados.
- Definir modelo de datos para solicitudes, credenciales, ligas de descarga y bitácora.
- Ajustar casos de uso detallados para carga anónima y descargas autenticadas.

**Entregables:**
- SRS v2.0.
- Modelo de datos conceptual y físico inicial (PostgreSQL).
- Casos de uso detallados.

## Iteración E2 – Diseño arquitectónico y tecnológico

**Objetivos:**
- Definir arquitectura FastAPI + Angular 19 (signals) + workers Redis (validación/PDF) con lineamientos de estilo gob.mx v3 incluidos desde CDN en `index.html`.
- Diseñar separación de repositorios (recepción vs. resultados) y capacidad mínima de 1 TB.
- Planear integración con sistema externo de resultados (ingesta de ligas/archivos).

**Entregables:**
- SAD actualizado.
- Prototipo técnico mínimo: endpoint FastAPI de validación simulada + pantalla Angular de carga anónima con estado “Validando tu archivo…” usando la guía gráfica gob.mx.

---

# 3. Fase de Construcción (Construction)

## Iteración C1 – Núcleo de recepción y validación

**Objetivos:**
- Implementar carga anónima de archivo .xlsx.
- Ejecutar 9 validaciones con workers y generar PDF de confirmación/errores.
- Generar credenciales en primera carga válida y registrar solicitud con consecutivo.

**Entregables:**
- Pantalla de carga anónima y mensaje en línea.
- Workers de validación + generación de PDFs.
- Repositorio de recepción operativo (filesystem + registros en PostgreSQL).

**Plan de trabajo detallado – SPA Angular 19 (signals) con guía gob.mx v3**
- **Punto de partida:** Angular CLI 19.2.x ya instalado; `index.html` incluye los assets de la guía gráfica gob.mx v3 desde CDN.
- **¿Qué es SPA?** Una Single Page Application: el shell se renderiza una vez y las vistas cambian en el navegador (sin recargar toda la página) usando enrutamiento de Angular.
- **Pasos previstos:**
  1. Definir rutas iniciales (`/` carga anónima, `/login`, `/descargas`) y un layout base que use los estilos gob.mx ya cargados.
  2. Crear el componente de inicio/carga con signals para estado de archivo, progreso y mensajes ("Validando tu archivo...").
  3. Implementar servicios HTTP y de estado con signals para enviar el `.xlsx` al backend y mostrar las 9 validaciones.
  4. Preparar componentes de autenticación y listado de descargas reutilizando la guía gráfica (tablas, alerts, botones).
  5. Validar accesibilidad y consistencia visual con la guía gráfica en navegación SPA (sin recargas completas).

## Iteración C2 – Portal de descargas y publicación de ligas

**Objetivos:**
- Implementar login (CCT + contraseña generada) y módulo de descargas.
- Consumir ligas/archivos provistos por el sistema externo y listarlos por versión/consecutivo.
- Ajustar monitoreo técnico (logs, espacio en disco, salud de workers).

**Entregables:**
- Portal de descargas autenticado.
- Integración con repositorio de resultados.
- Panel técnico básico.

---

# 4. Fase de Transición (Transition)

**Objetivos:**
- Despliegue en ambientes de prueba y producción bajo HTTPS.
- Capacitación breve a operadores y mesa de ayuda.
- Soporte intensivo durante la ventana de recepción/descarga y validación de carga pico (120,000 solicitudes).

**Entregables:**
- Manual de usuario (carga anónima y descargas autenticadas).
- Manual técnico (operación de workers y repositorios).
- Informe de cierre y lecciones aprendidas.
