# POLÍTICAS DE DESARROLLO DE SOFTWARE

## 1. Propósito

Establecer las políticas, procesos y procedimientos para el desarrollo, mantenimiento y operación del software, asegurando calidad, seguridad, trazabilidad y control mediante buenas prácticas DevOps, PSP y RUP.

## 2. Alcance

Aplica a todos los proyectos de software desarrollados o mantenidos por la organización.

## 3. Gestión de Requerimientos

### 3.1 Matriz de responsabilidades por módulo

Para asegurar trazabilidad, calidad y claridad operativa, cada módulo del sistema deberá tener responsables definidos.

Roles mínimos:

- **Líder del Proyecto**: responsable de priorización, seguimiento general y liberaciones.
- **Desarrollador del Módulo**: responsable del desarrollo, mantenimiento y corrección del código del módulo.
- **Tester del Módulo**: responsable de validar funcionalidad, ejecutar pruebas y aprobar resultados de QA.

Cada módulo del sistema deberá tener asignado:

| Módulo        | Desarrollador Responsable | Tester Responsable | Líder del Proyecto |
| ------------- | ------------------------- | ------------------ | ------------------ |
| API           | @pepenautamx              | @polethvillegas    | Líder Proyecto     |
| Admin         | @dleon55                  | Pendiente          | Líder Proyecto     |
| Dashboard     | @maronatti                | Pendiente          | Líder Proyecto     |
| Integraciones | Pendiente                 | Pendiente          | Líder Proyecto     |

Esta matriz deberá mantenerse actualizada por el líder técnico o líder del proyecto.

### 3.2 Asignación automática de responsables en Issues

Cuando se cree un **Issue** asociado a un módulo del sistema, deberán asignarse automáticamente los responsables correspondientes.

Regla obligatoria:

Al crear un Issue:

1. Se debe seleccionar el **módulo afectado**.
2. El Issue deberá asignarse al **desarrollador responsable del módulo**.
3. El Issue deberá asignarse también al **tester responsable del módulo**.

Responsabilidades durante el ciclo del Issue:

**Desarrollador del módulo**

- Analizar el requerimiento o incidencia.
- Crear la rama correspondiente (`task/*` o `hotfix/*`).
- Implementar la solución.
- Crear Pull Request hacia `qa`.

**Tester del módulo**

- Revisar el Issue.
- Preparar casos de prueba si aplica.
- Validar funcionalidad en ambiente QA.
- Aprobar o rechazar la liberación.

**Líder del Proyecto**

- Priorizar Issues.
- Supervisar avances.
- Autorizar liberación hacia producción (`main`).

### 3.3 Flujo operativo de Issue por módulo

1. Se crea el Issue.
2. Se identifica el módulo afectado.
3. GitHub asigna automáticamente:
   - desarrollador responsable
   - tester responsable
4. El desarrollador crea rama `task/*`.
5. Se implementa el cambio.
6. Pull Request hacia `qa`.
7. Tester valida en QA.
8. Si es aprobado → merge hacia `main`.
9. Si falla → regresa a desarrollo.

Estados del Issue:

- Nuevo
- En análisis
- En desarrollo
- En pruebas
- Aprobado
- Cerrado

Cada requerimiento debe incluir:

- Descripción funcional
- Criterios de aceptación
- Impacto en arquitectura

Todo requerimiento debe registrarse como Issue en el repositorio.

Estados:

- Nuevo
- En análisis
- En desarrollo
- En pruebas
- Cerrado

Cada requerimiento debe incluir:

- Descripción funcional
- Criterios de aceptación
- Impacto en arquitectura

### 3.4 Etiquetas (Labels) de GitHub y colorimetría

Para facilitar la clasificación, priorización y visualización de Issues en GitHub, se deberán crear etiquetas estandarizadas.

Las etiquetas se agrupan en cinco categorías: **tipo de trabajo, prioridad, módulo, estado y ambiente**.

#### A) Tipo de trabajo

| Etiqueta             | Uso                              | Color   |
| -------------------- | -------------------------------- | ------- |
| `type:feature`       | Nueva funcionalidad              | #1d76db |
| `type:bug`           | Error o defecto del sistema      | #d73a4a |
| `type:improvement`   | Mejora a funcionalidad existente | #a2eeef |
| `type:task`          | Trabajo técnico o mantenimiento  | #7057ff |
| `type:documentation` | Cambios en documentación         | #0075ca |

#### B) Prioridad

| Etiqueta      | Uso                          | Color   |
| ------------- | ---------------------------- | ------- |
| `priority:p0` | Incidente crítico producción | #b60205 |
| `priority:p1` | Alta prioridad               | #d93f0b |
| `priority:p2` | Prioridad media              | #fbca04 |
| `priority:p3` | Baja prioridad               | #0e8a16 |

#### C) Módulo del sistema

Estas etiquetas permiten identificar automáticamente el desarrollador y tester responsable del módulo.

| Etiqueta              | Uso                    | Color   |
| --------------------- | ---------------------- | ------- |
| `module:api`          | Backend API            | #5319e7 |
| `module:admin`        | Panel administrativo   | #8a2be2 |
| `module:dashboard`    | Dashboard o frontend   | #1abc9c |
| `module:integrations` | Integraciones externas | #006b75 |

#### D) Estado del Issue

| Etiqueta               | Uso                   | Color   |
| ---------------------- | --------------------- | ------- |
| `status:analysis`      | En análisis técnico   | #cfd3d7 |
| `status:development`   | En desarrollo         | #fbca04 |
| `status:qa`            | En pruebas QA         | #0e8a16 |
| `status:blocked`       | Bloqueado             | #b60205 |
| `status:ready-release` | Listo para liberación | #5319e7 |

#### E) Ambiente

| Etiqueta         | Uso                           | Color   |
| ---------------- | ----------------------------- | ------- |
| `env:qa`         | Cambio desplegado en QA       | #1d76db |
| `env:production` | Cambio liberado en producción | #0e8a16 |

#### Reglas de uso

- Todo Issue debe tener **al menos una etiqueta de tipo, prioridad y módulo**.
- El módulo seleccionado determina el **desarrollador y tester responsables**.
- Las etiquetas de estado se actualizan durante el ciclo de vida del Issue.
- Las etiquetas de ambiente se aplican cuando el cambio es desplegado.

Esta convención permite visualizar rápidamente el estado del proyecto en GitHub Projects, facilitar filtros y mejorar la trazabilidad del trabajo del equipo.

## 4. Gestión de Incidencias

Las incidencias se clasifican en:

- P0 Crítico
- P1 Alto
- P2 Medio
- P3 Bajo

El ciclo de vida de la incidencia:

1. Registro
2. Diagnóstico
3. Corrección
4. Validación
5. Cierre

## 5. Diseño de Software

Todo desarrollo debe incluir diseño previo:

- Arquitectura
- Modelo de datos
- Diagramas de componentes

## 6. Desarrollo

El desarrollo debe seguir estándares de codificación, modularidad y seguridad.

## 7. Control de Versiones

Se utilizará Git como sistema oficial de control de versiones, con una estrategia de ramas orientada a trazabilidad, control de calidad, segregación de ambientes y despliegues seguros.

### 7.1 Propuesta simplificada de ramas para equipo pequeño

Para un equipo de desarrollo pequeño, se recomienda reducir el número de tipos de ramas para facilitar adopción, disciplina operativa y capacitación.

Modelo simplificado propuesto:

- `main`: producción.
- `qa`: ambiente de pruebas y validación.
- `task/*`: cualquier trabajo normal de desarrollo, mejora, ajuste, requerimiento o corrección no urgente.
- `hotfix/*`: correcciones urgentes de producción.

Con este esquema se eliminan tipos que suelen confundir o terminar usándose de forma inconsistente, como `develop`, `feature/*`, `bugfix/*`, `chore/*` y `release/*`.

Ventajas del modelo simplificado:

- Más fácil de enseñar al equipo.
- Menor probabilidad de errores en la selección de rama.
- Menor carga administrativa.
- Mejor cumplimiento real de la política.
- Suficiente control para equipos pequeños con uno o pocos despliegues por semana.

### 7.2 Rama utilizada para ambiente QA

El ambiente de QA deberá desplegarse desde la rama `qa`.

Flujo simplificado recomendado:

1. El desarrollador crea una rama `task/*`.
2. La rama se integra por Pull Request hacia `qa`.
3. El ambiente QA se despliega desde `qa`.
4. Una vez aprobado funcional y técnicamente, se fusiona de `qa` hacia `main`.
5. Si existe una urgencia productiva, se crea una rama `hotfix/*` desde `main` y después se regresa el cambio también a `qa`.

Flujo resumido:

- Cambio normal: `task/*` → `qa` → `main`
- Cambio urgente: `hotfix/*` → `main` → `qa`

Este modelo reduce pasos sin perder control. Para un equipo pequeño, menos ramas suele significar más orden y menos accidentes con nombre elegante.

### 7.3 Nomenclatura de ramas

Toda rama deberá seguir una convención obligatoria, simple y fácil de memorizar.

Estructura recomendada:

- `<tipo>/<id>-<descripcion-corta>`

Tipos permitidos:

- `task/*`
- `hotfix/*`

Ejemplos:

- `task/145-login-pacientes`
- `task/212-reporte-pagos`
- `task/318-ajuste-google-maps`
- `hotfix/401-token-expirado`

Opcionalmente, si el equipo necesita identificar autor sin complicarse demasiado, puede usarse:

- `<tipo>/<usuario>-<id>-<descripcion-corta>`

Ejemplos:

- `task/dleon-145-login-pacientes`
- `hotfix/dleon-401-token-expirado`

Reglas:

- Usar minúsculas.
- Separar palabras con guion medio.
- No usar espacios, acentos ni caracteres especiales.
- La descripción debe ser breve y entendible.
- El identificador debe corresponder al Issue, ticket o folio interno.

### 7.4 Inclusión de versión en la nomenclatura

En un equipo pequeño, se recomienda no incluir la versión en todas las ramas para evitar nombres largos y difíciles de respetar.

Regla recomendada:

- No incluir versión en ramas `task/*`.
- Incluir versión solo en etiquetas de liberación, releases de GitHub o despliegues documentados.
- En `hotfix/*`, la versión puede incluirse solo si el cambio requiere control formal de liberación.

Ejemplos opcionales para urgencias productivas:

- `hotfix/v2.4.1-token-expirado`
- `hotfix/401-token-expirado`

Recomendación operativa:
La versión debe vivir principalmente en:

- tags de Git
- release notes
- changelog
- nombre del artefacto desplegado

Así la rama sigue corta y la trazabilidad no se vuelve novela de 800 páginas.

### 7.5 Inclusión del nombre o identificador del desarrollador

En un equipo pequeño, el nombre del desarrollador en la rama debe ser opcional, no obligatorio.

Propuesta:

- Usar ramas sin nombre de desarrollador como regla general.
- Usar nombre corto solo cuando varios desarrolladores trabajen temas parecidos al mismo tiempo.

Modelo preferido:

- `task/145-login-pacientes`
- `hotfix/401-token-expirado`

Modelo opcional:

- `task/dleon-145-login-pacientes`
- `hotfix/dleon-401-token-expirado`

Esto reduce errores de nomenclatura y facilita la capacitación.

### 7.6 Reglas obligatorias de ramas

Toda rama deberá cumplir las siguientes reglas:

- Estar asociada a un Issue, requerimiento, incidente o cambio aprobado.
- Tener nombre estandarizado.
- Tener alcance acotado a una sola funcionalidad, corrección o ajuste técnico.
- Mantener vigencia temporal; una vez integrada, deberá eliminarse.
- No reutilizarse para nuevos cambios.
- Mantener historial comprensible y commits con mensajes claros.

### 7.7 Ramas reservadas

Se consideran ramas reservadas y de uso restringido:

- `main`
- `qa`

Restricciones:

- No se permite trabajo directo sobre ramas reservadas.
- No se permite push directo a `main` o `qa`.
- Todo cambio deberá entrar por Pull Request.
- Las ramas `hotfix/*` deberán usarse solo para incidentes urgentes de producción.

### 7.8 Políticas y restricciones por rama

#### a) Rama `main`

Políticas:

- Exclusiva para producción.
- Solo recibe cambios aprobados desde `qa` o `hotfix/*`.
- Todo merge deberá corresponder a una liberación aprobada.

Restricciones mínimas:

- Protección obligatoria.
- Bloqueo de push directo.
- Revisión mínima de 1 o 2 aprobadores, según tamaño real del equipo.
- Resolución obligatoria de conversaciones.
- Ejecución exitosa de pipeline CI.
- Validación de pruebas automáticas.

#### b) Rama `qa`

Políticas:

- Exclusiva para pruebas integrales y validación funcional.
- Recibe cambios desde `task/*`.
- Debe representar exactamente lo desplegado al ambiente QA.

Restricciones mínimas:

- Protección obligatoria.
- Bloqueo de push directo.
- Al menos 1 aprobación técnica.
- Pipeline exitoso obligatorio.
- Pruebas de integración obligatorias cuando apliquen.

#### c) Rama `task/*`

Políticas:

- Se usa para cualquier cambio normal del proyecto: funcionalidad, ajuste, corrección, mejora técnica o mantenimiento.
- Debe crearse desde `qa` cuando el siguiente destino natural sea QA.

Restricciones mínimas:

- No requiere protección especial.
- Debe vincularse a un Issue o ticket.
- Debe eliminarse después del merge.

#### d) Ramas `hotfix/*`

Políticas:

- Exclusivas para incidentes productivos urgentes.
- Se crean desde `main`.
- Después del ajuste deben regresar a `main` y también a `qa` para mantener alineados ambos ambientes.

Restricciones mínimas:

- Uso excepcional.
- Aprobación acelerada pero obligatoria.
- Evidencia de incidente o ticket crítico.
- Validación posterior del cambio en QA.

### 7.9 Configuración recomendada de reglas de rama en GitHub

Para ramas protegidas se recomienda configurar como mínimo:

- Require a pull request before merging.
- Require approvals: mínimo 1 en `qa` y mínimo 1 o 2 en `main`.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Restrict who can push to matching branches.
- Bloquear force push.
- Bloquear eliminación accidental de ramas protegidas.

Configuración mínima sugerida para equipo pequeño:

- Proteger `main` y `qa`.
- No proteger `task/*`.
- No complicar con reglas diferentes por módulo salvo que el equipo crezca.

### 7.10 Reglas recomendadas para commits y merge

- Todo commit deberá ser legible y trazable.
- Se recomienda convención tipo: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Todo PR deberá indicar objetivo, alcance, riesgos, evidencia y plan de reversa.
- No deberán integrarse ramas con conflictos sin resolver.
- Se recomienda squash merge de `task/*` hacia `qa` para mantener historial limpio.
- Se recomienda merge controlado de `qa` hacia `main` una vez aprobada la liberación.
- Los `hotfix/*` deben integrarse primero a `main` y después replicarse a `qa`.

## 8. Integración Continua

Todo cambio deberá integrarse mediante Pull Request y pasar por controles automatizados y manuales antes de promoverse entre ramas o ambientes.

Requisitos mínimos:

- Revisión de código.
- Ejecución de pruebas unitarias.
- Ejecución de pruebas de integración cuando aplique.
- Validación de calidad estática.
- Validación de seguridad básica de dependencias y secretos.
- Evidencia de trazabilidad hacia Issue, requerimiento o incidencia.

Controles sugeridos por ambiente:

- Hacia `qa`: lint, build, pruebas unitarias y pruebas de integración cuando apliquen.
- Hacia `main`: pipeline completo, aprobación funcional y validaciones de seguridad y liberación.

## 9. Pruebas

Se deben realizar:

- pruebas unitarias
- pruebas de integración
- pruebas funcionales

## 10. Despliegue

Los despliegues deben realizarse mediante pipeline automatizado.

## 11. Seguridad

Se deben aplicar prácticas de seguridad durante el desarrollo.

## 12. Mejora Continua

Se realizarán revisiones periódicas del proceso de desarrollo.

---

# ANEXO A – ETIQUETAS DE GITHUB Y COLORIMETRÍA

Este anexo define las etiquetas (labels) oficiales que deberán configurarse en GitHub para estandarizar la clasificación de Issues, facilitar la gestión del trabajo del equipo y mejorar la trazabilidad de desarrollo.

Las etiquetas se agrupan en cinco categorías: **tipo de trabajo, prioridad, módulo, estado y ambiente**.

## A.1 Tipo de trabajo

| Etiqueta             | Uso                              | Color   |
| -------------------- | -------------------------------- | ------- |
| `type:feature`       | Nueva funcionalidad              | #1d76db |
| `type:bug`           | Error o defecto del sistema      | #d73a4a |
| `type:improvement`   | Mejora a funcionalidad existente | #a2eeef |
| `type:task`          | Trabajo técnico o mantenimiento  | #7057ff |
| `type:documentation` | Cambios en documentación         | #0075ca |

## A.2 Prioridad

| Etiqueta      | Uso                             | Color   |
| ------------- | ------------------------------- | ------- |
| `priority:p0` | Incidente crítico en producción | #b60205 |
| `priority:p1` | Alta prioridad                  | #d93f0b |
| `priority:p2` | Prioridad media                 | #fbca04 |
| `priority:p3` | Baja prioridad                  | #0e8a16 |

## A.3 Módulo del sistema

Estas etiquetas permiten identificar automáticamente el desarrollador y tester responsable del módulo.

| Etiqueta              | Uso                    | Color   |
| --------------------- | ---------------------- | ------- |
| `module:api`          | Backend API            | #5319e7 |
| `module:admin`        | Panel administrativo   | #8a2be2 |
| `module:dashboard`    | Dashboard o frontend   | #1abc9c |
| `module:integrations` | Integraciones externas | #006b75 |

## A.4 Estado del Issue

| Etiqueta               | Uso                   | Color   |
| ---------------------- | --------------------- | ------- |
| `status:analysis`      | En análisis técnico   | #cfd3d7 |
| `status:development`   | En desarrollo         | #fbca04 |
| `status:qa`            | En pruebas QA         | #0e8a16 |
| `status:blocked`       | Trabajo bloqueado     | #b60205 |
| `status:ready-release` | Listo para liberación | #5319e7 |

## A.5 Ambiente

| Etiqueta         | Uso                              | Color   |
| ---------------- | -------------------------------- | ------- |
| `env:qa`         | Cambio desplegado en ambiente QA | #1d76db |
| `env:production` | Cambio liberado en producción    | #0e8a16 |

## A.6 Reglas de uso de etiquetas

Para mantener orden en la gestión del proyecto, deberán aplicarse las siguientes reglas:

- Todo Issue deberá tener **al menos una etiqueta de tipo, prioridad y módulo**.
- El módulo seleccionado determina el **desarrollador y tester responsables**.
- Las etiquetas de estado se actualizarán durante el ciclo de vida del Issue.
- Las etiquetas de ambiente se utilizarán cuando el cambio sea desplegado.

Esta convención permite:

- visualizar rápidamente el estado del proyecto
- facilitar filtros en GitHub Issues y GitHub Projects
- mejorar la trazabilidad del trabajo del equipo
- identificar responsables técnicos por módulo

El líder del proyecto será responsable de asegurar que las etiquetas estén correctamente configuradas en el repositorio.

