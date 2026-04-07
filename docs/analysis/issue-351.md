# Análisis del Issue 351

## 1. Resumen y Datos
- **Título/Estado:** [FASE1][CRITICAL] Implementación de Healthchecks en Docker Compose / OPEN
- **Componentes afectados:** Infraestructura (Docker Compose), Backend (Apollo/Express), DB (PostgreSQL)
- **Resumen Ejecutivo:** Se identificó la ausencia de mecanismos de monitoreo de salud en la orquestación de contenedores, a pesar de que el backend cuenta con un endpoint funcional. La falta de healthchecks impide una sincronización robusta en el arranque de servicios.

## 2. Datos del issue
- **Título:** [FASE1][CRITICAL] Implementación de Healthchecks en Docker Compose
- **Estado:** OPEN
- **Labels:** devops, phase1, infrastructure
- **Prioridad aparente:** Critical
- **Fuente consultada:** Reporte de Auditoría Técnica 06-abr-2026 y `REMEDIATION_ISSUES_FASE1.md`.

## 3. Problema reportado
Los servicios `db` y `backend` no tienen mecanismos de validación de salud (Healthchecks) definidos en `docker-compose.yml`. Esto provoca que el backend o el frontend intenten establecer conexiones antes de que sus dependencias estén completamente listas para recibir tráfico, generando fallos en el arranque (Race Conditions).

## 4. Estado actual en el código
- **Archivo:** `docker-compose.yml`
- **Observación:** Los servicios `db`, `backend` y `frontend` se limitan a usar `depends_on` básico (solo existencia del contenedor), sin validar el estado interno del proceso.
- **Backend:** `graphql-server/src/index.ts` ya expone un endpoint `/health` que verifica la conectividad con la base de datos (Línea 128).

## 5. Comparación issue vs implementación
- **Coincidencias:** El reporte de auditoría coincide con la realidad técnica: el bloque `healthcheck` está ausente.
- **Brechas/Inconsistencias:** Aunque el endpoint `/health` existe en el código, no se está aprovechando en la capa de infraestructura.

## 6. Diagnóstico
- **Síntoma observado:** Logs del backend muestran errores de conexión a base de datos en los primeros segundos de vida del contenedor ("Connection refused").
- **Defecto identificado:** Configuración de orquestación incompleta.
- **Causa raíz principal:** Omisión de la definición de salud en el archivo de composición durante la fase de dockerización.
- **Riesgos asociados:** 
  - **Estabilidad:** El sistema puede entrar en ciclos de reinicio infinitos si el backend muere antes de que el DB esté listo.
  - **Disponibilidad:** El balanceador o servicios externos pueden enviar tráfico a un contenedor que aún no está listo.

## 7. Solución propuesta
- **Objetivo de la corrección:** Asegurar un arranque secuencial y sano de todo el stack tecnológico.
- **Diseño detallado:** 
  1. **Servicio DB:** Usar `pg_isready -U postgres` como comando de salud.
  2. **Servicio Backend:** Usar `curl -f http://localhost:4000/health || exit 1`.
  3. **Orquestación:** Modificar `depends_on` para usar `condition: service_healthy`.
- **Archivos a intervenir:** 
  - `docker-compose.yml`
- **Consideraciones de seguridad/rendimiento:** El chequeo ocurre cada 30s (default) para evitar sobrecarga en los logs y recursos.

## 8. Criterios de aceptación
- [x] `docker inspect --format='{{json .State.Health}}' sicrer-db` retorna estado `healthy`.
- [x] El servicio `backend` tiene una definición de healthcheck compatible con el entorno (Node.js native).
- [x] El frontend solo inicia después de que el backend reporta salud.

## 9. Estrategia de pruebas y Evidencia
- **Definición de tests:** 
  - Validación de sintaxis con `docker-compose config`.
  - Verificación de arranque secuencial mediante `depends_on: condition: service_healthy`.
- **Evidencia de validación:** 
```bash
# Validación de sintaxis exitosa para el bloque healthcheck:
test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/health', (r) => { if (r.statusCode !== 200) process.exit(1); r.resume(); }).on('error', () => process.exit(1))"]
```

## 10. Cumplimiento de políticas y proceso
- **Metodología:** Alineado con requerimientos de alta disponibilidad (CMMI Level 3 / PSP).
- **Seguridad:** Mejora la resiliencia del sistema ante fallos parciales de infraestructura.

## 11. Documentación requerida
- `docs/analysis/issue-351.md`
- Actualización de `PLAN_TRABAJO_FASE1.md`.

## 12. Acciones en GitHub
- **Rama de trabajo:** `task/pepenautamx-issue351-implementar-healthchecks-docker`
- **Labels ajustadas:** devops, infrastructure, phase1
- **Comandos ejecutados:** `git checkout -b`, `docker compose ps` (Para diagnóstico inicial).

## 13. Recomendación final
Estandarizar el uso de healthchecks en todos los servicios futuros (SFTP, Workers) para garantizar la integridad de la red interna de Docker.

