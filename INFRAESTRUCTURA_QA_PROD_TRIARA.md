# Propuesta técnica de infraestructura (TRIARA / SEP)

## 1) Arquitectura objetivo (2 VMs)

La arquitectura considera dos máquinas virtuales y contenedorización Docker en cada una:

- **vm-qa-01**: ambiente de QA.
- **vm-prod-01**: ambiente de Producción.

Cada VM ejecuta los siguientes contenedores:
- Balanceador / reverse proxy (`lb`)
- Aplicación (`app`)
- Base de datos (`db`)
- File server (`files`)

---

## 2) Dimensionamiento técnico ajustado (totales solicitados)

**Totales globales requeridos:**
- **CPU:** 20 vCPU
- **RAM:** 40 GB
- **Disco (DD):** 2.2 TB

| VM | Ambiente | vCPU | RAM | Disco SO | Disco datos/logs | Disco total VM |
|---|---|---:|---:|---:|---:|---:|
| vm-qa-01 | QA | 6 | 8 GB | 100 GB SSD | 300 GB SSD | 400 GB |
| vm-prod-01 | Producción | 14 | 32 GB | 200 GB SSD | 1.6 TB SSD/NVMe | 1.8 TB |

**Suma total propuesta:** 20 vCPU, 40 GB RAM, 2.2 TB DD.

---

## 3) Asignación de recursos por contenedor (referencial)

### vm-qa-01 (6 vCPU / 8 GB)
- `lb-qa`: 0.5 vCPU / 512 MB
- `app-qa`: 2 vCPU / 2.5 GB
- `db-qa`: 2.5 vCPU / 3.5 GB
- `files-qa`: 1 vCPU / 1.5 GB

### vm-prod-01 (14 vCPU / 32 GB)
- `lb-prod`: 1 vCPU / 2 GB
- `app-prod`: 5 vCPU / 10 GB
- `db-prod`: 6 vCPU / 16 GB
- `files-prod`: 2 vCPU / 4 GB

Recomendación de operación Docker:
- Definir límites `cpus`, `memory` y `pids` por contenedor.
- Configurar `restart: always` en servicios críticos.
- Mantener versionado semántico de imágenes y registro privado.

---

## 4) Almacenamiento y persistencia

### vm-qa-01 (400 GB)
- `/data/db-qa` 180 GB
- `/data/files-qa` 90 GB
- `/data/logs-qa` 30 GB
- SO: 100 GB

### vm-prod-01 (1.8 TB)
- `/data/db-prod` 1.0 TB
- `/data/files-prod` 500 GB
- `/data/logs-prod` 100 GB
- SO: 200 GB

Recomendaciones:
- Separar almacenamiento de BD, archivos y logs.
- Asignar el volumen de BD en producción sobre SSD/NVMe con IOPS garantizadas.
- Monitorear crecimiento mensual para ampliar capacidad antes de saturación.

---

## 5) Red y seguridad

- VLAN separadas para QA y Producción.
- Exposición externa únicamente por `443/TCP` hacia `lb`.
- Puerto de `db` y `files` limitado a red privada.
- Acceso administrativo por VPN/bastión, SSH con llave y MFA.
- Secretos fuera de `docker-compose` (vault o gestor seguro).
- Hardening base del sistema operativo y parchado mensual.

---

## 6) Respaldo y continuidad

### QA
- Full semanal + incremental diario.
- Retención: 15 días.
- Objetivo: RPO 24 h / RTO 8 h.

### Producción
- Full semanal + incremental diario.
- Logs de transacción cada 15 minutos.
- Retención: 90 días + archivo mensual.
- Objetivo: RPO 15 min / RTO 2 h.

Práctica operativa:
- Ejecutar prueba de restauración mensual documentada.

---

## 7) Observabilidad y operación

Métricas mínimas:
- Infraestructura: CPU, RAM, disco, IOPS, latencia de red.
- Aplicación: latencia p95/p99, tasa de error, throughput.
- Base de datos: locks, consultas lentas, crecimiento de tablas e índices.

Herramientas sugeridas:
- Prometheus + Grafana + Alertmanager.
- Centralización de logs en ELK/OpenSearch.

---

## 8) Recomendaciones de crecimiento

### Escalamiento vertical (primera etapa)
- Incrementar recursos de `vm-prod-01` cuando se cumpla alguno de estos umbrales:
  - CPU > 70% sostenido por 15 minutos.
  - RAM > 80% sostenida.
  - IOPS > 75% sostenidas.

### Escalamiento horizontal (segunda etapa)
- Incorporar `vm-prod-02` para separar `app/lb` y habilitar alta disponibilidad.
- Migrar `db` a nodo dedicado o servicio administrado con réplica/standby.
- Incorporar balanceador institucional L7 para distribución activa-activa.

### Madurez operativa (tercera etapa)
- Orquestación con Kubernetes (si aplica a la operación del proyecto).
- Estrategias blue/green o canary para despliegues.
- Automatización de capacidad y costos con revisiones trimestrales.
