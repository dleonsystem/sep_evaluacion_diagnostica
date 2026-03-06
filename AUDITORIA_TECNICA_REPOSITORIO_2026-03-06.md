# Auditoría Técnica Integral del Repositorio

Fecha: 2026-03-06  
Alcance: revisión de frontend Angular, backend GraphQL, scripts SQL/DDL, configuración y documentación.

> **Nota metodológica**: el dictamen se basa en evidencia observable en el repositorio y en la ejecución de validaciones locales. Donde no fue posible verificar una condición operativa (infraestructura real, monitoreo productivo, IAM externo, WAF, etc.), se marca explícitamente.

## 1) Resumen ejecutivo

El repositorio muestra **avance funcional parcial** con una base técnica utilizable para prototipado, pero con **desalineaciones críticas entre código, base de datos y documentación**. La solución **no está lista para producción** y **no está lista para QA formal** sin una estabilización previa.

Fortalezas observadas:
- Existe estructura separada de frontend Angular y backend GraphQL.
- Uso de TypeScript, SQL parametrizado y middleware de seguridad base (helmet/compression/cors).
- Presencia de documentación amplia y scripts de inicialización de BD.

Hallazgos más relevantes:
- Desacople severo entre DDL y resolvers (nombres de columnas/tablas y catálogos incompatibles).
- Autenticación/autorización mock en backend y tokens simulados en frontend.
- Manejo de credenciales sensibles en `localStorage` plano.
- Pruebas rotas o no ejecutables en backend y frontend.
- Documentación sobredimensiona capacidades no evidenciadas (rate limiting, alta cobertura, capa de servicios completa).

Conclusión ejecutiva:
- **Estado general**: parcialmente listo para desarrollo interno, **no listo** para QA formal ni producción.
- **Riesgo dominante**: seguridad + integridad de datos + falta de trazabilidad real entre diseño e implementación.

---

## 2) Calificación general (1-10)

| Dimensión | Calificación | Justificación breve |
|---|---:|---|
| Estructura del repositorio | 5 | Separación parcial por capas/proyectos, pero coexisten artefactos no alineados y componentes “aspiracionales”. |
| Calidad del código | 5 | Tipado en TS y SQL parametrizado; sin embargo, hay lógica extensa en resolvers, mocks en flujo crítico y errores de consistencia semántica. |
| Arquitectura | 4 | Arquitectura declarada no coincide con la implementada (sin service layer real en backend). |
| Frontend / UX | 5 | UI funcional básica y flujo de carga implementado; seguridad de sesión débil y protección de rutas incompleta. |
| Backend / APIs / GraphQL | 4 | Implementación funcional parcial, pero con auth mock, control de acceso incompleto y contratos acoplados a esquema no consistente. |
| Base de datos / DDL | 4 | DDL base existe, pero no corresponde al modelo realmente consumido por resolvers/scripts evolutivos. |
| Seguridad | 3 | Credenciales en localStorage, CORS abierto por defecto, sesión mock, y bypass funcional explícito. |
| DevOps / despliegue | 4 | Scripts presentes, pero evidencia de pipeline/health gates/rollback/observabilidad productiva no consolidada. |
| Pruebas / QA | 3 | Backend test runner roto por configuración ESM/CJS; frontend con fallo de tipado en specs y sin evidencia de cobertura útil. |
| Mantenibilidad | 4 | Alto acoplamiento y deuda de consistencia técnica/documental. |
| Avance real | 6 | Se observan flujos operables (carga/consulta/tickets), pero con huecos críticos de seguridad y robustez. |
| Documentación técnica | 6 | Abundante y estructurada, pero con divergencia importante frente al código real. |

---

## 3) Hallazgos detallados

### 3.1 Estructura y consistencia del repositorio

1. **Hallazgo**: Coexistencia de stack NestJS en raíz sin implementación visible operativa.
- **Evidencia**: `package.json` raíz define scripts/dependencias Nest (`nest start`, `dist/main.js`) sin evidenciar código fuente correspondiente en el árbol revisado.
- **Impacto**: confusión operativa, onboarding lento, riesgo de builds/pipelines apuntando a artefactos inexistentes.
- **Severidad**: Media.
- **Recomendación**: separar repos por bounded context o retirar artefactos no usados; definir único entrypoint oficial.
- **Prioridad**: Alta.

2. **Hallazgo**: Documentación de arquitectura describe capas/servicios no implementados como tal.
- **Evidencia**: arquitectura declara `UserService/AuthService/...` y rate limiting; en código backend la lógica está mayormente en resolvers y no se evidencia rate limiter.
- **Impacto**: falsa percepción de madurez y cobertura de controles.
- **Severidad**: Alta.
- **Recomendación**: actualizar ADR/arquitectura al estado real o implementar las capas faltantes.
- **Prioridad**: Alta.

### 3.2 Calidad de código

1. **Hallazgo**: Resolver `uploadExcelAssessment` concentra parsing, validaciones, persistencia y control transaccional en un bloque grande.
- **Evidencia**: método monolítico en `resolvers.ts` con múltiples responsabilidades.
- **Impacto**: baja testabilidad, mayor complejidad ciclomática, alto costo de cambio.
- **Severidad**: Alta.
- **Recomendación**: refactorizar en servicios de dominio/aplicación (parser, validador, orquestador transaccional, repositorios).
- **Prioridad**: Alta.

2. **Hallazgo**: Manejo de errores expone mensajes directos de excepción al cliente en algunas rutas.
- **Evidencia**: `uploadExcelAssessment` devuelve `Error al procesar: ${error.message}`.
- **Impacto**: fuga de detalles internos y soporte reactivo más difícil de gobernar.
- **Severidad**: Media.
- **Recomendación**: catálogo de errores controlado + correlation IDs.
- **Prioridad**: Media.

### 3.3 Arquitectura

1. **Hallazgo**: Contradicción entre estado “modo sin BD” y validación dura de variables DB al boot.
- **Evidencia**: backend anuncia ejecución sin BD en arranque, pero `validateDatabaseConfig()` lanza excepción si faltan vars requeridas.
- **Impacto**: indisponibilidad en entornos parciales y comportamiento no determinista según configuración.
- **Severidad**: Alta.
- **Recomendación**: definir modo degradado real (feature flag) o eliminar mensaje/documentar requisito estricto.
- **Prioridad**: Alta.

### 3.4 Frontend / UX

1. **Hallazgo**: Rutas sensibles sin guards efectivos.
- **Evidencia**: `app.routes.ts` no aplica `canActivate` en rutas administrativas ni funcionales críticas.
- **Impacto**: exposición de pantallas y acciones desde UI sin control mínimo de navegación.
- **Severidad**: Alta.
- **Recomendación**: aplicar guardas por rol/sesión y resolver redirecciones coherentes.
- **Prioridad**: Inmediata.

2. **Hallazgo**: Gestión de credenciales/sesión en `localStorage` en texto plano.
- **Evidencia**: `AuthService` persiste `contrasena`, correo y estado de sesión; `AdminAuthService` guarda token simulado base64.
- **Impacto**: alto riesgo de exposición por XSS/inspección local y suplantación de sesión.
- **Severidad**: Crítica.
- **Recomendación**: migrar a auth real (JWT/HttpOnly cookie), no persistir contraseñas, usar refresh/session segura.
- **Prioridad**: Inmediata.

### 3.5 Backend / API / GraphQL

1. **Hallazgo**: Contexto de usuario mock en middleware GraphQL.
- **Evidencia**: se asigna `user: { id: 'test-user' }` solo si existe header `authorization`.
- **Impacto**: autenticación no confiable, autorización inconsistente, falsos positivos en pruebas funcionales.
- **Severidad**: Crítica.
- **Recomendación**: validar JWT/firma, extraer claims reales y roles obligatorios.
- **Prioridad**: Inmediata.

2. **Hallazgo**: Bypass explícito de autenticación en tickets.
- **Evidencia**: `createTicket` permite tickets sin usuario autenticado si se envía correo; comentario interno lo reconoce.
- **Impacto**: riesgo de suplantación, spam y trazabilidad débil.
- **Severidad**: Alta.
- **Recomendación**: exigir sesión válida o flujo anónimo separado con controles (captcha/rate-limit/verificación).
- **Prioridad**: Inmediata.

3. **Hallazgo**: Acceso por correo en `getMyTickets` sin sesión.
- **Evidencia**: si no hay `userId`, consulta por correo recibido en input.
- **Impacto**: posible IDOR por conocimiento de correo.
- **Severidad**: Alta.
- **Recomendación**: requerir token + owner check por `sub`; no usar correo como factor único.
- **Prioridad**: Inmediata.

### 3.6 Base de datos / DDL PostgreSQL

1. **Hallazgo**: Incompatibilidad severa entre DDL base y queries reales del backend.
- **Evidencia**: DDL define `usuarios.correo/apellido_paterno/contrasena_hash`, mientras resolvers consultan/insertan `email/apepaterno/password_hash` y `cat_roles_usuario`.
- **Impacto**: fallos de ejecución en runtime y alto riesgo de bloqueo funcional completo.
- **Severidad**: Crítica.
- **Recomendación**: unificar contrato DB (migraciones versionadas), generar schema snapshot oficial y alinear resolvers + scripts.
- **Prioridad**: Inmediata.

2. **Hallazgo**: Script inicial crea credencial por defecto para rol de app.
- **Evidencia**: `CREATE ROLE eia_app LOGIN PASSWORD 'change_me_in_production'`.
- **Impacto**: riesgo de exposición si se usa sin rotación en ambientes reales.
- **Severidad**: Alta.
- **Recomendación**: inyección de secreto obligatoria por entorno, rotación y policy de contraseñas.
- **Prioridad**: Alta.

### 3.7 Seguridad

1. **Hallazgo**: CORS permisivo por defecto junto a `credentials: true`.
- **Evidencia**: `origin: process.env.CORS_ORIGIN || '*'` con `credentials: true`.
- **Impacto**: configuración insegura/confusa y superficie de ataque ampliada si no se fija origen explícito.
- **Severidad**: Alta.
- **Recomendación**: whitelist estricta por ambiente + validación explícita de origen.
- **Prioridad**: Alta.

2. **Hallazgo**: claims de seguridad/documentación no verificables completamente.
- **Evidencia**: README afirma JWT/rate limiting/alta cobertura; no se evidencia implementación integral equivalente en código auditado.
- **Impacto**: riesgo de compliance y decisión técnica basada en supuestos.
- **Severidad**: Media.
- **Recomendación**: trazabilidad “claim -> evidencia técnica” obligatoria.
- **Prioridad**: Media.

### 3.8 DevOps / despliegue

1. **Hallazgo**: build frontend falla por budgets en producción.
- **Evidencia**: `ng build` rompe por límites de estilos/componentes.
- **Impacto**: bloqueo de release reproducible.
- **Severidad**: Alta.
- **Recomendación**: optimizar estilos/bundle o ajustar budgets temporalmente con plan de reducción.
- **Prioridad**: Alta.

2. **Hallazgo**: testing backend no ejecutable por conflicto ESM/CJS en Jest config.
- **Evidencia**: `jest.config.js` usa `module.exports` en paquete con `type: module`; falla `npm test`.
- **Impacto**: sin red de seguridad automatizada para cambios.
- **Severidad**: Alta.
- **Recomendación**: migrar `jest.config.cjs` o config ESM compatible y validar pipeline.
- **Prioridad**: Inmediata.

### 3.9 Pruebas / QA

1. **Hallazgo**: pruebas frontend fallan por desalineación de tipos en spec.
- **Evidencia**: `archivos-guardados.component.spec.ts` usa propiedad `email` no existente en `RegistroArchivo` (usa `correo`).
- **Impacto**: suite inestable, feedback no confiable para regresiones.
- **Severidad**: Media.
- **Recomendación**: corregir specs, fortalecer contratos de tipos y agregar pruebas de flujo crítico.
- **Prioridad**: Alta.

### 3.10 Consistencia funcional y avance real

1. **Hallazgo**: funcionalidades clave operan con elementos simulados.
- **Evidencia**: token admin simulado en frontend; contexto mock en backend.
- **Impacto**: avance funcional aparente superior al avance productizable.
- **Severidad**: Alta.
- **Recomendación**: separar explícitamente “modo demo” y “modo productivo”, con feature flags y hard gates.
- **Prioridad**: Inmediata.

---

## 4) Inconsistencias detectadas

### Código vs Base de datos
- Backend usa `usuarios.email/apepaterno/password_hash` y catálogo `cat_roles_usuario`, pero DDL base usa `correo/apellido_paterno/contrasena_hash` y rol string en `usuarios`.
- Resolver de tickets usa tablas/catálogos (`tickets_soporte`, `cat_estado_ticket`, secuencia `seq_numero_ticket`) no visibles en script base `init-db.sql`.

### Frontend vs Backend
- Frontend simula sesión admin local; backend exige rol en contexto pero contexto no inyecta rol real.
- Rutas frontend no guardadas aunque backend tenga restricciones parciales en resolvers.

### Arquitectura declarada vs implementada
- Documentación declara service layer y rate limiting; implementación real concentra lógica en resolvers y no evidencia limitador de tasa.

### Configuración vs despliegue
- Build de frontend en modo producción falla por budgets actuales.
- Test backend no corre por incompatibilidad de configuración.

### Documentación vs realidad
- README anuncia “alta cobertura” y controles de seguridad avanzados no comprobados en ejecución local.

---

## 5) Riesgos principales (priorizados)

| Riesgo | Probabilidad | Impacto | Criticidad | Acción sugerida |
|---|---|---|---|---|
| Incompatibilidad DB-código rompe flujos core | Alta | Muy alto | **Crítica** | Congelar esquema oficial + migraciones + contrato SQL versionado. |
| Auth/autorización mock deriva en acceso indebido | Alta | Muy alto | **Crítica** | Implementar JWT real + RBAC por claims + hardening de resolvers. |
| Exposición de credenciales por localStorage | Alta | Alto | **Crítica** | Eliminar persistencia de contraseñas y usar sesiones seguras. |
| Falta de suite de pruebas confiable | Alta | Alto | **Alta** | Arreglar infraestructura de pruebas e introducir smoke/regresión obligatoria. |
| Build productivo frontend bloqueado | Alta | Medio/Alto | **Alta** | Reducir peso/estilos y ajustar budgets con backlog técnico. |
| Divergencia documentación-realidad | Alta | Medio | **Media** | Política de documentación viva y check de evidencia por release. |

---

## 6) Estimación de avance real (inferida)

> Porcentaje estimado con base en evidencia visible del repositorio y validaciones ejecutadas.

- **Frontend**: 70% (flujos UI amplios, pero seguridad/guards y robustez incompletas).
- **Backend**: 60% (resolvers amplios, pero auth real y separación de capas insuficientes).
- **Seguridad**: 30% (controles base presentes, implementación débil en sesión/autorización).
- **Base de datos**: 55% (DDL y scripts abundantes, pero inconsistentes entre sí y contra código).
- **Pruebas**: 25% (suite no estable/ejecutable de forma integral).
- **DevOps**: 40% (scripts base; faltan gates confiables y evidencia de pipeline robusto).
- **Documentación**: 75% (abundante, pero parte no sincronizada con implementación).
- **Integración end-to-end**: 45% (existen piezas conectadas, sin garantías de consistencia productiva).

---

## 7) Deuda técnica consolidada

### Urgencia inmediata
- Deuda de seguridad: auth mock, token simulado, credenciales en localStorage.
- Deuda estructural: contrato DB-código inconsistente.
- Deuda de QA: pruebas no ejecutables.

### Corto plazo
- Deuda de arquitectura: falta de service layer/repositorios para reducir complejidad.
- Deuda de despliegue: budgets de frontend y validaciones automáticas en CI.
- Deuda documental: claims no trazables a evidencia técnica.

### Mediano plazo
- Deuda operativa: observabilidad (métricas, trazas, alertamiento) y runbooks.
- Deuda UX/accesibilidad: validación no exhaustiva de estados vacíos/errores y accesibilidad AA.
- Deuda de gobernanza: estándares de naming, contratos y ownership por módulo.

---

## 8) Plan de remediación

### Horizonte inmediato (0-2 semanas)
1. **Seguridad mínima viable**
   - Implementar JWT real (firma/expiración/claims) y validar en middleware GraphQL.
   - Retirar almacenamiento de contraseñas del frontend.
   - Deshabilitar bypass por correo en tickets y reforzar ownership checks.
2. **Estabilización técnica base**
   - Definir esquema DB “source of truth” (migración 0) y corregir resolvers incompatibles.
   - Corregir configuración Jest (ESM/CJS) y reparar specs frontend rotas.
3. **Gates de calidad iniciales**
   - Pipeline mínimo: typecheck + tests + build frontend producción.

### Horizonte corto (2-6 semanas)
1. Refactor de backend por casos de uso críticos (Auth, Tickets, Upload) hacia service layer.
2. Incorporar validación de entrada centralizada (DTO/schema validation) y manejo de errores estandarizado.
3. Reducir tamaño de bundle/estilos y normalizar budgets realistas con objetivo trimestral.
4. Actualizar documentación arquitectónica a estado real y mapa de trazabilidad requisito->módulo->prueba.

### Horizonte mediano (6-12 semanas)
1. Observabilidad completa: logs estructurados, métricas, trazas distribuidas, alertas.
2. Hardening de seguridad: rate limiting, políticas CORS por entorno, pruebas de seguridad automatizadas (SAST/DAST).
3. Estrategia de releases: versionado semántico, changelog verificable, rollback plan y runbooks operativos.

Dependencias críticas:
- No iniciar QA formal sin resolver contrato DB-código + auth real + suite mínima ejecutable.

---

## 9) Conclusión final

- **¿Es sostenible?** Parcialmente, solo para desarrollo interno controlado.
- **¿Es seguro?** No en su estado actual para exposición formal.
- **¿Es mantenible?** Con riesgo medio-alto por acoplamiento y deuda de consistencia.
- **¿Listo para QA?** No; requiere estabilización de pruebas y contrato técnico.
- **¿Listo para producción?** No.

### Condiciones mínimas antes de liberar
1. Unificación efectiva de modelo de datos y consultas backend.
2. Autenticación/autorización real sin mocks ni bypasses.
3. Eliminación de credenciales en localStorage y endurecimiento de sesiones.
4. Pipeline verde en typecheck/tests/build producción.
5. Documentación sincronizada con evidencia técnica real.
