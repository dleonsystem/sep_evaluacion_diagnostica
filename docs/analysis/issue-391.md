# Análisis de Incidencia: Error 'Failed to fetch' en creación de tickets (#391)

**ID del Issue:** #391
**Estado:** CERRADO / RESUELTO
**Prioridad:** Alta (Fase 1)
**Fecha de Resolución:** 2026-04-10

## Descripción del Problema
Los usuarios reportaron que al intentar crear un ticket de soporte con múltiples evidencias (archivos adjuntos), el sistema mostraba un error genérico del navegador: `Failed to fetch`. Esto impedía el registro de incidencias y generaba frustración al no haber un mensaje de error claro.

## Análisis Técnico y Causa Raíz
El error `Failed to fetch` en este contexto no era un fallo de disponibilidad del servidor, sino una violación de límites de protocolo y configuración:

1.  **Límite de Payload de Express:** El servidor GraphQL utiliza Express como base. Por defecto, el middleware de parseo de JSON tiene un límite de 100KB. Al adjuntar imágenes o documentos en Base64 dentro del input de la mutación `createTicket`, el tamaño de la petición superaba fácilmente este límite.
2.  **Cierre de Conexión Abrupto:** Cuando Express rechaza una petición por tamaño (`413 Payload Too Large`), si no se maneja correctamente en el flujo de CORS, el navegador lo interpreta como una falla de conexión de red ("Failed to fetch").
3.  **Timeouts de SFTP:** En entornos con latencia, la conexión al servidor SFTP para guardar evidencias podía tomar más tiempo del esperado, disparando el timeout del cliente antes de recibir una respuesta.

## Solución Implementada

### 1. Ajuste de Límites en el Servidor (`index.ts`)
Se incrementó el límite de recepción de datos a **50MB** para permitir el adjunto de múltiples evidencias de alta calidad sin interrupciones:
```typescript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

### 2. Estabilización de Cors y Seguridad
Se aseguró que las políticas de CORS permitieran el paso de encabezados de error incluso cuando la petición es rechazada por el middleware de parsing, asegurando que el frontend reciba información útil.

### 3. Manejo de Errores en Resolvers
Se añadió lógica de "fail-fast" en el resolver `createTicket`. Si la conexión con el almacenamiento remoto (SFTP) falla, el sistema devuelve un error controlado de GraphQL en lugar de dejar que la petición expire.

## Verificación
- [x] **Carga Pesada:** Verificado el envío de tickets con hasta 10 evidencias (total ~15MB) exitosamente.
- [x] **Mensajería:** En caso de fallo real del servidor, el frontend ahora muestra el mensaje de error de la API en lugar del error genérico de fetch.

---
**Responsable:** Antigravity AI
**Proyecto:** SEP - Evaluación Diagnóstica
