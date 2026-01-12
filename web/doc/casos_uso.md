# Modelo de Casos de Uso – Plataforma de Recepción, Validación y Descarga EIA

## 1. Diagrama general de casos de uso (Mermaid)

```mermaid
flowchart LR
    subgraph Actores
        A[Escuela anónima]
        B[Escuela autenticada]
        C[Sistema externo de resultados]
        D[Operador técnico SEP]
    end

    subgraph Sistema[Plataforma EIA]
        CU1[CU-01 Cargar archivo .xlsx sin login]
        CU2[CU-02 Validar 10 reglas y mostrar estado]
        CU3[CU-03 Generar credenciales, 1ª carga válida]
        CU4[CU-04 Emitir PDF de confirmación/errores]
        CU5[CU-05 Registrar solicitud y almacenar archivo]
        CU6[CU-06 Detectar reenvío y requerir login]
        CU7[CU-07 Autenticarse para reenvío/descargas]
        CU8[CU-08 Listar versiones y ligas de descarga]
    end

    A --> CU1
    A --> CU2
    A --> CU3
    A --> CU4
    A --> CU5
    A --> CU6

    B --> CU6
    B --> CU7
    B --> CU8

    C --> CU8

    D --> CU2
    D --> CU5
```

---

## 2. Lista de casos de uso

1. **CU-01 Cargar archivo .xlsx sin login**
   - Actor: Escuela (anónima)
   - Descripción: Permite seleccionar y cargar el archivo. Dispara validación automática.

2. **CU-02 Validar 10 reglas y mostrar estado**
   - Actor: Escuela (anónima), Operador técnico SEP
   - Descripción: Ejecuta las verificaciones (CCT, correo, nivel, campos obligatorios por hoja, columnas obligatorias, valores 0–3, estructura general, número/nombre de hojas, consistencia interna y **huella de archivo/hash** para distinguir archivos con el mismo nombre) y muestra “Validando tu archivo…”.

3. **CU-03 Generar credenciales en primera carga válida**
   - Actor: Escuela (anónima)
   - Descripción: Si es la primera carga válida, crea usuario = CCT validado y contraseña = correo validado.

4. **CU-04 Emitir PDF de confirmación o errores**
   - Actor: Escuela (anónima)
   - Descripción: Descarga automática del PDF de confirmación (con fecha hoy + 4 días, usuario/contraseña, timestamp) o PDF de errores si el archivo es inválido.

5. **CU-05 Registrar solicitud y almacenar archivo**
   - Actor: Escuela (anónima), Operador técnico SEP
   - Descripción: Cada carga válida se registra como solicitud independiente con consecutivo y se guarda en el repositorio de recepción.

6. **CU-06 Detectar reenvío y requerir login**
   - Actor: Escuela (anónima), Escuela (autenticada)
   - Descripción: Si existe una credencial previa para el CCT/correo, se bloquea el envío anónimo y se solicita autenticación antes de permitir otro archivo; el reenvío verifica la **huella hash** para identificar si es exactamente el mismo archivo o una nueva versión aun con el mismo nombre.

7. **CU-07 Autenticarse para reenvío/descargas**
   - Actor: Escuela (autenticada)
   - Descripción: Login con CCT + contraseña generada en la primera carga válida para habilitar el reenvío de archivos y el acceso a descargas.

8. **CU-08 Listar versiones y ligas de descarga**
   - Actores: Escuela (autenticada), Sistema externo de resultados
   - Descripción: Muestra consecutivos y ligas depositadas por el sistema externo para la escuela autenticada.

**Nota de implementación temporal:** mientras el backend FastAPI es construido por otro equipo, los casos de uso CU-01 a CU-07 se ejecutarán en el frontend con servicios simulados y datos de prueba/localStorage que imitan las respuestas esperadas. Cuando los endpoints estén disponibles, se cambiará la fuente de datos sin modificar los flujos de usuario.

---

## 3. Relación con la SRS y casos detallados

- Las reglas de validación y credenciales se describen en `srs.md` y siguen el documento `plataforma_recepcion_validacion_descarga_EIA.md`.
- El detalle (flujos, pre/postcondiciones) se documentará en `casos_uso_detallados.md` si se requiere ampliación.
