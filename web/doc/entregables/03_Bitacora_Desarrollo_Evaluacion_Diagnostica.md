# BITÁCORA DE DESARROLLO CON EL DETALLE DE TAREAS REALIZADAS POR SPRINT O MÓDULO ENTREGADO,<br>CON EVIDENCIA DE COMMITS Y VERSIONES EN GITHUB, INCLUYENDO REFERENCIAS A SOLUCIÓN DE PROBLEMÁTICAS REPORTADAS Y<br>CAMBIOS IMPLEMENTADOS MEDIANTE PULL REQUESTS

**Proyecto:** Evaluación Diagnóstica (plataforma web)

**Periodo reportado:** diciembre 2025 y primera semana de enero 2026.

---

## 1. Resumen ejecutivo del periodo

Durante el periodo reportado se ejecutaron ajustes funcionales y de usabilidad en el frontend, principalmente en los módulos de carga masiva, validación de archivos, administración de resultados y autenticación. Se consolidó el flujo de validación y descarga de PDFs, se añadieron controles de paginación y filtros en paneles administrativos, y se atendieron incidencias de interfaz (errores de consola y estilos). Los cambios fueron integrados mediante Pull Requests y quedan evidenciados en commits del repositorio.

---

## 2. Bitácora por sprint o módulo entregado

### Sprint DIC‑01 (Inicio de diciembre 2025)

**Módulos/áreas:** Carga masiva, validación de plantillas, autenticación.

**Tareas realizadas:**
- Fortalecimiento del flujo de carga masiva y validación de plantillas por nivel.
- Ajustes a la interfaz de carga para mostrar mensajes y estados con mayor claridad.
- Correcciones de errores de consola y de validación de tipos.

**Evidencia de commits (extracto):**
- `4c9e035` — Add workbook type detection for carga masiva.
- `a969d6f` — Add primaria template validation.
- `1d6bb8a` — Add secundaria tecnicas generales validation.
- `1c75255` — Update validation results messaging.
- `ca79dba` — Fix excel validator typing exports.

**Pull Requests asociados (extracto):**
- PR #90, #91, #92 y #93: validaciones de plantillas, reglas y mensajes.
- PR #94, #95 y #96: mejoras de tipado y ajustes visuales.

---

### Sprint DIC‑02 (Mitad de diciembre 2025)

**Módulos/áreas:** Resultados, PDF, descargas, UX.

**Tareas realizadas:**
- Ajustes al flujo de generación y descarga de PDFs.
- Mejora de la presentación visual de PDFs y validaciones.
- Correcciones de duplicidad de miembros en servicios.

**Evidencia de commits (extracto):**
- `942cd70` — Generate valid confirmation PDFs.
- `0705626` — Style confirmation PDF content.
- `8a88519` — Improve PDF header color and encoding.
- `50624cb` — Fix resultados PDF download.

**Problemáticas reportadas y solución aplicada:**
- **PDFs con formato/estilo incorrecto** → Ajuste de estilos y encabezados (`0705626`, `8a88519`).
- **Descarga de PDF de resultados fallida** → Corrección de flujo de descarga (`50624cb`).

**Pull Requests asociados (extracto):**
- PR #100, #101, #102, #103 y #104: generación/estilo de PDFs y fixes en servicios.
- PR #114: corrección de descarga de resultados.

---

### Sprint DIC‑03 (Finales de diciembre 2025)

**Módulos/áreas:** Panel administrativo, upload de PDFs, filtros y paginación.

**Tareas realizadas:**
- Implementación de flujo de upload de PDFs y asociación con Excel.
- Incorporación de filtros y paginación en el panel administrativo.
- Ajustes de layout y tipografías para mejorar la lectura.

**Evidencia de commits (extracto):**
- `0576bbe` — Add admin panel PDF upload flow.
- `87bc569` — Agregar selector de Excel y guardar PDFs.
- `54d344e` — Add admin panel filters and pagination.
- `0a18f2a` — Add pagination to admin panel excel list.
- `6fbf7ec` — Increase admin panel font sizes.

**Problemáticas reportadas y solución aplicada:**
- **Dificultad para localizar registros en panel** → Filtros y paginación (`54d344e`, `0a18f2a`).
- **Legibilidad en panel administrativo** → Ajuste de tipografías y layout (`6fbf7ec`).

**Pull Requests asociados (extracto):**
- PR #108, #109, #110, #111 y #112: flujo de PDFs y selector de Excel.
- PR #117 y #118: paginación y filtros.
- PR #120 y #121: ajustes de layout y tipografías.

---

### Sprint ENE‑01 (Primera semana de enero 2026)

**Módulos/áreas:** Consolidación de panel administrativo, validaciones y documentación.

**Tareas realizadas:**
- Ajustes finales a validaciones, metadatos de Excel y estados de asociación.
- Refuerzo de consistencia en paneles administrativos.
- Actualizaciones de documentación de soporte y de arquitectura.

**Evidencia de commits (extracto):**
- `00afe3c` — Add level metadata to admin excel list.
- `bc08aee` — Add excel association status to admin panel.
- `a24ce88` — Add results column with PDF download status.

**Pull Requests asociados (extracto):**
- PR #113 y #115: columna de resultados y estado de asociación.
- PR #119: metadatos de nivel en listado administrativo.

---

## 3. Evidencia de commits y versiones en GitHub (referencias)

> **Nota:** Las referencias a commits y PRs corresponden al rango diciembre 2025 – primera semana de enero 2026, verificable en el historial de Git del repositorio.

**Commits relevantes (extracto):**
- `4c9e035`, `a969d6f`, `1d6bb8a` — validaciones de plantillas por nivel.
- `942cd70`, `0705626`, `8a88519` — generación y estilo de PDFs.
- `0576bbe`, `87bc569` — flujo de upload de PDFs y selector de Excel.
- `54d344e`, `0a18f2a` — filtros y paginación en panel administrativo.
- `00afe3c`, `bc08aee`, `a24ce88` — metadatos y estados en panel de administración.

**Versiones/Integraciones (PRs relevantes):**
- PR #90–#96: validación y tipado de reglas y plantillas.
- PR #100–#104: mejoras en PDFs y correcciones de servicios.
- PR #108–#114: flujo de PDFs y columna de resultados.
- PR #117–#121: paginación, filtros y ajustes de layout.

---

## 4. Problemáticas reportadas y solución

| Problemática reportada | Impacto | Solución aplicada | Evidencia (commit/PR) |
| --- | --- | --- | --- |
| Errores de consola en validaciones y servicios | Inestabilidad y fallos en flujo de carga | Correcciones de duplicidad y tipado | `f17355f`, PR #98/#99 |
| PDFs con formato incorrecto | Entrega de confirmaciones con estilo deficiente | Ajuste de estilos y encabezados | `0705626`, `8a88519`, PR #102/#103 |
| Descarga de resultados fallida | Imposibilidad de consultar resultados | Corrección del flujo de descarga | `50624cb`, PR #114 |
| Panel administrativo sin filtros/paginación | Dificultad para operar con grandes listas | Implementación de filtros y paginación | `54d344e`, `0a18f2a`, PR #117/#118 |

---

## 5. Cambios implementados mediante Pull Requests

- PR #90–#96: reglas de validación por nivel y ajustes en la UI.
- PR #100–#104: generación de PDFs y mejoras visuales.
- PR #108–#114: flujo de upload de PDFs, columnas de resultados y descargas.
- PR #117–#121: paginación, filtros y mejoras de layout en panel administrativo.

---

**Responsable del informe:** Equipo de desarrollo web
