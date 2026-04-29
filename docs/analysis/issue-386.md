# Análisis Técnico: Entrega de Correos Institucionales

**ID del Issue:** #386
**Estado:** CERRADO (Limitación de Entorno)
**Prioridad:** Baja (Fase 1 - Informativo)

## Descripción de la Incidencia
Se reportó que los correos electrónicos generados por la plataforma (recuperación de contraseña, notificación de resultados) no son recibidos por usuarios con dominios institucionales como `@nube.sep.gob.mx` y `@comunidad.unam.mx`.

## Diagnóstico Técnico
Tras revisar la configuración del servicio de mensajería (`MailingService`) y el entorno de desarrollo actual, se han identificado las siguientes causas raíces que impiden la recepción de estos correos:

### 1. Inconsistencia de SPF y DMARC
Los dominios institucionales modernos (gestionados por Microsoft 365 y Google Workspace) utilizan protocolos estrictos de autenticación de remitente:
- **SPF (Sender Policy Framework):** El sistema intenta enviar correos "en nombre de" dominios oficiales (`sep.gob.mx`) utilizando servidores SMTP de terceros (Gmail personal). Los registros MX de la institución detectan esta discrepancia y rechazan el correo por seguridad (protección contra phishing).
- **DKIM (DomainKeys Identified Mail):** Al no contar con una firma digital oficial del dominio institucional en la cabecera del correo, los filtros de SPAM asignan una reputación negativa al mensaje.

### 2. Reputación de IP y Bloqueo de Infraestructura
- El envío se realiza desde un entorno de desarrollo local (`localhost`), lo que expone IPs residenciales o dinámicas que suelen estar en listas de bloqueo automatizadas para correos transaccionales.
- Las cuentas de Gmail personales tienen límites estrictos de envío cuando se detecta un patrón de correo automatizado/bot.

## Resolución y Conclusión
No se trata de un error en el código fuente de la aplicación, sino de una **limitación del entorno de desarrollo hibrido** sin infraestructura de producción configurada.

**Acciones Recomendadas por el Usuario:**
1.  **Mantener la configuración actual:** No se realizarán cambios en el código ya que la configuración SMTP actual es funcional para pruebas en dominios comerciales (@gmail.com, @hotmail.com, etc.).
2.  **Uso en Producción:** Una vez que la aplicación se despliegue en un servidor oficial, se deberá configurar un **Relay SMTP Institucional** con los permisos de SPF/DKIM correspondientes para garantizar la entrega al 100% de los buzones.

---
**Fecha de Reporte:** 2026-04-09
**Resolución:** Documentado como comportamiento esperado en entorno local.
**Responsable:** Antigravity AI
