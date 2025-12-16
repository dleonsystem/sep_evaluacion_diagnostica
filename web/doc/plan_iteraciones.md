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

## Iteración C2 – Descarga SEP y mejoras

**Objetivos:**
- Implementar descarga de valoraciones para usuarios SEP.
- Mejorar interfaz de usuario (filtros, tablas, mensajes).
- Optimizar auditoría y filtros de bitácora.

**Entregables:**
- Pantalla de descarga para SEP con filtros.
- Mejora de bitácora y reportes básicos.
- Versión lista para piloto de Etapa 1.

## Iteración C3 – Etapa 2 (Resultados)

**Objetivos:**
- Implementar carga de resultados por SEP Federal.
- Implementar descarga de resultados por director escolar.
- Ajustes derivados del piloto y retroalimentación.

**Entregables:**
- Módulo de carga de resultados.
- Módulo de descarga de resultados por escuela.
- Versión candidata a producción.

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

