# Análisis de Incidencia: Visibilidad de Estados y Ajustes UI en Panel de Administrador y Cargas

## 1. Descripción del Problema

Se reportaron tres problemas principales relacionados con la gestión de estados y la interfaz de usuario:
1. **Desaparición de registros en el Panel de Administrador:** Los archivos cargados no eran visibles para el administrador debido a un error de validación en el servidor GraphQL.
2. **Confusión en estados (RECHAZADO):** El sistema mostraba la etiqueta "RECHAZADO" (en rojo y con apariencia de botón) para archivos que tenían errores técnicos de validación, lo cual generaba confusión al usuario profesor, sugiriendo una acción administrativa manual.
3. **Sección expandible innecesaria:** La vista de historial de cargas del profesor permitía expandir cada fila para ver detalles técnicos y de descarga que resultaban redundantes o innecesarios para el flujo de trabajo actual.

## 2. Análisis Técnico

### 2.1 Desfase en GraphQL Enum
El servidor GraphQL tiene un tipo `EstadoValidacion` definido como un Enum estricto:
```graphql
enum EstadoValidacion {
  PENDIENTE
  VALIDADO
  RECHAZADO
  EN_PROCESO
}
```
En el resolver `getSolicitudes`, se estaba intentando mapear estados inválidos del catálogo de la base de datos (`cat_estado_validacion_eia2`) al texto `"ERROR DE VALIDACIÓN"`. Al no estar este texto en el Enum del esquema, Apollo Server rechazaba la respuesta, provocando que la lista de registros llegara vacía al frontend del administrador.

### 2.2 UI/UX del Estado en la Vista del Profesor
La columna "ESTADO" en la vista de cargas del profesor utilizaba elementos `<button>` que daban la impresión de ser interactivos, cuando su propósito era puramente informativo. Además, el mapeo de colores asignaba el rojo al estado "RECHAZADO", incluso para fallos técnicos.

## 3. Soluciones Implementadas

### 3.1 Backend (GraphQL Server)
- Se corrigió el mapeo en `resolvers.ts` dentro de `getSolicitudes`. Ahora, los códigos internos `INVALIDO` y `RECHAZADO` de la base de datos se mapean al valor técnico `RECHAZADO`, cumpliendo con el Enum de GraphQL y restaurando la visibilidad en el Panel de Administrador.
- Se aseguró que las nuevas cargas exitosas marquen el estado como `VALIDO` (ID 1) para que el flujo sea consistente.

### 3.2 Frontend (Web App)
- **Sincronización de Interfaces:** Se actualizó `SolicitudEia2` en `evaluaciones.service.ts` para tratar el campo `estadoValidacion` como `string`, reflejando el mapeo dinámico del backend.
- **Corrección de Etiquetas:** En `ArchivosEvaluacionComponent`, se implementó una lógica de visualización que intercepta el estado técnico `RECHAZADO` y lo muestra al usuario como `"ERROR DE VALIDACIÓN"` en texto simple.
- **Simplificación UI:**
  - Se eliminó la capacidad de expandir las filas en el historial de cargas.
  - Se eliminó el código relacionado con `idRegistroExpandido` y `alternarDetalle`.
  - Se limpió el SCSS eliminando estilos redundantes de la sección expandible.
  - Se transformaron los botones de estado en etiquetas de texto (`<span>`) para mejorar la semántica de la interfaz.

## 4. Verificación
- [x] Los registros son visibles nuevamente en el Panel del Administrador.
- [x] El estado de error técnico se muestra como "ERROR DE VALIDACIÓN" en lugar de "RECHAZADO".
- [x] La columna de estados ya no contiene botones interactivos.
- [x] Las filas del historial de cargas ya no son expandibles.

## 5. Conclusión
Con estos ajustes, se ha estabilizado la comunicación entre el servidor y el cliente, eliminando errores de validación de esquema y mejorando la claridad de la información presentada al usuario final.
