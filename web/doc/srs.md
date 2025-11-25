# Especificación de Requerimientos de Software (SRS)  
## Proyecto: Plataforma de Gestión de Valoraciones EIA 2025–2026

> **Metodología:** RUP – Fase de Elaboración (visión establecida en Inception)  
> **Versión:** 1.1 – Borrador (backend Node.js)

---

# 1. Introducción

## 1.1 Propósito
Este documento especifica de forma detallada los requerimientos funcionales y no funcionales del sistema, sirviendo como base para el diseño, implementación y pruebas.

## 1.2 Alcance
El sistema permitirá la gestión centralizada del ciclo de vida de los archivos de valoraciones y resultados EIA:

- Carga de valoraciones por escuela.
- Descarga de valoraciones por usuarios SEP.
- Carga de resultados por usuarios SEP.
- Descarga de resultados por escuelas.
- Registro de auditoría de actividades.

## 1.3 Público objetivo
- Equipo de desarrollo (backend y frontend).
- Analistas de negocio.
- Personal de pruebas (QA).
- Representantes funcionales de la SEP.

---

# 2. Descripción general

## 2.1 Perspectiva del producto
Sistema web centralizado, accesible mediante navegador, expuesto sobre HTTPS, compuesto por:

- Frontend SPA en Angular 19.
- API REST en Node.js (framework por definir, p. ej. Express o NestJS).
- Base de datos PostgreSQL.

## 2.2 Interfaces del sistema

### 2.2.1 Interfaces de usuario
- Pantalla de inicio de sesión.
- Panel de director escolar.
- Panel de usuario SEP.
- Panel de administrador.
- Pantallas de carga y descarga de archivos.
- Pantalla de bitácora.

### 2.2.2 Interfaces de hardware
- Servidor de aplicaciones (para Node.js).
- Servidor de base de datos (PostgreSQL).
- Almacenamiento de archivos (disco local o servicio de objetos).

### 2.2.3 Interfaces de software
- Sistema operativo del servidor.
- Librerías de manipulación de archivos Excel.
- Drivers de conexión a PostgreSQL para Node.js (p. ej. `pg`).

---

# 3. Actores y casos de uso

## 3.1 Actores

- **DirectorEscolar**: representante de una escuela, sube valoraciones y descarga resultados.
- **UsuarioSEP_Estatal**: descarga valoraciones de escuelas de su entidad.
- **UsuarioSEP_Federal**: descarga valoraciones de todo el país y carga resultados.
- **AdministradorSistema**: gestiona usuarios, catálogos y auditoría.
- **SistemaAutenticación** (interno): módulo de login/password dentro de la misma plataforma.

## 3.2 Lista de casos de uso (resumen)

- CU-01 Iniciar sesión.
- CU-02 Cargar archivo de valoraciones.
- CU-03 Validar estructura de archivo.
- CU-04 Mostrar advertencias de valoraciones incompletas.
- CU-05 Descargar archivos de valoraciones.
- CU-06 Cargar archivos de resultados.
- CU-07 Descargar resultados por escuela.
- CU-08 Consultar bitácora de actividades.
- CU-09 Gestionar usuarios.
- CU-10 Cerrar sesión.

---

# 4. Especificación de casos de uso

(Ver documento `casos_uso_detallados.md` para el detalle completo.)

---

# 5. Requerimientos de datos

## 5.1 Entidades principales
- Usuario
- Escuela
- Entidad federativa
- Ciclo escolar
- ArchivoValoraciones
- ArchivoResultados
- ResultadosPorEscuela
- BitacoraActividad

---

# 6. Requerimientos no funcionales (detalle)

## 6.1 Seguridad
- Cifrado de contraseñas en la base de datos.
- Sesiones o tokens con expiración configurable.
- Políticas de bloqueo tras múltiples intentos fallidos de login.
- Canales cifrados (HTTPS).

## 6.2 Performance
- Tiempo de respuesta menor a 3 segundos para operaciones estándar.
- Manejo de carga concurrente mediante configuración adecuada de Node.js (por ejemplo, clustering, balanceo de carga).

## 6.3 Disponibilidad
- El sistema debe estar disponible durante la ventana principal de recepción (ejemplo: 7:00 a 22:00, tiempo del centro) con un 99 % de disponibilidad.

## 6.4 Mantenibilidad
- Código modular y documentado.
- Separación clara entre capas (presentación, lógica de negocio, acceso a datos) en la organización del proyecto Node.js.

## 6.5 Escalabilidad
- Arquitectura que permita distribuir instancias del backend (Node.js) tras un balanceador de carga si aumenta la carga.
- Uso eficiente de la base de datos PostgreSQL mediante índices adecuados.

---

# 7. Criterios de aceptación

- El sistema debe permitir a cualquier director escolar, con credenciales válidas, subir al menos un archivo de valoraciones para su escuela.
- Los usuarios SEP deben poder descargar archivos de valoraciones filtrando por entidad y CCT.
- El sistema debe registrar en bitácora todos los inicios de sesión, cargas y descargas.
- El sistema debe permitir la carga de al menos un archivo de resultados y su posterior descarga por la escuela correspondiente.
