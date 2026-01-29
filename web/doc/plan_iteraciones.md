# Plan de Iteraciones – RUP
## Plataforma de Recepción, Validación y Descarga de Archivos EIA (2ª aplicación)

---

## 1. Fase de Inicio (Inception)

**Objetivos:**
- Definir visión y alcances conforme al documento `plataforma_recepcion_validacion_descarga_EIA.md`.
- Identificar actores: escuela anónima/autenticada, sistema externo y operador técnico SEP.
- Acordar reglas de validación (10 verificaciones, incluyendo huella hash para diferenciar archivos con el mismo nombre) y lineamientos de credenciales/PDFs.

**Entregables:**
- Documento de Visión v2.0.
- Lista inicial de riesgos.
- Modelo de casos de uso actualizado.

---

## 2. Fase de Elaboración (Elaboration)

## Iteración E1 – Requerimientos y modelo de datos

**Objetivos:**
- Completar SRS v2.0 con reglas de validación (incluida huella hash), generación de credenciales, control de reenvíos autenticados y repositorios separados.
- Definir modelo de datos para solicitudes, credenciales, ligas de descarga y bitácora.
- Ajustar casos de uso detallados para carga anónima y descargas autenticadas.

**Entregables:**
- SRS v2.0.
- Modelo de datos conceptual y físico inicial (PostgreSQL).
- Casos de uso detallados.

**Criterios de Aceptación:**

- [ ] SRS completa con al menos 15 requisitos funcionales documentados y validados
- [ ] Los 5 casos de uso prioritarios están detallados con flujos principales y alternativos
- [ ] Modelo de datos conceptual incluye al menos 30 entidades con relaciones definidas
- [ ] Revisión y aprobación del stakeholder (SEP) sobre la SRS
- [ ] 100% de trazabilidad entre requisitos y casos de uso

### Iteración E2 – Diseño arquitectónico y tecnológico

**Objetivos:**
- Definir arquitectura GraphQL + Angular 19 (signals) + workers Redis (validación/PDF) con lineamientos de estilo gob.mx v3 incluidos desde CDN en `index.html`.
- Diseñar separación de repositorios (recepción vs. resultados) y capacidad mínima de 1 TB.
- Planear integración con sistema externo de resultados (ingesta de ligas/archivos).

**Entregables:**
- SAD actualizado.
- Prototipo técnico mínimo: operación GraphQL de validación simulada + pantalla Angular de carga anónima con estado “Validando tu archivo…” usando la guía gráfica gob.mx.

**Criterios de Aceptación:**

- [ ] Documento de Arquitectura (SAD) aprobado con diagramas de componentes e infraestructura
- [ ] Prototipo funcional desplegado en ambiente de desarrollo
- [ ] Endpoint de prueba responde con latencia < 200ms bajo carga de 10 peticiones/seg
- [ ] Pantalla Angular se comunica exitosamente con el backend y muestra datos
- [ ] Ambientes de desarrollo, pruebas y producción configurados y documentados
- [ ] Framework backend seleccionado y justificación documentada

---

## 3. Fase de Construcción (Construction)

## Iteración C1 – Núcleo de recepción y validación

**Objetivos:**
- Implementar carga anónima de archivo .xlsx solo para primer envío; bloquear reenvío anónimo si ya existe credencial.
- Ejecutar 10 validaciones con workers y generar PDF de confirmación/errores (incluye huella hash para distinguir archivos iguales por nombre).
- Generar credenciales en primera carga válida y registrar solicitud con consecutivo (almacenando hash de archivo); pedir login para reenvíos posteriores y detectar si el archivo es idéntico al previo.

**Entregables:**
- Pantalla de carga anónima y mensaje en línea.
- Workers de validación + generación de PDFs.
- Repositorio de recepción operativo (filesystem + registros en PostgreSQL).

**Plan de trabajo detallado – SPA Angular 19 (signals) con guía gob.mx v3**
- **Punto de partida:** Angular CLI 19.2.x ya instalado; `index.html` incluye los assets de la guía gráfica gob.mx v3 desde CDN; el backend GraphQL será construido por otro equipo.
- **¿Qué es SPA?** Una Single Page Application: el shell se renderiza una vez y las vistas cambian en el navegador (sin recargar toda la página) usando enrutamiento de Angular.
- **Pasos previstos:**
  1. Definir rutas iniciales (`/` carga anónima, `/login`, `/descargas`) y un layout base que use los estilos gob.mx ya cargados.
  2. Crear el componente de inicio/carga con signals para estado de archivo, progreso y mensajes ("Validando tu archivo...").
  3. Implementar servicios HTTP y de estado con signals que hoy regresen datos simulados/localStorage, respetando las firmas esperadas del futuro backend GraphQL para conmutar sin cambios cuando esté listo.
  4. Preparar componentes de autenticación y listado de descargas reutilizando la guía gráfica (tablas, alerts, botones) con datos de prueba.
  5. Validar accesibilidad y consistencia visual con la guía gráfica en navegación SPA (sin recargas completas) y documentar cómo activar la fuente de datos real cuando esté disponible.

## Iteración C2 – Portal de descargas y publicación de ligas

**Objetivos:**
- Implementar login (correo + contraseña generada) y módulo de descargas.
- Consumir ligas/archivos provistos por el sistema externo y listarlos por versión/consecutivo (iniciando con datos simulados en frontend; conmutar a GraphQL en cuanto el equipo de backend entregue operaciones).
- Ajustar monitoreo técnico (logs, espacio en disco, salud de workers).

**Entregables:**
- Portal de descargas autenticado.
- Integración con repositorio de resultados.
- Panel técnico básico.

**Criterios de Aceptación:**

- [ ] SEP Federal puede cargar archivos de resultados masivos (> 10,000 registros)
- [ ] Proceso de carga masiva se completa en < 2 horas para 50,000 escuelas
- [ ] Directores escolares solo ven resultados de su CCT (seguridad validada al 100%)
- [ ] Notificaciones automáticas se envían a directores cuando resultados están listos
- [ ] 95% de notificaciones se entregan exitosamente en < 5 minutos
- [ ] Pruebas de carga con 1,000 descargas simultáneas sin errores
- [ ] 0 defectos críticos pendientes en ambiente de pruebas
- [ ] Aprobación formal de SEP para paso a producción

---

## 4. Fase de Transición (Transition)

**Objetivos:**
- Despliegue en ambientes de prueba y producción bajo HTTPS.
- Capacitación breve a operadores y mesa de ayuda.
- Soporte intensivo durante la ventana de recepción/descarga y validación de carga pico (120,000 solicitudes).

**Entregables:**
- Manual de usuario (carga anónima y descargas autenticadas).
- Manual técnico (operación de workers y repositorios).
- Informe de cierre y lecciones aprendidas.
