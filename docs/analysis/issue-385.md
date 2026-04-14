# Dictamen de Implementación - Issue #385
## Requerimiento: Sanitización y Flexibilización de archivos Excel

### 1. Resumen del Trabajo
Se ha implementado una capa de sanitización y validación robusta para los archivos de evaluación Excel, equilibrando la seguridad técnica (prevención de inyección) con la flexibilidad de negocio necesaria para la carga masiva.

### 2. Cambios Realizados

#### Backend (`graphql-server`) y Frontend (`web/frontend`)
- **Sanitización de Seguridad (Mandatorio)**:
  - Rechazo de **Fórmulas (`.f`)** e **Hipervínculos (`.l`)** en nombres y valoraciones para prevenir inyección de código.
  - Bloqueo de **Errores de Excel (`#REF!`, `#VALOR!`)** para garantizar la integridad de los resultados.
  - Validación de existencia de todas las hojas requeridas por nivel educativo.
- **Flexibilización de Captura (Opcionales)**:
  - **Identidad**: El "Nombre del Alumno", "Número de Lista" y "Sexo" ahora son **opcionales** para permitir la carga de registros con datos parciales.
  - **Escuela**: El "Nombre de la Escuela" en la hoja ESC es opcional (se recupera vía CCT).
- **Reglas de Formato Suavizadas**:
  - **Nombres**: Se permiten letras, espacios y **puntos** (para abreviaturas como GPE. o MA.).
  - **Grupos**: Se permiten letras, números y **espacios** (ej. 'A 1', 'B 2'). Se mantiene el bloqueo a comillas y símbolos especiales.
  - **Número de Lista**: Se permite cualquier formato alfanumérico (ej. '1|8', '20-A') para evitar bloqueos por errores de dedo.

### 3. Matriz de Validación Final

| Caso de Prueba | Resultado | Regla Aplicada / Motivo |
| :--- | :--- | :--- |
| Archivo con Contraseña | **RECHAZO** | Seguridad de lectura (Protección XLSX) |
| Fórmula en valoración | **RECHAZO** | Seguridad (Prevención de inyección) |
| Hipervínculo en nombre | **RECHAZO** | Seguridad (Prevención de links maliciosos) |
| Error de Excel (`#REF!`) | **RECHAZO** | Integridad (Detección de celdas rotas) |
| Nombre con punto (`MARÍA G.`) | **VÁLIDO** | Flexibilidad (Permitir abreviaturas) |
| Grupo con espacio (`A 1`) | **VÁLIDO** | Flexibilidad (Formato de plantilla admitido) |
| Grupo con comillas (`"A1"`) | **RECHAZO** | Calidad (Limpieza de inyección de texto) |
| N° de Lista no numérico (`1/8`) | **VÁLIDO** | Flexibilidad (Tolerancia a errores de captura) |
| Nombre o Sexo vacío | **VÁLIDO** | Negocio (Campos ya no obligatorios) |
| Archivo sin ningún alumno | **RECHAZO** | Integridad (Debe tener al menos un registro) |

### 4. Estado de la Implementación
- [x] Sincronización Backend/Frontend finalizada.
*   [x] Sanitización de seguridad operativa.
*   [x] Flexibilidad de campos opcionales aplicada.
*   [x] Soporte para abreviaturas y espacios en nombres/grupos.

**Documentación generada por:** Antigravity (IA)
**Fecha:** 14 de Abril de 2026
