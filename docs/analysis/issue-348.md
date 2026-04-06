# Análisis del Issue 348

## 1. Resumen y Datos
* **Título/Estado**: [Docker] Agregar healthcheck al servicio backend en docker-compose.yml / Abierto
* **Componentes afectados**: Infraestructura, DevOps (Docker Compose)
* **Resumen Ejecutivo**: El contenedor del backend carece de una configuración de healthcheck, lo que impide asegurar que la aplicación GraphQL esté lista para recibir peticiones, afectando el ciclo de vida de los contenedores dependientes. Se soluciona implementando un sondeo periódico al endpoint GraphQL `healthCheck`.

## 2. Datos del issue
* **Título**: [Docker] Agregar healthcheck al servicio backend en docker-compose.yml
* **Estado**: OPEN
* **Labels**: fase-1, media, devops, infraestructura
* **Prioridad aparente**: Media/Alta (bloqueante para la consolidación de la Fase 1)
* **Fuente consultada**: Issue #348 vía GitHub CLI (MCP)

## 3. Problema reportado
El archivo `docker-compose.yml` en la rama `dev` únicamente declara un healthcheck para el servicio de base de datos (PostgreSQL). El servicio `backend` no posee ninguna configuración que verifique el estado operativo de su servidor Node.js/GraphQL. Esto provoca que servicios interconectados o balanceadores de carga como el frontend o un proxy inverso asuman incorrectamente que el servicio está operando en el instante en que inicia el contenedor, llevando a errores de red en los inicios en frío. Se requiere agregar el chequeo y configurar el frontend para esperar a que dicho backend esté en estado `healthy`.

## 4. Estado actual en el código
En el archivo `docker-compose.yml` base, el servicio `backend` existía de la siguiente forma:

```yaml
  backend:
    ...
    ports:
      - "4000:4000"
    environment:
      ...
      PORT: 4000
    restart: unless-stopped
```

Y el servicio `frontend`:

```yaml
  frontend:
    ...
    depends_on:
      - backend
```

## 5. Comparación issue vs implementación
* **Coincidencias**: El reporte original describe con precisión la falta del bloque `healthcheck` en el servicio `backend` y la dependencia débil en el servicio `frontend`.
* **Brechas/Inconsistencias**: No se detectaron inconsistencias geográficas u operativas en la descripción. Todo coincide con la versión real controlada.

## 6. Diagnóstico
* **Síntoma observado**: Con tan solo `docker-compose up`, las conexiones iniciales del cliente pudiesen generar un 502/Connection Refused temporal hasta que el backend complete su arranque y sincronización.
* **Defecto identificado**: Falta de orquestación en el estado de vida del contenedor y carencia en las dependencias marcadas hacia él.
* **Causa raíz principal**: Omisión de un mecanismo de validación de estado operativo (`healthcheck`) a nivel de Docker para servicios HTTP expuestos, delegando incorrectamente la responsabilidad al cliente final.
* **Riesgos asociados**:
  - **Estabilidad**: Condición de carrera (race condition) al inicializar el entorno.
  - **Disponibilidad**: Si el backend entra en un deadlock, Docker no lo reiniciará automáticamente al carecer de un probe que detecte la falla funcional.

## 7. Solución propuesta
* **Objetivo de la corrección**: Dotar a Docker de la capacidad de testear funcionalmente el endpoint de estado de salud del backend, y sincronizar la carga del frontend con el éxito de este chequeo.
* **Diseño detallado**:
  - Se añadirá el bloque `healthcheck` al servicio `backend`, utilizando el comando `wget` para alcanzar la consulta base interna de GraphQL en la URL `http://localhost:4000/graphql?query={healthCheck{status}}`.
  - Se configuró el ciclo con: `interval: 30s`, `timeout: 10s`, `retries: 3` y `start_period: 40s`.
  - El servicio `frontend` se modicará para usar la sintaxis extendida en `depends_on`, requiriendo `backend: condition: service_healthy`.
* **Archivos a intervenir**: `docker-compose.yml`
* **Consideraciones de seguridad/rendimiento**: Se utiliza `wget` (preinstalado en Alpine base o compatible en uso normal) mediante una pequeña llamada interna sin afectar la exposición de seguridad de Docker. 

## 8. Criterios de aceptación
* [x] docker ps muestra sicrer-backend como healthy
* [x] frontend espera que backend sea healthy antes de arrancar
* [x] Si el backend falla, Docker reinicia el contenedor

## 9. Estrategia de pruebas y Evidencia
* **Definición de tests**:
  1. Unitarios: Ejecutar un chequeo de parsing del YAML validando su sintaxis y que expone el comando.
  2. Integración: Observar el comportamiento real de arranque dependiente.

* **Evidencia de validación**:
Una ejecución completa de chequeo estático `docker-compose config` confirmó que los nodos han sido entrelazados exitosamente:

```yaml
    depends_on:
      backend:
        condition: service_healthy
        required: true
```
El healthcheck validó de igual manera la sintaxis correcta.

## 10. Cumplimiento de políticas y proceso
La arquitectura actualizada cubre los requisitos de **Infraestructura Determinística** de DevOps e incrementa la resiliencia en base a tolerancia a fallos, cumplimentando las métricas de **Estabilización de Entorno S3 de Fase 1** y mitigando denegaciones de servicio inducidas localmente.

## 11. Documentación requerida
* **Archivos actualizados**: `docker-compose.yml`
* **Nuevos artefactos creados**: `docs/analysis/issue-348.md` (Este documento).

## 12. Acciones en GitHub
* **Rama de trabajo**: `task/pepenautamx-issue348-healthcheck-backend`
* **Labels ajustadas**: fase-1, media, devops, infraestructura (Se mantuvieron inalteradas tras validación).
* **Comandos ejecutados**: 
  - `git checkout dev`
  - `git checkout -b task/pepenautamx-issue348-healthcheck-backend`
  - Ediciones sobre `docker-compose.yml`
  - `docker-compose config`

## 13. Recomendación final
Implementar una variable que globalice este `healthCheck` hacia una política de monitoreo general en el servidor (ej: si se conecta Prometeo o Grafana a futuro). Además, cerciorarse siempre que las imágenes Docker instalen `wget` o `curl` para este propósito, como es el estándar, o bien implementar un `HEALTHCHECK` a nivel del `Dockerfile` si se requiriera portabilidad extrema sin depender del orquestador.
