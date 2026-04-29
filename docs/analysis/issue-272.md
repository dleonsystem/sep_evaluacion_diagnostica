# Análisis del Issue 272

## 1. Resumen ejecutivo
El proyecto presenta una brecha de cobertura en el backend del 1.27% (actual 18.73% vs objetivo 20%), lo que bloquea el pipeline de CI/CD. Este análisis identifica que los resolvers de GraphQL en `resolvers.ts` carecen de pruebas unitarias. La solución consiste en implementar una suite de pruebas robusta usando Mocks de Jest para validar los flujos de autenticación y tickets, asegurando la estabilidad del sistema y el cumplimiento de los estándares de calidad definidos.

## 2. Datos del issue
- Título: [Alta][QA] Ampliar cobertura de pruebas backend para resolvers GraphQL críticos
- Estado: Abierto
- Labels: Alta, QA, Backend
- Prioridad aparente: Crítica (Bloqueador de Integración Continua)
- Componentes afectados: `graphql-server/src/schema/resolvers.ts`, `graphql-server/src/config/database.ts`
- Fuente consultada: Issue #272, Reporte de cobertura Jest local, Matriz de trazabilidad.

## 3. Problema reportado
La lógica crítica de backend (autenticación de usuarios, gestión de tickets de soporte y recepción de evaluaciones EIA) no cuenta con pruebas unitarias suficientes. Esto no solo incumple el umbral del 20% de cobertura, sino que aumenta el riesgo de regresiones en funciones vitales del sistema.

## 4. Estado actual en el código
- **Cobertura de Líneas**: 18.73% (Faltan +1.27% para el "Green Build").
- **Archivo Resolvers**: `resolvers.ts` contiene ~2870 líneas de código con dependencias directas a base de datos y SFTP, lo que dificulta las pruebas sin una infraestructura de mocks adecuada.
- **Pruebas Existentes**: Existen pruebas para servicios aislados, pero no se integran los resolvers en el inventario actual de pruebas unitarias.

## 5. Comparación issue vs implementación
### Coincidencias
- El framework de pruebas (Jest) ya está configurado y funcional.
- Se han realizado limpiezas previas en el código que facilitan la inyección de mocks.
### Brechas
- Ausencia total de pruebas para `Mutation.authenticateUser`.
- Ausencia total de pruebas para `Mutation.createTicket`.
- Falta de validación de lógica de priorización automática de tickets.
### Inconsistencias
- El pipeline exige 20%, pero las últimas integraciones de lógica de negocio no incluyeron los tests correspondientes.

## 6. Diagnóstico
### Síntoma observado
- Fallo recurrente en GitHub Actions en el job `build-and-test-backend`.
### Defecto identificado
- Cobertura insuficiente en el módulo de resolvers.
### Causa raíz principal
- Ausencia de una suite de pruebas unitarias para el controlador principal de GraphQL (Resolvers).
### Causas contribuyentes
- Alta complejidad de los resolvers que manejan transacciones de base de datos y archivos físicos simultáneamente.
### Riesgos asociados
- Regresiones en el flujo de autenticación que podrían bloquear el acceso a todos los usuarios.
- Fallos en la creación de tickets que dejarían a los usuarios sin soporte técnico.

## 7. Solución propuesta
### Objetivo de la corrección
- Alcanzar un mínimo de 20.00% de cobertura de líneas en el backend.
- Asegurar que la lógica de autenticación y tickets esté validada ante cambios futuros.
### Diseño detallado
1. **Mocking de Infraestructura**: Configurar `jest.mock` para el módulo `database.js` y `SftpService`.
2. **Suite de Autenticación**: Validar login exitoso (con generación de JWT), login fallido (incremento de intentos) y bloqueo de cuenta.
3. **Suite de Mesa de Ayuda**: Validar creación de tickets (TKT) e incidencias públicas (PUB), incluyendo la lógica de palabras clave para prioridad ALTA.
4. **Ejecución de Cobertura**: Ejecutar `npm test -- --coverage` para confirmar el cumplimiento del umbral.
### Archivos o módulos a intervenir
- `graphql-server/src/schema/resolvers.spec.ts` (Nuevo)
- `graphql-server/src/schema/resolvers.ts` (Posibles ajustes menores de exportación)
### Cambios de datos / migraciones
- N/A (Solo pruebas unitarias).
### Consideraciones de seguridad
- Los mocks deben simular el comportamiento de `timingSafeEqual` y manejo de hashes para asegurar que la lógica de seguridad se pruebe correctamente.
### Consideraciones de rendimiento
- El uso de mocks acelerará la ejecución de la suite de pruebas al no requerir red ni I/O de disco pesado.
### Consideraciones de compatibilidad
- Asegurar compatibilidad con `ts-jest` y el modo ESM de Node.js.

## 8. Criterios de aceptación
- [ ] Cobertura de líneas en el backend >= 20.00%.
- [ ] Pruebas de `authenticateUser` cubriendo casos de éxito, error y bloqueo.
- [ ] Pruebas de `createTicket` validando adjuntos (simulados) y prioridad.
- [ ] Ejecución exitosa de `npm test` sin errores de concurrencia.

## 9. Estrategia de pruebas
### Unitarias
- Localizadas en `resolvers.spec.ts`, usando `jest` para espiar llamadas a base de datos.
### Integración
- N/A para este issue (se enfoca en unitarias para cobertura).
### E2E/manual
- Verificación de que el servidor inicia correctamente tras los cambios (Health Check).
### Casos borde
- Intentos de login con correos inexistentes.
- Creación de tickets con archivos con nombres duplicados o extensiones restringidas.

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Green Build Policy (Pipeline debe estar siempre en verde).
- Situación actual: Pipeline bloqueado por cobertura insuficiente.
- Cómo se cumple con la solución: Se añade la cobertura faltante para desbloquear el CI/CD.

## 11. Documentación requerida
- Archivos a actualizar: `INVENTARIO_PRUEBAS_REALES.md`, `MATRIZ_TRAZABILIDAD_VIGENTE.md`.
- Issue comment a publicar: Comentario técnico con resumen de hallazgos y solución.
- Artefactos técnicos a adjuntar o referenciar: Reporte de cobertura LCOV.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: sí
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/pepenautamx-issue272-cobertura-backend`
  - `npm test -- --coverage`
  - `gh issue comment 272 --body "..."`

## 13. Recomendación final
Una vez alcanzado el 20%, se recomienda integrar la lógica de pruebas para la `Carga Masiva` (UploadExcelAssessment) en un sprint posterior, ya que su complejidad (Worker Threads) requiere una configuración de mocks más avanzada.
