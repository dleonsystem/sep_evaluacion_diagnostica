-- =====================================================================
-- MIGRACIÓN: Agregar tabla ARCHIVOS_TICKETS y catálogo asociado
-- Fecha: 19-feb-2026
-- Descripción: Crear infraestructura para gestionar archivos adjuntos en tickets
-- =====================================================================

-- =====================================================================
-- VERIFICACIÓN PREVIA
-- =====================================================================

-- Verificar que existe la tabla tickets_soporte
SELECT 'Verificando tabla tickets_soporte...' as paso;
SELECT COUNT(*) as total_tickets FROM tickets_soporte;

-- Verificar estructura de tickets_soporte
SELECT 'Columnas de tickets_soporte:' as paso;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets_soporte'
    AND column_name IN ('id', 'numero_ticket')
ORDER BY ordinal_position;

-- =====================================================================
-- PASO 1: CREAR CATÁLOGO DE ESTADOS PARA ARCHIVOS
-- =====================================================================

BEGIN;

-- Crear catálogo de estados
CREATE TABLE cat_estado_archivo_ticket (
    id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    orden SMALLINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insertar valores iniciales
INSERT INTO cat_estado_archivo_ticket (codigo, descripcion, orden)
SELECT val,
    INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
    ord
FROM unnest(ARRAY['ACTIVO','ELIMINADO','CORRUPTO','EN_CUARENTENA']::TEXT[]) 
     WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar inserción
SELECT 'Catálogo cat_estado_archivo_ticket creado:' as paso;
SELECT id, codigo, descripcion, orden, activo 
FROM cat_estado_archivo_ticket 
ORDER BY orden;

COMMIT;

-- =====================================================================
-- PASO 2: CREAR TABLA ARCHIVOS_TICKETS
-- =====================================================================

BEGIN;

CREATE TABLE archivos_tickets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ticket  VARCHAR(20) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tamanio        BIGINT NOT NULL,
    extension      VARCHAR(20),
    ruta           VARCHAR(500) NOT NULL,
    estado         SMALLINT NOT NULL DEFAULT 
        (SELECT id FROM cat_estado_archivo_ticket WHERE codigo = 'ACTIVO'),
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_archivos_tickets_estado 
        FOREIGN KEY (estado) 
        REFERENCES cat_estado_archivo_ticket(id),
    CONSTRAINT fk_archivos_tickets_numero 
        FOREIGN KEY (numero_ticket) 
        REFERENCES tickets_soporte(numero_ticket) 
        ON DELETE CASCADE,
    CONSTRAINT chk_archivos_tickets_tamanio 
        CHECK (tamanio > 0),
    CONSTRAINT chk_archivos_tickets_extension 
        CHECK (extension IS NULL OR extension ~ '^[a-zA-Z0-9]{1,20}$')
);

-- Crear índices
CREATE INDEX idx_archivos_tickets_numero ON archivos_tickets(numero_ticket);
CREATE INDEX idx_archivos_tickets_estado ON archivos_tickets(estado);
CREATE INDEX idx_archivos_tickets_created ON archivos_tickets(created_at DESC);

-- Verificar creación
SELECT 'Tabla archivos_tickets creada:' as paso;
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'archivos_tickets'
ORDER BY ordinal_position;

COMMIT;

-- =====================================================================
-- PASO 3: CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================================

BEGIN;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trg_actualizar_updated_at_archivos_tickets()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archivos_tickets_updated_at
    BEFORE UPDATE ON archivos_tickets
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_updated_at_archivos_tickets();

SELECT 'Trigger de updated_at creado exitosamente.' as paso;

COMMIT;

-- =====================================================================
-- VERIFICACIÓN FINAL
-- =====================================================================

-- Verificar catálogo
SELECT 'Estados disponibles para archivos:' as paso;
SELECT * FROM cat_estado_archivo_ticket ORDER BY orden;

-- Verificar estructura de archivos_tickets
SELECT 'Estructura final de archivos_tickets:' as paso;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'archivos_tickets'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 'Constraints de archivos_tickets:' as paso;
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'archivos_tickets'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Verificar índices
SELECT 'Índices de archivos_tickets:' as paso;
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'archivos_tickets'
ORDER BY indexname;

-- =====================================================================
-- RESUMEN
-- =====================================================================

SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado,
    'Catálogo creado: cat_estado_archivo_ticket' as catalogo,
    'Tabla creada: archivos_tickets' as tabla,
    '3 índices creados' as indices,
    'Trigger updated_at agregado' as trigger;

-- =====================================================================
-- PRUEBA DE INSERCIÓN (opcional)
-- =====================================================================
-- 
-- Descomentar para probar inserción (requiere un ticket existente):
--
-- INSERT INTO archivos_tickets (
--     numero_ticket,
--     nombre_archivo,
--     tamanio,
--     extension,
--     ruta
-- ) VALUES (
--     'TKT-001',  -- Reemplazar con un numero_ticket válido
--     'evidencia_problema.pdf',
--     1048576,
--     'pdf',
--     '/storage/tickets/2026/02/TKT-001/evidencia_problema.pdf'
-- );
--
-- SELECT * FROM archivos_tickets;
--
-- =====================================================================

-- =====================================================================
-- NOTAS DE USO
-- =====================================================================
--
-- INSERTAR ARCHIVO:
-- INSERT INTO archivos_tickets (
--     numero_ticket, nombre_archivo, tamanio, extension, ruta
-- ) VALUES (
--     'TKT-123', 'screenshot.png', 245760, 'png', '/path/to/file.png'
-- );
--
-- CONSULTAR ARCHIVOS DE UN TICKET:
-- SELECT 
--     a.nombre_archivo,
--     a.tamanio,
--     a.extension,
--     e.codigo as estado,
--     t.usuario_id,
--     u.nombre as usuario_ticket,
--     a.created_at
-- FROM archivos_tickets a
-- JOIN cat_estado_archivo_ticket e ON a.estado = e.id
-- JOIN tickets_soporte t ON a.numero_ticket = t.numero_ticket
-- LEFT JOIN usuarios u ON t.usuario_id = u.id
-- WHERE a.numero_ticket = 'TKT-123'
-- ORDER BY a.created_at DESC;
--
-- MARCAR ARCHIVO COMO ELIMINADO:
-- UPDATE archivos_tickets
-- SET estado = (SELECT id FROM cat_estado_archivo_ticket WHERE codigo = 'ELIMINADO')
-- WHERE id = 'uuid-del-archivo';
--
-- VALIDACIONES AUTOMÁTICAS:
-- - No se puede insertar archivo sin que exista el ticket (FK)
-- - tamanio debe ser > 0
-- - extension debe ser alfanumérica (1-20 caracteres)
-- - Eliminar ticket CASCADE elimina sus archivos
--
-- =====================================================================

-- =====================================================================
-- ROLLBACK (si es necesario)
-- =====================================================================
--
-- Si necesitas revertir los cambios:
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_archivos_tickets_updated_at ON archivos_tickets;
-- DROP FUNCTION IF EXISTS trg_actualizar_updated_at_archivos_tickets();
-- DROP TABLE IF EXISTS archivos_tickets CASCADE;
-- DROP TABLE IF EXISTS cat_estado_archivo_ticket CASCADE;
-- COMMIT;
--
-- =====================================================================
