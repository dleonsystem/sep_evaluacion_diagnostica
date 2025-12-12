# Especificación de Requerimientos de Software (SRS)
## Proyecto: Plataforma de Recepción, Validación y Descarga de Archivos EIA (2ª aplicación)

> **Metodología:** RUP – Fase de Elaboración
> **Versión:** 2.0 – Alineada al documento `plataforma_recepcion_validacion_descarga_EIA.md`

---

# 1. Introducción

## 1.1 Propósito
Detallar los requerimientos funcionales y no funcionales de la plataforma encargada de **recibir archivos .xlsx sin autenticación previa**, validarlos automáticamente, generar credenciales en la **primera carga válida** y publicar las **ligas de descarga** de resultados que son procesados en un sistema externo.

## 1.2 Alcance
La plataforma cubre únicamente el flujo de recepción–validación–descarga de la **segunda aplicación de los Ejercicios Integradores del Aprendizaje (EIA)**:

- Carga anónima de archivos .xlsx.
- Validación automática de estructura y contenido.
- Emisión de **PDF de confirmación** (válidos) o **PDF de errores** (inválidos).
- Generación de credenciales solo en la primera carga válida (usuario = CCT, contraseña = correo validado).
- Registro de cada carga válida como solicitud independiente con consecutivo.
- Exposición de ligas de descarga depositadas por un **sistema externo** que procesa los archivos.

## 1.3 Público objetivo
- Equipo de desarrollo (backend y frontend).
- Analistas funcionales SEP.
- Personal QA.
- Equipo de operación y soporte técnico.

---

# 2. Descripción general

## 2.1 Perspectiva del producto
Aplicación web de tres capas con **frontend Angular 17**, **backend FastAPI en Python 3.12** y **almacenamiento PostgreSQL + Filesystem**. No realiza cálculos educativos; actúa como **pasarela de validación y distribución de archivos**.

## 2.2 Interfaces del sistema

### 2.2.1 Interfaces de usuario
- Pantalla de carga anónima de archivo.
- Mensaje de validación en línea con etiqueta “Validando tu archivo…”.
- Descarga automática de PDF (confirmación o errores).
- Pantalla protegida para consulta de ligas de descarga (login con CCT + correo validado).
- Panel técnico básico para monitoreo de solicitudes.

### 2.2.2 Interfaces de hardware
- Servidor de aplicaciones para FastAPI.
- Servidor de base de datos PostgreSQL.
- Almacenamiento de archivos en disco SSD (mínimo 1 TB para recepción/resultados).

### 2.2.3 Interfaces de software
- Librerías de manipulación de Excel (pandas + openpyxl o equivalente en el stack Python).
- Conectores de base de datos para PostgreSQL.
- Integración de cola de trabajos (Redis/RQ o Celery) para validaciones y generación de PDFs.

---

# 3. Actores y casos de uso

## 3.1 Actores

- **Escuela (anónima):** carga archivo .xlsx sin autenticarse, recibe PDF de confirmación/errores.
- **Escuela autenticada:** usa CCT + contraseña (correo validado en primera carga) para descargar resultados publicados.
- **Sistema externo de procesamiento:** genera resultados y deposita ligas/archivos para publicación.
- **Operador técnico SEP:** supervisa logs y repositorios de archivos.

## 3.2 Lista de casos de uso (resumen)

- CU-01 Cargar archivo .xlsx sin login.
- CU-02 Validar estructura y contenido (9 verificaciones).
- CU-03 Generar credenciales en primera carga válida.
- CU-04 Emitir PDF de confirmación o errores.
- CU-05 Registrar solicitud con consecutivo y repositorio de archivos válidos.
- CU-06 Autenticarse para consultar descargas (CCT + correo validado).
- CU-07 Listar versiones y ligas de descarga provenientes del sistema externo.

---

# 4. Especificación de reglas de validación

La validación se ejecuta automáticamente tras seleccionar el archivo y mostrar la etiqueta **“Validando tu archivo…”**. Debe incluir las 9 verificaciones siguientes:

1. **CCT** – formato válido.
2. **Correo** – estructura sintáctica válida.
3. **Nivel** – coherencia con estructura.
4. **Campos obligatorios por hoja** – no vacíos.
5. **Columnas obligatorias** – presentes y en orden esperado.
6. **Valores válidos (0–3)** en valoraciones.
7. **Estructura general del archivo** – formato .xlsx y disposición esperada.
8. **Número y nombre de hojas** – coinciden con el nivel.
9. **Consistencia interna** – datos alineados entre hojas.

Si la estructura o los valores no cumplen, el archivo se **rechaza** y se entrega PDF de errores.

---

# 5. Requerimientos funcionales

- RF-01: Permitir carga de archivo .xlsx sin autenticación previa.
- RF-02: Mostrar estado “Validando tu archivo…” mientras se procesa.
- RF-03: Ejecutar las **9 reglas de validación** descritas en la sección 4.
- RF-04: Si el archivo es válido, generar **PDF de confirmación** con mensaje, fecha futura de consulta (hoy + 4 días), usuario (CCT), contraseña (correo validado solo en primera carga) y marca de tiempo.
- RF-05: Si el archivo es inválido, generar **PDF de errores** con detalle de fallas.
- RF-06: Crear credenciales **solo en la primera carga válida** (usuario = CCT, contraseña = correo validado) y reutilizarlas en cargas posteriores.
- RF-07: Registrar cada carga válida como **solicitud independiente** con consecutivo y guardar el archivo en repositorio de recepción.
- RF-08: Habilitar autenticación (CCT + contraseña) para consultar las ligas de descarga.
- RF-09: Mostrar **todas las versiones** de resultados que el sistema externo haya depositado, con consecutivo y liga.
- RF-10: Mantener repositorios separados para archivos recibidos y resultados publicados.

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

---

# 7. Criterios de aceptación

- Cualquier escuela puede subir un archivo .xlsx y recibir PDF de confirmación o errores sin iniciar sesión.
- Las 9 reglas de validación se ejecutan y rechazan archivos que no cumplan estructura/valores.
- La primera carga válida genera credenciales (usuario = CCT, contraseña = correo validado) y las mantiene para descargas futuras.
- Cada carga válida queda registrada como solicitud independiente con consecutivo y archivo almacenado.
- Las ligas de descarga provienen del sistema externo y se listan con su versión/consecutivo al autenticarse.
