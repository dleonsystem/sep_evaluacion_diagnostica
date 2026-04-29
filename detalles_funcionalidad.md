# Reporte de Incidencias y Requerimientos - Fase 1 (SiRVER)

Este documento consolida los hallazgos técnicos y errores de funcionalidad detectados durante las pruebas de la Fase 1.

## 1. Módulo de Carga de Archivos (FRV)
* [cite_start]**Drag & Drop limitado:** El arrastre solo funciona si se suelta dentro del botón verde; debe permitir soltar en cualquier parte del recuadro de "ADJUNTAR"[cite: 3, 4]. 
* [cite_start]**Intercepción del Navegador:** Al soltar fuera del botón, Chrome/Edge abren el archivo como pestaña o descarga en lugar de procesarlo[cite: 5, 6].
* [cite_start]**Incompatibilidad de Navegadores:** Firefox bloquea el ingreso a la rama de la plataforma[cite: 7, 8]. [cite_start]JIRAF no permite la carga[cite: 9, 10].
* [cite_start]**Validación de Sesión:** Se permite cargar, validar y enviar sin haber iniciado sesión; esto debe inhabilitarse[cite: 43, 44].
* [cite_start]**Lógica de Duplicidad:** * No debe permitir duplicados por cambio de nombre; debe validar por CCT y Turno[cite: 90, 91].
    * [cite_start]Al subir un archivo con mismo nombre y CCT, debe solicitar reemplazo y eliminar el registro anterior[cite: 75, 76, 91].
    * [cite_start]Se debe permitir duplicidad solo si son usuarios distintos enviando el mismo archivo[cite: 92].

## 2. Motor de Validación y Excel
* [cite_start]**Inconsistencias en PDF:** Los errores listados en la web no coinciden totalmente con el PDF descargado[cite: 12, 13]. [cite_start]Las filas/columnas señaladas en el PDF suelen estar desfasadas respecto al Excel real[cite: 14].
* [cite_start]**Validación Secundaria/Telesecundaria:** * Los FRV de nivel Secundaria fallan en encabezados (B5, C5, D5, E5, F5, F8, etc.) incluso si están correctos[cite: 17, 18, 21].
    * [cite_start]Faltan los formatos específicos para Telesecundarias[cite: 18].
* [cite_start]**Reglas de Campos:** * Columna A: Matrícula opcional (13 caracteres alfanuméricos, sin caracteres especiales)[cite: 22].
    * [cite_start]Debe permitir carga de alumnos sin valoraciones completas (grados/grupos parciales)[cite: 19, 20].
* [cite_start]**Sanitización:** Bloquear carga si hay fórmulas, hipervínculos, decimales o texto fuera de los rangos de celdas definidos [cite: 23-31].

## 3. Gestión de Usuarios y Sesiones
* [cite_start]**Correos Institucionales:** Error al solicitar contraseña o gestionar usuarios con dominios `@nube.sep.gob.mx` o `@comunidad.unam.mx`[cite: 84, 89].
* [cite_start]**Bugs de Autenticación:** * Si el usuario ya está logueado, el sistema no lo reconoce en nuevas pestañas o cargas masivas; debe mostrar mensaje de "USUARIO YA REGISTRADO" [cite: 35-37].
    * [cite_start]Al reintentar cargas, se generan nuevas credenciales que bloquean el acceso del usuario[cite: 40, 48, 49].
* [cite_start]**Fuga de Credenciales:** El modal de usuario/contraseña aparece antes de validar/guardar el archivo; debe mostrarse solo tras el éxito del proceso[cite: 87, 88].
* **Correo de Bienvenida:** Enlace "IR AL SISTEMA" roto. [cite_start]No siempre envía el formato o genera el PDF[cite: 32, 34].

## 4. Mesa de Ayuda y Tickets
* [cite_start]**Falla de Envío:** Error "Failed to fetch" al intentar crear tickets[cite: 66, 67].
* [cite_start]**Evidencias:** No permite adjuntar archivos en la creación y no abre las evidencias en tickets existentes[cite: 67, 83].

## 5. Panel de Administración y Cargas Realizadas
* [cite_start]**Historial de Cargas:** Solo muestra 2 documentos; al cargar un tercero, se elimina el más antiguo[cite: 71, 72]. [cite_start]Falta visualización previa del archivo cargado[cite: 73, 74].
* [cite_start]**Filtros de Admin:** La búsqueda por CCT, Turno o Correo no funciona[cite: 82, 93].
* [cite_start]**Privacidad de Datos:** El panel muestra logs internos de procesos SiRVER innecesarios para el usuario final[cite: 77, 78].