# Plantilla 2Sztxf6Bfv-2025_EIA_FormatoValoraciones_Primaria.xlsx

## Hojas (nombres exactos)

- `ESC`
- `PRIMERO`
- `SEGUNDO`
- `TERCERO`
- `CUARTO`
- `QUINTO`
- `SEXTO`
- `INSTRUCCIONES`

## Encabezados obligatorios por hoja

### Hoja `ESC` (etiquetas visibles)

- `C9`: **CCT :**
- `C11`: **TURNO :**
- `C13`: **NOMBRE DE LA ESCUELA :**
- `C18`: **CORREO:**

### Hojas `PRIMERO` a `SEXTO` (fila 6)

| Celda | Encabezado requerido |
| --- | --- |
| `B6` | NÚM. DE LISTA |
| `C6` | NOMBRE DEL ESTUDIANTE (Primer Apellido - Segundo Apellido - Nombre) |
| `D6` | SEXO H: NIÑO - M: NIÑA |
| `E6` | GRUPO |
| `F6` | VALORACIÓN ASIGNADA SEGÚN LA RÚBRICA |

> Nota: los encabezados originales están en dos líneas (con salto de línea). Al comparar, se recomienda normalizar espacios.

### Hojas `PRIMERO` y `SEGUNDO` (consignas, fila 9)

| Columna | Encabezado requerido |
| --- | --- |
| `F9` | CONSIGNA: 1 INCISO: A1 |
| `G9` | CONSIGNA: 2 INCISO: A1 |
| `H9` | CONSIGNA: 2 INCISO: A2 |
| `I9` | CONSIGNA: 3 INCISO: A1 |
| `J9` | CONSIGNA: 4 INCISO: A1 |
| `K9` | CONSIGNA: 1 INCISO: A1 |
| `L9` | CONSIGNA: 2 INCISO: A1 |
| `M9` | CONSIGNA: 3 INCISO: A1 |
| `N9` | CONSIGNA: 3 INCISO: A2 |
| `O9` | CONSIGNA: 4 INCISO: A1 |

### Hojas `TERCERO` y `CUARTO` (consignas, fila 9)

| Columna | Encabezado requerido |
| --- | --- |
| `F9` | CONSIGNA: 1 INCISO: A1 |
| `G9` | CONSIGNA: 1 INCISO: A2 |
| `H9` | CONSIGNA: 1 INCISO: B1 |
| `I9` | CONSIGNA: 1 INCISO: B2 |
| `J9` | CONSIGNA: 1 INCISO: B3 |
| `K9` | CONSIGNA: 2 INCISO: A1 |
| `L9` | CONSIGNA: 2 INCISO: A2 |
| `M9` | CONSIGNA: 2 INCISO: A3 |
| `N9` | CONSIGNA: 2 INCISO: B1 |
| `O9` | CONSIGNA: 3 INCISO: A1 |
| `P9` | CONSIGNA: 3 INCISO: B1 |
| `Q9` | CONSIGNA: 4 INCISO: A1 |
| `R9` | CONSIGNA: 4 INCISO: A2 |
| `S9` | CONSIGNA: 4 INCISO: A3 |
| `T9` | CONSIGNA: 1 INCISO: A1 |
| `U9` | CONSIGNA: 1 INCISO: B1 |
| `V9` | CONSIGNA: 2 INCISO: A1 |
| `W9` | CONSIGNA: 3 INCISO: A1 |
| `X9` | CONSIGNA: 3 INCISO: B1 |
| `Y9` | CONSIGNA: 3 INCISO: C1 |
| `Z9` | CONSIGNA: 3 INCISO: C2 |
| `AA9` | CONSIGNA: 4 INCISO: A1 |
| `AB9` | CONSIGNA: 4 INCISO: B1 |
| `AC9` | CONSIGNA: 5 INCISO: A1 |
| `AD9` | CONSIGNA: 5 INCISO: A2 |
| `AE9` | CONSIGNA: 5 INCISO: A3 |

### Hojas `QUINTO` y `SEXTO` (consignas, fila 9)

| Columna | Encabezado requerido |
| --- | --- |
| `F9` | CONSIGNA: 1 INCISO: A1 |
| `G9` | CONSIGNA: 1 INCISO: B1 |
| `H9` | CONSIGNA: 1 INCISO: B2 |
| `I9` | CONSIGNA: 2 INCISO: A1 |
| `J9` | CONSIGNA: 2 INCISO: B1 |
| `K9` | CONSIGNA: 2 INCISO: C1 |
| `L9` | CONSIGNA: 3 INCISO: A1 |
| `M9` | CONSIGNA: 3 INCISO: B1 |
| `N9` | CONSIGNA: 4 INCISO: A1 |
| `O9` | CONSIGNA: 4 INCISO: B1 |
| `P9` | CONSIGNA: 1 INCISO: A1 |
| `Q9` | CONSIGNA: 1 INCISO: B1 |
| `R9` | CONSIGNA: 1 INCISO: C1 |
| `S9` | CONSIGNA: 1 INCISO: C2 |
| `T9` | CONSIGNA: 1 INCISO: C3 |
| `U9` | CONSIGNA: 2 INCISO: A1 |
| `V9` | CONSIGNA: 2 INCISO: B1 |
| `W9` | CONSIGNA: 2 INCISO: C1 |
| `X9` | CONSIGNA: 2 INCISO: D1 |
| `Y9` | CONSIGNA: 3 INCISO: A1 |
| `Z9` | CONSIGNA: 3 INCISO: A2 |
| `AA9` | CONSIGNA: 3 INCISO: B1 |
| `AB9` | CONSIGNA: 3 INCISO: C1 |
| `AC9` | CONSIGNA: 4 INCISO: A1 |
| `AD9` | CONSIGNA: 4 INCISO: B1 |

## Reglas de celdas (tipos, longitudes, campos obligatorios)

### Hoja `ESC`

- **CCT** (`D9` o `E9`): 10 caracteres alfanuméricos en mayúsculas. Validación de longitud **exacta 10** (`D9:D10`).
- **Turno** (`D11`): selección de lista basada en `X7:X12` (MATUTINO, VESPERTINO, NOCTURNO, DISCONTINUO, TIEMPO COMPLETO, JORNADA AMPLIADA).
- **Nombre de la escuela** (`D13` o `E13`): obligatorio (texto).
- **Correo de contacto** (`D18` o `E18`): obligatorio (formato correo).
- **`C61`**: validación de número entero entre **1 y 32** (celda con validación numérica).

### Hojas `PRIMERO` a `SEXTO` (datos de estudiantes)

Campos obligatorios por registro (desde la fila 10):

- **Número de lista** (`B`): obligatorio, numérico.
- **Nombre del estudiante** (`C`): obligatorio, texto.
- **Sexo** (`D`): obligatorio, solo `H` o `M`.
- **Grupo** (`E`): obligatorio, una sola letra `A-Z`.
- **Valoraciones**: obligatorias, enteros de **0 a 3**.

Rangos de valoraciones:

- `PRIMERO` / `SEGUNDO`: `F10:O500` (10 consignas).
- `TERCERO` / `CUARTO`: `F10:AE500` (26 consignas).
- `QUINTO` / `SEXTO`: `F10:AD500` (25 consignas).

> La plantilla aplica validaciones de longitud 10 para la CCT en `C4` y listas/válidos para las valoraciones según el rango por grado.
