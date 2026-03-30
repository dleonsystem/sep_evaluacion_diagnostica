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

## 2) Dimensionamiento técnico propuesto

| VM | Ambiente | vCPU | RAM | Disco SO | Disco datos/logs | CPU sugerido | SO |
|---|---|---:|---:|---:|---:|---|---|
| vm-qa-01 | QA | 4 | 12 GB | 100 GB SSD | 250 GB SSD | Intel Xeon Silver/Gold o AMD EPYC equivalente | Ubuntu Server 22.04 LTS |
| vm-prod-01 | Producción | 12 | 48 GB | 150 GB SSD | 1.2 TB SSD NVMe | Intel Xeon Gold / AMD EPYC (2.6 GHz+) | Ubuntu Server 22.04 LTS |

---

## 3) Asignación de recursos por contenedor (referencial)

### vm-qa-01
- `lb-qa`: 0.5 vCPU / 512 MB
- `app-qa`: 1.5 vCPU / 3 GB
- `db-qa`: 1.5 vCPU / 6 GB
- `files-qa`: 0.5 vCPU / 2 GB

### vm-prod-01
- `lb-prod`: 1 vCPU / 2 GB
- `app-prod`: 4 vCPU / 14 GB
- `db-prod`: 6 vCPU / 26 GB
- `files-prod`: 1 vCPU / 6 GB

Recomendación de operación Docker:
- Definir límites `cpus`, `memory` y `pids` por contenedor.
- Configurar `restart: always` en servicios críticos.
- Mantener versionado semántico de imágenes y registro privado.

---

## 4) Almacenamiento y persistencia

### vm-qa-01
- `/data/db-qa` 120 GB
- `/data/files-qa` 100 GB
- `/data/logs-qa` 30 GB

### vm-prod-01
- `/data/db-prod` 700 GB
- `/data/files-prod` 400 GB
- `/data/logs-prod` 100 GB

Recomendaciones:
- Separar almacenamiento de BD, archivos y logs.
- Usar discos SSD/NVMe con IOPS garantizadas para contenedor `db` en Producción.
- Monitorear crecimiento mensual de volumen para reaprovisionamiento preventivo.

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
