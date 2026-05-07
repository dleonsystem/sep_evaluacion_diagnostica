BITÁCORA DE DESARROLLO Y SEGUIMIENTO, CON DETALLE DE TAREAS REALIZADAS POR SPRINT O MÓDULO ENTREGADO, INCLUYENDO EVIDENCIA DE COMMITS Y VERSIONES EN GITHUB, REFERENCIAS A SOLUCIÓN DE PROBLEMÁTICAS Y CAMBIOS IMPLEMENTADOS MEDIANTE PULL REQUESTS.

Sistema: Plataforma de Recepción, Validación y Descarga de Archivos de la Segunda Aplicación de los Ejercicios Integradores del Aprendizaje (EIA).

1) Propósito del entregable

Documentar de forma trazable el trabajo ejecutado durante enero y febrero de 2026 en el proyecto SEP Evaluación Diagnóstica, incluyendo:

Tareas realizadas por sprint/módulo.

Evidencia de commits y versiones integradas por Pull Requests.

Problemáticas atendidas y solución implementada.

Cambios relevantes en Frontend, Backend GraphQL/REST y Base de Datos.

2) Alcance

Este documento cubre la actividad registrada en Git para el periodo 2026-01-01 a 2026-02-29, con foco en:

Módulo de autenticación y control de acceso.

Carga masiva y validación de archivos.

Tickets/mesa de ayuda y operación administrativa.

Dashboard y métricas.

Integración GraphQL/REST/SFTP.

Ajustes de esquema y trazabilidad en PostgreSQL.

3) Resumen ejecutivo por mes

Enero 2026 (Integración funcional y ajustes de contrato de datos)

Se robusteció la interfaz de usuario y flujos de operación (login, carga, descargas, tickets).

Se alineó el contrato GraphQL con la estructura real de base de datos (campos, fechas, roles, credenciales).

Se integraron cambios por múltiples PRs en ramas de trabajo (Dev-JGA-FrontEnd-ENE26, codex/*) y se cerraron incidencias de UX/validación.

Febrero 2026 (Madurez operativa, administración y trazabilidad)

Se implementaron capacidades administrativas de mayor nivel: dashboard de métricas reales, control de tickets y resultados.

Se fortaleció la persistencia con trazabilidad por usuario (usuario_id) y resultados (JSONB) en solicitudes.

Se habilitó integración híbrida con endpoint REST legado y documentación técnica Swagger.

Se consolidó la gobernanza técnica con CI/CD, Husky y plan de estabilización.

4) Línea de tiempo de versiones (Enero-Febrero)

4.1 Enero 2026

timeline
    title Hitos Técnicos y versiones integradas (Enero 2026)
    07-ene : PRs #124-#136 : Mejoras UI : Carga y manejo de archivos/resultados
    08-ene : PRs #137-#150 : Ajustes login : Indicadores UX y validaciones
    21-ene : PRs #168-#184 : Actualizaciones GraphQL/back : Fixes tickets/localStorage
    22-ene : PRs #185-#197 : Integraciones rama ENE26 : Documentación técnica
    23-ene : PRs #198-#201 : Control de descargas por sesión : Alertas de carga
    28-ene : PRs #202-#212 : Alineación GraphQL-BD : createUser/login y endpoint frontend
    29-ene : PR #213 : Integración de rama Dev-JGA-FrontEnd-FEB26


4.2 Febrero 2026

timeline
    title Hitos Técnicos y versiones integradas (Febrero 2026)
    04-feb : 4e1818d : Subida Excel y ajustes de carga/BD
    13-feb : c4ed55b : Tickets : Evidencias y ajustes de restricciones en BD
    16-feb : 0f499f6 : CI/CD : Husky y estabilización técnica : Gestión de errores : SFTP, Swagger, soft delete
    18-feb : ad59618 : Persistencia centralizada : Soporte SFTP
    19-feb : 01ce65e : Dashboard admin : Login y visibilidad de tickets : Consulta centros de trabajo
    24-feb : 67f808e : Respuesta de tickets : Resultados por solicitud
    25-feb : 1c48f85 : Mejoras fullstack de consolidación


5) Bitácora por sprint/módulo

Sprint ENE-3 (28–29 ene): Integración GraphQL real y alineación con BD

Commit

Fecha

Cambio

Solución implementada

e418a4f

28/01/2026

Alinear campos de usuario con la base de datos

Consistencia entre API y persistencia

9b137b8

28/01/2026

Actualizar fecha de registro en GraphQL

Corrección semántica de datos

c5ba546

28/01/2026

Mapear roles de usuario desde catálogo

Control de rol unificado

852915a

28/01/2026

Requerir password y guardar hash al crear usuario

Endurecimiento de seguridad

b451641

28/01/2026

Integrar CreateUser en carga masiva

Cierre de flujo E2E de alta

5a842cc

28/01/2026

Agregar autenticación GraphQL para login

Login contra backend real

c4c1156

28/01/2026

Usar updated_at en autenticación

Trazabilidad de acceso

Sprint FEB-2 (18–25 feb): Dashboard, tickets administrables y resultados

Commit

Fecha

Cambio

Solución implementada

ad59618

18/02/2026

Persistencia centralizada y SFTP

Migración de almacenamiento local a modelo trazable

01ce65e

19/02/2026

Implementar Dashboard Administrativo

KPIs reales para seguimiento directivo

1ac7f01

19/02/2026

Fix visibilidad tickets admin + UI

Corrección de acceso y operación de soporte

67f808e

24/02/2026

Respuesta de tickets y resultados

Cierre de flujo de soporte y resultados

1c48f85

25/02/2026

Mejoras

Afinación fullstack de consolidación

6) Trazabilidad de problemáticas vs solución técnica

graph LR
    P1[Problema: Contrato GraphQL != BD] --> S1[Alinear campos, fechas y roles]
    P2[Problema: Login y alta no cerraban flujo E2E] --> S2[CreateUser + authenticateUser + endpoint FE ajustado]
    P3[Problema: Tickets sin ciclo admin completo] --> S3[Responder/cerrar tickets + historial]
    P4[Problema: Falta de trazabilidad de cargas por usuario] --> S4[usuario_id en solicitudes_eia2]
    P5[Problema: Entrega de resultados sin estructura] --> S5[resultados JSONB + SFTP + descarga]
    P6[Problema: Falta de visibilidad directiva] --> S6[Dashboard de métricas reales]
    P7[Problema: Gobernanza técnica insuficiente] --> S7[CI/CD + Husky + plan estabilización]


7) Evidencia de cambios de BD y scripts de soporte (Enero-Febrero)

Ajuste de unicidad en grupos: Soporte de nombre repetido por grado dentro de la misma escuela para evitar colisiones en la validación.

Privacidad y autoría: Inclusión de usuario_id en la tabla solicitudes_eia2 para identificar el origen de cada carga masiva.

Histórico de archivos de salida: Inclusión de campo resultados (tipo JSONB) en solicitudes_eia2 para trazabilidad de descargas.

Evidencias de soporte: Inclusión de campo evidencias en tickets_soporte para adjuntos técnicos.

Scripts de migración ejecutados: fix_grupos_constraint.sql, add_usuario_id_solicitudes.sql, add_ticket_evidencias.sql.

8) Evidencia de PRs integrados (Muestra representativa)

PRs #198–#201 (23/01/2026): Seguridad y UX en descargas y validación de carga.

PRs #202–#213 (28–29/01/2026): Integración E2E de GraphQL-BD y flujos de autenticación.

PRs #229–#232 (12/02/2026): Consolidación de documentación técnica y Swagger.

9) Matriz de módulos entregados vs estado

Módulo

Estado Ene–Feb 2026

Evidencia

Autenticación / Autorización

Completo y reforzado

5a842cc, 852915a, 9fd3334

Carga Masiva

Completo con controles y trazabilidad

4e1818d, ad59618, 67f808e

Tickets / Mesa de ayuda

Completo con respuesta y evidencias

c4ed55b, 3dbfcd2, 67f808e

Dashboard Administrativo

Implementado con métricas reales

01ce65e, 1c48f85

Gobernanza técnica (CI/CD)

Implementada

0f499f6, 939c618

10) Conclusiones del periodo Enero–Febrero 2026

Se completó la transición de un frontend principalmente local a una operación integrada con backend real (GraphQL/REST).

La plataforma ganó trazabilidad de punta a punta: usuario autor, ticket, respuesta, resultado y descarga.

El esquema de datos evolucionó para soportar privacidad, auditoría y ciclo de vida documental.

Se establecieron prácticas de estabilización y calidad continua para sostener el crecimiento del proyecto.