# Propuesta ajustada de infraestructura de VMs en TRIARA (SEP)

## 1) Objetivo
Ajustar la propuesta para operar con **solo 2 máquinas virtuales totales**:
- **1 VM para QA** (dimensionada de forma austera).
- **1 VM para Producción** (prioridad alta de capacidad y rendimiento).

Cada VM contendrá contenedores Docker para:
- Base de datos (BD)
- Aplicación (API/Web)
- File server
- Balanceador/reverse proxy

---

## 2) Criterio de priorización (QA sacrificado / Producción priorizada)
- QA se mantiene con recursos mínimos para pruebas funcionales, humo y regresión.
- Producción concentra la mayor capacidad de cómputo, memoria e IOPS.
- Diferencia objetivo de capacidad: **Producción ~3x en CPU/RAM** respecto a QA.

---

## 3) Dimensionamiento final (2 VMs)

| VM | Ambiente | vCPU | RAM | Disco SO | Disco datos/logs | Perfil de CPU sugerido | SO |
|---|---|---:|---:|---:|---:|---|---|
| vm-qa-01 | QA | 4 | 12 GB | 100 GB SSD | 250 GB SSD | Intel Xeon Silver/Gold o AMD EPYC equivalente | Ubuntu Server 22.04 LTS |
| vm-prod-01 | Producción | 12 | 48 GB | 150 GB SSD | 1.2 TB SSD NVMe (IOPS altas) | Intel Xeon Gold / AMD EPYC (2.6 GHz+), virtualización enterprise | Ubuntu Server 22.04 LTS |

### Distribución sugerida dentro de cada VM (Docker)

#### vm-qa-01 (austero)
- `lb-qa` (Nginx/Traefik): 0.5 vCPU / 512 MB
- `app-qa` (API/Web): 1.5 vCPU / 3 GB
- `db-qa` (PostgreSQL o SQL Server): 1.5 vCPU / 6 GB
- `files-qa` (NFS/Samba/MinIO): 0.5 vCPU / 2 GB

#### vm-prod-01 (prioritario)
- `lb-prod` (Nginx/Traefik): 1 vCPU / 2 GB
- `app-prod` (API/Web): 4 vCPU / 14 GB
- `db-prod` (PostgreSQL o SQL Server): 6 vCPU / 26 GB
- `files-prod` (NFS/Samba/MinIO): 1 vCPU / 6 GB

> Nota: Los límites por contenedor (`cpus`, `memory`, `pids`) deben configurarse en Docker Compose para evitar contención.

---

## 4) Almacenamiento y volúmenes

### QA
- Volúmenes:
  - `/data/db-qa` (120 GB)
  - `/data/files-qa` (100 GB)
  - `/data/logs-qa` (30 GB)
- Política: datos enmascarados y retención corta.

### Producción
- Volúmenes:
  - `/data/db-prod` (700 GB)
  - `/data/files-prod` (400 GB)
  - `/data/logs-prod` (100 GB)
- Recomendación: separar logs de BD y archivos de aplicación para mejorar I/O.

---

## 5) Red y seguridad mínima obligatoria
- Segmentación de red en VLAN separadas para QA y Producción.
- Solo abrir a Internet el balanceador (443/TCP).
- Puertos de BD y file server restringidos a red privada interna.
- SSH solo por VPN/bastión, autenticación por llave y MFA.
- Secretos en vault/gestor seguro (no en texto plano dentro de compose).

---

## 6) Respaldo y continuidad

### QA (operación básica)
- Backup full semanal + incremental diario.
- Retención 15 días.
- RPO 24 h / RTO 8 h.

### Producción (prioridad)
- Backup full semanal + incremental diario.
- Logs de transacción cada 15 minutos.
- Retención 90 días + respaldo mensual de archivo.
- RPO 15 min / RTO 2 h.

---

## 7) Operación DevOps/DBA recomendada
- Pipeline: build → escaneo de vulnerabilidades → despliegue QA → aprobación → despliegue Producción.
- Observabilidad mínima:
  - Infra: CPU, RAM, disco, IOPS, red.
  - App: latencia p95, error rate, throughput.
  - DB: locks, consultas lentas, crecimiento de tablas.
- Umbrales para crecer Producción:
  - CPU > 70% sostenido 15 min.
  - RAM > 80%.
  - IOPS > 75%.

---

## 8) Resumen ejecutivo solicitado
Con base en la restricción presupuestal y priorización operativa, la arquitectura queda en:

1. **Una VM de QA (`vm-qa-01`)** con recursos reducidos, que contiene contenedores de balanceador, aplicación, base de datos y file server para pruebas.
2. **Una VM de Producción (`vm-prod-01`)** con recursos reforzados, que contiene contenedores de balanceador, aplicación, base de datos y file server para operación productiva.

Este ajuste sacrifica capacidad de QA para privilegiar estabilidad y desempeño de Producción, manteniendo el modelo dockerizado solicitado.
