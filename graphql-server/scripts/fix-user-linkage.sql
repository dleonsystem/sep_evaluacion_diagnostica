-- Script para vincular registros de solicitudes_eia2 que tienen usuario_id como NULL
-- Basado en la relación de usuarios con centros de trabajo (CCTs)

BEGIN;

-- 1. Vincular registros basados en la tabla usuarios_centros_trabajo
-- Si un CCT sólo tiene un usuario asignado, vinculamos sus solicitudes huérfanas
UPDATE solicitudes_eia2 s
SET usuario_id = uct.usuario_id
FROM usuarios_centros_trabajo uct
JOIN escuelas e ON e.id = uct.centro_trabajo_id
WHERE s.usuario_id IS NULL
  AND s.cct = e.cct
  -- Sólo vinculamos si hay exactamente un usuario para ese CCT para evitar ambigüedad
  AND (SELECT COUNT(*) FROM usuarios_centros_trabajo uct2 WHERE uct2.centro_trabajo_id = e.id) = 1;

-- 2. Caso específico reportado por el usuario: senadocomite@gmail.com (ID: b03ea1dc-1e18-47a7-ad3a-4600065043f9)
-- Vinculamos todas las solicitudes de CCTs que este usuario ha intentado cargar (si el email coincide en el log o credenciales)
UPDATE solicitudes_eia2 s
SET usuario_id = 'b03ea1dc-1e18-47a7-ad3a-4600065043f9'
WHERE s.usuario_id IS NULL
  AND s.credencial_id IN (
    SELECT id FROM credenciales_eia2 WHERE correo_validado = 'senadocomite@gmail.com'
  );

-- 3. Actualizar id_turno para registros existentes basado en el catálogo escuelas
UPDATE solicitudes_eia2 s
SET id_turno = e.id_turno
FROM escuelas e
WHERE s.id_turno IS NULL
  AND s.cct = e.cct;

COMMIT;
