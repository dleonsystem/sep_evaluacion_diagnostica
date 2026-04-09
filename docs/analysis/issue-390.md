# Análisis del Issue #390

## 1. Resumen y Datos
•	**Título/Estado:** [Fase 1] Bug: Enlace "IR AL SISTEMA" roto y fallo en generación de PDF/Correo / Pendiente
•	**Componentes afectados:** Backend (Mailing Service, Comprobante PDF Service), Frontend (Mock PDF Service, CargaMasivaComponent)
•	**Resumen Ejecutivo:** Se requiere la actualización de la identidad visual (SiCRER -> SiRVER) en plantillas de correo y reportes PDF, además de ajustes en el formato de fechas y etiquetas de contabilización de estudiantes.

## 2. Datos del issue
•	**Título:** [Fase 1] Bug: Enlace "IR AL SISTEMA" roto y fallo en generación de PDF/Correo
•	**Estado:** Abierto
•	**Labels:** Fase1, bug
•	**Prioridad aparente:** Alta
•	**Fuente consultada:** Comentarios del usuario y detalles_funcionalidad.md

## 3. Problema reportado
1. Enlaces y textos en correos de bienvenida desactualizados (SiCRER en lugar de SiRVER).
2. Etiquetas en PDF incorrectas ("Alumnos validados" en lugar de "Estudiantes validados").
3. Formato de fecha en PDF desactualizado (D/M/YYYY en lugar de "D de mes de YYYY").
4. Enlace "IR AL SISTEMA" apunta a localhost (comportamiento esperado en dev, pero se solicita estandarizar).
5. Contraseña con asteriscos en comprobante de usuario logueado (ya reportado como corregido, pero requiere verificación).

## 4. Estado actual en el código
- **MailingService (Backend):** Utiliza "SiCRER" en múltiples métodos (`wrapInTemplate`, `sendPasswordRecovery`, `sendCredentials`, `sendAdminPasswordReset`). Los enlaces usan `process.env.APP_URL` con fallback a localhost.
- **MockPdfService (Frontend):** Genera el PDF de validación con el texto literal "Alumnos validados:".
- **ComprobantePdfService (Backend):** Genera el PDF de recepción con "plataforma SiCRER" y formato de fecha `medium`.
- **CargaMasivaComponent (Frontend):** Formatea las fechas del PDF usando `.toLocaleDateString()` y `.toLocaleString()` sin especificaciones de estilo largo.

## 5. Comparación issue vs implementación
•	**Coincidencias:** El sistema genera los correos y PDFs, pero con la nomenclatura anterior (SiCRER).
•	**Brechas/Inconsistencias:** Las etiquetas, el nombre del sistema y el formato de fechas no cumplen con los nuevos requerimientos de la Fase 1 (Branding SiRVER).

## 6. Diagnóstico
•	**Síntoma observado:** Correos y PDFs con branding antiguo y formatos de fecha cortos.
•	**Defecto identificado:** Hardcoding de cadenas de texto "SiCRER" y uso de formatos de fecha por defecto del navegador/servidor.
•	**Causa raíz principal:** Transición de identidad del proyecto SiCRER -> SiRVER no completada en módulos de comunicación.
•	**Riesgos asociados:** Confusión del usuario, falta de profesionalismo en la identidad institucional.

## 7. Solución propuesta
•	**Objetivo de la corrección:** Unificar la identidad SiRVER en todos los entregables (PDF/Email) y mejorar la legibilidad de fechas y etiquetas.
•	**Diseño detallado:** 
    1. Actualizar constantes de texto en `mailing.service.ts`.
    2. Actualizar `mock-pdf.service.ts` para cambiar "Alumnos" por "Estudiantes".
    3. Implementar un formateador de fechas centralizado o ajustar `Intl.DateTimeFormat` a `dateStyle: 'long'`.
    4. Cambiar textos de redirección y enlaces en correos según las especificaciones del usuario.
•	**Archivos a intervenir:** 
    - `graphql-server/src/services/mailing.service.ts`
    - `graphql-server/src/services/comprobante-pdf.service.ts`
    - `web/frontend/src/app/services/mock-pdf.service.ts`
    - `web/frontend/src/app/components/carga-masiva/carga-masiva.component.ts`
•	**Consideraciones de seguridad/rendimiento:** Los cambios son principalmente estéticos (strings). No hay impacto en rendimiento.

## 8. Criterios de aceptación
•	[ ] Correo de bienvenida muestra "Bienvenido al Sistema SiRVER".
•	[ ] Correo de bienvenida usa el texto: "Se han generado oficialmente sus credenciales para la plataforma SiRVER".
•	[ ] Enlace de acceso en correo dice: "Puede acceder al sistema en la siguiente dirección: Ir al Sistema SiRVER".
•	[ ] PDF de éxito muestra "Estudiantes validados".
•	[ ] PDF de éxito muestra la fecha en formato largo (Ej: 24 de marzo de 2026).
•	[ ] PDF de recepción (backend) utiliza "SiRVER".

## 9. Estrategia de pruebas y Evidencia
•	**Definición de tests:** Verificación visual de correos (vía logs en terminal o Mailtrap si está configurado) y descarga de PDFs de prueba.
•	**Evidencia de validación:** (Pendiente)

## 10. Cumplimiento de políticas y proceso
Alineado con el rebranding de Fase 1 solicitado por el usuario.

## 11. Documentación requerida
- `docs/analysis/issue-390.md`

## 12. Acciones en GitHub
•	**Rama de trabajo:** `task/pepenautamx-issue390-fix-email-and-pdf-details`
•	**Labels ajustadas:** Fase1

## 13. Recomendación final
Centralizar las cadenas de texto del sistema (Nombre del proyecto, URLs base) en archivos de configuración o variables de entorno para evitar cambios repetitivos en múltiples servicios.
