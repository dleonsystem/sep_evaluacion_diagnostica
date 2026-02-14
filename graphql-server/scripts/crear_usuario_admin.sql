-- Script para crear usuario Administrador (Coordinador Federal)
-- Email: joseg.gutierrez@nube.sep.gob.mx
-- Rol: 2 (COORDINADOR_FEDERAL)
-- Contraseña temporal: Inicio123.

INSERT INTO usuarios (
    nombre, 
    apepaterno, 
    apematerno, 
    email, 
    password_hash, 
    rol, 
    password_debe_cambiar, 
    activo, 
    fecha_registro
) VALUES (
    'José Guadalupe', 
    'Gutiérrez', 
    'Gutiérrez', 
    'joseg.gutierrez@nube.sep.gob.mx', 
    'a093b0cb8497ed3b2299112d3ec2931f:1720662b110e452bb8de10e1a5a8f57447a7eda9f792c2dee04507e1a61d72a5ad0e055939dc4ce12bc1336a65ae4aac5ea5b19abdaae1f86390c3e68a481323', 
    2, -- COORDINADOR_FEDERAL
    TRUE, 
    TRUE, 
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    rol = 2,
    password_debe_cambiar = TRUE,
    activo = TRUE;

-- Verificación
SELECT u.email, u.nombre, r.nombre as rol_nombre 
FROM usuarios u 
JOIN cat_roles_usuario r ON u.rol = r.id_rol 
WHERE u.email = 'joseg.gutierrez@nube.sep.gob.mx';
