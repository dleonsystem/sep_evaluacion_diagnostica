# Documento de Estructura de Datos

## 1. Diagrama Entidad-Relación (ER)

A continuación se presenta el diagrama entidad-relación inferido del sistema, basado en los esquemas y modelos encontrados en la documentación:

```
[ESCUELAS] <--- [USUARIOS]
   |             |
   |             v
   |         [VALORACIONES]
   |             |
   v             v
[GRUPOS]     [EVALUACIONES]
   |             |
   v             v
[MATERIAS]   [PERIODOS_EVALUACION]
```

### Descripción de entidades principales:
- **ESCUELAS**: Representa cada centro educativo.
- **USUARIOS**: Usuarios asociados a escuelas (directores, operadores SEP, administradores).
- **VALORACIONES**: Registros de valoraciones por estudiante y materia.
- **EVALUACIONES**: Evaluaciones realizadas en distintos periodos.
- **GRUPOS**: Agrupaciones de estudiantes por grado y grupo.
- **MATERIAS**: Catálogo de materias evaluadas.
- **PERIODOS_EVALUACION**: Periodos de diagnóstico/intermedio/final.

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

### VALORACIONES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id              | UUID         | Identificador único               |
| estudiante_id   | UUID         | Relación con ESTUDIANTES          |
| materia_id      | INT          | Relación con MATERIAS             |
| periodo_id      | INT          | Relación con PERIODOS_EVALUACION  |
| valor           | INT          | Valoración (0-3)                  |
| fecha           | DATETIME     | Fecha de valoración               |

### EVALUACIONES
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_evaluacion   | INT          | Identificador de evaluación       |
| id_estudiante   | INT          | Relación con ESTUDIANTES          |
| id_materia      | INT          | Relación con MATERIAS             |
| id_periodo      | INT          | Relación con PERIODOS_EVALUACION  |
| fecha_evaluacion| DATE         | Fecha de evaluación               |

### GRUPOS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_grupo        | INT          | Identificador de grupo            |
| nivel_educativo | VARCHAR(50)  | Nivel educativo                   |
| grado_nombre    | VARCHAR(20)  | Nombre del grado                  |
| grado_numero    | INT          | Número de grado                   |
| descripcion     | VARCHAR(200) | Descripción                       |

### MATERIAS
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_materia      | INT          | Identificador de materia          |
| codigo          | VARCHAR(10)  | Código de materia                 |
| nombre          | VARCHAR(100) | Nombre de la materia              |
| orden           | INT          | Orden                             |

### PERIODOS_EVALUACION
| Campo           | Tipo         | Descripción                       |
|-----------------|--------------|-----------------------------------|
| id_periodo      | INT          | Identificador de periodo          |
| nombre          | VARCHAR(50)  | Nombre del periodo                |
| fecha_inicio    | DATE         | Fecha de inicio                   |
| fecha_fin       | DATE         | Fecha de fin                      |

---

Este documento resume la estructura de datos principal del sistema, incluyendo el diagrama ER y el diccionario de datos para las entidades clave. Para detalles adicionales, consulta los archivos de análisis técnico y los scripts SQL del proyecto.