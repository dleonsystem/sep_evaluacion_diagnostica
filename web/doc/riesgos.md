# Lista de Riesgos – Plataforma de Recepción, Validación y Descarga EIA

| ID | Tipo      | Descripción                                                                 | Prob. | Impacto | Estrategia de mitigación |
|----|-----------|-----------------------------------------------------------------------------|-------|---------|---------------------------|
| R1 | Operativo | Escuelas continúan usando correo en lugar de la carga anónima .xlsx         | Media | Alta    | Comunicación oficial, instrucciones claras en portal, monitoreo de buzones |
| R2 | Técnico   | Sobrecarga de validaciones (pico cercano al cierre, objetivo 120,000)       | Alta  | Alta    | Escalar workers GraphQL/Redis, pruebas de carga, autoescalado en infraestructura |
| R3 | Datos     | Archivos con estructura/nombres de hoja alterados rompen validación         | Alta  | Media   | Validación estricta de 10 reglas (incluye hash para detectar duplicados por contenido), mensajes claros en PDF de errores, plantillas oficiales |
| R4 | Seguridad | Compromiso de credenciales (correo + contraseña generada)                   | Media | Alta    | Hashing de contraseñas, HTTPS obligatorio, bitácora de accesos, bloqueo por intentos fallidos |
| R5 | Integración | Retraso o falla en depósito de resultados por el sistema externo           | Media | Alta    | Acuerdos de entrega, monitoreo de repositorio de resultados, alertas tempranas |
| R6 | Infraestructura | Falta de espacio en repositorios (mínimo 1 TB para recepción/resultados) | Media | Alta    | Monitoreo de disco, planes de expansión en caliente, limpieza controlada de archivos obsoletos |
| R7 | Cambio    | Resistencia de usuarios a la credencial generada automáticamente            | Media | Media   | Manuales y FAQs, recordatorio en PDF de confirmación, soporte de mesa de ayuda |
| R8 | Integración | Diferencias entre datos simulados en frontend y contratos reales de GraphQL (backend de otro equipo) | Media | Media | Definir contratos desde el inicio, documentar mocks/localStorage, pruebas de integración al habilitar operaciones |
