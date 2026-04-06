# Análisis Técnico - Issue #265

## 1. Información General
- **ID del Issue**: #265
- **Título**: CRUD Catálogo de Escuelas (Fase 1)
- **Módulo**: Backend (GraphQL Server)
- **Asignado a**: Administrador / Sistema
- **Fecha de Análisis**: 2026-04-06

## 2. Descripción del Problema
Se requería habilitar el módulo de administración ABCC (Alta, Baja, Cambio, Consulta) para el catálogo principal de Escuelas. El frontend ya contaba con el diseño del modal y servicio (`escuelas.service.ts`), pero faltaban las mutaciones GraphQL de infraestructura (`createEscuela`, `updateEscuela`, `deleteEscuela`), con prioridad en asegurar que las eliminaciones fueran lógicas (Soft Delete).

## 3. Diagnóstico (Root Cause Analysis - RUP)
1. **Falta de Mutaciones**: Los endpoints para escribir/eliminar no estaban definidos en el `Mutation` de `typeDefs.ts`.
2. **Compatibilidad Front-Back**: Se detectó que la interfaz `deleteEscuela` solicitaba devolver una estructura con mensaje de éxito (`DeleteResponse`).
3. **Escalamiento Preventivo**: Eliminar físicamente registros de maestros o de catálogos puede corromper datos de evaluaciones históricas. Se requería un esquema de Soft Delete (`activo = false`).

## 4. Solución Técnica Implementada (PSP)
### 4.1. Esquema GraphQL (`typeDefs.ts`)
- Se inyectó la mutación `deleteEscuela(id: ID!): DeleteResponse!` para cerrar el ciclo CRUD del administrador.
- Se verificó la disponibilidad de los `Input Types` para inserción/modificación interactuando de forma congruente con `Escuela!`.

### 4.2. Lógica de Negocio (`resolvers.ts`)
Se implementó en la capa de resolutores (Mutation block) las siguientes garantías:
1. **deleteEscuela**: Efectúa una transacción controlada hacia PostgreSQL con un comando de actualización `UPDATE escuelas SET activo = false, updated_at = NOW() WHERE id = $1`. Si el ID no existe, se arroja excepción, interrumpiendo un proceso inválido.
2. **Trazabilidad Continua**: Se vincula la llamada hacia la tabla `log_actividades` registrando `DELETE_ESCUELA` sobre el ID de la escuela procesada; resguardando de esta manera la autoría y el momento dictado bajo prácticas RUP.

## 5. Pruebas de Validación Físicas (Criterios de Aceptación)
- [x] La mutación `deleteEscuela` desactiva (Oculta) en lugar de un `DELETE CASCADE`.
- [x] El servidor se levanta sin errores de compilación Type/Resolvers Mismatch.

## 6. Consideraciones de Seguridad (OWASP)
1. **Validación de Identidad**: Toda mutación pasa sobre el contexto verificado.
2. **Inyección SQL Abatida**: Todas las variables ($1) de actualización entran purificadas a la base por parte de la librería (pg).
3. **Integridad Histórica**: Se blindaron las Evaluaciones y Estudiantes debido a que el "Soft Delete" preserva los identificadores y relaciones.
