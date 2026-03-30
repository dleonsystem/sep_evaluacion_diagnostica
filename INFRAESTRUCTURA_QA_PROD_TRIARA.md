# Propuesta ajustada de infraestructura de máquinas virtuales en TRIARA (SEP)

## 1) Objetivo
Ajustar la arquitectura de ambientes **QA** y **Producción** para un proyecto dockerizado, respetando la capacidad real disponible:

- **CPU total disponible:** 20 vCPU
- **RAM total disponible:** 38 GB
- **Disco total disponible:** 2.2 TB

---

## 2) Criterio de ajuste
Para no rebasar capacidad, se mantiene el esquema de **2 VMs por ambiente** (APP + DB), priorizando Producción sobre QA:

- Producción recibe mayor proporción de recursos (continuidad operativa).
- QA se mantiene funcional para pruebas, validación y regresión.
- Se conserva separación APP/DB por seguridad y operación DBA.

---

## 3) Topología propuesta (4 VMs totales)
- **qa-app-01**: host Docker de QA (frontend, API, pruebas funcionales).
- **qa-db-01**: base de datos QA.
- **prod-app-01**: host Docker de Producción.
- **prod-db-01**: base de datos Producción.

---

## 4) Dimensionamiento ajustado a la capacidad real

### 4.1 Distribución de recursos por VM

| VM | Rol | vCPU | RAM | Disco total |
|---|---|---:|---:|---:|
| qa-app-01 | Docker host QA | 3 | 6 GB | 120 GB SSD |
| qa-db-01 | Base de datos QA | 3 | 8 GB | 380 GB SSD |
| prod-app-01 | Docker host Producción | 6 | 10 GB | 220 GB SSD |
| prod-db-01 | Base de datos Producción | 8 | 14 GB | 1.48 TB SSD/NVMe |
| **TOTAL** |  | **20 vCPU** | **38 GB** | **2.20 TB** |

### 4.2 Validación de restricción
- **CPU:** 3 + 3 + 6 + 8 = **20 vCPU** ✅
- **RAM:** 6 + 8 + 10 + 14 = **38 GB** ✅
- **Disco:** 120 + 380 + 220 + 1480 = **2200 GB (2.2 TB)** ✅

---

## 5) Recomendaciones operativas con recursos limitados

### QA
- Ejecutar pruebas por ventanas (evitar pruebas de carga pesadas simultáneas).
- Limitar recursos por contenedor con `cpu` y `memory` en Docker Compose.
- Usar dataset enmascarado y reducido para mantener desempeño.

### Producción
- Asignar prioridad de CPU/RAM a base de datos (`prod-db-01`).
- Activar compresión de logs y rotación para no agotar disco en `prod-app-01`.
- Configurar pool de conexiones del backend para no saturar BD.

---

## 6) Distribución sugerida de disco por VM

### qa-app-01 (120 GB)
- SO: 40 GB
- Imágenes/volúmenes Docker: 60 GB
- Logs: 20 GB

### qa-db-01 (380 GB)
- SO: 40 GB
- Datos BD: 260 GB
- Logs/temporales/respaldos cortos: 80 GB

### prod-app-01 (220 GB)
- SO: 50 GB
- Imágenes/volúmenes Docker: 120 GB
- Logs: 50 GB

### prod-db-01 (1.48 TB)
- SO: 60 GB
- Datos productivos: 1.05 TB
- Logs transaccionales: 220 GB
- Respaldos locales temporales: 150 GB

---

## 7) Seguridad y red (mínimo requerido)
- Segmentación en VLAN separadas para QA, PROD y MGMT.
- Firewall:
  - Internet → APP: 443/TCP (80 solo redirect).
  - APP → DB: solo puerto del motor (5432 o 1433 según plataforma).
  - SSH solo por VPN/bastión con llave.
- Hardening básico:
  - Deshabilitar root remoto.
  - Actualizaciones mensuales de seguridad.
  - Gestión de secretos fuera del código.

---

## 8) Respaldo y continuidad (ajustado)
- **QA:** full semanal + incremental diario (retención 15 días).
- **Producción:** full semanal + incremental diario + log transaccional cada 30 min.
- Objetivo realista con capacidad actual:
  - **RPO PROD:** 30 min
  - **RTO PROD:** 4 horas

---

## 9) CI/CD y operación DevOps
1. Build de imagen + escaneo de vulnerabilidades.
2. Despliegue automático a QA.
3. Pruebas funcionales y aprobación.
4. Despliegue controlado a Producción (rolling).
5. Monitoreo post-deploy y rollback si falla health-check.

Herramientas sugeridas de bajo costo operativo:
- Prometheus + Grafana (métricas).
- Loki o ELK liviano (logs).

---

## 10) Riesgos y plan de crecimiento
Con esta capacidad, el ambiente es viable para operación inicial; sin embargo, existen límites:
- Riesgo de saturación en picos altos de concurrencia.
- Margen de crecimiento acotado en RAM de producción.

### Escalamiento recomendado (siguiente fase)
- +4 vCPU y +8 GB RAM en `prod-app-01`.
- Replicación de lectura para `prod-db-01` cuando el uso promedio de CPU en BD supere 70% sostenido.
- Balanceador L7 institucional si se agrega `prod-app-02`.

---

## 11) Resumen ejecutivo final
La propuesta queda **alineada al disponible real** de **20 vCPU, 38 GB RAM y 2.2 TB disco**, conservando separación de funciones APP/DB en QA y Producción, y priorizando estabilidad de Producción con un diseño operable en TRIARA.
