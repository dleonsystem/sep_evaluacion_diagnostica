# REPORTE DE MANTENIMIENTO: ACCIONES CORRECTIVAS Y EVOLUTIVAS
## Sistema de Evaluación Diagnóstica (Plataforma Web)

**Periodo reportado:** diciembre 2025 y primera semana de enero 2026.

---

## 1. Objetivo del reporte

Documentar las acciones correctivas y evolutivas realizadas sobre el sistema de Evaluación Diagnóstica durante el periodo reportado, incluyendo los componentes impactados, los commits asociados y la evidencia (capturas) que debe integrarse al informe final.

---

## 2. Alcance del mantenimiento

- **Correctivo:** resolución de fallas funcionales, errores de interfaz y ajustes en flujos críticos.
- **Evolutivo:** mejoras de funcionalidad, nuevas capacidades en paneles administrativos y ampliación de validaciones.

---

## 3. Acciones correctivas (extracto)

| ID | Incidencia | Solución aplicada | Componentes afectados | Evidencia (commit/PR) | Evidencia visual |
| --- | --- | --- | --- | --- | --- |
| C-01 | Errores en descarga de resultados PDF | Ajuste del flujo de descarga y verificación de estado | Descargas, panel administrativo | `50624cb`, PR #114 | Aquí pon la imagen relacionada con descarga de resultados PDF en el panel administrativo |
| C-02 | PDFs de confirmación con formato incorrecto | Ajuste de estilos y encabezados | Generación de PDF | `0705626`, `8a88519`, PR #102/#103 | Aquí pon la imagen relacionada con el PDF de confirmación corregido |
| C-03 | Errores de consola por duplicidad en servicios | Correcciones en servicios de validación | Servicios de validación | `f17355f`, PR #98/#99 | Aquí pon la imagen relacionada con consola sin errores o pantalla validando |
| C-04 | Panel sin filtros/paginación | Implementación de filtros y paginación | Panel administrativo | `54d344e`, `0a18f2a`, PR #117/#118 | Aquí pon la imagen relacionada con filtros y paginación en el panel |

---

## 4. Acciones evolutivas (extracto)

| ID | Mejora | Descripción | Componentes afectados | Evidencia (commit/PR) | Evidencia visual |
| --- | --- | --- | --- | --- | --- |
| E-01 | Validaciones por nivel | Nuevas reglas de validación para plantillas por nivel | Validación de archivos | `4c9e035`, `a969d6f`, `1d6bb8a`, PR #90–#93 | Aquí pon la imagen relacionada con mensajes de validación por nivel |
| E-02 | Panel administrativo con columnas de resultados | Se añadió columna de resultados y estado de descarga | Panel administrativo | `a24ce88`, PR #113 | Aquí pon la imagen relacionada con columna de resultados |
| E-03 | Estado de asociación de Excel | Visualización del estado de asociación | Panel administrativo | `bc08aee`, PR #115 | Aquí pon la imagen relacionada con estado de asociación |
| E-04 | Metadatos de nivel en listado | Inclusión de metadatos por nivel en listado de Excel | Panel administrativo | `00afe3c`, PR #119 | Aquí pon la imagen relacionada con metadatos de nivel |
| E-05 | Filtros y paginación | Mejora de navegación en listados extensos | Panel administrativo | `54d344e`, `0a18f2a`, PR #117/#118 | Aquí pon la imagen relacionada con filtros/paginación |

---

## 5. Componentes actualizados

- **Carga masiva y validación:** reglas por nivel, tipado de hojas y mensajes de validación.
- **Generación de PDFs:** estilo, encabezados y formato.
- **Panel administrativo:** filtros, paginación, columna de resultados, estado de asociación, metadatos de nivel.
- **Descargas:** corrección del flujo de descarga de PDFs.

---

## 6. Evidencias requeridas (capturas sugeridas)

1. **Carga masiva:** pantalla con validación correcta y mensaje “Validando tu archivo...”.
2. **Validación con errores:** pantalla mostrando mensaje de error y PDF de errores simulado.
3. **Panel administrativo:** tabla con filtros y paginación visibles.
4. **Panel administrativo:** columna de resultados con estado de descarga.
5. **Panel administrativo:** estado de asociación de Excel.
6. **Panel administrativo:** metadatos de nivel en listado.
7. **PDFs:** confirmación con encabezado corregido.

> Nota: Inserta cada imagen donde se indica “Aquí pon la imagen relacionada con...”.

---

## 7. Conclusión

El mantenimiento correctivo eliminó incidencias críticas de descarga y presentación de PDFs, mientras que el mantenimiento evolutivo fortaleció la validación de archivos y mejoró la operación del panel administrativo. Estas acciones incrementan la confiabilidad del flujo de carga y la visibilidad de resultados para usuarios administrativos.

---

**Responsable del informe:** Equipo de desarrollo web
