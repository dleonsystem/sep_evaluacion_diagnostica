# Dictamen de Rediseño de Experiencia de Usuario - Issue #395
## Requerimiento: Simplificación de la Visualización de Errores

### 1. Resumen del Cambio
A solicitud del usuario, se ha modificado la forma en que el sistema comunica los errores de validación durante la carga masiva de archivos FRV. El objetivo es reducir la carga cognitiva en la interfaz web y centralizar el detalle técnico en el reporte PDF.

### 2. Descripción de la Solución
Anteriormente, la página web mostraba una lista detallada de errores (Hoja, Fila, Motivo). Con este cambio:
- **Interfaz Web**: Muestra un aviso general de que existen inconsistencias y un resumen invitando a descargar el PDF.
- **Reporte PDF**: Mantiene la integridad total del detalle técnico, sirviendo como el único punto de referencia para la corrección de datos.

### 3. Impacto en Componentes

#### [Frontend] [carga-masiva.component.html](file:///c:/ANGULAR/sep_evaluacion_diagnostica/web/frontend/src/app/components/carga-masiva/carga-masiva.component.html)
- Se eliminó el bloque `*ngFor` que iteraba sobre `erroresAgrupados`.
- Se añadieron clases de utilidad de diseño (`carga__mensaje--error`, `carga__mensaje--info`) para los nuevos mensajes informativos.

### 4. Beneficios
- **UI más limpia**: Evita que listas largas de errores desplacen elementos importantes de la página.
- **Flujo de Trabajo Guiado**: El usuario ahora tiene una acción clara (descargar PDF) en lugar de tratar de corregir datos viendo la pantalla del navegador.
- **Consistencia**: El PDF se convierte en el "documento de verdad" oficial para las correcciones.

### 5. Verificación
- [x] Validación de errores funcionales (el sistema detecta los mismos errores que antes).
- [x] Generación de PDF verificada (contiene la lista completa desaparecida de la web).
- [x] Mensajes de UI ajustados a la identidad visual del proyecto.

**Documentación generada por:** Antigravity (IA)
**Fecha:** 14 de Abril de 2026
