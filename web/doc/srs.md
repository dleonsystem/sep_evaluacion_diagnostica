# Especificación de Requerimientos de Software (SRS)
## Proyecto: Plataforma de Recepción, Validación y Descarga de Archivos EIA (2ª aplicación)

> **Metodología:** RUP – Fase de Elaboración
> **Versión:** 2.0 – Alineada al documento `plataforma_recepcion_validacion_descarga_EIA.md`

---

## 1. Introducción

### 1.1 Propósito

## 1.1 Propósito
Detallar los requerimientos funcionales y no funcionales de la plataforma encargada de **recibir archivos .xlsx sin autenticación previa**, validarlos automáticamente, generar credenciales en la **primera carga válida** y publicar las **ligas de descarga** de resultados que son procesados en un sistema externo. Si una escuela ya generó credenciales en una primera carga válida, los reenvíos posteriores **requieren autenticación previa** y, sin importar el nombre del archivo, se distinguen versiones por su **huella de contenido (hash)** para evitar confusiones entre archivos iguales y diferentes.

## 1.2 Alcance
La plataforma cubre únicamente el flujo de recepción–validación–descarga de la **segunda aplicación de los Ejercicios Integradores del Aprendizaje (EIA)**:

- Carga anónima de archivos .xlsx.
- Validación automática de estructura y contenido.
- Emisión de **PDF de confirmación** (válidos) o **PDF de errores** (inválidos).
- Generación de credenciales solo en la primera carga válida (usuario = CCT, contraseña = correo validado).
- Registro de cada carga válida como solicitud independiente con consecutivo.
- Exposición de ligas de descarga depositadas por un **sistema externo** que procesa los archivos.

### 1.3 Público objetivo

- Equipo de desarrollo (backend y frontend).
- Analistas funcionales SEP.
- Personal QA.
- Equipo de operación y soporte técnico.

---

## 2. Descripción general

### 2.1 Perspectiva del producto

## 2.1 Perspectiva del producto
Aplicación web de tres capas con **frontend Angular 19 (signals)**, **backend GraphQL** (carpeta `graphql-server`) y **almacenamiento PostgreSQL + Filesystem**. No realiza cálculos educativos; actúa como **pasarela de validación y distribución de archivos**. El backend GraphQL será implementado por otro equipo; el frontend entregará pantallas funcionales con servicios Angular que hoy responden con datos de prueba/localStorage, pero conservan las mismas firmas HTTP para conmutar a la API GraphQL sin reescritura. La lógica de negocio debe **bloquear reenvíos anónimos** si ya existe una credencial previa para el mismo CCT/correo, solicitar autenticación antes de permitir la nueva carga y **registrar la huella (hash) de cada archivo** para distinguir versiones aunque el nombre sea idéntico.

### 2.2 Interfaces del sistema

#### 2.2.1 Interfaces de usuario

### 2.2.1 Interfaces de usuario
- Pantalla de carga anónima de archivo.
- Mensaje de validación en línea con etiqueta “Validando tu archivo…”.
- Descarga automática de PDF (confirmación o errores).
- Pantalla protegida para consulta de ligas de descarga (login con CCT + correo validado).
- Panel técnico básico para monitoreo de solicitudes.
- Módulo de carga masiva con estado de validaciones y credenciales generadas.
- Vista de archivos guardados con búsqueda, descarga y gestión de resultados asociados.
- Panel de seguimiento de solicitudes y descargas con filtros por CCT/fecha.
- Mesa de ayuda para creación y consulta de tickets de soporte.
- Panel administrador para carga de resultados y gestión de tickets.
- Uso de la **guía gráfica gob.mx v3** incluida desde CDN en `index.html`, con scripts auxiliares (`jquery.min.js`, `gobmx.js`, `main.js`) ya cargados.

### 2.2.2 Interfaces de hardware
- Servidor de aplicaciones para GraphQL.
- Servidor de base de datos PostgreSQL.
- Almacenamiento de archivos en disco SSD (mínimo 1 TB para recepción/resultados).

### 2.2.3 Interfaces de software
- Librerías de manipulación de Excel (equivalentes en el stack del backend GraphQL).
- Conectores de base de datos para PostgreSQL en el runtime del servidor GraphQL.
- Integración de cola de trabajos (Redis o equivalente) para validaciones y generación de PDFs.
- CDN de la guía gráfica gob.mx v3 referenciada en `index.html` (hoja de estilos principal y scripts `gobmx.js`/`main.js`).

---

## 3. Actores y casos de uso

### 3.1 Actores

- **Escuela (anónima):** carga archivo .xlsx sin autenticarse cuando es su primer envío; recibe PDF de confirmación/errores.
- **Escuela autenticada:** usa CCT + contraseña (correo validado en primera carga) para reenviar archivos, cargar nuevas versiones (identificadas por hash) y descargar resultados publicados.
- **Sistema externo de procesamiento:** genera resultados y deposita ligas/archivos para publicación.
- **Operador técnico SEP:** supervisa logs y repositorios de archivos.
- **Administrador SEP:** carga resultados asociados a solicitudes validadas y gestiona tickets de soporte.

### 3.2 Lista de casos de uso (resumen)

- CU-01 Cargar archivo .xlsx sin login (primer envío).
- CU-02 Validar estructura y contenido (10 verificaciones, incluye hash de archivo).
- CU-03 Generar credenciales en primera carga válida.
- CU-04 Emitir PDF de confirmación o errores.
- CU-05 Registrar solicitud con consecutivo y repositorio de archivos válidos.
- CU-06 Detectar reenvío y requerir login.
- CU-07 Autenticarse para reenvío de archivos y descargas (CCT + correo validado).
- CU-08 Listar versiones y ligas de descarga provenientes del sistema externo.
- CU-09 Consultar archivos guardados con acciones de descarga/limpieza.
- CU-10 Seguimiento de solicitudes y descargas con filtros por CCT/fecha.
- CU-11 Crear ticket de soporte con evidencias.
- CU-12 Consultar historial de tickets y respuestas.
- CU-13 Administrar carga de resultados (panel administrador).
- CU-14 Gestionar tickets y respuestas (panel administrador).

---

# 4. Especificación de reglas de validación

La validación se ejecuta automáticamente tras seleccionar el archivo y mostrar la etiqueta **“Validando tu archivo…”**. Debe incluir las 10 verificaciones siguientes y, antes de procesar, verificar si ya existen credenciales para el **CCT/correo**; en ese caso se exige autenticación y no se permite reenvío anónimo:

1. **CCT** – formato válido.
2. **Correo** – estructura sintáctica válida.
3. **Nivel** – coherencia con estructura.
4. **Campos obligatorios por hoja** – no vacíos.
5. **Columnas obligatorias** – presentes y en orden esperado.
6. **Valores válidos (0–3)** en valoraciones.
7. **Estructura general del archivo** – formato .xlsx y disposición esperada.
8. **Número y nombre de hojas** – coinciden con el nivel.
9. **Consistencia interna** – datos alineados entre hojas.
10. **Huella de archivo (hash)** – se calcula sobre el binario completo para distinguir archivos distintos aunque tengan el mismo nombre; si el hash coincide con un envío previo del mismo CCT/correo se considera el mismo archivo y se notifica que ya fue recibido.

Si la estructura o los valores no cumplen, el archivo se **rechaza** y se entrega PDF de errores.

---

# 5. Requerimientos funcionales

- RF-01: Permitir carga de archivo .xlsx sin autenticación previa **solo cuando no existan credenciales previas para el mismo CCT/correo**.
- RF-02: Mostrar estado “Validando tu archivo…” mientras se procesa.
- RF-03: Ejecutar las **10 reglas de validación** descritas en la sección 4 (incluida la huella hash para evitar duplicados por nombre).
- RF-04: Si el archivo es válido, generar **PDF de confirmación** con mensaje, fecha futura de consulta (hoy + 4 días), usuario (CCT), contraseña (correo validado solo en primera carga) y marca de tiempo.
- RF-05: Si el archivo es inválido, generar **PDF de errores** con detalle de fallas.
- RF-06: Crear credenciales **solo en la primera carga válida** (usuario = CCT, contraseña = correo validado) y reutilizarlas en cargas posteriores.
- RF-07: Bloquear reenvíos anónimos cuando ya existan credenciales para el CCT/correo y exigir login previo para permitir la nueva carga.
- RF-08: Registrar cada carga válida como **solicitud independiente** con consecutivo, guardar el archivo en repositorio de recepción y **asociar su hash** para diferenciar envíos con nombres repetidos.
- RF-09: Habilitar autenticación (CCT + contraseña) para reenviar archivos y consultar las ligas de descarga.
- RF-10: Mostrar **todas las versiones** de resultados que el sistema externo haya depositado, con consecutivo y liga.
- RF-11: Mantener repositorios separados para archivos recibidos y resultados publicados.
- RF-12: Implementar servicios frontend tipificados hacia GraphQL que, mientras no exista backend disponible, devuelvan datos simulados/localStorage usando el mismo contrato esperado de las operaciones.
- RF-13: Permitir consultar archivos guardados localmente, con búsqueda por nombre/CCT, descarga, eliminación y vista de resultados asociados.
- RF-14: Presentar seguimiento de solicitudes y descargas con filtros por CCT/fecha y panel de estado.
- RF-15: Habilitar creación de tickets de soporte con motivo, descripción y evidencias adjuntas.
- RF-16: Mostrar historial de tickets con estatus y respuestas del administrador.
- RF-17: Permitir a administradores seleccionar solicitudes validadas, filtrar por estatus/fecha y subir archivos de resultados asociados.
- RF-18: Permitir a administradores gestionar tickets (filtrar, actualizar estatus y registrar respuestas).

---

# 6. Requerimientos no funcionales

## 6.1 Seguridad
- Tráfico externo obligado sobre **HTTPS**.
- Contraseñas almacenadas con **hashing** seguro.
- Bitácora de accesos y validaciones.

## 6.2 Rendimiento
- Capacidad para procesar **120,000 solicitudes de validación** (equivalente a la primera aplicación por correo).
- Validaciones automáticas sin bloqueo prolongado de la interfaz.

## 6.3 Disponibilidad y almacenamiento
- Repositorios separados para recepción y resultados.
- Capacidad mínima de **1 TB** para recepción/resultados y posibilidad de expansión sin afectar servicio.

## 6.4 Escalabilidad y mantenibilidad
- Capacidad de agregar nuevos niveles o estructuras sin rediseñar el sistema.
- Arquitectura desacoplada (frontend, API y workers de validación/PDF) para escalar horizontalmente.
- Capa de servicios frontend conmutables (modo simulado vs. API GraphQL) documentada para minimizar retrabajo cuando el backend quede disponible.

---

## 7. Criterios de aceptación

- Cualquier escuela puede subir un archivo .xlsx y recibir PDF de confirmación o errores sin iniciar sesión **solo si es su primer envío (no existen credenciales previas para su CCT/correo)**.
- Las 10 reglas de validación se ejecutan y rechazan archivos que no cumplan estructura/valores o que sean idénticos a un envío previo (mismo hash para el mismo CCT/correo).
- La primera carga válida genera credenciales (usuario = CCT, contraseña = correo validado) y las mantiene para descargas futuras y reenvíos autenticados.
- Cada carga válida queda registrada como solicitud independiente con consecutivo y archivo almacenado.
- Los reenvíos requieren autenticación cuando ya existen credenciales, y las ligas de descarga provienen del sistema externo y se listan con su versión/consecutivo al autenticarse.
