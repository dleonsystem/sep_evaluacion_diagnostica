# Caso de Uso  
**Sistema de Recepción, Validación y Descarga de Archivos de la Segunda aplicación de los Ejercicios Integradores del Aprendizaje (EIA)**

**Rol:** Directores  
**Versión:** 0.1  
**Fecha:** Noviembre 2025  

---

## Revisiones

| Fecha       | Versión | Descripción       | Autor                   |
|------------|---------|-------------------|-------------------------|
| 01/12/2025 | 1.0     | Versión Inicial   | Cesar Epifanio Santiago |

---

## Introducción

### Rol Directores

Este documento tiene como finalidad describir la forma en que el usuario podrá interactuar con el proceso de carga de archivos, validación y posterior habilitación de descargas de los resultados de la segunda aplicación de los Ejercicios Integrados del Aprendizaje (EIA), detallando las operaciones relacionadas.

El propósito de este caso de uso es describir la secuencia de pasos que un usuario con rol de Director debe seguir especificando las operaciones, validaciones y pantallas involucradas.

---

## Objetivo del caso de uso

Explicar el funcionamiento del proceso, sus respectivos flujos alternos y de excepción.

---

## Detalles del caso de uso

### Diagrama
*(No especificado en el documento)*

---

### Disparador

Un usuario con rol director requiere cargar un archivo con los resultados de la segunda aplicación de los Ejercicios Integrados del Aprendizaje (EIA).

---

### Actores

- Directores de Centros de Trabajo

---

### Precondiciones

- Contar con archivos que contengan la estructura correspondiente.

---

### Postcondiciones

- Carga y validación del archivo con los resultados de la segunda aplicación de los Ejercicios Integrados del Aprendizaje (EIA)

---

## 3. Flujos del Caso de Uso

### 3.1 Flujo principal – Carga de Archivos

| Acción del Actor | Respuesta del Sistema |
|------------------|-----------------------|
| Ingresa a la plataforma mediante el dominio correspondiente. | |
| | Muestra la pantalla principal con las opciones: Carga de archivos, Descarga de archivos y Mensaje de Bienvenida |
| Da clic en la opción **Carga de archivos** | |
| | Muestra las opciones de submenú Carga de archivos: CCT*, Correo electrónico*, Archivo de carga*, Botón Cargar |
| Captura datos y da clic en **Cargar** | El archivo deberá ser Excel (XLSX) |
| | Muestra ventana “Validando tu archivo…” y mensaje de validación |
| Da clic en **Entendido** | |
| | Muestra mensaje “Archivo validado correctamente.” y botón Generar Reporte |
| Da clic en **Generar Reporte** | |
| | Muestra PDF de validación |
| | Fin del Flujo Principal |

---

## 5. Flujos de excepción

### FE1 – Formato de Archivo no válido

| Acción del Actor | Respuesta del Sistema |
|------------------|-----------------------|
| Intenta cargar archivo no XLSX | |
| | Muestra mensaje “Formato de archivo no válido, favor de verificar” |
| | Fin del caso de uso |

---

## Firmas

**Fecha de elaboración:** 01/12/2025  
**Fecha de revisión:** 10/12/2025  

**Cesar Epifanio Santiago**  
Subdirector de Aseguramiento de Calidad  
