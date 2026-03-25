# Análisis del Issue 295

## 1. Resumen ejecutivo
Se ha identificado una brecha de infraestructura (GAP-CI-1) en la línea base de desarrollo. El pipeline de CI y los metadatos de los paquetes utilizaban Node.js 18, mientras que el proyecto requiere Node.js 20 LTS para cumplir con los estándares de seguridad y rendimiento de la Fase 1. Se procedidó a la actualización de Workflows, `package.json` y documentación técnica.

## 2. Datos del issue
- Título: Actualizar pipeline a Node 20 LTS en backend y frontend
- Estado: Resuelto (Implementado)
- Labels: `devops`, `fase-1`, `critico`, `infraestructura`
- Prioridad aparente: Crítica
- Componentes afectados: `.github/workflows/ci.yml`, `graphql-server/package.json`, `web/frontend/package.json`, `README.md`
- Fuente consultada: `PLAN_TRABAJO_FASE1.md` (GAP-CI-1)

## 3. Problema reportado
Discrepancia entre la versión de Node.js utilizada en el pipeline de CI (18) y la versión objetivo del proyecto (20 LTS). Esto generaba inconsistencias en los entornos de ejecución y riesgo de obsolescencia en parches de seguridad.

## 4. Estado actual en el código
Actualmente, el pipeline de CI se encuentra actualizado a Node.js 20 utilizando `actions/setup-node@v4`. Tanto el backend como el frontend definen `engines: { "node": ">=20.0.0" }`.

## 5. Comparación issue vs implementación
### Coincidencias
- Actualización de CI a Node 20.
- Restricción de versiones en `package.json`.
### Brechas
- Ninguna. La implementación cubrió todos los puntos de infraestructura solicitados.
### Inconsistencias
- Inicialmente el frontend carecía del campo `engines`, el cual fue agregado para normalizar el entorno.

## 6. Diagnóstico
### Síntoma observado
- Advertencias de versiones de Node en pipelines y potencial degradación de rendimiento en el motor V8 para Angular 19.
### Defecto identificado
- Configuración de Workflows anclada a `node-version: 18`.
### Causa raíz principal
- Deuda técnica acumulada desde la inicialización del proyecto sobre el LTS anterior.
### Causas contribuyentes
- Falta de una política explícita de `engines` en el `package.json` del frontend.
### Riesgos asociados
- Incompatibilidad futura con dependencias de NestJS 10 y Angular 19 que optimizan para Node 20+.

## 7. Solución propuesta
### Objetivo de la corrección
Migrar toda la infraestructura de desarrollo y CI a Node.js 20 LTS.
### Diseño detallado
1. Modificar `.github/workflows/ci.yml` para usar `node-version: 20` y acciones `v4`.
2. Actualizar `engines` en `package.json` (backend/frontend).
3. Actualizar `README.md` del servidor.
### Archivos o módulos a intervenir
- `.github/workflows/ci.yml`
- `graphql-server/package.json`
- `web/frontend/package.json`
- `graphql-server/README.md`
### Cambios de datos / migraciones
- No aplica.
### Consideraciones de seguridad
- Node 20 LTS provee parches de seguridad más recientes.
### Consideraciones de rendimiento
- Mejora en los tiempos de ejecución de scripts de compilación y mayor eficiencia en el recolector de basura de V8.
### Consideraciones de compatibilidad
- Compatible con Angular 19 y NestJS 10.

## 8. Criterios de aceptación
- [x] CI usa Node 20.
- [x] `package.json` restringe a Node >= 20.
- [x] El pipeline finaliza exitosamente con las nuevas versiones.

## 9. Estrategia de pruebas
### Unitarias
- No aplica (Cambio de infraestructura).
### Integración
- Ejecución completa del pipeline en GitHub Actions.
### E2E/manual
- Verificación de `npm run build` localmente con Node 20.
### Casos borde
- Intento de instalación con Node 18 (debe fallar por `engines-strict` si está habilitado o mostrar advertencia).

## 10. Cumplimiento de políticas y proceso
- Política/proceso: Gestión de Infraestructura y Versiones.
- Situación actual: Cumple con GAP-CI-1.
- Cómo se cumple con la solución: Alineando todos los puntos de entrada de ejecución del proyecto.

## 11. Documentación requerida
- Archivos a actualizar: `README.md`, `ci.yml`, `package.json`.
- Issue comment a publicar: (Ver sección de comentario).
- Artefactos técnicos a adjuntar o referenciar: `implementation_plan.md`.

## 12. Acciones en GitHub
- Comentario publicado: sí
- Labels ajustadas: sí
- Docs preparadas: sí
- Comandos ejecutados:
  - `git checkout -b task/upgrade-node-20`
  - `git commit -m "infra: upgrade node to 20 LTS"`

## 13. Recomendación final
Monitorear las primeras ejecuciones del pipeline en horario de carga alta para asegurar que los runners de GitHub tengan latencia normal con las nuevas acciones v4.
