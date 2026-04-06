-- Migración Issue #251: Tickets de Soporte
-- Fix: Secuencia para folios y catálogo de prioridades

-- 1. Crear secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS seq_numero_ticket START WITH 1000;

-- 2. Crear catálogo de prioridades
CREATE TABLE IF NOT EXISTS cat_prioridad_ticket (
    id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(100),
    orden SMALLINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Sembrar prioridades
INSERT INTO cat_prioridad_ticket (codigo, descripcion, orden)
SELECT val, 
       INITCAP(REPLACE(LOWER(val::TEXT), '_', ' ')),
       ord
FROM unnest(ARRAY['BAJA', 'MEDIA', 'ALTA', 'CRITICA']::TEXT[]) WITH ORDINALITY AS t(val, ord)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Actualizar tabla de tickets para usar el catálogo (Opcional pero recomendado para normalización)
-- Por ahora mantendremos el VARCHAR para no romper el código actual, pero aseguraremos que los valores coincidan.
ALTER TABLE tickets_soporte ALTER COLUMN prioridad SET DEFAULT 'MEDIA';
