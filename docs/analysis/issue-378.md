# Análisis de Requerimiento: Restricción de Duplicidad por Usuario

**ID del Issue:** #378
**Estado:** COMPLETADO
**Prioridad:** Alta (Fase 1)

## Descripción del Requerimiento
Se requería que la validación de archivos duplicados (misma CCT y Turno) sea sensible al usuario que realiza la carga. Es decir:
1.  Si el **mismo usuario** intenta subir una CCT+Turno que ya cargó, se debe solicitar reemplazo.
2.  Si un **usuario diferente** intenta subir la misma CCT+Turno, el sistema debe permitirlo como una carga independiente (duplicidad permitida entre usuarios distintos).

## Análisis de Causa Raíz
Anteriormente, la lógica podría haber estado bloqueando globalmente a nivel de CCT, lo que impedía que distintos directores o responsables de turno trabajaran sobre la misma escuela si compartían datos.

## Solución Implementada
Se ajustó la lógica en el backend (`resolvers.ts`) para incluir el identificador del usuario en el filtro de búsqueda de solicitudes existentes.

### Implementación Técnica (Backend)
- **Consulta de Verificación:** Se modificó la query de detección de duplicados en la mutación `uploadExcelAssessment`:
  ```sql
  SELECT id FROM solicitudes_eia2 
  WHERE cct = $1 
    AND id_turno = $2 
    AND usuario_id = $3 
  LIMIT 1
  ```
- **Lógica resultante:**
    - Al incluir `usuario_id = $3`, el sistema solo encontrará una "carga activa" si el usuario actual es el mismo que realizó la carga previa de esa CCT+Turno.
    - Si el `usuario_id` es diferente, la consulta no devuelve resultados y el flujo continúa como una carga nueva y válida.

## Verificación
- [x] Usuario A carga CCT 0123456789 (Turno Matutino) -> Exito.
- [x] Usuario A carga CCT 0123456789 (Turno Matutino) nuevamente -> **Solicita Reemplazo** (Correcto).
- [x] Usuario B carga CCT 0123456789 (Turno Matutino) -> Exito sin solicitar reemplazo (Correcto, son distintos usuarios).

---
**Fecha de Resolución:** 2026-04-09
**Responsable:** Antigravity AI
