# Análisis Técnico - Issue #373
## Bug: Intercepción del navegador al soltar archivos fuera del botón

### 1. Descripción del Problema
Cuando un usuario intenta realizar una carga masiva y arrastra un archivo hacia la aplicación, si el archivo es soltado (drop) fuera del área designada (`.carga__drop`), el navegador (Chrome, Edge) intercepta el evento y ejecuta su comportamiento por defecto: abrir el archivo en la misma pestaña o descargarlo. Esto interrumpe el flujo del usuario y puede causar pérdida de datos no guardados.

### 2. Causa Raíz
Los eventos `dragover` y `drop` solo están siendo capturados y prevenidos (`preventDefault()`) en el contenedor específico de la zona de drop. El objeto global `window` o `document` no tiene manejadores que detengan la propagación del comportamiento por defecto para el resto de la interfaz.

### 3. Solución Propuesta (PSP/RUP)
Implementar interceptores globales a nivel de componente utilizando `@HostListener` en Angular.

#### Especificaciones Técnicas:
- **Evento `window:dragover`**: Llamar a `event.preventDefault()` para evitar que el navegador muestre el icono de "copiar/abrir" fuera de las zonas permitidas.
- **Evento `window:drop`**: Llamar a `event.preventDefault()` para bloquear la apertura automática del archivo.

### 4. Criterios de Aceptación
- [ ] Al arrastrar un archivo Excel a cualquier parte de la pantalla (Header, Footer, márgenes) y soltarlo, la aplicación debe permanecer estática.
- [ ] El archivo solo debe procesarse si cae exactamente dentro del área de "Arrastre y suelte aquí".
- [ ] No debe haber navegación ni descargas automáticas disparadas por el navegador.

### 5. Seguridad (OWASP)
Esta medida mejora la **Disponibilidad** y la **Integridad** de la sesión del usuario al evitar navegaciones accidentales que podrían exponer tokens en URLs o simplemente interrumpir una transacción crítica de carga masiva.
