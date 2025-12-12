# Documento de Visión
## Proyecto: Plataforma de Recepción, Validación y Descarga de Archivos (2ª aplicación EIA)
## Metodología: RUP – Fase de Inicio (Inception)

> **Estado:** Versión 2.0 alineada a `plataforma_recepcion_validacion_descarga_EIA.md`

---

# 1. Introducción

## 1.1 Propósito del documento
Definir objetivos, alcance, usuarios, funciones y restricciones de la plataforma web que **recibe, valida y publica descargas** para la segunda aplicación de los Ejercicios Integradores del Aprendizaje (EIA), sin procesar evaluaciones ni determinar si un envío es primera o segunda aplicación.

## 1.2 Alcance del sistema
El sistema realiza:

- **Recepción anónima** de archivos .xlsx con etiqueta “Validando tu archivo…” **solo para el primer envío por CCT/correo**.
- **Validación automática** con 10 verificaciones (CCT, correo, nivel, campos y columnas obligatorias, valores 0–3, estructura general, número/nombre de hojas, consistencia interna y **huella hash** para distinguir archivos con el mismo nombre).
- **Generación de credenciales** solo en la primera carga válida (usuario = CCT validado, contraseña = correo validado; no se regenera en cargas posteriores).
- **Emisión de PDFs** de confirmación (mensaje, fecha hoy + 4 días, usuario/contraseña, marca de tiempo) o de errores cuando aplica.
- **Registro de solicitudes**: cada carga válida es independiente con consecutivo; repositorio de archivos recibidos.
- **Publicación de ligas de descarga** entregadas por un sistema externo que procesa los archivos.

## 1.3 Definiciones, acrónimos y abreviaturas
- **EIA:** Ejercicios Integradores del Aprendizaje.
- **CCT:** Clave del Centro de Trabajo (usuario de acceso a descargas).
- **PDF de confirmación/errores:** comprobantes automáticos generados tras la validación.
- **Sistema externo:** proceso que genera resultados y deposita ligas de descarga.

## 1.4 Referencias
- Documento `plataforma_recepcion_validacion_descarga_EIA.md`.
- Lineamientos y plantillas oficiales de la segunda aplicación EIA.

---

# 2. Posicionamiento

## 2.1 Oportunidad de negocio
Sustituir el envío de archivos por correo en la segunda aplicación EIA por un flujo automatizado de recepción, validación y publicación de descargas, manteniendo trazabilidad y seguridad.

## 2.2 Problema a resolver
- Recepción manual y dispersa de archivos por correo.
- Falta de control sobre estructura y contenido de los archivos recibidos.
- Ausencia de credenciales centralizadas y comprobantes automáticos.
- Riesgo de mezclar envíos y no conocer el consecutivo de solicitudes.

## 2.3 Beneficios
- Automatización completa de la recepción y validación.
- Generación consistente de credenciales y comprobantes PDF.
- Separación de repositorios de recepción y resultados para evitar confusión.
- Publicación rápida de ligas de descarga generadas por el sistema externo.

## 2.4 Interesados clave
- Área responsable de la Evaluación Diagnóstica en la SEP.
- Directivos escolares (envían archivos, descargan resultados).
- Equipos técnicos (operación, soporte y validación).
- Equipo responsable del sistema externo de procesamiento.

---

# 3. Descripción del usuario

## 3.1 Perfiles de usuario

### Escuela (anónima)
- Sube archivo .xlsx sin iniciar sesión **solo en su primer envío**.
- Recibe PDF de confirmación/errores.

### Escuela autenticada
- Accede con usuario = CCT y contraseña = correo validado en la primera carga.
- Puede reenviar archivos cuando ya existan credenciales y consulta todas las versiones de resultados disponibles y sus ligas de descarga.

### Operador técnico SEP
- Monitorea validaciones, repositorios y generación de PDFs.

### Sistema externo de procesamiento
- Deposita resultados/ligas que serán mostradas por la plataforma.

---

# 4. Descripción general del sistema

## 4.1 Perspectiva del sistema
Aplicación web de tres capas con **Angular 19 (signals)**, **FastAPI (Python 3.12)** y **PostgreSQL + Filesystem**, apoyada por workers para validación y PDFs. No calcula resultados; solo publica ligas entregadas por el sistema externo. La SPA usa la **guía gráfica gob.mx v3** cargada vía CDN (estilos y scripts en `index.html`). Mientras el backend Python es implementado por otro equipo, el frontend entregará pantallas funcionales con servicios Angular que devuelven datos de prueba/localStorage pero mantienen las mismas firmas HTTP previstas para FastAPI, para que el cambio a los endpoints reales sea transparente.

## 4.2 Funciones principales (vista de negocio)
- Cargar archivo .xlsx sin autenticación **solo para el primer envío del CCT/correo**.
- Ejecutar 10 validaciones y mostrar estado “Validando tu archivo…” (incluye hash para detectar archivos idénticos).
- Generar PDF de confirmación o errores y descargarlo automáticamente.
- Crear credenciales en la primera carga válida y mantenerlas en cargas posteriores.
- Registrar cada solicitud con consecutivo y almacenar el archivo en repositorio de recepción.
- Permitir login (CCT + contraseña) para reenviar archivos cuando ya existan credenciales y consultar versiones y ligas de descarga depositadas externamente.

## 4.3 Suposiciones y dependencias
- Las plantillas .xlsx mantienen nombres de hojas y columnas esperadas.
- El sistema externo entrega resultados/ligas en el repositorio de resultados.
- Disponibilidad de infraestructura HTTPS y almacenamiento mínimo de 1 TB.
- El backend FastAPI será provisto por un equipo diferente; durante C1/C2 el frontend operará con datos simulados en localStorage y servicios Angular que replican las respuestas esperadas.

---

# 5. Requerimientos de alto nivel

## 5.1 Requerimientos funcionales (resumen)
- RF-01: Recepción anónima de archivo .xlsx con etiqueta de validación en línea **solo en el primer envío**; si ya existe credencial se exige login antes de reenviar.
- RF-02: Validación automática con 10 reglas (incluye hash) y rechazo con PDF de errores cuando falle.
- RF-03: Generación de credenciales solo en primera carga válida (usuario = CCT, contraseña = correo validado).
- RF-04: Emisión de PDF de confirmación con fecha de consulta (hoy + 4 días), usuario, contraseña y marca de tiempo.
- RF-05: Registro de solicitudes con consecutivo y almacenamiento de archivos válidos en repositorio de recepción.
- RF-06: Portal autenticado para listar versiones y ligas de descarga provenientes del sistema externo.
- RF-07: Repositorios separados para archivos recibidos y resultados.

## 5.2 Requerimientos no funcionales (resumen)
- Seguridad: HTTPS obligatorio, contraseñas con hashing, bitácoras de acceso y validación.
- Rendimiento: soportar **120,000 validaciones automáticas** (referencia a la primera aplicación por correo).
- Disponibilidad/almacenamiento: mínimo **1 TB** inicial, capacidad de expansión sin afectar servicio.
- Escalabilidad: separación frontend/API/workers para crecimiento horizontal; posibilidad de agregar nuevos niveles/estructuras.

---

# 6. Alcance

## 6.1 Lo que sí incluye
- Recepción y validación de archivos .xlsx de la segunda aplicación EIA.
- Generación de credenciales y PDFs automáticos.
- Registro de solicitudes y repositorios separados (recepción vs. resultados).
- Publicación de ligas de descarga procesadas externamente.

## 6.2 Lo que NO incluye
- Procesamiento o cálculo de resultados pedagógicos.
- Determinar si un envío pertenece a primera o segunda aplicación.
- Sustitución, comparación o fusión de archivos enviados previamente.

---

# 7. Riesgos de alto nivel
- Volumen alto de validaciones cercano al plazo límite (picos de carga).
- Archivos con estructuras alteradas o nombres de hojas fuera de plantilla.
- Dependencia del sistema externo para la disponibilidad de ligas de descarga.

---

# 8. Cronograma y etapas
- **Etapa 1:** Recepción anónima, validaciones, generación de credenciales y PDFs, registro de solicitudes y repositorio de recepción.
- **Etapa 2:** Portal autenticado de descarga y publicación de ligas provenientes del sistema externo; refinamientos de monitoreo técnico y escalabilidad.
