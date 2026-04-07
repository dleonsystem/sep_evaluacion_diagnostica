# Casos de Prueba Manuales (SiCRER)

Este documento detalla los flujos de prueba manuales paso a paso para verificar el correcto funcionamiento del sistema tanto para **Usuarios Normales (Responsables CCT)** como para **Administradores**. Úselo como bitácora de aseguramiento de calidad (QA).

## 1. Perfil: Usuario Normal (Responsable de Escuela / Director / Profesor)

| ID | Escenario a Probar | Pasos a Ejecutar (Flujo Normal) | Resultado Esperado (Éxito) | Flujo Alterno (Falla/Error) | Estado | Módulo |
|:---|:---|:---|:---|:---|:---|:---|
| **1.1** | Primera Carga de Archivo (Creación de Cuenta) | 1. Ir a Carga Masiva (sin sesión)<br>2. Ingresar un correo y elegir nivel educativo<br>3. Cargar archivo Excel válido<br>4. Dar clic en "Guardar Archivo" | UI indica validación exitosa. Se crea la cuenta y genera contraseña. Se descarga un PDF con la clave textualmente visible. El usuario recibe un correo de bienvenida. | Si el archivo tiene formato erróneo/roto, el backend no procesa, no se crea registro de credenciales y se avisa visualmente del rechazo de CCT/archivo. | `[ ] Pendiente` | Carga Masiva |
| **1.2** | Restablecer Contraseña Olvidada | 1. Ir a `/login` -> "Olvidó contraseña"<br>2. Capturar correo y enviar.<br>3. Abrir el correo recibido. | Llega un correo con nueva contraseña permanente. Se inicia sesión de inmediato sin que pida cambio "obligatorio". | Si el correo no existe, el sistema marca "Correo no registrado". Si el correo falla al enviarse, avisa de interrupción con error "500 SMTP". | `[ ] Pendiente` | Login |
| **1.3** | Carga de Archivo con Sesión Iniciada | 1. Iniciar sesión usando contraseña del Caso 1.2.<br>2. Ir a Carga Masiva<br>3. Subir archivo válido. | Bloque de correo se bloquea para escritura. UI rellena el cache con la clave de la sesión. El PDF generado omite asteriscos e indica que "SU CONTRASEÑA ES LA QUE YA TIENE". | Si el JWT de sesión expiró durante el transcurso, manda al usuario al modal de error y luego de regreso a la pantalla de login. | `[ ] Pendiente` | Carga Masiva |
| **1.4** | Carga de Archivo con Errores de Validación | 1. Ingresar cualquier correo<br>2. Cargar Excel faltante de columnas/inconsistente.<br>3. Dar clic en Validar | Interfaz muestra listado en pantalla o alerta. Se descarga un PDF listando errores por fila/columna. No se almacena nada al SFTP/BD. | Si el tipo de error es catastrófico y crashea el validador, pantalla manda alerta de "Error interno en el servidor 500". | `[ ] Pendiente` | Carga Masiva |

---

## 2. Perfil: Administrador

| ID | Escenario a Probar | Pasos a Ejecutar (Flujo Normal) | Resultado Esperado (Éxito) | Flujo Alterno (Falla/Error) | Estado | Módulo |
|:---|:---|:---|:---|:---|:---|:---|
| **2.1** | Inicio de Sesión Administrativo | 1. En login, ingresar correo Admin.<br>2. Poner contraseña.<br> 3. Entrar. | El sistema detecta el rol y redirige a `/admin/dashboard`. Carga un menú lateral oscuro exclusivo en el UI sin los módulos normales. | Si el admin pone mal su contraseña, el login marca "Credenciales inválidas" en texto rojo sin dejar ver el dashboard. | `[ ] Pendiente` | Admin |
| **2.2** | CRUD Catálogo de Escuelas | 1. Menú Admin -> Escuelas<br>2. Click en Crear -> Llenar CCT, turno y tipo.<br>3. Click en Guardar<br> 4. Actualizar tabla, editar y guardar de nuevo. | Los datos se guardan en BD y el Swal muestra el éxito. La tabla refresca instantáneo y la escuela aparece listada y editada sin refrescar (`F5`) la ventana completa. | Al crear escuela con un CCT previamente existente, arroja Constraint Error de BD avisando "El CCT ya está matriculado". | `[ ] Pendiente` | Admin (CU-14) |
| **2.3** | Restablecimiento Forzado de Contraseña por Admin | 1. Panel administrativo "Usuarios"<br>2. Buscar la cuenta del usuario del Caso 1.1<br> 3. Click sobre "Forzar reseteo de password". | El admin ve alerta "Clave temporal X enviada a asd@asd.com". Se actualiza la contraseña con un hash salt 10 en la BD y el correo vuela exitoso. | Si el servicio de SMTP de envío falla, el sistema resetea al usuario, pero avisa que el mail "Falló, asigne clave manual: XXX". | `[ ] Pendiente` | Admin |

> **Nota para los Testers:**  
> Use the column **Estado** marcando como `[x] Pasó`, `[!] Falló`, o `[ ] Pendiente` conforme avanza.  
> Ambientes requeridos: Base de Datos en el servidor QA (`168.255.101.99`). 
