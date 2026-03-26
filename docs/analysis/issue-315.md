# Análisis Técnico: Issue #315 - Notificaciones y SMTP

## 1. Problema Real
El sistema requiere enviar notificaciones críticas (credenciales, recuperación de contraseña, resultados listos) vía email. Actualmente, la implementación en `mailing.service.ts` es funcional pero rígida, y no existe un mecanismo para probar el flujo completo en un entorno local sin enviar correos reales o depender de una conexión externa a Gmail.

## 2. Causa Raíz
- **Configuración Rígida**: Dependencia directa de variables de entorno que podrían no estar presentes en el contenedor Docker local.
- **Falta de Modo Debug**: No hay un modo de "Captura de correo" para desarrollo que evite el spam o errores de conexión SMTP durante las pruebas.
- **Plantillas Embebidas**: Las plantillas HTML están hardcodeadas en el servicio, lo que dificulta su mantenimiento sin recompilar.

## 3. Implementación Actual vs Requerimiento
| Característica | Estado Actual | Requerimiento (Fase 1) |
| :--- | :--- | :--- |
| **Transporte** | Nodemailer (SMTP) | Soporte para Local (Mailtrap/Ethereal) y Prod |
| **Seguridad** | SSL/TLS opcional | Configuración flexible via `.env` |
| **Plantillas** | HTML embebido en TS | Plantillas consistentes y profesionales |
| **Validación** | Logging básico | Verificación de entrega en logs de Docker |

## 4. Diseño de la Solución
### Backend (GraphQL Server)
- **MailingService**: 
  - Implementar un "Dry Run" o `SMTP_TEST_MODE` que imprima los correos en la consola en lugar de enviarlos.
  - Asegurar que el transporter maneje correctamente transportes sin autenticación (común en entornos locales/Docker).
- **Environment**: Documentar y requerir variables `SMTP_*` en el `.env` del contenedor.

### Infraestructura (Docker)
- Asegurar que el contenedor del backend tenga salida al puerto SMTP configurado.

## 5. Riesgos y Mitigaciones
- **Bloqueo de Puertos**: Muchos ISPs bloquean el puerto 25/465. *Mitigación*: Soporte para puerto 587 (STARTTLS) por defecto.
- **Credenciales en Logs**: *Mitigación*: Asegurar que el modo debug no imprima contraseñas o tokens sensibles.
