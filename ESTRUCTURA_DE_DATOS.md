# Documento de Estructura de Datos

## 1. Diagrama Entidad-Relación (ER)

A continuación se presenta el diagrama entidad-relación inferido del sistema, basado en los esquemas y modelos encontrados en la documentación:


```mermaid
erDiagram
    ESCUELAS ||--o{ USUARIOS : tiene
    ESCUELAS ||--o{ GRUPOS : agrupa
    GRUPOS ||--o{ ESTUDIANTES : contiene
    ESTUDIANTES ||--o{ VALORACIONES : recibe
    VALORACIONES }o--|| MATERIAS : evalua
    VALORACIONES }o--|| PERIODOS_EVALUACION : en
    USUARIOS ||--o{ VALORACIONES : registra
    EVALUACIONES ||--|| VALORACIONES : referencia
```

---

### Descripción de entidades principales:

 **COMPETENCIAS**: Competencias evaluadas por materia.
 **RESULTADOS_COMPETENCIAS**: Logros por competencia en cada evaluación.
 **LOG_ACTIVIDADES**: Bitácora de actividades y auditoría.
 **CAT_GRADOS**: Catálogo de grados escolares.

---

## 2. Diccionario de Datos

### ESCUELAS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| cct             | VARCHAR(10)  | Clave Centro Trabajo              |
| nombre          | VARCHAR(150) | Nombre de la escuela              |
| estado          | VARCHAR(50)  | Estado                            |
| cp              | VARCHAR(10)  | Código postal                     |
| telefono        | VARCHAR(15)  | Teléfono                          |
| email           | VARCHAR(100) | Correo electrónico                |
| director        | VARCHAR(150) | Nombre del director               |
| fecha_registro  | DATETIME     | Fecha de registro                 |
| estatus         | CHAR(1)      | Estado (A=Activo, I=Inactivo)     |

#### Restricciones y claves
- **PK:** id
- **UK:** cct

### USUARIOS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| nombre          | VARCHAR(150) | Nombre completo                   |
| email           | VARCHAR(100) | Correo electrónico                |
| rol             | VARCHAR(20)  | Rol (DIRECTOR, OPERADOR_SEP, ADMINISTRADOR) |
| escuela_id      | UUID         | Relación con ESCUELAS             |
| fecha_registro  | DATETIME     | Fecha de registro                 |
| estatus         | CHAR(1)      | Estado (A=Activo, I=Inactivo)     |

#### Restricciones y claves
- **PK:** id
- **FK:** escuela_id → ESCUELAS(id)
- **UK:** email

### VALORACIONES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| estudiante_id   | UUID         | Relación con ESTUDIANTES          |
| materia_id      | INT          | Relación con MATERIAS             |
| periodo_id      | INT          | Relación con PERIODOS_EVALUACION  |
| valor           | INT          | Valoración (0-3)                  |
| fecha           | DATETIME     | Fecha de valoración               |

#### Restricciones y claves
- **PK:** id
- **FK:** estudiante_id → ESTUDIANTES(id)
- **FK:** materia_id → MATERIAS(id_materia)
- **FK:** periodo_id → PERIODOS_EVALUACION(id_periodo)

### EVALUACIONES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_evaluacion   | INT          | Identificador de evaluación       |
| id_estudiante   | INT          | Relación con ESTUDIANTES          |
| id_materia      | INT          | Relación con MATERIAS             |
| id_periodo      | INT          | Relación con PERIODOS_EVALUACION  |
| fecha_evaluacion| DATE         | Fecha de evaluación               |

#### Restricciones y claves
- **FK:** id_materia → MATERIAS(id_materia)
- **FK:** id_periodo → PERIODOS_EVALUACION(id_periodo)

### GRUPOS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_grupo        | INT          | Identificador de grupo            |
| nivel_educativo | VARCHAR(50)  | Nivel educativo                   |
| grado_nombre    | VARCHAR(20)  | Nombre del grado                  |
| grado_numero    | INT          | Número de grado                   |
| descripcion     | VARCHAR(200) | Descripción                       |

#### Restricciones y claves
- **PK:** id_grupo
### MATERIAS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_materia      | INT          | Identificador de materia          |
| codigo          | VARCHAR(10)  | Código de materia                 |
| nombre          | VARCHAR(100) | Nombre de la materia              |
| orden           | INT          | Orden                             |

#### Restricciones y claves
- **PK:** id_materia
- **UK:** codigo

### PERIODOS_EVALUACION
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_periodo      | INT          | Identificador de periodo          |
| nombre          | VARCHAR(50)  | Nombre del periodo                |
| fecha_inicio    | DATE         | Fecha de inicio                   |
| fecha_fin       | DATE         | Fecha de fin                      |

#### Restricciones y claves
- **PK:** id_periodo

### ESTUDIANTES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| nombre          | VARCHAR(150) | Nombre completo                   |
| grupo_id        | INT          | Relación con GRUPOS               |
| curp            | VARCHAR(18)  | CURP del estudiante               |
| fecha_nacimiento| DATE         | Fecha de nacimiento               |
| estatus         | CHAR(1)      | Estado (A=Activo, I=Inactivo)     |

#### Restricciones y claves

### CAT_GRADOS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_grado        | INT          | Identificador de grado            |
| nivel_educativo | VARCHAR(50)  | Nivel educativo                   |
| grado_nombre    | VARCHAR(20)  | Nombre del grado                  |
| grado_numero    | INT          | Número de grado                   |
| descripcion     | VARCHAR(200) | Descripción                       |

#### Restricciones y claves
- **PK:** id_grado

### COMPETENCIAS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_competencia  | INT          | Identificador de competencia      |
| id_materia      | INT          | Relación con MATERIAS             |
| codigo          | VARCHAR(20)  | Código de competencia             |
| descripcion     | VARCHAR(500) | Descripción                       |
| nivel_esperado  | INT          | Nivel esperado (1-4)              |

#### Restricciones y claves
- **PK:** id_competencia
- **FK:** id_materia → MATERIAS(id_materia)

### RESULTADOS_COMPETENCIAS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_resultado    | INT          | Identificador de resultado        |
| id_evaluacion   | INT          | Relación con EVALUACIONES         |
| id_competencia  | INT          | Relación con COMPETENCIAS         |
| nivel_logro     | INT          | Nivel de logro (1-4)              |

#### Restricciones y claves
- **PK:** id_resultado
- **FK:** id_evaluacion → EVALUACIONES(id_evaluacion)
- **FK:** id_competencia → COMPETENCIAS(id_competencia)

### LOG_ACTIVIDADES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_log          | INT          | Identificador de log              |
| id_usuario      | UUID         | Relación con USUARIOS             |
| fecha_hora      | DATETIME     | Fecha y hora de la actividad      |
| accion          | VARCHAR(50)  | Tipo de acción (INSERT, UPDATE, DELETE, LOGIN) |
| tabla           | VARCHAR(50)  | Tabla afectada                    |
| registro_id     | INT          | ID del registro afectado          |
| detalle         | TEXT         | Detalle de la acción              |
| ip              | VARCHAR(50)  | IP de origen                      |

#### Restricciones y claves
- **PK:** id_log
- **FK:** id_usuario → USUARIOS(id)
---
Este documento resume la estructura de datos principal del sistema, incluyendo el diagrama ER y el diccionario de datos para las entidades clave. Para detalles adicionales, consulta los archivos de análisis técnico y los scripts SQL del proyecto.

---

## 3. Ejemplos de Consultas SQL

### Consulta: Valoraciones por escuela y periodo
```sql
SELECT e.nombre AS escuela, p.nombre AS periodo, COUNT(v.id) AS total_valoraciones
FROM ESCUELAS e
JOIN USUARIOS u ON u.escuela_id = e.id
JOIN ESTUDIANTES est ON est.grupo_id IN (SELECT id_grupo FROM GRUPOS WHERE escuela_id = e.id)
JOIN VALORACIONES v ON v.estudiante_id = est.id
JOIN PERIODOS_EVALUACION p ON v.periodo_id = p.id_periodo
GROUP BY e.nombre, p.nombre;
```

### Consulta: Promedio de valoración por materia
```sql
SELECT m.nombre AS materia, AVG(v.valor) AS promedio_valoracion
FROM VALORACIONES v
JOIN MATERIAS m ON v.materia_id = m.id_materia
GROUP BY m.nombre;
```

### Consulta: Listado de estudiantes con valoraciones incompletas
```sql
SELECT est.nombre, est.curp, g.grado_nombre, e.nombre AS escuela
FROM ESTUDIANTES est
JOIN GRUPOS g ON est.grupo_id = g.id_grupo
JOIN ESCUELAS e ON g.escuela_id = e.id
WHERE est.id NOT IN (
   SELECT estudiante_id FROM VALORACIONES WHERE valor IS NOT NULL
);
```

### Vista: Reporte por escuela y materia
```sql
CREATE VIEW VW_REPORTE_ESCUELA AS
SELECT 
        e.cct,
        e.nombre AS nombre_escuela,
        g.grado_nombre,
        m.codigo AS codigo_materia,
        m.nombre AS nombre_materia,
        COUNT(DISTINCT est.id) AS total_estudiantes,
        AVG(rc.nivel_logro) AS promedio_nivel,
        SUM(CASE WHEN rc.nivel_logro = 4 THEN 1 ELSE 0 END) AS nivel_4,
        SUM(CASE WHEN rc.nivel_logro = 3 THEN 1 ELSE 0 END) AS nivel_3,
        SUM(CASE WHEN rc.nivel_logro = 2 THEN 1 ELSE 0 END) AS nivel_2,
        SUM(CASE WHEN rc.nivel_logro = 1 THEN 1 ELSE 0 END) AS nivel_1
FROM ESCUELAS e
INNER JOIN GRUPOS g ON e.id = g.id_escuela
INNER JOIN ESTUDIANTES est ON g.id_grupo = est.grupo_id
INNER JOIN EVALUACIONES ev ON est.id = ev.id_estudiante
INNER JOIN MATERIAS m ON ev.id_materia = m.id_materia
INNER JOIN RESULTADOS_COMPETENCIAS rc ON ev.id_evaluacion = rc.id_evaluacion
GROUP BY e.cct, e.nombre, g.grado_nombre, m.codigo, m.nombre;
```

### Consulta: Auditoría de actividades por usuario
```sql
SELECT u.nombre, l.accion, l.tabla, l.fecha_hora, l.detalle
FROM LOG_ACTIVIDADES l
JOIN USUARIOS u ON l.id_usuario = u.id
WHERE l.fecha_hora >= '2025-12-01';
```

---

## 4. Notas y recomendaciones

- Para ampliar el modelo, revisar los scripts SQL y el análisis técnico complementario.
- Se recomienda mantener integridad referencial y restricciones de unicidad en claves importantes (CURP, CCT, email).
- El diagrama Mermaid puede visualizarse en VS Code o herramientas compatibles.
- Considera los catálogos y vistas para facilitar reportes y análisis.
- Mantén actualizada la bitácora de actividades para auditoría y seguridad.
- Revisa los campos NULL permitidos en USUARIOS (por ejemplo, escuela_id para administradores).
- Para migraciones, consulta el análisis técnico complementario y scripts de migración.