-- Script de migración para estandarizar la longitud de campos de email a 255 caracteres
-- Fecha: 2026-03-06
-- Referencia: RESUMEN_CORRECCIONES_CLIENTE.md (RF-16.10 / Estructura de Datos)

DO $$ 
BEGIN
    -- Tabla usuarios
    ALTER TABLE usuarios ALTER COLUMN email TYPE VARCHAR(255);
    
    -- Tabla escuelas
    ALTER TABLE escuelas ALTER COLUMN email TYPE VARCHAR(255);
    
    -- Tabla credenciales_eia2
    ALTER TABLE credenciales_eia2 ALTER COLUMN correo_validado TYPE VARCHAR(255);
    
    -- Tabla notificaciones_email
    ALTER TABLE notificaciones_email ALTER COLUMN destinatario TYPE VARCHAR(255);
    
    -- Tabla intentos_login
    ALTER TABLE intentos_login ALTER COLUMN email TYPE VARCHAR(255);
    
    -- Tabla plantillas_email (Actualizado por) - No es email pero por consistencia si fuera necesario, 
    -- aunque plantillas_email.codigo no es email. 
    -- Revisando ddl_generated.sql:
    -- usuarios.email es VARCHAR(100) -> 255
    -- escuelas.email es VARCHAR(100) -> 255
    -- credenciales_eia2.correo_validado es VARCHAR(100) -> 255
    -- notificaciones_email.destinatario es VARCHAR(100) -> 255
    -- intentos_login.email es VARCHAR(100) -> 255

    -- Tablas staging (pre3, pri1, etc.)
    -- Muchas de estas tienen correo1, correo2 como VARCHAR(100)
    ALTER TABLE pre3 ALTER COLUMN correo1 TYPE VARCHAR(255);
    ALTER TABLE pre3 ALTER COLUMN correo2 TYPE VARCHAR(255);
    ALTER TABLE pri1 ALTER COLUMN correo1 TYPE VARCHAR(255);
    ALTER TABLE pri1 ALTER COLUMN correo2 TYPE VARCHAR(255);
    -- (Nota: Se asume que otras tablas priX, secX siguen el mismo patrón si existen)

END $$;
