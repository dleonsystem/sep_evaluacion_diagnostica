# Especificación de APIs - Plataforma de Recepción y Validación de Evaluación Diagnóstica

**Versión:** 1.0  
**Fecha:** 12 de enero de 2026  
**Autor:** Equipo de Desarrollo SEP

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación y Autorización](#autenticación-y-autorización)
3. [APIs de Escuelas](#apis-de-escuelas)
4. [APIs de Usuarios](#apis-de-usuarios)
5. [APIs de Archivos FRV](#apis-de-archivos-frv)
6. [APIs de Reportes](#apis-de-reportes)
7. [APIs de Evaluaciones](#apis-de-evaluaciones)
8. [APIs de Tickets de Soporte](#apis-de-tickets-de-soporte)
9. [APIs de Catálogos](#apis-de-catálogos)
10. [Códigos de Respuesta](#códigos-de-respuesta)
11. [Modelos de Datos](#modelos-de-datos)

---

## Introducción

### Convenciones Generales

- **Base URL:** `https://evaluacion-diagnostica.sep.gob.mx/api/v1`
- **Autenticación:** Bearer Token (JWT)
- **Content-Type:** `application/json`
- **Charset:** UTF-8
- **Rate Limiting:** 100 requests/min por usuario, 1000 requests/min por entidad

### Headers Requeridos

```http
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}
```

---

## Autenticación y Autorización

### 1. POST /api/auth/login

**Descripción:** Autenticación de usuario y generación de tokens.

**Request:**

```json
{
  "email": "director.school245@edu.mx",
  "password": "SecurePass123!",
  "remember_me": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "director.school245@edu.mx",
      "nombre_completo": "Juan Pérez García",
      "rol": "DIRECTOR_ESCUELA",
      "entidad_id": "09",
      "escuela_id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  },
  "message": "Autenticación exitosa"
}
```

**Errores:**

- `401 Unauthorized`: Credenciales inválidas
- `423 Locked`: Cuenta bloqueada por intentos fallidos
- `403 Forbidden`: Cuenta inactiva

---

### 2. POST /api/auth/register

**Descripción:** Registro de nuevo usuario (solo ADMINISTRADOR).

**Permisos:** `ADMINISTRADOR`

**Request:**

```json
{
  "email": "nuevo.usuario@edu.mx",
  "nombre_completo": "María López Sánchez",
  "rol": "DIRECTOR_ESCUELA",
  "entidad_id": "09",
  "escuela_id": "550e8400-e29b-41d4-a716-446655440002",
  "telefono": "5512345678"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440010",
    "email": "nuevo.usuario@edu.mx",
    "password_temporal": "Temp2024!xY7",
    "expira_en": "2026-01-19T12:00:00Z"
  },
  "message": "Usuario creado. Credenciales temporales generadas y mostradas/descargadas en PDF."
}
```

---

### 3. POST /api/auth/refresh-token

**Descripción:** Renovación de access token usando refresh token.

**Request:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

---

### 4. POST /api/auth/logout

**Descripción:** Cerrar sesión y revocar tokens.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 5. POST /api/auth/forgot-password

**Descripción:** Solicitar restablecimiento de contraseña.

**Request:**

```json
{
  "email": "director.school245@edu.mx"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Solicitud de restablecimiento registrada. El token se muestra en la plataforma.",
  "expira_en": "2026-01-12T14:30:00Z"
}
```

---

### 6. POST /api/auth/reset-password

**Descripción:** Restablecer contraseña con token generado en la plataforma (sin envío de email).

**Request:**

```json
{
  "token": "abc123def456ghi789",
  "nueva_password": "NewSecurePass456!",
  "confirmar_password": "NewSecurePass456!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
```

---

### 7. POST /api/auth/change-password

**Descripción:** Cambiar contraseña (usuario autenticado).

**Request:**

```json
{
  "password_actual": "OldPassword123!",
  "password_nueva": "NewPassword456!",
  "confirmar_password": "NewPassword456!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

---

## APIs de Escuelas

### 8. GET /api/escuelas

**Descripción:** Listar escuelas con filtros y paginación.

**Permisos:** `ADMINISTRADOR`, `SUPERVISOR_ENTIDAD`

**Query Parameters:**

- `entidad_id` (opcional): Filtrar por entidad
- `nivel_educativo` (opcional): PREESCOLAR, PRIMARIA, SECUNDARIA
- `activo` (opcional): true/false
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `search` (opcional): Búsqueda por CCT o nombre

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "escuelas": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "cct": "09DPR1234A",
        "nombre": "Escuela Primaria Benito Juárez",
        "entidad_id": "09",
        "entidad_nombre": "Ciudad de México",
        "nivel_educativo": "PRIMARIA",
        "turno": "MATUTINO",
        "total_alumnos": 450,
        "activo": true,
        "created_at": "2024-08-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 125,
      "total_pages": 7
    }
  }
}
```

---

### 9. GET /api/escuelas/:id

**Descripción:** Obtener detalle de una escuela.

**Permisos:** `ADMINISTRADOR`, `SUPERVISOR_ENTIDAD`, `DIRECTOR_ESCUELA` (propia)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "cct": "09DPR1234A",
    "nombre": "Escuela Primaria Benito Juárez",
    "entidad": {
      "id": "09",
      "clave": "09",
      "nombre": "Ciudad de México"
    },
    "nivel_educativo": "PRIMARIA",
    "turno": "MATUTINO",
    "total_alumnos": 450,
    "direccion": "Av. Insurgentes 123, Col. Centro",
    "telefono": "5555551234",
    "email": "escuela.245@edu.mx",
    "activo": true,
    "estadisticas": {
      "total_archivos_subidos": 12,
      "total_evaluaciones": 1350,
      "ultimo_archivo": "2026-01-10T15:30:00Z"
    },
    "created_at": "2024-08-15T10:00:00Z",
    "updated_at": "2026-01-10T15:30:00Z"
  }
}
```

---

### 10. POST /api/escuelas

**Descripción:** Crear nueva escuela.

**Permisos:** `ADMINISTRADOR`

**Request:**

```json
{
  "cct": "09DPR5678B",
  "nombre": "Escuela Primaria Miguel Hidalgo",
  "entidad_id": "09",
  "nivel_educativo": "PRIMARIA",
  "turno": "VESPERTINO",
  "total_alumnos": 320,
  "direccion": "Calle Reforma 456, Col. Juárez",
  "telefono": "5555555678",
  "email": "escuela.hidalgo@edu.mx"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "cct": "09DPR5678B",
    "nombre": "Escuela Primaria Miguel Hidalgo"
  },
  "message": "Escuela creada exitosamente"
}
```

---

### 11. PUT /api/escuelas/:id

**Descripción:** Actualizar datos de escuela.

**Permisos:** `ADMINISTRADOR`, `DIRECTOR_ESCUELA` (propia, campos limitados)

**Request:**

```json
{
  "nombre": "Escuela Primaria Miguel Hidalgo y Costilla",
  "total_alumnos": 335,
  "telefono": "5555559999"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "updated_fields": ["nombre", "total_alumnos", "telefono"]
  },
  "message": "Escuela actualizada exitosamente"
}
```

---

### 12. DELETE /api/escuelas/:id

**Descripción:** Desactivar escuela (soft delete).

**Permisos:** `ADMINISTRADOR`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Escuela desactivada exitosamente"
}
```

---

## APIs de Usuarios

### 13. GET /api/usuarios

**Descripción:** Listar usuarios con filtros.

**Permisos:** `ADMINISTRADOR`, `SUPERVISOR_ENTIDAD`

**Query Parameters:**

- `entidad_id` (opcional)
- `rol` (opcional)
- `activo` (opcional)
- `page`, `per_page`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "email": "director.245@edu.mx",
        "nombre_completo": "Juan Pérez García",
        "rol": "DIRECTOR_ESCUELA",
        "entidad_nombre": "Ciudad de México",
        "escuela_cct": "09DPR1234A",
        "activo": true,
        "ultimo_acceso": "2026-01-12T08:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 48
    }
  }
}
```

---

### 14. GET /api/usuarios/:id

**Descripción:** Obtener detalle de usuario.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "email": "director.245@edu.mx",
    "nombre_completo": "Juan Pérez García",
    "rol": "DIRECTOR_ESCUELA",
    "entidad_id": "09",
    "escuela_id": "550e8400-e29b-41d4-a716-446655440001",
    "telefono": "5512345678",
    "activo": true,
    "password_temporal": false,
    "ultimo_acceso": "2026-01-12T08:30:00Z",
    "created_at": "2024-09-01T12:00:00Z"
  }
}
```

---

### 15. POST /api/usuarios

**Descripción:** Crear nuevo usuario (duplicado de `/api/auth/register`).

**Permisos:** `ADMINISTRADOR`

---

### 16. PUT /api/usuarios/:id

**Descripción:** Actualizar datos de usuario.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente"
}
```

---

### 17. DELETE /api/usuarios/:id

**Descripción:** Desactivar usuario.

**Permisos:** `ADMINISTRADOR`

---

### 18. PATCH /api/usuarios/:id/estado

**Descripción:** Cambiar estado de usuario (activar/desactivar/bloquear).

**Request:**

```json
{
  "accion": "BLOQUEAR",
  "motivo": "Múltiples intentos de acceso no autorizado"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Usuario bloqueado exitosamente"
}
```

---

## APIs de Archivos FRV

### 19. POST /api/frv/upload

**Descripción:** Subir archivo FRV (Formato de Registro de Valoración).

**Permisos:** `DIRECTOR_ESCUELA`, `DOCENTE`

**Request (multipart/form-data):**

```txt
file: [archivo.xlsx]
escuela_id: 550e8400-e29b-41d4-a716-446655440001
periodo_id: 550e8400-e29b-41d4-a716-446655440050
tipo_archivo: FRV_PRIMARIA
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "archivo_id": "550e8400-e29b-41d4-a716-446655440100",
    "estado": "PENDIENTE",
    "nombre_archivo": "FRV_09DPR1234A_2024_PRE3.xlsx",
    "tamano_bytes": 245678,
    "total_registros": 45,
    "hash_sha256": "abc123def456..."
  },
  "message": "Archivo recibido. En proceso de validación."
}
```

---

### 20. GET /api/frv

**Descripción:** Listar archivos FRV con filtros.

**Query Parameters:**

- `escuela_id`, `periodo_id`, `estado`, `page`, `per_page`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "archivos": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440100",
        "nombre_archivo": "FRV_09DPR1234A_2024_PRE3.xlsx",
        "escuela_cct": "09DPR1234A",
        "periodo_nombre": "Septiembre 2024-2025",
        "tipo_archivo": "FRV_PRIMARIA",
        "estado": "VALIDADO",
        "total_registros": 45,
        "registros_procesados": 45,
        "uploaded_en": "2026-01-10T15:30:00Z",
        "validado_en": "2026-01-10T15:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 12
    }
  }
}
```

---

### 21. GET /api/frv/:id

**Descripción:** Obtener detalle y estado de validación de archivo.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "nombre_archivo": "FRV_09DPR1234A_2024_PRE3.xlsx",
    "estado": "VALIDADO",
    "total_registros": 45,
    "registros_procesados": 45,
    "registros_rechazados": 0,
    "validaciones": {
      "estructura": "OK",
      "datos": "OK",
      "duplicados": "OK"
    },
    "errores": [],
    "uploaded_en": "2026-01-10T15:30:00Z",
    "validado_en": "2026-01-10T15:35:00Z"
  }
}
```

---

### 22. POST /api/frv/:id/validar

**Descripción:** Solicitar validación manual de archivo (re-validar).

**Response (202 Accepted):**

```json
{
  "success": true,
  "message": "Validación iniciada"
}
```

---

## APIs de Reportes

### 23. GET /api/reportes

**Descripción:** Listar reportes generados.

**Query Parameters:**

- `escuela_id`, `periodo_id`, `tipo_reporte`, `estado`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "reportes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440200",
        "tipo_reporte": "INDIVIDUAL_ESCUELA",
        "formato": "PDF",
        "estado": "DISPONIBLE",
        "escuela_cct": "09DPR1234A",
        "periodo_nombre": "Septiembre 2024-2025",
        "generado_en": "2026-01-11T10:00:00Z",
        "descargado_en": null,
        "expira_en": "2026-02-11T10:00:00Z"
      }
    ]
  }
}
```

---

### 24. POST /api/reportes/generar

**Descripción:** Solicitar generación de reporte.

**Request:**

```json
{
  "tipo_reporte": "INDIVIDUAL_ESCUELA",
  "formato": "PDF",
  "escuela_id": "550e8400-e29b-41d4-a716-446655440001",
  "periodo_id": "550e8400-e29b-41d4-a716-446655440050",
  "opciones": {
    "incluir_graficas": true,
    "nivel_detalle": "COMPLETO"
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "reporte_id": "550e8400-e29b-41d4-a716-446655440200",
    "estado": "PENDIENTE",
    "tiempo_estimado_segundos": 30
  },
  "message": "Reporte en cola de generación"
}
```

---

### 25. GET /api/reportes/:id

**Descripción:** Obtener detalle de reporte.

---

### 26. GET /api/reportes/:id/descargar

**Descripción:** Descargar archivo de reporte.

**Response (200 OK):**

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="Reporte_09DPR1234A_2024.pdf"

[Binary PDF content]
```

---

## APIs de Evaluaciones

### 27. GET /api/evaluaciones

**Descripción:** Obtener evaluaciones con filtros.

**Query Parameters:**

- `escuela_id`, `periodo_id`, `grado`, `nivel_educativo`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "evaluaciones": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440300",
        "escuela_cct": "09DPR1234A",
        "grado": 3,
        "nivel_educativo": "PRIMARIA",
        "materia": "MATEMATICAS",
        "valoracion": 2,
        "observaciones": "Requiere refuerzo en geometría",
        "created_at": "2026-01-10T16:00:00Z"
      }
    ],
    "estadisticas": {
      "total": 1350,
      "promedio": 2.1,
      "distribucion": {
        "critico": 120,
        "bajo": 450,
        "medio": 600,
        "destacado": 180
      }
    }
  }
}
```

---

## APIs de Tickets de Soporte

### 28. GET /api/tickets

**Descripción:** Listar tickets de soporte.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440400",
        "numero_ticket": "TKT-2026-001234",
        "asunto": "Error al subir archivo FRV",
        "categoria": "CARGA_ARCHIVOS",
        "prioridad": "ALTA",
        "estado": "ABIERTO",
        "creado_por": "director.245@edu.mx",
        "asignado_a": "soporte.tecnico@sep.gob.mx",
        "created_at": "2026-01-12T09:00:00Z"
      }
    ]
  }
}
```

---

### 29. POST /api/tickets

**Descripción:** Crear nuevo ticket de soporte.

**Request:**

```json
{
  "asunto": "Error al subir archivo FRV",
  "descripcion": "Al intentar subir el archivo aparece error de validación",
  "categoria": "CARGA_ARCHIVOS",
  "prioridad": "ALTA",
  "adjuntos": ["screenshot.png"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "ticket_id": "550e8400-e29b-41d4-a716-446655440400",
    "numero_ticket": "TKT-2026-001234"
  },
  "message": "Ticket creado. La respuesta se dará seguimiento en el portal."
}
```

---

### 30. POST /api/tickets/:id/comentarios

**Descripción:** Agregar comentario a ticket.

**Request:**

```json
{
  "comentario": "Adjunto capturas de pantalla del error"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Comentario agregado"
}
```

---

## APIs de Catálogos

### 31. GET /api/catalogos/entidades

**Descripción:** Obtener catálogo de entidades federativas.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "09",
      "clave": "09",
      "nombre": "Ciudad de México",
      "activo": true
    }
  ]
}
```

---

### 32. GET /api/catalogos/periodos

**Descripción:** Obtener catálogo de periodos de evaluación.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440050",
      "nombre": "Septiembre 2024-2025",
      "fecha_inicio": "2024-09-01",
      "fecha_fin": "2025-07-15",
      "activo": true
    }
  ]
}
```

---

## Códigos de Respuesta

| Código | Descripción |
| ------ | ----------- |
| 200 OK | Solicitud exitosa |
| 201 Created | Recurso creado exitosamente |
| 202 Accepted | Solicitud aceptada, procesamiento asíncrono |
| 400 Bad Request | Datos inválidos en la solicitud |
| 401 Unauthorized | No autenticado |
| 403 Forbidden | No autorizado (sin permisos) |
| 404 Not Found | Recurso no encontrado |
| 409 Conflict | Conflicto (ej: duplicado) |
| 422 Unprocessable Entity | Validación fallida |
| 423 Locked | Cuenta bloqueada |
| 429 Too Many Requests | Rate limit excedido |
| 500 Internal Server Error | Error del servidor |
| 503 Service Unavailable | Servicio temporalmente no disponible |

---

## Modelos de Datos

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [
      {
        "field": "email",
        "message": "Formato de email inválido"
      }
    ]
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440999"
}
```

---
