# Lista de Riesgos – Plataforma EIA 2025–2026

| ID | Tipo      | Descripción                                                   | Prob. | Impacto | Estrategia de mitigación                                        |
|----|-----------|---------------------------------------------------------------|-------|---------|------------------------------------------------------------------|
| R1 | Operativo | Escuelas continúan enviando archivos por correo electrónico   | Media | Alta    | Comunicación clara, oficios oficiales, bloqueo del canal correo |
| R2 | Técnico   | Sobrecarga del sistema en últimos días de recepción          | Alta  | Alta    | Escalamiento horizontal de instancias Node.js, pruebas de carga |
| R3 | Datos     | Archivos con estructura alterada o columnas faltantes        | Alta  | Media   | Validaciones básicas, advertencias visibles, documentación      |
| R4 | Seguridad | Robo de credenciales de usuario                              | Media | Alta    | **Plan de mitigación detallado:**<br>- **Prevención:** Políticas de contraseña fuerte (mín. 12 caracteres, mayúsculas, minúsculas, números, símbolos), rotación obligatoria cada 90 días, bloqueo tras 3 intentos fallidos<br>- **Detección:** Monitoreo de accesos anómalos (horarios inusuales, múltiples IPs), alertas de intentos de login fallidos, auditoría continua en tabla AUDITORIAS<br>- **Respuesta:** Expiración automática de sesión tras 30 min inactividad, cierre forzado de sesiones comprometidas, notificación al usuario y administrador<br>- **Controles adicionales:** Autenticación de 2 factores (2FA) opcional, CAPTCHA tras 2 intentos fallidos, registro de dispositivos autorizados |
| R5 | Humano    | Errores al cargar resultados por parte de SEP                | Media | Alta    | Flujos guiados, confirmaciones, posibilidad de reversión        |
| R6 | Legal     | Manejo inadecuado de datos personales                        | Baja  | Alta    | Cumplimiento normativo, políticas de acceso mínimo necesario    |
| R7 | Técnico   | Fallas de infraestructura (servidor, red, almacenamiento)    | Media | Alta    | Respaldos periódicos, monitoreo, plan de recuperación           |
| R8 | Cambio    | Resistencia de usuarios a adoptar la nueva plataforma        | Media | Media   | Capacitación, manuales, soporte durante ventana de operación    |

