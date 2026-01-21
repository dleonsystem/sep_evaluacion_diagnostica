# Documento de Arquitectura de Software (SAD)
## Plataforma de Recepción, Validación y Descarga de Archivos EIA

---

## 1. Introducción

Describe la arquitectura de alto nivel para la plataforma que **recibe archivos .xlsx sin autenticación previa** (solo en el primer envío), los valida automáticamente, genera credenciales en la primera carga válida y publica ligas de descarga generadas por un sistema externo. Si ya existen credenciales para el CCT/correo, los **reenvíos requieren autenticación previa**.

---

## 2. Visión arquitectónica

Arquitectura web de tres capas y procesos desacoplados:

1. **Capa de presentación:** SPA en **Angular 19 (signals)** para carga anónima, descarga de PDFs y portal autenticado de descargas, usando la guía gráfica gob.mx v3 cargada desde CDN. Mientras el backend GraphQL es desarrollado por otro equipo, el frontend operará con servicios simulados y datos de prueba almacenados en memoria/localStorage, manteniendo las mismas interfaces para conmutar a la API real sin cambios.
2. **Capa de lógica de negocio:** API **GraphQL** para orquestar validaciones, generación de credenciales y publicación de ligas (implementada por un equipo distinto).
3. **Capa de datos y archivos:** **PostgreSQL** para solicitudes/credenciales y **filesystem SSD** para repositorios separados de recepción y resultados.
4. **Procesamiento asíncrono:** Workers (Redis o cola equivalente) para validaciones y armado de PDFs.

---

## 3. Vista lógica

### 3.1 Componentes principales

- **Módulo de Recepción Anónima (primer envío)**
  - Carga de archivo .xlsx sin login cuando no existan credenciales previas para el CCT/correo.
  - Mensaje “Validando tu archivo…”.
  - Verificación previa de duplicidad (si ya existen credenciales se bloquea el envío anónimo y la detección de archivo repetido usa hash, no el nombre).
- **Módulo de Reenvío Autenticado**
  - Solicita login cuando el CCT/correo ya registró una primera carga válida.
  - Permite subir nuevos archivos tras autenticarse.
- **Motor de Validación**
  - 10 verificaciones (CCT, correo, nivel, campos/columnas obligatorias, valores 0–3, estructura general, número/nombre de hojas, consistencia interna y **hash de contenido** para diferenciar archivos con el mismo nombre).
  - Rechazo inmediato con PDF de errores cuando falle; si el hash coincide con un envío previo del mismo CCT/correo se notifica que el archivo ya fue recibido.
- **Generador de Credenciales y PDFs**
  - Credenciales solo en primera carga válida (usuario = CCT, contraseña = correo validado).
  - PDFs de confirmación con fecha de consulta (hoy + 4 días) o PDFs de errores.
- **Registro de Solicitudes**
  - Consecutivo por carga válida.
  - Almacenamiento del archivo validado en repositorio de recepción.
- **Módulo de Descargas Autenticadas**
  - Login con CCT + contraseña generada en primera carga válida.
  - Listado de versiones de resultados (consecutivo + liga) depositados por el sistema externo.
  - Reutiliza la autenticación para permitir reenvío de archivos cuando ya existan credenciales.
- **Servicios de integración frontend**
  - Interfaces Angular tipificadas hacia GraphQL para carga, login y descargas.
  - Mientras no exista backend disponible, devuelven datos simulados/localStorage con la misma forma de respuesta que las futuras operaciones.
- **Panel técnico**
  - Monitoreo de logs, espacio en disco y estado de workers.

---

## 4. Vista de despliegue (Mermaid)

```mermaid
flowchart LR
    U[Escuela
    Carga anónima] --> B[Browser
    Angular 19]
    D[Escuela autenticada
    Descargas] --> B

    B --> API[API GraphQL]
    API --> W[Workers
    Validación/PDF]
    API --> DB[(PostgreSQL
    Solicitudes/Credenciales)]
    API --> FS1[(Repo recepción
    Archivos válidos)]
    API --> FS2[(Repo resultados
    Ligas/ZIP externos)]
```

---

## 5. Decisiones tecnológicas clave

- **Frontend:** Angular 19 + TypeScript (signals) con Angular CLI 19.2.x sobre Node 22.x y estilos base gob.mx v3 incluidos vía CDN en `index.html`. Los servicios Angular expondrán interfaces tipificadas; mientras no exista backend disponible, responderán con datos simulados/localStorage pero sin romper la forma de las operaciones.
- **Backend:** GraphQL (carpeta `graphql-server`) desarrollado por un equipo distinto; la integración del frontend será transparente gracias a la capa de servicios simulados.
- **Workers:** Redis o cola equivalente para validación y generación de PDFs.
- **Persistencia:** PostgreSQL (datos) + Filesystem SSD (archivos válidos y resultados).
- **Generación de PDF:** Librería equivalente en el stack del backend GraphQL.
- **Validación de Excel:** Librería equivalente en el stack del backend GraphQL.
- **Protocolos:** HTTPS obligatorio.

---

## 6. Consideraciones de seguridad

- Hashing de contraseñas generadas (no se almacenan en texto plano).
- Repositorios de archivos con controles de acceso segregados (recepción vs. resultados).
- Bitácora de accesos y operaciones de validación/descarga.
- Certificados TLS para todo el tráfico externo.

---

# 7. Escalabilidad y disponibilidad

- Workers horizontales para paralelizar validaciones y PDFs.
- Posibilidad de crecer almacenamiento sin interrumpir servicio (mínimo 1 TB inicial).
- Separación de repositorios evita contención entre cargas y descargas.
- Balanceo de carga sobre GraphQL si incrementa el volumen (objetivo: 120,000 validaciones).
