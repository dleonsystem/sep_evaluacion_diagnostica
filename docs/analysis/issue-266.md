# Análisis del Issue: [Fase 1] Validaciones y reglas de negocio para CCT / Registro de Escuelas #266

## 1. Resumen y Datos
*   **Título/Estado:** Validaciones y reglas de negocio para CCT / Registro Automático / Abierto
*   **Componentes afectados:** UI (Angular), Backend (GraphQL Resolver), CCT Validator Utility
*   **Resumen Ejecutivo:** Se identificó una discrepancia en el algoritmo de verificación de CCT (multiplicadores invertidos) y una restricción excesiva que impedía la carga masiva para escuelas de nueva creación no catalogadas. Se implementó la corrección algorítmica y un mecanismo de registro "just-in-time" durante la carga de Excel.

## 2. Datos del issue
*   **Título:** Validaciones y reglas de negocio para CCT #266 (Derivado de #252)
*   **Estado:** En Proceso
*   **Labels:** enhancement, fase-1, catalogos, critico
*   **Prioridad:** Crítica (Bloquea la participación de escuelas nuevas en la evaluación)
*   **Fuente consultada:** `ProcedimientoElementoVerificador.md` (Documento técnico oficial).

## 3. Problema reportado
1.  **Dígito Verificador Incorrecto**: El sistema reportaba como inválidas CCTs oficiales debido a que los multiplicadores del algoritmo (7 y 26) se aplicaban a las posiciones inversas.
2.  **Bloqueo de Escuelas Nuevas**: La carga de evaluaciones fallaba si la CCT no existía previamente en la tabla `escuelas`, obligando a un registro manual previo por parte del administrador, lo cual es ineficiente para el despliegue nacional.

## 4. Estado anterior en el código
*   **Frontend (`excel-validation.service.ts`)**: Multiplicaba Nones por 7 y Pares por 26. Retornaba error fatal si `verificarCctEnBaseDeDatos` era falso.
*   **Backend (`cct-validator.ts`)**: Algoritmo idéntico al frontend (incorrecto).
*   **Backend (`resolvers.ts`)**: La mutación `uploadExcelAssessment` realizaba un `SELECT` inicial en `escuelas`; si no había resultados, retornaba `success: false` con mensaje de error de catálogo.

## 5. Comparación issue vs implementación
*   **Correcto**: El sistema ahora sigue fielmente el ejemplo del documento oficial (CCT `01DPR0001V` -> Residuo 3 -> 'D').
*   **Nuevas Escuelas**: Se permite la carga si el formato es válido. El backend detecta la ausencia del registro y lo crea automáticamente usando la metadata del Excel.

## 6. Diagnóstico Técnico
*   **Causa Raíz Algorithm**: Mala interpretación de "Posiciones Pares" (documento considera Posición 1 como impar, Posición 2 como par) vs Índices de Array (0, 1, 2...).
*   **Causa Raíz Bloqueo**: Suposición del diseño original de que el catálogo de escuelas estaría 100% pre-cargado antes del inicio de la evaluación diagnóstica.

## 7. Solución implementada
*   **Corrección Algorítmica**:
    *   `posPares * 7`
    *   `posNones * 26`
    *   (Donde Posición 1 es index 0, Posición 2 es index 1).
*   **Registro Automático (Backend)**:
    1.  Si la escuela no existe, el resolver inicia una inserción preventiva dentro de la transacción de carga.
    2.  Se mapea la **Entidad Federativa** a partir de los primeros 2 caracteres de la CCT.
    3.  Se hereda el **Ciclo Escolar** activo.
    4.  Se utiliza el nombre y nivel detectados directamente de la plantilla Excel.
*   **Mejora UX (Frontend)**: Se cambió el error por una `advertencia` que informa al usuario: "La CCT no está registrada... el sistema la dará de alta automáticamente".

## 8. Criterios de aceptación (PSP)
*   [x] Validación exitosa de CCTs oficiales (ej. Ciudad de México 09...).
*   [x] Creación de registro en tabla `escuelas` si no existe.
*   [x] Mantenimiento de auditoría en `log_actividades`.

## 9. Estrategia de pruebas
*   **Test Case 1**: CCT `01DPR0001V`. Resultado esperado: Válido.
*   **Test Case 2**: Archivo Excel con CCT nueva. Resultado esperado: Inserción exitosa en DB y vinculación de evaluación.

## 10. Seguridad (OWASP)
*   Se asegura que el registro automático se realice bajo una transacción controlada para evitar registros huérfanos.
*   Se valida el formato de la CCT antes de cualquier persistencia para prevenir inyecciones o datos basura.

---
**Documentado por:** Antigravity (Senior AI Architect)
**Fecha:** 2026-04-16
