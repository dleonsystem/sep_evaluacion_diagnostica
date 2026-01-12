# Plan de Iteraciones – RUP  
## Plataforma de Gestión de Valoraciones EIA 2025–2026

---

# 1. Fase de Inicio (Inception)

**Objetivos:**
- Definir visión del sistema.
- Identificar actores y casos de uso principales.
- Establecer alcance de las etapas 1 y 2.
- Identificar riesgos de alto nivel.

**Entregables:**
- Documento de Visión.
- Lista inicial de riesgos.
- Modelo de casos de uso de alto nivel.

---

# 2. Fase de Elaboración (Elaboration)

## Iteración E1 – Modelado de requerimientos

**Objetivos:**
- Completar la SRS.
- Detallar casos de uso prioritarios (CU-01, CU-02, CU-05, CU-07, CU-08).
- Definir modelo de datos conceptual.

**Entregables:**
- SRS v1.x.
- Casos de uso detallados.
- Modelo de datos conceptual.

**Criterios de Aceptación:**
- [ ] SRS completa con al menos 15 requisitos funcionales documentados y validados
- [ ] Los 5 casos de uso prioritarios están detallados con flujos principales y alternativos
- [ ] Modelo de datos conceptual incluye al menos 30 entidades con relaciones definidas
- [ ] Revisión y aprobación del stakeholder (SEP) sobre la SRS
- [ ] 100% de trazabilidad entre requisitos y casos de uso

## Iteración E2 – Diseño arquitectónico y tecnológico

**Objetivos:**
- Definir arquitectura de software.
- Seleccionar frameworks concretos en Node.js (por ejemplo, Express o NestJS) y afinar configuración de Angular.
- Definir estrategia de despliegue inicial (ambientes: desarrollo, pruebas, producción).

**Entregables:**
- Documento de Arquitectura (SAD) actualizado.
- Prototipo técnico mínimo:
  - Endpoint de ejemplo en Node.js.
  - Pantalla simple en Angular 19 consumiendo el endpoint.

**Criterios de Aceptación:**
- [ ] Documento de Arquitectura (SAD) aprobado con diagramas de componentes e infraestructura
- [ ] Prototipo funcional desplegado en ambiente de desarrollo
- [ ] Endpoint de prueba responde con latencia < 200ms bajo carga de 10 peticiones/seg
- [ ] Pantalla Angular se comunica exitosamente con el backend y muestra datos
- [ ] Ambientes de desarrollo, pruebas y producción configurados y documentados
- [ ] Framework backend seleccionado y justificación documentada

---

# 3. Fase de Construcción (Construction)

## Iteración C1 – Núcleo Etapa 1

**Objetivos:**
- Implementar autenticación (login, logout).
- Implementar carga de valoraciones con validaciones básicas.
- Implementar bitácora de actividades.

**Entregables:**
- Módulo de login en Angular + API de autenticación en Node.js.
- Pantalla de carga de valoraciones.
- Registro de eventos (logins y cargas) en PostgreSQL.
- Pruebas unitarias e integración básicas.

**Criterios de Aceptación:**
- [ ] Usuario puede autenticarse con credenciales válidas (éxito en 100% de casos válidos)
- [ ] Sistema rechaza credenciales inválidas con mensaje claro (100% de casos inválidos)
- [ ] Sesión expira automáticamente tras 30 minutos de inactividad
- [ ] Carga de archivos .xlsx y .xls funciona para formatos válidos (éxito ≥ 95%)
- [ ] Validaciones básicas detectan errores críticos (CCT inválido, hojas faltantes)
- [ ] Auditoría registra al menos: usuario, acción, timestamp, IP, resultado
- [ ] Cobertura de pruebas unitarias ≥ 75% en módulos críticos
- [ ] 0 defectos críticos o mayores en pruebas de integración

## Iteración C2 – Descarga SEP y mejoras

**Objetivos:**
- Implementar descarga de valoraciones para usuarios SEP.
- Mejorar interfaz de usuario (filtros, tablas, mensajes).
- Optimizar auditoría y filtros de bitácora.

**Entregables:**
- Pantalla de descarga para SEP con filtros.
- Mejora de bitácora y reportes básicos.
- Versión lista para piloto de Etapa 1.

**Criterios de Aceptación:**
- [ ] Usuarios SEP pueden filtrar archivos por: CCT, entidad, fecha, estado
- [ ] Descarga de archivos se completa en < 5 segundos para archivos ≤ 5 MB
- [ ] Interfaz cumple con estándares de accesibilidad WCAG 2.1 nivel AA
- [ ] Bitácora permite búsqueda por usuario, acción, rango de fechas
- [ ] Sistema soporta 100 usuarios concurrentes sin degradación > 20% en rendimiento
- [ ] Piloto con 50 escuelas reales ejecutado exitosamente
- [ ] Feedback de usuarios piloto incorporado (al menos 80% de sugerencias críticas)

## Iteración C3 – Etapa 2 (Resultados)

**Objetivos:**
- Implementar carga de resultados por SEP Federal.
- Implementar descarga de resultados por director escolar.
- Ajustes derivados del piloto y retroalimentación.

**Entregables:**
- Módulo de carga de resultados.
- Módulo de descarga de resultados por escuela.
- Versión candidata a producción.

**Criterios de Aceptación:**
- [ ] SEP Federal puede cargar archivos de resultados masivos (> 10,000 registros)
- [ ] Proceso de carga masiva se completa en < 2 horas para 50,000 escuelas
- [ ] Directores escolares solo ven resultados de su CCT (seguridad validada al 100%)
- [ ] Notificaciones automáticas se envían a directores cuando resultados están listos
- [ ] 95% de notificaciones se entregan exitosamente en < 5 minutos
- [ ] Pruebas de carga con 1,000 descargas simultáneas sin errores
- [ ] 0 defectos críticos pendientes en ambiente de pruebas
- [ ] Aprobación formal de SEP para paso a producción

---

# 4. Fase de Transición (Transition)

**Objetivos:**
- Despliegue en ambiente productivo.
- Capacitación a usuarios clave (SEP, directores).
- Soporte intensivo durante ventana de recepción de archivos.

**Entregables:**
- Manual de usuario.
- Manual de administración.
- Informe de cierre de proyecto y lecciones aprendidas.

**Criterios de Aceptación:**
- [ ] Sistema desplegado en producción con 99.5% de disponibilidad durante primer mes
- [ ] Al menos 200 directores escolares capacitados presencialmente o en línea
- [ ] 50 usuarios SEP (estatales + federales) capacitados en todas las funcionalidades
- [ ] Manuales de usuario distribuidos y accesibles en plataforma (formato PDF + videos)
- [ ] Equipo de soporte disponible 12 horas/día durante ventana crítica de recepción
- [ ] Menos de 5% de tickets de soporte clasificados como "críticos" sin resolver en 4 horas
- [ ] Tasa de adopción ≥ 70% (escuelas usando plataforma vs. enviando por correo)
- [ ] Informe de cierre documenta al menos 10 lecciones aprendidas y 5 mejoras recomendadas
- [ ] Aprobación final de cierre de proyecto por parte del sponsor (SEP)

