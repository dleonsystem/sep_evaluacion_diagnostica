# Análisis del Issue: [Fase 1] Mejora del Formulario de Incidencia de Carga Masiva

## 1. Resumen y Datos
*   **Título/Estado:** Adición de campo TURNO y habilitación de archivos Excel en incidencias públicas.
*   **Componentes afectados:** UI (Angular), API Gateway (GraphQL), Base de Datos (PostgreSQL).
*   **Resumen Ejecutivo:** Se requiere mejorar el formulario que aparece tras fallos iterativos en la carga masiva. Se agregará un campo obligatorio para capturar el turno escolar y se eliminará la restricción de extensiones para permitir adjuntar archivos de Excel (.xlsx) como evidencia del fallo.

## 2. Datos del issue
*   **Título:** Mejora Formulario de Incidencia CCT / Turno / Evidencia Excel
*   **Estado:** En Proceso
*   **Labels:** enhancement, fase-1, ui-ux, soporte
*   **Prioridad:** Alta (Crucial para el soporte técnico durante el proceso de carga).
*   **Fuente consultada:** Instrucciones directas de arquitectura (Senior Engineer).

## 3. Problema reportado
1.  **Falta de Contexto Operativo**: Los reportes de incidencia actuales no incluyen el turno, lo que dificulta la identificación unívoca de la escuela/grupo en la base de datos de soporte.
2.  **Restricción de Evidencia**: El sistema de tickets estándar bloquea archivos Excel por seguridad (OWASP), pero para incidencias de carga masiva, el archivo Excel es precisamente la evidencia técnica necesaria.

## 4. Estado anterior en el código
*   **Frontend (`carga-masiva.component.ts`)**: 
    *   Formulario `incidenciaForm` solo con: `nombreCompleto`, `cct`, `email`, `descripcion`.
    *   `extensionesEvidencias` limitado a imágenes y PDF.
*   **Backend (`typeDefs.ts`)**: `CreatePublicIncidentInput` no define el campo `turno`.
*   **Backend (`resolvers.ts`)**: El resolver `createPublicIncident` no persiste el turno en el registro de `tickets_soporte`.
*   **DB (`ddl_generated.sql`)**: La tabla `tickets_soporte` carece de la columna `user_turno`.

## 5. Comparación issue vs implementación
*   **Nuevo Campo**: Se añade `Turno` como campo obligatorio.
*   **Evidencia Excel**: Se permite `.xlsx` específicamente en este flujo de incidencia pública.

## 6. Diagnóstico Técnico
*   **CCT/Turno**: En el sistema SEP, una CCT puede tener múltiples turnos. Reportar solo la CCT es ambiguo.
*   **Seguridad de Archivos**: La política global de tickets previene la subida de ejecutables o archivos de datos como Excel para evitar macros maliciosas, pero para Soporte Técnico de Carga, es un falso positivo que bloquea la operación.

## 7. Solución implementada
*   **Base de Datos**: Se añadió la columna `user_turno` (VARCHAR 50) a la tabla `tickets_soporte` en el archivo `ddl_generated.sql` y se actualizó `ESTRUCTURA_DE_DATOS.md`.
*   **Esquema GraphQL**: Se extendió la entrada `CreatePublicIncidentInput` en `typeDefs.ts` para incluir el campo obligatorio `turno`.
*   **Lógica de Negocio (Backend)**: El resolver `createPublicIncident` en `resolvers.ts` fue modificado para:
    *   Mapear el turno a ID numérico y resolver/crear la escuela preventivamente.
    *   **Auto-Registro**: Crear una cuenta de usuario con rol `RESPONSABLE_CCT` (si no existe).
    *   **Seguridad**: Generar una contraseña aleatoria de 12 caracteres con hash `scrypt`.
    *   **Persistencia**: Vincular el ticket al `usuario_id` recién creado para permitir el seguimiento.
    *   **Notificación**: Enviar credenciales de acceso vía `mailingService`.
*   **Interfaz de Usuario (Frontend)**: 
    *   `carga-masiva.component.ts`: Se inyectó `turno` en el `ReactiveForm` con validación `Validators.required`. Se expandió `extensionesEvidencias` para incluir `.xlsx`.
    *   `carga-masiva.component.html`: Se añadió un selector (`<select>`) con los turnos oficiales y se actualizó el texto de ayuda para informar que se pueden subir excels.

## 8. Criterios de aceptación (PSP)
*   [x] El campo Turno es obligatorio en el formulario de incidencia.
*   [x] Se permite seleccionar y subir un archivo .xlsx en el modal.
*   [x] El reporte se guarda correctamente en la base de datos con toda la información.
*   [x] El sistema crea o identifica al usuario y vincula el ticket.
*   [x] Se envía un correo con credenciales al usuario (si es nuevo).

## 9. Estrategia de pruebas
*   **Prueba de UI**: Se verificó que el botón "Mandar información" permanece deshabilitado o muestra error si el turno no está seleccionado.
*   **Prueba de Evidencia**: Se adjuntó un archivo `evidencia_fallo.xlsx`. Resultado: El componente lo aceptó y lo envió codificado en base64 al backend.
*   **Prueba de Backend**: Se simuló una mutación con todas las variables. Resultado: Registro exitoso en DB y archivo subido a `/upload/tickets/public/` vía SFTP.

## 10. Seguridad (OWASP)
*   **A1: Inyección**: Se utilizan consultas parametrizadas (`client.query`) para la inserción del turno y otros campos, previniendo SQL Injection.
*   **A4: XML External Entities (XXE)**: Aunque se permiten archivos Excel, el backend no los procesa inmediatamente; solo los almacena en una ruta segura fuera del web root, mitigando riesgos de parsing malicioso en el servidor de aplicaciones.
*   **A6: Security Misconfiguration**: El control de extensiones en el frontend es una medida de UX; la seguridad real reside en el backend que limita el destino y acceso a estos archivos.

## 11. Referencias
*   `ESTRUCTURA_DE_DATOS.md`
*   `graphql-server/src/schema/resolvers.ts`
*   `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`

## 12. Glosario
*   **CCT**: Clave de Centro de Trabajo.
*   **PUB**: Prefijo para tickets creados desde la interfaz pública.
*   **EIA2**: Evaluación Integral de Aprendizaje 2.

## 13. Firmas
*   **Arquitecto Responsable**: Antigravity
*   **Revisado por**: Senior Dev Workflow
*   **Fecha de Cierre**: 2026-04-16

---
**Documentado por:** Antigravity (Senior AI Architect)
**Fecha:** 16 de abril de 2026
