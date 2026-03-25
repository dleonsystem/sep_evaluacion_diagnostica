# [cite_start]ANEXO 1 [cite: 1]
## [cite_start]Procedimiento para calcular el elemento verificador [cite: 2]
### [cite_start]MANUAL DE PROCEDIMIENTOS DEL CCT [cite: 3, 4]

Este documento describe el algoritmo para obtener el elemento verificador de una clave de centro de trabajo.

---

### Pasos del Procedimiento
* [cite_start]**a)** Convertir las claves del clasificador y del identificador de alfabéticas a numéricas de acuerdo con la **Tabla 1**[cite: 5].
* [cite_start]**b)** Sumar todas las posiciones pares de la clave de centro de trabajo, considerando la entidad, clasificador, identificador y número progresivo[cite: 6].
* [cite_start]**c)** Multiplicar el resultado del punto (b) por **7**[cite: 7].
* [cite_start]**d)** Sumar todas las posiciones nones de la clave de centro de trabajo, considerando la entidad, el clasificador, el identificador y el número progresivo[cite: 8].
* [cite_start]**e)** Multiplicar el resultado del punto (d) por **26**[cite: 9].
* [cite_start]**f)** Sumar los resultados obtenidos en los pasos (c) y (e)[cite: 10].
* [cite_start]**g)** Dividir el resultado del punto (f) entre **27**[cite: 11].
* [cite_start]**h)** El residuo de la división del punto (g) se convierte en alfanumérico de acuerdo con la **Tabla 2** para obtener el elemento verificador[cite: 12].

---

### [cite_start]Ejemplo de Aplicación [cite: 13]
[cite_start]**Clave:** 01DPR0001 [cite: 14]

| Componente | Valor Original | Valor Numérico (Tabla 1) |
| :--- | :--- | :--- |
| [cite_start]Entidad [cite: 15] | 01 | 01 |
| [cite_start]Clasificador [cite: 16] | D | 04 |
| [cite_start]Identificador 1 [cite: 16] | P | 16 |
| [cite_start]Identificador 2 [cite: 16] | R | 18 |
| Nump. Prog. (pos 1-2) [cite_start][cite: 16] | 00 | 00 |
| Nump. Prog. (pos 3-4) [cite_start][cite: 16] | 01 | 01 |

* [cite_start]**Posiciones Pares:** 0, 0, 1, 1, 0, 0 [cite: 17]
* [cite_start]**Posiciones Nones:** 1, 4, 6, 8, 0, 1 [cite: 17]

---

### [cite_start]Tablas de Equivalencias [cite: 18, 19, 20, 21]

| Letra | Tabla 1 | Tabla 2 | Letra | Tabla 1 | Tabla 2 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | 01 | 00 | **N** | 14 | 13 |
| **B** | 02 | 01 | **O** | 15 | 14 |
| **C** | 03 | 02 | **P** | 16 | 15 |
| **D** | 04 | 03 | **Q** | 17 | 16 |
| **E** | 05 | 04 | **R** | 18 | 17 |
| **F** | 06 | 05 | **S** | 19 | 18 |
| **G** | 07 | 06 | **T** | 20 | 19 |
| **H** | 08 | 07 | **U** | 21 | 20 |
| **I** | 09 | 08 | **V** | 22 | 21 |
| **J** | 10 | 09 | **W** | 23 | 22 |
| **K** | 11 | 10 | **X** | 24 | 23 |
| **L** | 12 | 11 | **Y** | 25 | 24 |
| **M** | 13 | 12 | **Z** | 26 | 25 |