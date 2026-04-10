# Análisis Técnico: Issue #395 - Filtros de Búsqueda Inoperativos en Panel Admin

## 1. Diagnóstico del Problema

Tras realizar un análisis exhaustivo del código fuente en `AdminPanelComponent`, se identificaron varios puntos de falla en los mecanismos de filtrado del sistema:

### 1.1. Inoperatividad en Gestión de Usuarios
- **Causa Raíz**: El filtrado de usuarios se realizaba exclusivamente en el frontend mediante un `getter` que operaba sobre el array `this.usuarios`. Dado que este array solo contiene los datos de la página actual (límite: 10), cualquier búsqueda de un usuario que no se encontrara en los primeros 10 resultados fallaba silenciosamente ("inoperante").
- **Limitación de API**: El servicio `UsuariosService` no admitía parámetros de búsqueda, obligando al componente a realizar un filtrado parcial e ineficaz.

### 1.2. Desajuste de Paginación en Soporte e Incidencias
- **Causa Raíz**: Al cambiar los criterios de búsqueda (Texto o Estatus), la variable de página actual (`paginaSoporteActual`, `paginaIncidenciasActual`) no se reiniciaba a 1.
- **Impacto**: Si el usuario se encontraba en la página 5 y aplicaba un filtro que reducía el total a 1 página, la vista se mostraba vacía porque el sistema intentaba mostrar una página inexistente.

### 1.3. Desconexión de Eventos en Excel
- **Causa Raíz**: El cambio en el "Nivel Educativo" no disparaba la actualización de los filtros ni el reinicio de la página.

---

## 2. Solución Implementada

Se aplicó un enfoque de arquitectura cliente-servidor para las listas extensas y una mejora de reactividad para las listas locales.

### 2.1. Búsqueda en Servidor (Full-Text Search)
- **Backend (GraphQL)**: Se actualizó el esquema `listUsers` en `typeDefs.ts` para aceptar el argumento opcional `search: String`.
- **Resolutor SQL**: Se modificó el resolver en `resolvers.ts` para inyectar dinámicamente una cláusula `WHERE` con operadores `ILIKE` sobre los campos: `email`, `nombre`, `apepaterno` y `apematerno`.
- **Frontend Service**: Se actualizó `UsuariosService.listarUsuarios` para retransmitir el patrón de búsqueda al API.

### 2.2. Reactividad en el Panel Administrativo
- **Sincronización de UI**: Se añadieron disparadores `(ngModelChange)` en todos los campos de búsqueda del `AdminPanelComponent.html` para:
  1. Reiniciar la página actual a 1 de forma inmediata.
  2. Disparar la recarga de datos desde el servidor (en el caso de Usuarios y Escuelas).
- **Refactorización de Getters**: Se simplificó `usuariosFiltrados` para que refleje directamente la respuesta del servidor, eliminando la duplicidad de lógica de filtrado en el cliente.

---

## 3. Verificación y Resultados

| Módulo | Tipo de Filtro | Resultado post-fix |
| :--- | :--- | :--- |
| **Excel EIA2** | Cliente (Reactivo) | La página vuelve a 1 al cambiar nivel o texto. Sin "páginas fantasma". |
| **Soporte Técnico** | Cliente (Reactivo) | Filtrado instantáneo con reinicio de página correcto. |
| **Usuarios** | **Servidor (SQL)** | Búsqueda global funcional a través de todas las páginas de la BD. |
| **Escuelas** | Servidor (SQL) | Reinicio de página corregido al realizar búsquedas. |

## 4. Recomendaciones de Seguridad (OWASP)
- El filtrado en servidor utiliza **Consultas Parametrizadas** (`$1, $2, etc.`) para prevenir ataques de **Inyección SQL**, cumpliendo con los estándares de seguridad para el manejo de datos dinámicos.
