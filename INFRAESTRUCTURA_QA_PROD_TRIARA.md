# Propuesta de infraestructura de máquinas virtuales en TRIARA (SEP)

## 1) Objetivo
Definir una arquitectura base para **ambiente QA** y **ambiente Producción** para un equipo/proyecto dockerizado, considerando prácticas de PSP, DevOps, DBA, administración de servidores y cloud.

---

## 2) Supuestos de diseño
- Aplicación dockerizada con servicios API/web y procesos batch.
- Base de datos relacional (recomendado PostgreSQL o SQL Server según estándar SEP vigente).
- Carga esperada inicial media (hasta ~300 usuarios concurrentes en horarios pico) con crecimiento anual.
- Disponibilidad objetivo:
  - QA: 99.5%
  - Producción: 99.9%
- Sistema operativo recomendado: **Ubuntu Server 22.04 LTS** o **RHEL 9** (según lineamiento institucional).

---

## 3) Topología propuesta (par de VMs por ambiente)
Se propone **2 VMs por ambiente** (total 4 VMs):

- **VM-APP**: ejecución de contenedores Docker (API, frontend, workers, scheduler).
- **VM-DB**: motor de base de datos, respaldos y monitoreo de rendimiento de datos.

> Esta separación APP/DB facilita seguridad, escalabilidad y operación DBA.

---

## 4) Dimensionamiento de infraestructura

### 4.1 Ambiente QA

| VM | Rol | vCPU | RAM | Disco SO | Disco Datos | CPU sugerido (host TRIARA) | SO |
|---|---|---:|---:|---:|---:|---|---|
| qa-app-01 | Docker host (app + pruebas funcionales) | 4 | 16 GB | 120 GB SSD | 200 GB SSD | Intel Xeon Gold / AMD EPYC equivalente | Ubuntu 22.04 LTS |
| qa-db-01 | Base de datos QA | 4 | 16 GB | 120 GB SSD | 500 GB SSD (IOPS medias-altas) | Intel Xeon Gold / AMD EPYC equivalente | Ubuntu 22.04 LTS |

**Notas QA**
- Pool Docker con límites por contenedor (`cpu`, `memory`) para pruebas de estrés.
- Snapshot previo a pruebas de regresión y actualización.
- Datos enmascarados (anonimizados) para cumplir seguridad de información.

### 4.2 Ambiente Producción

| VM | Rol | vCPU | RAM | Disco SO | Disco Datos | CPU sugerido (host TRIARA) | SO |
|---|---|---:|---:|---:|---:|---|---|
| prod-app-01 | Docker host producción | 8 | 32 GB | 150 GB SSD | 300 GB SSD | Intel Xeon Gold / AMD EPYC (2.6 GHz+), virtualización enterprise | Ubuntu 22.04 LTS |
| prod-db-01 | Base de datos producción | 12 | 64 GB | 150 GB SSD | 1.5 TB SSD NVMe (IOPS altas) | Intel Xeon Gold / AMD EPYC (alto cache) | Ubuntu 22.04 LTS |

**Notas Producción**
- En producción, la VM de BD prioriza RAM e IOPS para reducir latencia y mejorar consultas.
- Reservar 20–25% de holgura para picos estacionales de operación SEP.

---

## 5) Contenedorización y despliegue

### VM-APP (QA/PROD)
- Docker Engine + Docker Compose (o Kubernetes si la madurez operativa lo justifica).
- Contenedores típicos:
  - `reverse-proxy` (Nginx/Traefik)
  - `api-backend`
  - `frontend-web`
  - `worker-batch`
  - `monitor-agent` (node exporter / fluent-bit)
- Política de imágenes:
  - Registro privado institucional.
  - Versionamiento semántico (`vX.Y.Z`) + etiqueta de commit SHA.

### VM-DB (QA/PROD)
- Motor de BD en VM dedicada (sin compartir con app).
- Volúmenes separados:
  - datos
  - logs/transacciones
  - respaldos temporales
- Parámetros DBA base:
  - Conexiones máximas acotadas por pool.
  - Mantenimiento programado (vacuum/reindex/estadísticas según motor).
  - Auditoría y bitácora de sentencias críticas.

---

## 6) Red y seguridad
- Segmentación por VLAN/subred:
  - VLAN-QA
  - VLAN-PROD
  - VLAN-MGMT (administración)
- Reglas mínimas de firewall:
  - Internet → APP: solo 443/TCP (y 80 con redirección a 443).
  - APP → DB: puerto específico del motor (ej. 5432/1433) restringido por IP.
  - SSH (22): solo por bastión/VPN y con llaves.
- Hardening:
  - CIS baseline.
  - Deshabilitar login root remoto.
  - MFA en accesos administrativos.
  - Gestión de secretos con vault (no en variables planas).

---

## 7) Respaldo, continuidad y recuperación
- Esquema de respaldos BD:
  - Full semanal.
  - Incremental diario.
  - Logs de transacción cada 15 minutos (producción).
- Retención sugerida:
  - QA: 15–30 días.
  - Producción: 90 días operativos + archivo mensual.
- Objetivos DR:
  - QA: RPO 24h / RTO 8h.
  - Producción: RPO 15 min / RTO 2h.
- Prueba de restauración: mensual y documentada.

---

## 8) Observabilidad y operación DevOps
- Monitoreo:
  - Infraestructura: CPU, RAM, disco, IOPS, latencia, red.
  - Aplicación: p95/p99, tasa de error, throughput.
  - BD: locks, tiempo de consulta, deadlocks, crecimiento de tablas.
- Herramientas sugeridas:
  - Prometheus + Grafana + Alertmanager.
  - Centralización de logs en ELK/OpenSearch.
- SLO iniciales:
  - API p95 < 800 ms en producción.
  - Error rate < 1%.
  - Disponibilidad mensual > 99.9% (prod).

---

## 9) Pipeline CI/CD (QA → PROD)
1. Commit y pruebas unitarias.
2. Build de imagen Docker y escaneo de vulnerabilidades.
3. Deploy automático a QA.
4. Pruebas funcionales/regresión + aprobación.
5. Ventana controlada de despliegue a producción (blue/green o rolling).
6. Validación post-deploy + rollback automático si falla health-check.

---

## 10) Capacidad y crecimiento recomendado
- Escalamiento vertical inicial (más vCPU/RAM).
- Umbrales para re-dimensionar:
  - CPU > 70% sostenido por 15 min.
  - RAM > 80% sostenido.
  - IOPS > 75% en disco de BD.
- Evolución objetivo (fase 2):
  - Agregar `prod-app-02` para alta disponibilidad.
  - Replicación de BD (read replica o standby).
  - Balanceador institucional en capa 7.

---

## 11) Resumen ejecutivo de recursos (mínimo viable recomendado)

### QA (2 VMs)
- **qa-app-01:** 4 vCPU, 16 GB RAM, 320 GB SSD total.
- **qa-db-01:** 4 vCPU, 16 GB RAM, 620 GB SSD total.

### Producción (2 VMs)
- **prod-app-01:** 8 vCPU, 32 GB RAM, 450 GB SSD total.
- **prod-db-01:** 12 vCPU, 64 GB RAM, 1.65 TB SSD NVMe total.

Esta propuesta ofrece una base robusta para iniciar operación formal, con separación de responsabilidades APP/DB, controles de seguridad, gobernanza DevOps y ruta clara de escalamiento.
