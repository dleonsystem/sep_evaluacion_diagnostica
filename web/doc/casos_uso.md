# Modelo de Casos de Uso – SEP Evaluación Diagnóstica (SiCRER)

## 1. Diagrama general de casos de uso (Alineación Fase 1)

```mermaid
graph TB
    subgraph "Actores"
        DIR[👤 Director / Escuela]
        DOC[👤 Docente]
        EST[👤 Estudiante]
        ADM[👥 Administrador DGADAE]
        OPE[👥 Operador Soporte]
    end
    
    subgraph "Módulo de Materiales (Admin)"
        CU01[CU-01 Publicar Materiales]
        CU02[CU-02 Descargar Materiales]
    end

    subgraph "Módulo de Aplicación (Manual/Docente)"
        CU03[CU-03 Aplicar Evaluación Diagnóstica]
    end

    subgraph "Módulo de Recepción y Validación (Portal Web)"
        CU04v2[CU-04v2 Cargar FRV por Portal Web]
        CU05[CU-05 Registrar solicitud y almacenamiento]
        CU06[CU-06 Detectar reenvío y login]
    end

    subgraph "Módulo de Resultados y Soporte"
        CU09v2[CU-09v2 Notificar y Descargar Resultados]
        CU11[CU-11 Crear ticket de soporte]
        CU13[CU-13 Gestionar tickets (Admin)]
    end

    ADM --> CU01
    DIR --> CU02
    DOC --> CU02
    
    DOC --> CU03
    EST -. participa .-> CU03
    
    DIR --> CU04v2
    CU04v2 --> CU05
    CU04v2 --> CU06
    
    SYNC[🔄 Sync] -.-> CU09v2
    DIR --> CU09v2
    
    DIR --> CU11
    OPE --> CU13
```

---

## 2. Definición de Casos de Uso

### CU-01: Publicar Materiales de Evaluación
- **Actor:** Administrador DGADAE
- **Descripción:** Permite la carga y publicación oficial de Cuadernillos (EIA), Rúbricas y Plantillas Excel (FRV) para cada ciclo y periodo.

### CU-02: Descargar Materiales
- **Actor:** Director, Docente
- **Descripción:** Acceso público a los materiales oficiales filtrados por nivel educativo (Preescolar, Primaria, Secundaria, Telesecundaria).

### CU-03: Aplicar Evaluación Diagnóstica
- **Actor Principal:** Docente
- **Actores Secundarios:** Estudiantes
- **Trazabilidad:** RF-03, RNF-05
- **Objetivo:** Ejecución de la evaluación en el aula y valoración de los resultados.
- **Flujo:**
  1. El docente distribuye los materiales (EIA) a los estudiantes.
  2. Los estudiantes completan los ejercicios integradores.
  3. El docente revisa y valora las respuestas basándose en las rúbricas.
  4. **Valoración por campo formativo:** Se asigna un nivel de integración (1-4) para ENS, HYC, LEN y SPC.
  5. **Observaciones:** El docente registra comentarios cualitativos por estudiante.
- **Resultado:** Evaluaciones valoradas listas para ser capturadas en el sistema.

### CU-04v2: Cargar FRV por Portal Web
- **Actor:** Director / Escuela
- **Descripción:** Carga del archivo Excel (FRV) con las valoraciones. Incluye validación automática de estructura, CCT, correo y reglas de negocio.

### CU-05: Registrar solicitud y almacenamiento
- **Actor:** Sistema
- **Descripción:** Generación de un consecutivo único por cada carga válida y almacenamiento seguro en el repositorio.

### CU-06: Detectar reenvío y requerir login
- **Actor:** Sistema / Escuela
- **Descripción:** Control de versiones basado en hash de archivo. Si el correo/CCT ya tiene una carga previa, se solicita autenticación.

### CU-09v2: Notificar y Descargar Resultados
- **Actor:** Director / Escuela
- **Descripción:** Acceso a los reportes procesados (PDF, F5) una vez que el sistema externo los sincroniza con el portal.

### CU-11: Crear ticket de soporte
- **Actor:** Usuario (Escuela)
- **Descripción:** Reporte de incidencias técnicas o dudas sobre la plataforma.

---

## 3. Matriz de Cumplimiento (Backlog Operativo)

| ID | Caso de Uso | Estado | Observaciones |
|----|-------------|--------|---------------|
| CU-01 | ✅ Completado | UI de administración implementada con validaciones. |
| CU-02 | ✅ Completado | Página pública con filtros por nivel educativo y logs de descarga. |
| CU-03 | ✅ Completado | Flujo manual documentado. Considera campos formativos y NIA. |
| CU-04v2 | 🏗️ En proceso | Lógica de validación backend en desarrollo. |
| CU-08 | ✅ Completado | Implementada consolidación de 5 reportes oficiales y empaquetado 7z (Fase 1 Híbrida). |
| CU-09v2 | ✅ Completado | Portal de descarga habilitado con soporte para resultados locales y vía SFTP. |
| CU-13 | ✅ Completado | Backend de tickets (Folio, SLA, Auditoría) implementado (Issue #262). |

---
**Nota:** Este documento se alinea con el archivo maestro `REQUERIMIENTOS_Y_CASOS_DE_USO.md` versión 2.1.
