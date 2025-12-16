# Plataforma de Recepción, Validación y Descarga de Archivos de la Segunda Aplicación de los Ejercicios Integradores del Aprendizaje (EIA)

## I. Introducción

La presente especificación técnica describe el diseño, reglas de validación, arquitectura funcional y requerimientos tecnológicos de la plataforma encargada de la Recepción, Validación y posterior habilitación de Descarga de archivos correspondientes a la Segunda Aplicación de los Ejercicios Integradores del Aprendizaje (EIA).

El sistema no procesa ni genera resultados, únicamente recibe los archivos, valida su estructura y contenido, registra las solicitudes y muestra las ligas de descarga de los archivos procesados externamente.

---

## II. Objetivo General del Sistema

Desarrollar una plataforma web que permita recibir archivos, validarlos automáticamente, generar credenciales de acceso (únicamente en la primera carga válida), registrar cada envío como una solicitud independiente y publicar las ligas de descarga correspondientes a los archivos procesados por un sistema externo.

---

## III. Alcance

El sistema comprenderá:

- Módulo de carga de archivos  
- Módulo de validación automática  
- Generación de credenciales en la primera carga válida  
- Registro interno de solicitudes con consecutivo  
- Publicación de ligas de descarga  
- Repositorio para almacenar archivos válidos recibidos  
- Panel básico para monitoreo técnico  

---

## IV. Requerimientos Funcionales por módulo

La plataforma permitirá subir un archivo .xlsx sin necesidad de autenticación previa.

Al seleccionar el archivo aparecerá la etiqueta: **"Validando tu archivo..."**

La validación se ejecutará automáticamente revisando:

1. CCT  
2. Correo  
3. Nivel  
4. Campo obligatorio por hoja  
5. Columnas obligatorias  
6. Valores válidos (0-3)  
7. Estructura general de archivo  
8. Número de hojas  
9. Consistencia interna  

Si el archivo es válido, el sistema mostrará el mensaje:

**"Tu archivo ha sido validado correctamente. Podrás consultar tus resultados a partir del día: [fecha = hoy + 4 días]"**

Si el archivo es válido, el sistema deberá generar credenciales para consulta futura de resultados, donde:

- **Usuario = CCT validado**  
- **Contraseña = Correo validado en la primera carga válida.**  
  - En cargas posteriores NO se regenera contraseña.

El sistema generará automáticamente un **PDF de confirmación**, que incluirá:

- Mensaje: "Archivo validado correctamente"  
- Fecha futura en que podrá consultar resultados  
- Usuario (CCT)  
- Contraseña (correo validado)  
- Marca de tiempo de la validación  

El PDF se descargará automáticamente.

Si el archivo es inválido, se mostrará un mensaje de rechazo y se generará el **PDF de errores**.

---

### 2. Validación del Archivo

**Validación del CCT:**  
Validación de correo electrónico  
Verificación del nivel educativo asociado  
Estructura sintáctica  
Coincidencia entre el correo capturado en el archivo y su estructura sintáctica.  
No se valida contra catálogos externos.

**Validación de estructura vs. nivel:**

- Número de hojas  
- Nombre de hojas  
- Estructura columna por columna  
- Campos obligatorios no vacíos  

**Validación del contenido por hoja:**

- Lista/Número → No vacío  
- Nombre → No vacío  
- Sexo → Solo H/M  
- Grupo → Letras A–Z  
- Valoraciones → Rango 0–3  
- Celdas obligatorias completas  

Si la estructura o los valores no coinciden, el archivo debe ser **rechazado**.

---

### 3. Reglas de Primera y Segunda Aplicación

Cada carga válida se registrará como una solicitud independiente.  
El sistema **NO determinará** primera o segunda aplicación,  
ni realizará comparaciones, sustituciones o fusiones entre archivos.

---

### 4. Procesamiento de Resultados

El procesamiento de archivos, generación de resultados, comparativos y empaquetado ZIP corresponde a **un sistema externo**,  
el cual depositará los archivos finales en un repositorio externo.

La plataforma únicamente mostrará las ligas de descarga generadas externamente.

---

### 5. Módulo de Descarga de Resultados

El usuario accede con su **CCT y contraseña (correo validado)** para consultar todas las versiones de resultados que se hayan generado externamente.

Cada versión aparecerá con:

- Número consecutivo  
- Liga de descarga  

---

## V. Requerimientos No Funcionales (RNF)

### 1. Seguridad
- Protección HTTPS obligatoria.  
- Contraseña almacenada bajo estándares de hashing.  
- Logs de acceso y actividad.  

### 2. Rendimiento
- Capacidad para validar archivos sin interrupción.  
- Soportar **120,000 solicitudes de validación**, equivalente a la cantidad de correos recibidos en la primera aplicación.  

### 3. Disponibilidad
Repositorios separados para:

- Archivos recibidos  
- Resultados provenientes de procesamiento externo  

Capacidad mínima de **1 TB** para repositorio de recepción-resultados.

### 4. Escalabilidad
- Debe permitir aumentar el espacio sin afectar al servicio.  
- Debe permitir agregar nuevos niveles o estructuras.  
