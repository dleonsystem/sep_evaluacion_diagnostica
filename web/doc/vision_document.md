# Documento de Visión  
## Proyecto: Plataforma de Gestión de Valoraciones EIA 2025–2026  
## Metodología: RUP – Fase de Inicio (Inception)

> **Estado:** Versión 1.1 – Borrador actualizado (backend Node.js)

---

# 1. Introducción

## 1.1 Propósito del documento
Este Documento de Visión define los objetivos, alcance, usuarios, funciones principales y restricciones del sistema que sustituirá el envío de archivos Excel de valoraciones de los Ejercicios Integradores del Aprendizaje (EIA) por correo electrónico, mediante una plataforma web segura, trazable y escalable para la SEP, directivos escolares y personal autorizado.

## 1.2 Alcance del sistema
El sistema permitirá, en su primera etapa:

- Reemplazar el envío de archivos de valoraciones por correo electrónico.
- Cargar archivos de valoraciones EIA en formato Excel (.xlsx, .xls).
- Validar estructura básica y campos obligatorios clave.
- Registrar actividades realizadas por todos los usuarios.
- Permitir la descarga de los archivos de valoraciones por parte del personal SEP.
- Autenticar a todos los usuarios mediante usuario y contraseña.

En la segunda etapa el sistema también permitirá:

- Cargar resultados procesados por los equipos de la SEP.
- Poner a disposición de cada director escolar los reportes/resultados correspondientes a su escuela para descarga.

## 1.3 Definiciones, acrónimos y abreviaturas
- **EIA:** Ejercicios Integradores del Aprendizaje.
- **Valoraciones:** Datos capturados por docentes y directivos en los formatos oficiales de Excel.
- **CCT:** Clave del Centro de Trabajo.
- **SEP:** Secretaría de Educación Pública.
- **Usuario SEP:** Personal autorizado (federal o estatal) para descargar valoraciones y cargar resultados.
- **Director escolar:** Usuario responsable de la escuela que sube valoraciones y descarga resultados.
- **RUP:** Rational Unified Process.

## 1.4 Referencias
- Lineamientos oficiales EIA 2025–2026.
- Carta Informativa, Guías de Aplicación, Guía de Directivos y Guía para el Uso de los Reportes.
- Requerimientos funcionales y no funcionales definidos con el área solicitante.

---

# 2. Posicionamiento

## 2.1 Oportunidad de negocio
Actualmente el proceso de recepción de valoraciones se realiza a través de correo electrónico. Esta práctica:

- Es altamente manual.
- No escala para decenas de miles de escuelas.
- Es vulnerable a pérdida, duplicación o corrupción de archivos.
- No ofrece trazabilidad ni bitácora confiable de lo realizado.

La plataforma propuesta ofrece un canal único, controlado y auditable para la recepción, descarga y distribución de valoraciones y resultados.

## 2.2 Problema a resolver
- Falta de control sobre la recepción de archivos.
- Imposibilidad de conocer en tiempo real qué escuelas han enviado información.
- Dificultad para localizar archivos específicos (por CCT, entidad, turno, etc.).
- Ausencia de bitácora de actividades.
- Alto riesgo operativo al depender de correo electrónico para un proceso masivo.

## 2.3 Beneficios
- Mayor control y trazabilidad de los archivos y actividades.
- Reducción del riesgo de pérdida o mezcla de información.
- Mejor tiempo de respuesta para la generación y entrega de resultados.
- Soporte a la toma de decisiones a partir de datos más completos y confiables.

## 2.4 Interesados clave
- Área responsable de la Evaluación Diagnóstica en la SEP.
- Autoridades educativas estatales.
- Directivos escolares de educación básica.
- Equipos técnicos responsables del desarrollo y operación de la plataforma.

---

# 3. Descripción del usuario

## 3.1 Perfiles de usuario

### Director escolar
- Sube el archivo Excel de valoraciones de su escuela.
- Recibe advertencias de validación básica.
- Descarga los resultados de su escuela una vez que la SEP los cargue.
- Consulta el historial de envíos de su escuela.

### Usuario SEP Estatal
- Consulta y descarga archivos de valoraciones correspondientes a escuelas de su entidad.
- Consulta indicadores básicos de avance (porcentaje de escuelas que han enviado archivo).
- Descarga resultados cargados por SEP cuando estén disponibles.

### Usuario SEP Federal
- Consulta y descarga archivos de valoraciones a nivel nacional.
- Carga archivos de resultados procesados.
- Supervisa avance y estados de recepción.

### Administrador del sistema
- Gestiona altas, bajas y cambios de usuarios.
- Define parámetros generales del sistema.
- Consulta la bitácora de auditoría completa.
- Gestiona catálogos (entidades, niveles, etc.) en caso necesario.

---

# 4. Descripción general del sistema

## 4.1 Perspectiva del sistema
El sistema se concibe como una aplicación web de tres capas:

- **Capa de presentación:** Aplicación Angular 19.
- **Capa de lógica de negocio:** API en Node.js (framework por definir, p. ej. Express o NestJS).
- **Capa de datos:** Base de datos PostgreSQL y almacenamiento de archivos.

Se integra con el ecosistema existente mediante exportación de archivos para procesamiento por parte de los equipos de resultados.

## 4.2 Funciones principales (vista de negocio)
- Registro e inicio de sesión de usuarios.
- Carga de archivos Excel de valoraciones por escuela.
- Validación de estructura básica del archivo y campos obligatorios.
- Notificación de inconsistencias de captura (sin impedir la carga).
- Gestión de intentos de carga de archivos con extensión incorrecta.
- Descarga de archivos de valoraciones por parte de usuarios SEP.
- Carga y descarga de archivos de resultados.
- Bitácora de actividades.

## 4.3 Suposiciones y dependencias
- Cada escuela cuenta con al menos un usuario director con acceso a internet.
- La SEP proporcionará plantillas de Excel con estructura estándar.
- El proceso de cálculo de resultados se realiza fuera del sistema (procesos internos SEP).
- La plataforma contará con infraestructura adecuada para soportar el volumen esperado.

---

# 5. Requerimientos de alto nivel

## 5.1 Requerimientos funcionales (resumen)
- RF-01: Autenticación mediante usuario y contraseña.
- RF-02: Carga de archivos Excel de valoraciones.
- RF-03: Validación de formato de archivo (Excel) con hasta tres advertencias antes de aceptar otro tipo de archivo.
- RF-04: Validación de columnas y campos obligatorios (CCT, TURNO, NOMBRE DE LA ESCUELA, CORREO).
- RF-05: Advertencia sobre valoraciones incompletas (alumnos sin alguna valoración registrada).
- RF-06: Descarga de archivos de valoraciones por usuarios SEP.
- RF-07: Carga de archivos de resultados procesados por SEP.
- RF-08: Descarga de resultados por directores escolares.
- RF-09: Registro de actividades (inicio de sesión, cargas, descargas, cambios).
- RF-10: Consulta de bitácora por parte de administradores.

## 5.2 Requerimientos no funcionales (resumen)
- Seguridad: contraseñas cifradas, control de acceso por rol, auditoría.
- Rendimiento: capacidad para miles de escuelas concurrentes en periodos pico.
- Usabilidad: interfaz simple, mensajes claros, flujo guiado.
- Disponibilidad: alta disponibilidad durante la ventana de recepción y entrega de resultados.
- Escalabilidad: posibilidad de incorporar más ciclos escolares y otros instrumentos en el futuro.

---

# 6. Alcance

## 6.1 Lo que sí incluye
- Sustitución del canal de correo electrónico para el envío y recepción de valoraciones.
- Validaciones mínimas y advertencias sobre calidad de datos.
- Gestión de resultados a nivel de archivo.
- Trazabilidad de actividades.

## 6.2 Lo que NO incluye
- Cálculo o interpretación de resultados pedagógicos.
- Integración directa con otros sistemas académicos o administrativos.
- Funcionalidades de análisis estadístico avanzado dentro de la propia plataforma.

---

# 7. Riesgos de alto nivel
- Usuarios que siguen intentando usar el correo electrónico en lugar de la plataforma.
- Carga simultánea muy alta en los últimos días de la ventana de recepción.
- Archivos con estructuras inesperadas o modificadas.
- Resistencia al cambio por parte de algunos usuarios finales.

---

# 8. Cronograma y etapas
- **Etapa 1:** Módulos de autenticación, carga de valoraciones, descarga por SEP y auditoría.
- **Etapa 2:** Módulos de carga de resultados, descarga de resultados por escuelas y mejoras a la experiencia de usuario.
