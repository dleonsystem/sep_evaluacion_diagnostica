# Sistema SiCRER - Evaluación Diagnóstica SEP
## Versión 2.0 - Stack Open Source

### Badges Legacy (Pre-Migración)
![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)
![Estado Legacy](https://img.shields.io/badge/estado-Deprecando-orange.svg)
![Versión Legacy](https://img.shields.io/badge/versi%C3%B3n-1.0.0.14-blue.svg)
![.NET](https://img.shields.io/badge/.NET-4.5-purple.svg)

### Badges Nuevo Stack (Post-Migración)
![Angular](https://img.shields.io/badge/Angular-17-dd0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-3178c6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.2-cc0000?logo=redis&logoColor=white)
![Filesystem](https://img.shields.io/badge/Storage-Filesystem_SSD-blue?logo=files&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24.x-2496ed?logo=docker&logoColor=white)
![Poetry](https://img.shields.io/badge/Poetry-1.8-60a5fa?logo=python&logoColor=white)

Sistema de Captura y Reporteo de Evaluación Diagnóstica para la Secretaría de Educación Pública (SEP) de México.

**NOVEDAD:** Se incorpora la **Plataforma de Recepción, Validación y Descarga** para la **segunda aplicación de los Ejercicios Integradores del Aprendizaje (EIA)**. Este módulo web obliga a capturar el **correo electrónico antes de elegir el Excel**, recibe archivos .xlsx sin autenticación previa, valida automáticamente estructura y contenido, genera una **contraseña aleatoria en la primera carga válida** (usuario = correo ingresado y validado contra el archivo) y permite reutilizar el **mismo correo para varios CCT**. Muestra nuevos mensajes de ayuda/confirmación, emite PDFs de confirmación/errores y expone ligas de descarga de resultados procesados externamente. No procesa evaluaciones ni determina si un envío es de primera o segunda aplicación; cada carga válida se registra como solicitud independiente y el sistema únicamente publica las ligas de descarga generadas fuera de la plataforma.

---

## 🚀 ESTRATEGIA BIFÁSICA DE MODERNIZACIÓN

> **Actualización de stack (2025):** Las tecnologías aprobadas para el rediseño son **Python 3.12** en backend (FastAPI), **Angular 17** en frontend y **PostgreSQL 16** como base de datos transaccional. Las referencias previas a React/Node.js se conservarán solo como historial y se irán migrando paulatinamente en esta sección y en los documentos analíticos.

### **FASE 1: Portal Web Híbrido** (Marzo 2026)

**Objetivo:** Implementar portal web moderno manteniendo procesamiento legacy

**Stack Tecnológico:**
- 🌐 **Frontend:** Angular 17 + TypeScript 5 (standalone components)
- ⚙️ **Backend:** Python 3.12 + FastAPI + SQLAlchemy
- 💾 **Base de Datos:** PostgreSQL 16 (catálogos y persistencia transaccional)
- 📦 **Storage:** Filesystem nativo SSD (FRV + PDFs, ~550 GB/año)
- ⚡ **Cache/Jobs:** Redis 7.2 (cola de validaciones con RQ/Celery)
- 🔐 **Auth:** OAuth2.1 + JWT tokens (PyJWT)
- 📊 **Excel:** Pandas + openpyxl para validación FRV

**Funcionalidades:**
- ✅ Login directores por CCT + contraseña
- 📤 Upload FRV con drag & drop (React Dropzone)
- ⚡ Validación automática en 30 segundos (vs 15 min manual)
- 🎫 Sistema tickets automático tras N fallos
- 📥 Descarga reportes PDF desde portal
- 🔄 Sincronización nocturna con SiCRER legacy

**Desarrollo:** Recursos internos SEP (DGADAI + DGTIC)
**Capacitación:** Remota/digital para alcance nacional con infraestructura existente

---

### **FASE 2: Migración Completa** (Septiembre 2026)

**Objetivo:** Eliminar dependencias legacy, 100% open source

**Nuevas Funcionalidades:**
- ⚡ Procesamiento nativo Python asíncrono (FastAPI + workers Celery/RQ) que elimina SiCRER.exe
- 📄 Generación PDF con WeasyPrint / ReportLab (elimina Crystal Reports)
- 🔒 Módulo ARCO completo (Acceso, Rectificación, Cancelación, Oposición)
- 📋 Gestor consentimientos LGPDP (padres/tutores)
- 📈 Dashboard analytics con Recharts (visualizaciones interactivas)
- 🔍 API pública REST (integración externa)
- 📊 Migración datos históricos 5 años (MS Access → PostgreSQL)

**Resultado:**
- ❌ Desactivación completa de SiCRER.exe
- ❌ Eliminación de MS Access
- ❌ Eliminación de Crystal Reports
- ✅ 100% compliance LGPDP
- ✅ $0 costos licenciamiento anual
- ✅ Escalabilidad 300K escuelas concurrentes

**Desarrollo:** Recursos internos SEP (DGADAI + DGTIC)

---


## 📋 Descripción

**SiCRER** (Sistema de Captura y Reporteo de Evaluación) es una aplicación desktop Windows diseñada para gestionar evaluaciones diagnósticas de estudiantes en los siguientes niveles educativos:

- 🎓 **Preescolar**
- 📚 **Primaria** 
- 🏫 **Secundaria Técnica y General**
- 📡 **Telesecundaria**

El sistema permite la captura, procesamiento y generación de reportes detallados sobre el desempeño de estudiantes en cuatro áreas principales:
- **ENS** - Enseñanza General (Español y Matemáticas)
- **HYC** - Historia y Civismo
- **LEN** - Lenguaje y Comunicación
- **SPC** - Saberes y Pensamiento Científico

### Plataforma de Recepción, Validación y Descarga (Segunda Aplicación EIA)

- 📥 **Recepción guiada:** la pantalla exige capturar el correo (será el usuario) antes de habilitar el selector de archivo y luego muestra la etiqueta «Validando tu archivo con el correo ingresado…».
- ✅ **Validación automática con 9 verificaciones en orden:**
  1. Coincidencia entre el correo ingresado y el correo dentro del Excel (solo en la primera carga de ese correo)
  2. CCT
  3. Nivel
  4. Campo obligatorio por hoja
  5. Columnas obligatorias
  6. Valores válidos (0-3)
  7. Estructura general de archivo
  8. Número y nombre de hojas
  9. Consistencia interna
- 🔐 **Credenciales autogeneradas:** solo en la primera carga válida se crea una contraseña aleatoria; el usuario para login y descargas es siempre el correo validado (el mismo correo puede usarse con varios CCT). No se regeneran contraseñas en cargas posteriores.
- 🧾 **PDF de confirmación/errores:** descarga automática con mensaje, fecha de disponibilidad (hoy + 4 días), usuario (correo), contraseña aleatoria generada y marca de tiempo; PDF de errores cuando el archivo es inválido o el correo no coincide con el Excel.
- 🗂️ **Registro y consecutivos:** cada carga válida se almacena como solicitud independiente y mantiene repositorio de archivos recibidos; el sistema no compara ni sustituye envíos previos.
- 🔗 **Descarga de resultados:** portal protegido por credenciales (correo + contraseña aleatoria) para mostrar versiones consecutivas y ligas de descarga depositadas por el sistema externo que procesa los archivos; mantiene repositorios separados para archivos recibidos y resultados.
- 📊 **Escalabilidad y disponibilidad:** capacidad mínima de 1 TB para recepción/resultados, soporte para 120,000 validaciones automáticas y operación bajo HTTPS con contraseñas almacenadas mediante hashing y logs de acceso.

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Framework** | .NET Framework | 4.5 |
| **UI** | Windows Forms | - |
| **Base de Datos** | Microsoft Access | .mdb |
| **Reportes** | Crystal Reports SAP | 13.0 |
| **Despliegue** | ClickOnce | - |
| **Acceso a Datos** | ADO (ActiveX Data Objects) | 7.0 |

### Componentes del Sistema

```
SiCRER/
├── Aplicación Principal (13.23 MB)
├── Base de Datos (25.23 MB)
├── Motor de Reportes (106.52 MB)
└── Documentación (0.52 MB)
```

---

## 📁 Estructura del Repositorio

```
sep_evaluacion_diagnostica/
│
├── 📄 LICENSE                              # Licencia MIT
├── 📄 README.md                            # Este archivo
├── 📄 .gitignore                           # Exclusiones de Git
│
├── 📊 ANALISIS_DETALLADO_PSP_RUP.md       # Análisis completo PSP/RUP
├── 🔧 ANALISIS_TECNICO_COMPLEMENTARIO.md  # Detalles técnicos
├── 📈 RESUMEN_EJECUTIVO_STAKEHOLDERS.md   # Resumen para directivos
├── 📋 REQUERIMIENTOS_Y_CASOS_DE_USO.md    # Especificación de requerimientos
│
├── 📁 MACROS Evaluacion Diagnostica/
│   │
│   ├── 📁 1 Formatos de valoración/
│   │   ├── 2025_EIA_FormatoValoraciones_Preescolar.xlsx
│   │   ├── 2025_EIA_FormatoValoraciones_Primaria.xlsx
│   │   ├── 2025_EIA_FormatoValoraciones_Secundarias_Tecnicas_Generales.xlsx
│   │   └── 2025_EIA_FormatoValoraciones_Secundarias_Telesecundarias.xlsx
│   │
│   ├── 📁 2 SiCRER/
│   │   └── SiCRER.SEPT_24.25/
│   │       ├── Instalador SiCRER_24_25_SEPT.exe
│   │       ├── ARCHIVOS DE SISTEMA/
│   │       └── RECURSOS/
│   │           ├── bd24.25.1.mdb
│   │           └── REPORTES/ (10 plantillas .rpt)
│   │
│   ├── 📁 3 Ejemplos de reportes generados/
│   │   ├── Escuelas/  (8 reportes PDF)
│   │   └── Grupo/     (10 reportes PDF)
│   │
│   └── 📁 4 Plantilla de correo para envío de resultados/
│       └── Plantilla para envío de resultados.docx
│
└── 📄 Flujo_General de la ED.docx         # Documentación del proceso
```

---

## 🚀 Instalación

### Requisitos del Sistema

- **Sistema Operativo:** Windows 7 / 8 / 10 / 11
- **Framework:** .NET Framework 4.5 o superior
- **Procesador:** x86 (32-bit)
- **RAM:** 2 GB mínimo
- **Espacio en Disco:** 500 MB
- **Resolución:** 1024x768 o superior

### Pasos de Instalación

1. **Descargar el instalador:**
   ```
   MACROS Evaluacion Diagnostica/2 SiCRER/SiCRER.SEPT_24.25/
   Instalador SiCRER_24_25_SEPT.exe
   ```

2. **Ejecutar el instalador:**
   - Hacer doble clic en `Instalador SiCRER_24_25_SEPT.exe`
   - Seguir el asistente de instalación
   - El sistema creará un acceso directo en el escritorio

3. **Primera ejecución:**
   - Abrir SiCRER desde el acceso directo
   - Verificar conexión a la base de datos
   - Cargar plantillas de formatos según nivel educativo

---

## 📖 Uso del Sistema

### Flujo de Trabajo

```
1. CAPTURA DE DATOS
   └─> Usar formatos Excel por nivel educativo
   
2. IMPORTACIÓN
   └─> Abrir SiCRER y cargar datos desde Excel
   
3. PROCESAMIENTO
   └─> El sistema calcula automáticamente indicadores
   
4. GENERACIÓN DE REPORTES
   └─> Seleccionar escuela/grupo y generar PDFs
   
5. DISTRIBUCIÓN
   └─> Enviar reportes usando plantilla de correo
```

### Tipos de Reportes

**Reportes de Escuela (Consolidados):**
- Reporte por materia y grado
- Distribución de niveles de logro
- Comparativa entre grupos

**Reportes de Grupo (Detallados):**
- Ficha individual por estudiante
- Todas las competencias evaluadas
- Observaciones y recomendaciones

---

## 📊 Documentación Técnica

Este repositorio incluye análisis técnico exhaustivo preparado bajo metodología PSP (Personal Software Process) y RUP (Rational Unified Process):

### 📋 FLUJO_OPERATIVO_OFICIAL.md ⭐ NUEVO
Documentación basada en diagramas oficiales SEP/DGADAE:
- Flujo completo de información con actores y roles
- 10 Equipos de validación procesando en paralelo
- Volumetría: Preescolar (5), Primaria (30), Secundaria (15) reportes/escuela
- Sistema Reporteador automatizado (1.5 min/escuela)
- Cuellos de botella y oportunidades de mejora
- Consideraciones LGPDP del flujo de datos
- **Audiencia:** Todos los roles - Entender operación completa
- **Tiempo de lectura:** 20 minutos

### 📊 DASHBOARD_VISUAL.md ⭐ NUEVO
Panel de métricas y visualizaciones interactivas:
- 15+ diagramas Mermaid (pie, gantt, flowcharts, quadrants)
- Puntuación general del sistema (6.5/10)
- Arquitectura actual vs. propuesta
- Roadmap de modernización visual
- Análisis de inversión y ROI
- Matriz de riesgos interactiva
- Stack tecnológico antes/después
- **Audiencia:** Project Managers, Stakeholders
- **Tiempo de lectura:** 10 minutos

### 📄 ANALISIS_DETALLADO_PSP_RUP.md
Análisis completo del sistema incluyendo:
- Arquitectura y componentes
- Modelo de datos
- Análisis de calidad PSP
- Estimaciones de esfuerzo
- Plan de modernización
- Matriz de riesgos

### 🔧 ANALISIS_TECNICO_COMPLEMENTARIO.md
Detalles técnicos profundos:
- Árbol de dependencias
- Esquema de base de datos
- Análisis de reportes Crystal
- Plan de migración detallado
- Scripts de automatización

### 📈 RESUMEN_EJECUTIVO_STAKEHOLDERS.md
Documento para tomadores de decisión:
- Hallazgos principales
- Análisis financiero (ROI)
- Opciones de modernización
- Roadmap estratégico
- Recomendaciones

---

## ⚠️ Advertencias Importantes

### 🔴 Componentes Obsoletos

El sistema contiene componentes que **requieren atención urgente**:

1. **Adobe Flash** (EOL: 31/12/2020)
   - FlashControlV71.dll
   - ShockwaveFlashObjects.dll
   - ⚠️ Vulnerabilidades de seguridad sin parches

2. **.NET Framework 4.5** (EOL: 26/04/2022)
   - Sin actualizaciones de seguridad
   - Incompatibilidad potencial con sistemas futuros

3. **Microsoft Access** (.mdb)
   - Límite de 2 GB
   - Sin soporte de concurrencia robusto
   - Riesgo de corrupción de datos

### 📋 Recomendaciones de Seguridad

- ✅ Realizar backups diarios de la base de datos
- ✅ No exponer el sistema a redes públicas
- ✅ Actualizar a versión sin componentes Flash
- ✅ Considerar migración a tecnologías modernas

---

## 🔄 Estado del Proyecto

### Versiones Disponibles

- **v1.0.0.12** - Versión estable anterior
- **v1.0.0.14** - Versión actual (última)

### Firma Digital

```
Certificado: CN=AzureAD\LuisDeLaCabadaTirado
PublicKeyToken: 4b2b2192a233fd47
Válido hasta: 08/08/2025
```

---

## 🛠️ Mantenimiento y Soporte

### Problemas Conocidos

1. **Reportes grandes (F2, F3)** consumen mucha memoria
2. **Tiempo de generación** puede ser lento con muchos estudiantes
3. **Compatibilidad Windows 11** no completamente probada

### Soporte Técnico

Para problemas técnicos o consultas:
1. Revisar la documentación técnica incluida
2. Verificar logs en: `C:\Users\[usuario]\AppData\Local\SiCRER\Logs`
3. Contactar al equipo de desarrollo

---

## 📈 Roadmap

### Corto Plazo (0-3 meses)
- [ ] Eliminar componentes Flash
- [ ] Implementar backups automáticos
- [ ] Actualizar documentación de usuario

### Mediano Plazo (3-6 meses)
- [ ] Migrar a stack open source (Node.js + NestJS)
- [ ] Reemplazar Crystal Reports → Puppeteer + Handlebars
- [ ] Migrar base de datos MS Access → PostgreSQL 16

### Largo Plazo (6-12 meses)
- [ ] Evaluar arquitectura web
- [ ] Implementar APIs REST
- [ ] Sistema de autenticación moderno

---

## 👥 Contribuciones

Este es un proyecto institucional de la SEP. Las contribuciones deben seguir:

1. Políticas de la SEP para sistemas informáticos
2. Cumplimiento LGPDP (protección de datos)
3. Estándares de código .NET
4. Proceso de revisión y aprobación

---

## 📜 Licencia

Este proyecto está licenciado bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para detalles.

```
MIT License

Copyright (c) 2025 dleonsystem

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 📞 Contacto

- **Propietario:** SEP
- **Repositorio:** https://github.com/dleonsystem/sep_evaluacion_diagnostica
- **Organización:** Secretaría de Educación Pública (SEP) - México

---

## 🙏 Agradecimientos

- Secretaría de Educación Pública (SEP)
- Directivos y docentes participantes en la evaluación diagnóstica
- Equipo de desarrollo y QA
- Comunidad .NET

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos totales | 73 |
| Tamaño del repositorio | ~255 MB |
| Líneas de código (estimadas) | 50,000 - 80,000 |
| Reportes Crystal | 10 plantillas |
| Formatos Excel | 4 plantillas |
| Base de datos | 25.23 MB |

---

## 🔗 Enlaces Útiles

- [Documentación .NET Framework](https://docs.microsoft.com/dotnet/framework/)
- [Crystal Reports Documentation](https://help.sap.com/crystal-reports)
- [ClickOnce Deployment](https://docs.microsoft.com/visualstudio/deployment/clickonce-security-and-deployment)
- [LGPDP México](https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPDPPSO.pdf)

---

**Última actualización:** 21 de Noviembre de 2025  
**Mantenido por:** dleonsystem  
**Estado:** En Producción
