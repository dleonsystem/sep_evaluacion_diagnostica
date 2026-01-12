# Documento de Arquitectura de Software (SAD)  

## Plataforma de Gestión de Valoraciones EIA 2025–2026

---

## 1. Introducción

Este documento describe la arquitectura de alto nivel del sistema, las decisiones tecnológicas principales y los componentes esenciales que la conforman.

---

## 2. Visión arquitectónica

El sistema se basa en una arquitectura web de tres capas:

1. **Capa de presentación:** Aplicación Angular 19 desplegada como SPA.
2. **Capa de lógica de negocio:** API en Node.js (framework por definir, p. ej. Express o NestJS).
3. **Capa de datos:** Base de datos PostgreSQL y almacenamiento de archivos.

---

## 3. Vista lógica

### 3.1 Componentes principales

- **Módulo de Autenticación**
  - Inicio de sesión.
  - Gestión de sesiones o tokens.
- **Módulo de Gestión de Archivos**
  - Carga de valoraciones.
  - Descarga de valoraciones.
  - Carga de resultados.
  - Descarga de resultados.
- **Módulo de Validación**
  - Validación de extensión.
  - Validación de columnas obligatorias.
  - Advertencias de valoraciones incompletas.
- **Módulo de Auditoría**
  - Registro de eventos.
  - Consulta de bitácora.
- **Módulo de Administración**
  - Gestión de usuarios.
  - Configuración básica.

---

## 4. Vista de despliegue (Mermaid)

```mermaid
flowchart LR
    U[Usuarios
Directores / SEP / Admin] --> B[Browser
Angular 19]

    B --> A[API Node.js]
    A --> DB[(PostgreSQL)]
    A --> FS[(Almacenamiento de archivos)]

```

---

## 5. Decisiones tecnológicas clave

- **Backend:** Node.js (framework por definir; candidatos: Express, NestJS).
- **Frontend:** Angular 19.
- **Base de datos:** PostgreSQL.
- **Gestión de archivos:** sistema de archivos del servidor o almacenamiento de objetos (extensible a soluciones en la nube).
- **Protocolos:** HTTP/HTTPS.
- **Autenticación:** basada en sesiones o tokens (por ejemplo, JWT) según se defina en el diseño técnico.

---

## 6. Consideraciones de seguridad

- Todo el tráfico externo se realiza sobre HTTPS.
- Las contraseñas se almacenan de forma cifrada en la base de datos.
- La base de datos sólo es accesible desde la capa de backend.
- Los registros de auditoría son inmutables (no se modifican, sólo se agregan).

---

## 7. Escalabilidad

- El frontend puede servirse desde un servidor estático o CDN.
- El backend en Node.js puede escalarse horizontalmente mediante balanceadores de carga.
- La base de datos se dimensionará para soportar el volumen esperado, con posibilidad de réplica en lectura en etapas posteriores.

---

## 8. Vista de componentes de infraestructura

El siguiente diagrama muestra la arquitectura de componentes de infraestructura del sistema:

```mermaid
graph TB
    subgraph "Capa de Presentación"
        WEB[Angular 19 SPA<br/>Servidor Web Estático]
    end
    
    subgraph "Capa de Aplicación"
        LB[Load Balancer<br/>NGINX/HAProxy]
        API1[FastAPI Instance 1<br/>Python 3.12]
        API2[FastAPI Instance 2<br/>Python 3.12]
        API3[FastAPI Instance N<br/>Python 3.12]
    end
    
    subgraph "Capa de Procesamiento Asíncrono"
        REDIS[(Redis<br/>Message Broker)]
        CELERY1[Celery Worker 1<br/>Validación]
        CELERY2[Celery Worker 2<br/>Reportes]
        CELERY3[Celery Worker 3<br/>Notificaciones]
    end
    
    subgraph "Capa de Datos"
        DB[(PostgreSQL 16<br/>Base de Datos Principal)]
        REPLICA[(PostgreSQL<br/>Réplica Lectura)]
        STORAGE[Almacenamiento<br/>Archivos Excel/PDF]
    end
    
    subgraph "Servicios Externos"
        SMTP[Servidor SMTP<br/>Envío Emails]
        MONITOR[Prometheus +<br/>Grafana Monitoring]
    end
    
    WEB -->|HTTPS| LB
    LB -->|Round Robin| API1
    LB -->|Round Robin| API2
    LB -->|Round Robin| API3
    
    API1 -->|Read/Write| DB
    API2 -->|Read/Write| DB
    API3 -->|Read/Write| DB
    
    API1 -->|Read Only| REPLICA
    API2 -->|Read Only| REPLICA
    API3 -->|Read Only| REPLICA
    
    API1 -.->|Enqueue Tasks| REDIS
    API2 -.->|Enqueue Tasks| REDIS
    API3 -.->|Enqueue Tasks| REDIS
    
    REDIS -->|Consume| CELERY1
    REDIS -->|Consume| CELERY2
    REDIS -->|Consume| CELERY3
    
    CELERY1 -->|Update Status| DB
    CELERY2 -->|Update Status| DB
    CELERY3 -->|Update Status| DB
    
    API1 -->|Upload/Download| STORAGE
    API2 -->|Upload/Download| STORAGE
    API3 -->|Upload/Download| STORAGE
    
    CELERY1 -->|Read Files| STORAGE
    CELERY2 -->|Generate PDFs| STORAGE
    
    CELERY3 -->|Send Emails| SMTP
    
    MONITOR -.->|Metrics| API1
    MONITOR -.->|Metrics| API2
    MONITOR -.->|Metrics| API3
    MONITOR -.->|Metrics| DB
    MONITOR -.->|Metrics| REDIS
    
    style DB fill:#4A90E2
    style REPLICA fill:#7BB3E8
    style REDIS fill:#DC382D
    style STORAGE fill:#90EE90
    style SMTP fill:#FFD700
    style MONITOR fill:#FF6B6B
```

### 8.1 Descripción de componentes

#### Capa de Presentación

- **Angular 19 SPA:** Aplicación de página única servida desde servidor web estático o CDN
- **Protocolo:** HTTPS con certificado SSL/TLS

#### Capa de Aplicación

- **Load Balancer:** Distribuye peticiones entre instancias de API (NGINX o HAProxy)
- **FastAPI Instances:** Múltiples instancias para escalamiento horizontal
- **Conexión:** Pool de conexiones a PostgreSQL (máx. 20 por instancia)

#### Capa de Procesamiento Asíncrono

- **Redis:** Message broker para colas de tareas Celery
- **Celery Workers:** Procesamiento paralelo de validaciones, reportes y notificaciones
- **Configuración:** 3-5 workers por tipo de tarea

#### Capa de Datos

- **PostgreSQL 16 (Principal):** Base de datos transaccional principal
- **PostgreSQL (Réplica):** Réplica para consultas de solo lectura (opcional)
- **Almacenamiento:** Sistema de archivos NFS o almacenamiento de objetos (S3-compatible)

#### Servicios Externos

- **SMTP Server:** Servidor de correo para notificaciones (ej: SendGrid, Mailgun)
- **Monitoring:** Prometheus para métricas + Grafana para dashboards

### 8.2 Especificaciones técnicas mínimas

| Componente | CPU | RAM | Almacenamiento | Observaciones |
| ---------- | --- | --- | -------------- | ------------- |
| PostgreSQL | 8 cores | 32 GB | 500 GB SSD | RAID 10 recomendado |
| FastAPI Instance | 4 cores | 8 GB | 50 GB | Escalar según carga |
| Celery Worker | 2 cores | 4 GB | 20 GB | 1 worker por tarea |
| Redis | 2 cores | 8 GB | 20 GB | Persistencia habilitada |
| Almacenamiento | - | - | 2 TB | Crecimiento: ~50 GB/año |

### 8.3 Alta disponibilidad

- **RTO (Recovery Time Objective):** < 2 horas
- **RPO (Recovery Point Objective):** < 15 minutos
- **Backup:** Diario completo + WAL archiving continuo
- **Failover:** Réplica de PostgreSQL con promoción automática
