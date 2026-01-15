# REPORTE DE AVANCES Y MINUTA DE REUNION (RUP)

## Proyecto: Plataforma de Carga y Consulta de Resultados - Evaluacion Diagnostica 2025

## Documento: Minuta + Reporte de Avances (Cierre de alcance de analisis y diseno preliminar)

## Version: v0.2 (complementada con hallazgos del repositorio)

## Fecha: 09/01/2026

## Hora: [HH:MM - HH:MM] (Zona: America/Mexico_City)

## Modalidad: [Presencial / Virtual]

## Lugar / Enlace: [Sala / Link]

## Elabora: [Nombre / Area]

## Dirigido a: [Area usuaria / Direccion]

## Areas participantes: DGTIC / EGPIC / [Area usuaria] / [Otras]

---

## 0. Identificacion del proyecto en progreso (hallazgos del repositorio)

**Proyecto identificado:** Plataforma de Recepcion, Validacion y Descarga de Archivos EIA (2a aplicacion), tambien referida como Plataforma de Gestion de Valoraciones EIA 2025-2026.

**Descripcion funcional clave (convergente en la documentacion):**

- Recepcion de archivos .xlsx sin autenticacion previa para carga inicial.
- Validacion automatica de estructura y contenido (CCT, correo, nivel, hojas, columnas, rangos 0-3).
- Generacion de credenciales solo en la primera carga valida (usuario = CCT, contrasena = correo validado).
- Emision automatica de PDF de confirmacion o PDF de errores.
- Registro de cada envio como solicitud independiente con consecutivo.
- Publicacion de ligas de descarga generadas por un sistema externo (la plataforma no procesa resultados).

**Artefactos RUP existentes en el repositorio:**

- Vision: `web/doc/vision_document.md`
- SRS: `web/doc/srs.md`
- Arquitectura (SAD): `web/doc/arquitectura_software.md`
- Modelo de casos de uso: `web/doc/casos_uso.md`
- Plan de iteraciones: `web/doc/plan_iteraciones.md`
- Riesgos: `web/doc/riesgos.md`
- Especificacion funcional EIA 2a aplicacion: `plataforma_recepcion_validacion_descarga_EIA.md`

---

## 1. Objetivo de la reunion

Presentar y revisar el diseno preliminar de la solucion (arquitectura, modelo y flujo de datos, prototipo de pantallas e integracion) y reportar el cierre del alcance correspondiente a la fase de analisis y requerimientos, con el fin de solicitar validacion y autorizacion del area usuaria para continuar con el proceso de dictamen y siguientes fases.

---

## 2. Antecedentes

El proyecto fue solicitado formalmente mediante el oficio [No. de oficio / fecha].
A la fecha, el equipo tecnico reporta conclusion del analisis y requerimientos, asi como la elaboracion de un primer diseno (arquitectura, datos, flujo e interfaces), mismo que fue presentado en la sesion del 09/01/2026 para revision.

Adicionalmente, el repositorio documenta el proyecto en progreso como una plataforma web de recepcion, validacion y descarga de archivos EIA (2a aplicacion), con requerimientos y artefactos RUP ya generados en `web/doc`.

---

## 3. Asistentes

| Nombre | Cargo | Area | Correo | Firma/VoBo |
| ------ | ----- | ---- | ------ | ---------- |
| [ ]    | [ ]   | [ ]  | [ ]    | [ ]        |
| [ ]    | [ ]   | [ ]  | [ ]    | [ ]        |
| [ ]    | [ ]   | [ ]  | [ ]    | [ ]        |

---

## 4. Agenda

1. Cierre de alcance de analisis y requerimientos
2. Presentacion de arquitectura y diseno del sistema
3. Revision de modelo de datos y flujo de datos
4. Insumos requeridos para catalogos de carga inicial
5. Prototipo de pantallas y flujo de usuario (carga/consulta)
6. Integracion tecnica y mecanismos de carga (automatico/manual)
7. Acciones para validacion del area usuaria y emision de oficio
8. Ruta para dictamen de desarrollo y evaluacion de Llave MX en Fase 1

---

## 5. Resumen ejecutivo de avances (al 09/01/2026)

- Se reporta cierre del alcance de la fase de analisis y definicion de requerimientos.
- Se elaboro y presento un diseno preliminar del sistema, que incluye:
  - Arquitectura propuesta (alto nivel)
  - Modelo de datos
  - Flujo de datos (origen -> carga -> validacion -> consulta/administracion)
  - Prototipo de pantallas y flujo de usuario para carga y consulta
  - Lineamientos iniciales de integracion para recepcion y gestion de archivos
- Se identifica como modulo en progreso la plataforma EIA 2a aplicacion con requerimientos y artefactos RUP ya documentados.
- Se establece como siguiente hito obligatorio la revision, validacion, autorizacion y firma por el area usuaria del paquete de analisis y diseno.

---

## 6. Estado del proyecto segun RUP (baseline)

| Fase RUP | Estado | Evidencia / artefactos | Observaciones |
| --- | --- | --- | --- |
| Inception | Completada (borrador) | `web/doc/vision_document.md`, `plataforma_recepcion_validacion_descarga_EIA.md` | Vision y alcance definidos; requiere VoBo del area usuaria. |
| Elaboration | En cierre (preliminar) | `web/doc/srs.md`, `web/doc/arquitectura_software.md`, `web/doc/casos_uso.md`, `ESTRUCTURA_DE_DATOS.md`, `FLUJO_DE_DATOS_COMPLETO.md`, `FLUJO_DATOS_IMPLEMENTACION.md` | Falta validacion de catalogos y reglas de negocio. |
| Construction | Planeada | `web/doc/plan_iteraciones.md`, `DASHBOARD_VISUAL.md` | Inicio condicionado a dictamen y VoBo. |
| Transition | No iniciada | N/A | Se activa tras piloto y aceptacion de usuario. |

---

## 7. Vision, alcance y restricciones (RUP - Inception)

### 7.1 Vision

Reemplazar el envio de valoraciones y resultados por correo electronico con una plataforma web segura, trazable y escalable que centralice la recepcion, validacion y consulta de resultados de la Evaluacion Diagnostica.

### 7.2 Alcance (incluye)

- Recepcion de archivos EIA en formato .xlsx.
- Validacion automatica de estructura y contenido.
- Emision de PDFs de confirmacion o errores.
- Generacion de credenciales en primera carga valida.
- Registro de solicitudes y bitacora de actividades.
- Consulta y descarga de resultados publicados por un sistema externo.

### 7.3 Fuera de alcance (no incluye)

- Procesamiento interno de resultados pedagogicos.
- Determinar si un envio es primera o segunda aplicacion.
- Analitica avanzada dentro de la plataforma en esta fase.

### 7.4 Supuestos y dependencias

- Plantillas oficiales EIA/FRV proporcionadas por SEP.
- Sistema externo responsable del procesamiento y generacion de resultados.
- Infraestructura disponible para picos de carga (120,000 validaciones por ciclo).

### 7.5 Restricciones

- Cumplimiento LGPDP, HTTPS obligatorio y contrasenas con hashing.
- Almacenamiento minimo de 1 TB para repositorio de recepcion/resultados.
- Trazabilidad y logs de acceso por requerimientos de auditoria.

---

## 8. Stakeholders y roles clave

- Area usuaria (DGADAE / area responsable de evaluacion diagnostica).
- DGTIC / EGPIC (arquitectura, calidad, dictamen).
- Directores escolares (carga y consulta).
- Docentes (consulta por grupo, si aplica).
- Operadores SEP (validacion, seguimiento, soporte).
- Sistema externo de procesamiento de resultados.

---

## 9. Requerimientos clave (resumen)

### 9.1 Funcionales

- Recepcion y validacion automatica de archivos .xlsx.
- Generacion de credenciales en primera carga valida.
- Registro de solicitudes y control de consecutivos.
- Emision de PDF de confirmacion/errores.
- Portal de consulta y descarga de resultados.
- Bitacora y notificaciones por email.

### 9.2 No funcionales

- Seguridad: HTTPS, hashing de contrasenas, logs de acceso.
- Rendimiento: validacion en segundos, soporte a picos 120k solicitudes.
- Disponibilidad: ventana operativa extendida y continuidad en picos.
- Escalabilidad: crecimiento anual de escuelas y solicitudes.

---

## 10. Modelo de casos de uso (resumen)

- CU-01 Iniciar sesion (consulta/descarga).
- CU-02 Cargar archivo EIA (sin autenticacion previa para carga inicial).
- CU-03 Validar estructura y contenido.
- CU-04 Emitir PDF de confirmacion o errores.
- CU-05 Consultar y descargar resultados.
- CU-06 Gestionar usuarios y bitacora (admin).
- CU-16 Recepcion y validacion de archivos EIA (2a aplicacion).

---

## 11. Arquitectura preliminar (RUP - Elaboration)

### 11.1 Stack tecnologico alineado 2025

- Frontend: Angular 17 + TypeScript 5.
- Backend: Python 3.12 /  + FastAPI / Node GraphQL.
- Base de datos: PostgreSQL 16.
- Storage: Filesystem SSD.
- Validacion Excel: pandas + openpyxl.

**Nota:** Existen borradores en `web/doc` que listan Node.js/Angular 19; se requiere alinear documentacion al stack aprobado.

### 11.2 Componentes

- Portal web de carga y consulta.
- API REST para validacion y registro.
- Motor de validacion de archivos.
- Persistencia (PostgreSQL) y repositorio de archivos.
- Integracion con sistema externo de resultados.
- Notificaciones por email.

---

## 12. Modelo de datos (resumen)

Entidades y relaciones principales:

- ESCUELAS, USUARIOS, GRUPOS, ESTUDIANTES.
- ARCHIVOS_FRV (metadatos de carga y validacion).
- CREDENCIALES_EIA2 y SOLICITUDES_EIA2 (credenciales y consecutivos por envio).
- REPORTES_GENERADOS, LOG_ACTIVIDADES, NOTIFICACIONES_EMAIL.

Regla clave:

- CREDENCIALES_EIA2 se generan solo en la primera solicitud valida de un CCT.

---

## 13. Flujo de datos (resumen)

1. Implementacion inicial y creacion de base de datos.
2. Poblacion de catalogos y datos maestros.
3. Registro/creacion de usuarios y escuelas.
4. Carga de archivo .xlsx y validacion automatica.
5. Registro de solicitud y almacenamiento del archivo.
6. Procesamiento externo de resultados.
7. Publicacion de ligas de descarga en el portal.

Volumetria estimada:

- 230,000 escuelas.
- 120,000 validaciones por ciclo.
- 1 TB de almacenamiento anual estimado.

---

## 14. Prototipo de pantallas y UX

- Flujo de carga con validacion automatica y feedback inmediato.
- Flujo de consulta con listado de solicitudes y ligas de descarga.
- Panel tecnico para monitoreo basico de cargas y estatus.

---

## 15. Integraciones y dependencias

- Sistema externo para procesamiento y generacion de resultados.
- Sistema de correo para notificaciones y envio de credenciales.
- Repositorios separados para archivos recibidos y resultados.
- Evaluacion de integracion con Llave MX en Fase 1.

---

## 16. Temas tratados y acuerdos

### 16.1 Cierre de alcance (Analisis y Requerimientos)

- Se informo el cierre de la fase de levantamiento, analisis y consolidacion de requerimientos.
- Acuerdo: el paquete documental se somete a validacion formal del area usuaria.

### 16.2 Presentacion de arquitectura (diseno preliminar)

- Se presento la arquitectura de referencia del sistema y sus componentes.
- Acuerdo: validar la alineacion del stack tecnologico y dependencias con DGTIC.

### 16.3 Modelo de datos y flujo de datos

- Se presento modelo de datos propuesto y flujo de datos completo.
- Acuerdo: ajustar/confirmar catalogos y reglas de negocio antes de congelar el modelo.

### 16.4 Insumos requeridos para catalogos de carga inicial

- Pendiente recepcion de insumos oficiales del area usuaria (catalogos y parametros).

### 16.5 Prototipo de pantallas y flujo de usuario

- Se presento prototipo de carga y consulta.
- Acuerdo: incorporar observaciones del area usuaria y generar version para VoBo.

### 16.6 Integracion tecnica y mecanismos de carga (automatico / manual)

- Se revisaron modalidades de recepcion y control de cargas.
- Acuerdo: definir modalidad prioritaria para Fase 1 y documentar supuestos tecnicos.

---

## 17. Decisiones tomadas (si aplican)

1. Se considera cerrado el alcance de analisis y requerimientos, sujeto a validacion formal del area usuaria.
2. El paquete (requerimientos + diseno preliminar) se enviara para VoBo y firma.
3. Se iniciara ruta de solicitud de dictamen para desarrollo, considerando evaluacion de Llave MX en Fase 1.

---

## 18. Acciones y responsables (plan inmediato)

| ID | Accion | Responsable | Area | Fecha compromiso | Evidencia esperada |
| --- | --- | --- | --- | --- | --- |
| A1 | Consolidar observaciones de la reunion al paquete documental | [ ] | DGTIC/EGPIC | [dd/mm/aaaa] | Version v1.0 del paquete |
| A2 | Entregar insumos oficiales para catalogos de carga inicial | [ ] | Area usuaria | [dd/mm/aaaa] | Oficio/correo + archivos |
| A3 | Revisar y validar requerimientos + diseno preliminar | [ ] | Area usuaria | [dd/mm/aaaa] | VoBo y firma |
| A4 | Emitir oficio de respuesta con avances y documentacion para visto bueno | [ ] | EGPIC/DGTIC | [dd/mm/aaaa] | Oficio firmado + anexos |
| A5 | Iniciar solicitud de dictamen para desarrollo | [ ] | DGTIC/EGPIC | [dd/mm/aaaa] | Acuse de tramite |
| A6 | Evaluacion tecnica: viabilidad de integrar Llave MX en Fase 1 | [ ] | DGTIC | [dd/mm/aaaa] | Nota tecnica / recomendacion |
| A7 | Alinear artefactos RUP `web/doc` con stack aprobado | [ ] | DGTIC/EGPIC | [dd/mm/aaaa] | SRS/SAD actualizados |

---

## 19. Riesgos / temas abiertos

| Riesgo / Tema | Descripcion | Impacto | Mitigacion | Responsable |
| --- | --- | --- | --- | --- |
| Validacion tardia | Retraso en VoBo del area usuaria | Alto | Definir fecha limite y seguimiento formal | [ ] |
| Catalogos incompletos | Falta de insumos para carga inicial | Alto | Solicitud formal + checklist de catalogos | [ ] |
| Llave MX en Fase 1 | Requiere dictamen/viabilidad e impacto en cronograma | Medio/Alto | Evaluacion tecnica + decision ejecutiva | [ ] |
| Sobrecarga en picos | 120k validaciones en ventana corta | Alto | Pruebas de carga, escalamiento horizontal | [ ] |
| Estructuras alteradas | Archivos con columnas/hojas fuera de plantilla | Medio | Validaciones estrictas + mensajes de correccion | [ ] |
| Alineacion tecnologica | Documentos con stack discrepante | Medio | Actualizar SRS/SAD y acuerdos tecnicos | [ ] |

---

## 20. Proximos pasos (hitos)

1. Entregar paquete documental para revision del area usuaria (requerimientos + diseno preliminar).
2. Obtener VoBo y firma (validacion formal).
3. Emitir oficio de avances y entrega documental en respuesta al oficio de solicitud.
4. Iniciar solicitud de dictamen para desarrollo.
5. Definir decision sobre integracion de Llave MX en Fase 1.
6. Preparar plan de trabajo de fase siguiente (con base en dictamen).

---

## 21. Entregables presentados / artefactos RUP

- Vision: `web/doc/vision_document.md`
- SRS (requerimientos): `web/doc/srs.md` y `REQUERIMIENTOS_Y_CASOS_DE_USO.md`
- Arquitectura preliminar (SAD): `web/doc/arquitectura_software.md`
- Modelo de datos: `ESTRUCTURA_DE_DATOS.md`
- Flujo de datos: `FLUJO_DE_DATOS_COMPLETO.md` y `FLUJO_DATOS_IMPLEMENTACION.md`
- Prototipo de pantallas: `DASHBOARD_VISUAL.md` (referencia visual)
- Especificacion EIA 2a aplicacion: `plataforma_recepcion_validacion_descarga_EIA.md`
- Plan de iteraciones: `web/doc/plan_iteraciones.md`
- Riesgos: `web/doc/riesgos.md`

---

## 22. Anexos (referencias)

- Anexo 1: Arquitectura preliminar (PDF/imagen)
- Anexo 2: Modelo de datos (diagrama)
- Anexo 3: Flujo de datos (BPMN/diagrama)
- Anexo 4: Prototipo de pantallas (capturas)
- Anexo 5: Requerimientos (documento)
- Anexo 6: Nota tecnica de integracion (automatico/manual)

---

### Firma y VoBo

Elabora: _______________________  Fecha: ***/***/_____
Revisa (DGTIC/EGPIC): _______________________  Fecha: ***/***/_____
Valida/Autoriza (Area usuaria): _______________________  Fecha: ***/***/_____
