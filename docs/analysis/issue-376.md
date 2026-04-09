# Análisis Técnico - Issue #376
## Lógica de Negocio: Validación de duplicidad por CCT y Turno

### 1. Descripción del Problema
El sistema debe garantizar que cada combinación de CCT (Clave de Centro de Trabajo) y Turno tenga una representación única en el periodo de evaluación. Actualmente, la validación de duplicados está ligada al `usuario_id`, lo que permite que diferentes usuarios carguen información para la misma escuela/turno, generando inconsistencias en los reportes federales.

### 2. Causa Raíz
En el resolver `uploadExcelAssessment`, la consulta SQL para detectar duplicados incluye el filtro `usuario_id = $3`. Esto restringe la búsqueda a "mis propias cargas", ignorando si otro usuario ya registró esa misma escuela. Además, el sistema debe ser capaz de identificar duplicados incluso si el archivo físico tiene un nombre diferente, basándose estrictamente en los metadatos `CCT` y `TURNO`.

### 3. Solución Propuesta (PSP/RUP)
Endurecer la regla de validación de persistencia.

#### Especificaciones Técnicas:
- **Consulta de Detección**: Cambiar la query para buscar `id` en `solicitudes_eia2` donde `cct = $1 AND id_turno = $2`.
- **Manejo de Reemplazo**: Si se encuentra una solicitud (de cualquier usuario), el sistema debe:
  1. Notificar que ya existe un registro activo.
  2. Solicitar confirmación para sobrescribir.
  3. Si se confirma, el nuevo `usuario_id` tomará "posesión" de la solicitud o se mantendrá el vínculo según la regla de negocio final (Fase 1 define que el Responsable CCT es quien tiene la última palabra).

### 4. Criterios de Aceptación
- [ ] No es posible subir dos archivos validos para la misma CCT+Turno sin confirmación de reemplazo.
- [ ] La validación es transversal a todos los usuarios del sistema.
- [ ] El cambio de nombre del archivo `.xlsx` no burla la validación de duplicidad.

### 5. Seguridad (OWASP)
Esta validación previene ataques de **Inyectabilidad de Datos** y duplicación maliciosa que podrían afectar la integridad de las estadísticas nacionales de evaluación.
