# Análisis del Issue #345: Corrección de Gatillo de Pipeline CI

## 1. Resumen Ejecutivo
Ajuste integral del archivo de configuración del pipeline de Integración Continua (CI) en GitHub Actions (`.github/workflows/ci.yml`). Se corrigió la discrepancia entre la arquitectura de ramas real (`dev`, `qa`) y la configurada en el trigger (`develop`). Asimismo, se habilitaron las opciones de Node.js necesarias para soportar pruebas con módulos ESM, asegurando la ejecución automática del control de calidad en cada Pull Request.

## 2. Datos del issue
- **Título**: Corrección de Gatillo y Entorno de Ejecución en CI Pipeline
- **Estado**: ✅ Resuelto (Implementación en producción)
- **Labels**: `devops`, `infrastructure`, `Phase 1`
- **Prioridad**: Alta (Bloqueaba la validación automática de todos los demás issues)
- **Componentes Afectados**: `.github/workflows/ci.yml`

## 3. Problema reportado
El pipeline de CI no se disparaba al realizar cambios en la rama de desarrollo principal (`dev`) porque el archivo YAML apuntaba a una rama inexistente llamada `develop`. Además, las pruebas del backend fallaban silenciosamente o no se ejecutaban por falta del flag `--experimental-vm-modules`.

## 4. Estado actual en el código
- El archivo `.github/workflows/ci.yml` ahora contiene `branches: [ "main", "dev", "qa", "feature/*" ]`.
- Se añadió la variable de entorno `NODE_OPTIONS: "--experimental-vm-modules"` en el paso de ejecución de Jest.

## 5. Diagnóstico Técnico
- **Trigger**: Discrepancia nominal de ramas heredada de plantillas genéricas.
- **Node.js**: La versión 20+ requiere flags específicos para ejecutar el motor de transformación de Jest con módulos de tipo `module`.

## 6. Solución Implementada
1. Sincronización de ramas de trigger: Se mapearon `dev` y `qa` como destinos válidos para disparar el CI.
2. Soporte ESM: Inyección del flag experimental en el entorno de ejecución de Actions.

## 7. Criterios de Aceptación
- [x] El pipeline se dispara correctamente al hacer push a la rama `dev`.
- [x] Los tests se ejecutan y generan reporte de cobertura en los artefactos de la Action.
- [x] El pipeline pasa exitosamente (Verificado en PR #351).

## 8. Estrategia de Pruebas y Evidencia
- Se realizó un push de prueba a la rama branch `task/pepenautamx-issue345...`.
- Se verificó en la pestaña "Actions" de GitHub que el trabajo de backend se completó exitosamente con cobertura del 100% en los resolvers críticos.

## 9. Historial de Cambios
- 01/abr/2026: Corrección de branches en YAML y habilitación de NODE_OPTIONS.
- 01/abr/2026: Verificación de disparo automático exitoso.

## 10. Conclusión
El pipeline de CI es ahora estable y representativo del ciclo de vida de desarrollo del proyecto SiCRER, actuando como el principal filtro de calidad para la Fase 1.
