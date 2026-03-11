-- Seed inicial de preguntas frecuentes
-- Ejecutar después de la migración de la tabla preguntas_frecuentes

BEGIN;

WITH seed_data (pregunta, respuesta, categoria, orden, activo) AS (
	VALUES
	('¿Qué tipo de archivo puedo subir?', 'Solo se permiten archivos en formato .xlsx conforme a la plantilla oficial de captura.', 'Carga de archivos', 1, TRUE),
	('¿Necesito iniciar sesión para hacer mi primera carga?', 'No. La primera carga puede realizarse sin autenticación cuando no existen credenciales previas para el CCT/correo.', 'Carga de archivos', 2, TRUE),
	('¿Por qué se rechaza mi archivo?', 'El sistema valida estructura, columnas obligatorias, rangos permitidos y consistencia interna. Si falla alguna regla, se rechaza y se muestra el detalle.', 'Carga de archivos', 3, TRUE),
	('¿Puedo subir el mismo archivo más de una vez?', 'Si el archivo tiene la misma huella (hash) para el mismo CCT/correo, se detecta como duplicado y no se procesa nuevamente.', 'Carga de archivos', 4, TRUE),
	('¿Cómo obtengo mis credenciales?', 'Las credenciales se generan automáticamente después de la primera carga válida y se envían al correo registrado.', 'Acceso', 5, TRUE),
	('¿Qué hago si olvidé mi contraseña?', 'Usa la opción de recuperación de contraseña en el portal. Recibirás instrucciones en tu correo registrado.', 'Acceso', 6, TRUE),
	('¿Cuándo se bloquea una cuenta?', 'La cuenta puede bloquearse temporalmente después de múltiples intentos fallidos de inicio de sesión.', 'Acceso', 7, TRUE),
	('¿Dónde consulto el estado de mi envío?', 'En el panel de seguimiento puedes consultar el estado por CCT y fecha de carga.', 'Seguimiento', 8, TRUE),
	('¿Cuándo estarán disponibles mis resultados?', 'Los resultados se habilitan cuando el procesamiento externo concluye y el estatus cambia a disponible.', 'Resultados', 9, TRUE),
	('¿Puedo descargar resultados de ciclos anteriores?', 'Sí, siempre que los archivos continúen dentro del periodo de disponibilidad configurado.', 'Resultados', 10, TRUE),
	('¿Quién puede ver los resultados de una escuela?', 'Solo usuarios con permisos y alcance autorizado para ese CCT/escuela.', 'Seguridad', 11, TRUE),
	('¿Cómo levanto un ticket de soporte?', 'Desde el módulo de soporte puedes crear un ticket con asunto, descripción y adjuntos.', 'Soporte', 12, TRUE)
)
INSERT INTO public.preguntas_frecuentes (pregunta, respuesta, categoria, orden, activo)
SELECT s.pregunta, s.respuesta, s.categoria, s.orden, s.activo
FROM seed_data s
WHERE NOT EXISTS (
	SELECT 1
	FROM public.preguntas_frecuentes pf
	WHERE pf.pregunta = s.pregunta
	  AND COALESCE(pf.categoria, '') = COALESCE(s.categoria, '')
);

COMMIT;