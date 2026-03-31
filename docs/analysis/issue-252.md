# Análisis del Issue 252

## 1. Resumen ejecutivo
El issue CU-14 plantea la necesidad de implementar la gestión administrativa (CRUD) del Catálogo de Escuelas, garantizando validaciones de negocio (unicidad, formato algorítmico CCT) de la Clave de Centro de Trabajo y persistiendo con auditoría. Tras analizar el código en el backend, se detecta que están definidos los `input` types (`CreateEscuelaInput`, `UpdateEscuelaInput`), la utilidad de validación cruda `cct-validator.ts` y las consultas (`listEscuelas`, `getEscuela`), pero existe una brecha total en la escritura: no hay mutaciones `createEscuela` ni `updateEscuela` implementadas en los esquemas y resolvers, rompiendo los criterios del CU-14 de crear/editar y auditar cambios de escuelas.

## 2. Datos del issue
- Título: CU-14: Administrar Catalogo de Escuelas
- Estado: Abierto
- Labels: enhancement, caso-de-uso, fase-1, critico, catalogos
- Prioridad aparente: Crítica (Fase 1 Web Portal, Dependencia de catalogación)
- Componentes afectados: Schema GraphQL (`typeDefs.ts`), Resolvers (`resolvers.ts`), Utilidades (`cct-validator.ts`), Frontend Angular
- Fuente consultada: `REQUERIMIENTOS_Y_CASOS_DE_USO.md` (RF-13, RNF-04, RNF-05, RNF-09)

## 3. Problema reportado
Un administrador requiere la capacidad para acceder a un endpoint seguro donde se pueda crear y editar escuelas. El entorno debe forzar la validación de CCT con precisión de formato, dígito verificador y estricta unicidad contra la base instalada. Todos los cambios deben quedar trazables. La vista debe habilitar que catálogos derivados hereden la información sin conflictos.

## 4. Estado actual en el código
- **Lectura:** Existen `listEscuelas` y `getEscuela` en `typeDefs.ts` y sus sentencias activas contra la tabla `escuelas` en `resolvers.ts`.
- **Escritura (GraphQL):** Faltan por completo las firmas `createEscuela(input: CreateEscuelaInput!): Escuela!` y `updateEscuela(id: ID!, input: UpdateEscuelaInput!): Escuela!` en el bloque `type Mutation`.
- **Implementación (Resolvers):** Inexistentes los handlers de inserción/edición de PostgreSQL. 
- **Validaciones CCT:** El algoritmo oficial (10 caracteres, dígito calculable) está debidamente abstraído en `src/utils/cct-validator.ts` (función `validateCCT(cct)`), sin embargo su llamada es huérfana para fines del CRUD ya que no hay endpoints expuestos para usar dicho archivo para el alta manual.

## 5. Comparación issue vs implementación
### Coincidencias
- El catálogo de sólo-lectura se encuentra disponible para procesos subyacentes (login, listados, catálogos de reportes).
- Las estructuras de entrada `CreateEscuelaInput` fueron mapeadas previamente.
- El algoritmo CCT ya existe en código base.
### Brechas
- "Un administrador puede crear y editar escuelas." -> Imposible, el esquema Graphql rechaza mutaciones de este conjunto, afectando directamente la tarea hija "#265 CRUD de catalogo de escuelas".
- "El sistema valida unicidad" -> Al no haber bloque de inserción, no se chequea la excepción de violación de llave única del RDBMS o pre-query.
### Inconsistencias
- Las definiciones `CreateEscuelaInput` viven en el esquema TypeScript Graphql huérfanas sin una mutación real.

## 6. Diagnóstico
### Síntoma observado
El frontend carece del punto de contacto (Mutations) para efectuar la inserción o actualización, deteniendo el flujo del Administrador del Portal Web (Phase 1).
### Defecto identificado
Desarrollo incompleto de las mutaciones `createEscuela` y `updateEscuela` en `typeDefs.ts` y falta su implementación lógica y SQL en `resolvers.ts`.
### Causa raíz principal
El trabajo de las iteraciones anteriores se detuvo únicamente en sentar las bases consultivas (Queries) necesarias para las funciones de evaluación y login, postergando la administración directiva del CU-14 por priorización.
### Causas contribuyentes
- Faltaba integración del motor de RNF de RUP para un sistema transaccional auditable.
### Riesgos asociados
- Sin el alta de manual, la aplicación pierde adaptabilidad y se vuelve esclava a inserciones a mano en DBeaver arriesgando formato CCT por error de capa 8 (DDBA editando a mano). 

## 7. Solución propuesta
### Objetivo de la corrección
Completar el endpoint de capa Backend (`typeDefs` y `resolvers`) robusto con validación cruzada y seguridad base de CCT para habilitar exitosamente la gestión web.
### Diseño detallado
1. En `graphql-server/src/schema/typeDefs.ts`: anexar `createEscuela` y `updateEscuela` dentro del `type Mutation`.
2. En `graphql-server/src/schema/resolvers.ts`: redactar ambos resolvers de mutación. 
    - a) Importar `validateCCT` de `cct-validator`. 
    - b) Ejecutar validación de CCT para formato en la operación `create`. 
    - c) Validar colisión/unicidad con PostgreSQL (verificar si la `cct` combinada con el `turno` ya existe y retornar error legible "Ya existe este modelo"). 
    - d) Escribir en bitácora de auditoría si existe contexto inyectado de log, actualizando el timestamp.
3. Asegurar validaciones de rol de acceso en directivas (módulo admin).
### Archivos o módulos a intervenir
- `graphql-server/src/schema/typeDefs.ts`
- `graphql-server/src/schema/resolvers.ts`
### Cambios de datos / migraciones
- La tabla de `escuelas` asume una constricción transaccional natural; se gestionan inserciones de llave con PG Exceptions y log geo-referencias a ID de turno.
### Consideraciones de seguridad
- Utilizar transacciones paramétricas y sanitización pre-insert previniendo inyección SQL en `cct` o `nombre`. Validar JWT Role == ADMIN.
### Consideraciones de rendimiento
- Al usar indexación de tabla base, los chequeos de unicidad tardan $< 10$ms.
### Consideraciones de compatibilidad
- Reflejar los datos retornados en base a `BASE_ESCUELA_FIELDS`.

## 8. Criterios de aceptación
- [ ] Las firmas en GraphQL Mutation permiten la invocación correcta desde el frontend.
- [ ] Fallos de formato de CCT son interceptados preventivamente por `cct-validator` arrojando error claro de negocio.
- [ ] Se capturan y devuelven correctamente violaciones de llave única.
- [ ] La tabla es persistida con base técnica y retorno de entidad completa (id).

## 9. Estrategia de pruebas
### Unitarias
- Realizar Request Mockeado para inyectar una CCT con dígito erróneo. El servicio no lo procesa y devuelve texto esperado.
### Integración
- Operar un ciclo Graphql POST de `createEscuela` -> Esperar Status True -> POST igual -> Detonar Unicidad Error. 
### E2E/manual
- El administrador usa panel Angular para crear nueva escuela con CCT '09DPR0000Z', se enlista en refresco exitosamente. Editar el teléfono; verificar que cambia para el reporte general.
### Casos borde
- CCT vacío, turno inválido foráneo de base de datos (`id_turno` sin llave foránea primaria).

## 10. Cumplimiento de políticas y proceso
- Política/proceso: RUP/PSP. Fase Construcción CRUD con reglas strict.
- Situación actual: Rompía en omisión de los entregables del CU-14 de RNF.
- Cómo se cumple con la solución: Incorpora la validación segura algorítmica y RDBMS constraint con arquitectura trazable para CRUD completo en 1 step.

## 11. Documentación requerida
- Archivos a actualizar: `docs/analysis/issue-252.md`
- Issue comment a publicar: Formato ejecutivo resumiendo técnica.
- Artefactos técnicos a adjuntar o referenciar: Plan de Implementación generado durante TDD.

## 12. Acciones en GitHub
- Comentario publicado: [por ejecutar]
- Labels ajustadas: no requirió
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue252-administrar-catalogo-escuelas`
  - `git add docs/analysis/issue-252.md`
  - `git commit -m "docs: anexa plan tecnico de analisis para CU-14 issue 252 catalogos escuelas"`

## 13. Recomendación final
Aprobar formalmente el Plan de Implementación a redactar en esta iteración para ejecutar la edición en `typeDefs.ts` y las consultas PostgreSQL en `resolvers.ts`. A partir de esto, el frontend quedará habilitado para consumirlo.
