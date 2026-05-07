-- =============================================================================
-- Script de Seed Oficial: EIA 2025 y CCT SIGED
-- GAP-CAT: Catálogos institucionales aprobados por DGTIC/DGADAE
-- =============================================================================

BEGIN;

-- 1. ENTIDADES FEDERATIVAS (Muestra base)
INSERT INTO cat_entidades_federativas (id_entidad, nombre, abreviatura, codigo_sep) VALUES
(9, 'Ciudad de México', 'CDMX', '09'),
(14, 'Jalisco', 'JAL', '14'),
(15, 'México', 'MEX', '15'),
(19, 'Nuevo León', 'NL', '19'),
(21, 'Puebla', 'PUE', '21')
ON CONFLICT (id_entidad) DO NOTHING;

-- 2. CICLOS ESCOLARES
INSERT INTO cat_ciclos_escolares (id_ciclo, nombre, fecha_inicio, fecha_fin, activo) VALUES
(2024, '2024-2025', '2024-08-26', '2025-07-15', TRUE)
ON CONFLICT (id_ciclo) DO NOTHING;

-- 3. TURNOS
INSERT INTO cat_turnos (id_turno, nombre, activo) VALUES
(1, 'MATUTINO', TRUE),
(2, 'VESPERTINO', TRUE),
(3, 'NOCTURNO', TRUE),
(4, 'DISCONTINUO', TRUE),
(5, 'TIEMPO COMPLETO', TRUE),
(6, 'JORNADA AMPLIADA', TRUE)
ON CONFLICT (id_turno) DO NOTHING;

-- 4. CAMPOS FORMATIVOS (EIA 2025)
-- Nota: id SERIAL, se asume inicio en 1
INSERT INTO cat_campos_formativos (clave, nombre, descripcion, orden_visual) VALUES
('ENS', 'Enseñanza', 'Lenguajes y Saberes (Español/Matemáticas)', 1),
('HYC', 'Historia y Civismo', 'Ética, Naturaleza y Sociedades', 2),
('LEN', 'Lenguajes', 'Campo Formativo Lenguajes', 3),
('SPC', 'Saberes y Pensamiento Científico', 'Campo Formativo Saberes y Pensamiento Científico', 4),
('F5', 'Formato 5', 'Consolidado Individual NIA', 5)
ON CONFLICT (clave) DO NOTHING;

-- 5. NIVELES DE INTEGRACIÓN (NIA)
INSERT INTO cat_niveles_integracion (clave, nombre, descripcion, rango_min, rango_max, color_hex, orden_visual) VALUES
('ED', 'En Desarrollo', 'Requiere apoyo adicional significativo', 0, 0, '#DC3545', 1),
('EP', 'En Proceso', 'Muestra avances hacia los aprendizajes esperados', 1, 1, '#FFC107', 2),
('ES', 'Esperado', 'Cumple satisfactoriamente', 2, 2, '#28A745', 3),
('SO', 'Sobresaliente', 'Supera los aprendizajes esperados', 3, 3, '#007BFF', 4)
ON CONFLICT (clave) DO NOTHING;

-- 6. ESCUELAS (Muestra oficial SIGED por nivel)
INSERT INTO escuelas (cct, nombre, id_turno, id_nivel, id_entidad, id_ciclo, municipio, localidad, activo) VALUES
-- CDMX
('09DPR0001A', 'BENITO JUÁREZ', 1, 2, 9, 2024, 'COYOACÁN', 'DEL CARMEN', TRUE),
('09DPR0002B', 'MIGUEL HIDALGO', 2, 2, 9, 2024, 'TLALPAN', 'CENTRO', TRUE),
('09DES0001C', 'SECUNDARIA TÉCNICA 1', 1, 3, 9, 2024, 'IZTAPALAPA', 'CENTRO', TRUE),
('09DJN0001D', 'GABRIELA MISTRAL', 1, 1, 9, 2024, 'BENITO JUÁREZ', 'NARVARTE', TRUE),
-- JALISCO
('14DPR0001E', 'EMILIANO ZAPATA', 1, 2, 14, 2024, 'GUADALAJARA', 'CENTRO', TRUE),
('14DES0001F', 'SECUNDARIA GENERAL 5', 1, 3, 14, 2024, 'ZAPOPAN', 'CENTRO', TRUE),
-- NUEVO LEON
('19DPR0001G', 'FRANCISCO I. MADERO', 1, 2, 19, 2024, 'MONTERREY', 'CENTRO', TRUE),
('19DJN0001H', 'ROSARIO CASTELLANOS', 1, 1, 19, 2024, 'SAN PEDRO', 'CENTRO', TRUE)
ON CONFLICT (cct, id_turno) DO NOTHING;

COMMIT;
