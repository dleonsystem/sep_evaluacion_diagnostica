-- =============================================================================
-- Script de Datos de Prueba
-- Sistema de Evaluación Integral de Aprendizaje (EIA) - SEP
-- =============================================================================
-- @version 1.0.0
-- @author SEP - Evaluación Diagnóstica
-- @standard PSP (Personal Software Process) - Test Data Generation
-- =============================================================================

\c eia_db;

-- Limpiar datos existentes (en orden inverso por dependencias)
TRUNCATE niveles_integracion_estudiante, estudiantes, evaluaciones, usuarios_centros_trabajo, centros_trabajo, usuarios, catalogo_campos_formativos, catalogo_niveles_integracion CASCADE;

-- =============================================================================
-- CATÁLOGOS: Niveles de Integración
-- =============================================================================
INSERT INTO catalogo_niveles_integracion (clave, descripcion, orden, activo) VALUES
('NI1', 'Nivel 1 - Iniciando', 1, true),
('NI2', 'Nivel 2 - En Desarrollo', 2, true),
('NI3', 'Nivel 3 - Satisfactorio', 3, true),
('NI4', 'Nivel 4 - Sobresaliente', 4, true);

-- =============================================================================
-- CATÁLOGOS: Campos Formativos
-- =============================================================================
INSERT INTO catalogo_campos_formativos (clave, descripcion, activo) VALUES
('LYC', 'Lenguaje y Comunicación', true),
('PM', 'Pensamiento Matemático', true),
('EMN', 'Exploración y Comprensión del Mundo Natural', true),
('EMS', 'Exploración y Comprensión del Mundo Social', true),
('AEC', 'Artes y Experiencias Culturales', true),
('DSF', 'Desarrollo Socioemocional y Físico', true);

-- =============================================================================
-- USUARIOS
-- =============================================================================
INSERT INTO usuarios (correo, nombre, apellido_paterno, apellido_materno, contrasena_hash, rol, activo) VALUES
-- Coordinadores Federales
('coordinador.federal@sep.gob.mx', 'María', 'González', 'Pérez', crypt('TempPassword123!', gen_salt('bf')), 'COORDINADOR_FEDERAL', true),
('admin.nacional@sep.gob.mx', 'Carlos', 'Hernández', 'López', crypt('TempPassword123!', gen_salt('bf')), 'COORDINADOR_FEDERAL', true),

-- Coordinadores Estatales
('coord.cdmx@sep.gob.mx', 'Ana', 'Martínez', 'Ramírez', crypt('TempPassword123!', gen_salt('bf')), 'COORDINADOR_ESTATAL', true),
('coord.jalisco@sep.gob.mx', 'Luis', 'Sánchez', 'Torres', crypt('TempPassword123!', gen_salt('bf')), 'COORDINADOR_ESTATAL', true),
('coord.nuevo_leon@sep.gob.mx', 'Patricia', 'Rodríguez', 'Flores', crypt('TempPassword123!', gen_salt('bf')), 'COORDINADOR_ESTATAL', true),

-- Responsables de CCT
('director.primaria@escuela.edu.mx', 'Roberto', 'García', 'Méndez', crypt('TempPassword123!', gen_salt('bf')), 'RESPONSABLE_CCT', true),
('director.secundaria@escuela.edu.mx', 'Elena', 'López', 'Castillo', crypt('TempPassword123!', gen_salt('bf')), 'RESPONSABLE_CCT', true),
('director.preescolar@escuela.edu.mx', 'Fernando', 'Ramírez', 'Cruz', crypt('TempPassword123!', gen_salt('bf')), 'RESPONSABLE_CCT', true),

-- Usuarios de consulta
('consulta.academica@sep.gob.mx', 'Sofía', 'Morales', 'Jiménez', crypt('TempPassword123!', gen_salt('bf')), 'CONSULTA', true),
('analista.datos@sep.gob.mx', 'Diego', 'Torres', 'Vargas', crypt('TempPassword123!', gen_salt('bf')), 'CONSULTA', true);

-- =============================================================================
-- CENTROS DE TRABAJO
-- =============================================================================
INSERT INTO centros_trabajo (clave_cct, nombre, entidad, municipio, localidad, nivel, turno, zona_escolar) VALUES
-- CDMX
('09DPR0001A', 'Escuela Primaria "Benito Juárez"', 'Ciudad de México', 'Coyoacán', 'Del Carmen', 'PRIMARIA', 'Matutino', 'Z001'),
('09DPR0002B', 'Escuela Primaria "Miguel Hidalgo"', 'Ciudad de México', 'Tlalpan', 'Centro', 'PRIMARIA', 'Vespertino', 'Z002'),
('09DES0001C', 'Escuela Secundaria Técnica No. 1', 'Ciudad de México', 'Iztapalapa', 'Centro', 'SECUNDARIA', 'Matutino', 'Z003'),
('09DJN0001D', 'Jardín de Niños "Gabriela Mistral"', 'Ciudad de México', 'Benito Juárez', 'Narvarte', 'PREESCOLAR', 'Matutino', 'Z004'),

-- Jalisco
('14DPR0001E', 'Escuela Primaria "Emiliano Zapata"', 'Jalisco', 'Guadalajara', 'Centro', 'PRIMARIA', 'Matutino', 'Z101'),
('14DES0001F', 'Escuela Secundaria General No. 5', 'Jalisco', 'Zapopan', 'Centro', 'SECUNDARIA', 'Matutino', 'Z102'),

-- Nuevo León
('19DPR0001G', 'Escuela Primaria "Francisco I. Madero"', 'Nuevo León', 'Monterrey', 'Centro', 'PRIMARIA', 'Matutino', 'Z201'),
('19DJN0001H', 'Jardín de Niños "Rosario Castellanos"', 'Nuevo León', 'San Pedro Garza García', 'Centro', 'PREESCOLAR', 'Matutino', 'Z202');

-- =============================================================================
-- RELACIÓN USUARIOS - CENTROS DE TRABAJO
-- =============================================================================
INSERT INTO usuarios_centros_trabajo (usuario_id, centro_trabajo_id)
SELECT 
    u.id,
    ct.id
FROM usuarios u
CROSS JOIN centros_trabajo ct
WHERE u.correo = 'director.primaria@escuela.edu.mx' AND ct.clave_cct IN ('09DPR0001A', '09DPR0002B');

INSERT INTO usuarios_centros_trabajo (usuario_id, centro_trabajo_id)
SELECT 
    u.id,
    ct.id
FROM usuarios u
CROSS JOIN centros_trabajo ct
WHERE u.correo = 'director.secundaria@escuela.edu.mx' AND ct.clave_cct IN ('09DES0001C', '14DES0001F');

INSERT INTO usuarios_centros_trabajo (usuario_id, centro_trabajo_id)
SELECT 
    u.id,
    ct.id
FROM usuarios u
CROSS JOIN centros_trabajo ct
WHERE u.correo = 'director.preescolar@escuela.edu.mx' AND ct.clave_cct IN ('09DJN0001D', '19DJN0001H');

-- =============================================================================
-- EVALUACIONES
-- =============================================================================
INSERT INTO evaluaciones (clave_cct, periodo, grado, grupo, nombre_archivo, estado_validacion, fecha_validacion)
VALUES
('09DPR0001A', '2024-2025-1', 1, 'A', 'pri1_09DPR0001A_2024.dbf', 'VALIDADO', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('09DPR0001A', '2024-2025-1', 2, 'A', 'pri2_09DPR0001A_2024.dbf', 'VALIDADO', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('09DPR0002B', '2024-2025-1', 3, 'B', 'pri3_09DPR0002B_2024.dbf', 'EN_PROCESO', NULL),
('09DES0001C', '2024-2025-1', 1, 'A', 'sec1_09DES0001C_2024.dbf', 'PENDIENTE', NULL),
('09DJN0001D', '2024-2025-1', 3, 'A', 'pre3_09DJN0001D_2024.dbf', 'VALIDADO', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- =============================================================================
-- ESTUDIANTES
-- =============================================================================
INSERT INTO estudiantes (evaluacion_id, curp, nombre, apellido_paterno, apellido_materno, grado, grupo, fecha_nacimiento, sexo)
SELECT 
    e.id,
    'GOMJ150815HDFLRN09',
    'Juan',
    'Gómez',
    'Martínez',
    1,
    'A',
    '2015-08-15',
    'M'
FROM evaluaciones e
WHERE e.nombre_archivo = 'pri1_09DPR0001A_2024.dbf'
LIMIT 1;

INSERT INTO estudiantes (evaluacion_id, curp, nombre, apellido_paterno, apellido_materno, grado, grupo, fecha_nacimiento, sexo)
SELECT 
    e.id,
    'ROPL150520MDFDRR04',
    'Laura',
    'Rodríguez',
    'Pérez',
    1,
    'A',
    '2015-05-20',
    'F'
FROM evaluaciones e
WHERE e.nombre_archivo = 'pri1_09DPR0001A_2024.dbf'
LIMIT 1;

INSERT INTO estudiantes (evaluacion_id, curp, nombre, apellido_paterno, apellido_materno, grado, grupo, fecha_nacimiento, sexo)
SELECT 
    e.id,
    'SAMC140910HDFSRR02',
    'Carlos',
    'Sánchez',
    'Méndez',
    2,
    'A',
    '2014-09-10',
    'M'
FROM evaluaciones e
WHERE e.nombre_archivo = 'pri2_09DPR0001A_2024.dbf'
LIMIT 1;

-- =============================================================================
-- NIVELES DE INTEGRACIÓN PARA ESTUDIANTES
-- =============================================================================
INSERT INTO niveles_integracion_estudiante (estudiante_id, campo_formativo_id, nivel_integracion_id)
SELECT 
    e.id,
    cf.id,
    ni.id
FROM estudiantes e
CROSS JOIN catalogo_campos_formativos cf
CROSS JOIN catalogo_niveles_integracion ni
WHERE e.curp = 'GOMJ150815HDFLRN09' AND cf.clave = 'LYC' AND ni.clave = 'NI3'
LIMIT 1;

INSERT INTO niveles_integracion_estudiante (estudiante_id, campo_formativo_id, nivel_integracion_id)
SELECT 
    e.id,
    cf.id,
    ni.id
FROM estudiantes e
CROSS JOIN catalogo_campos_formativos cf
CROSS JOIN catalogo_niveles_integracion ni
WHERE e.curp = 'GOMJ150815HDFLRN09' AND cf.clave = 'PM' AND ni.clave = 'NI2'
LIMIT 1;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT 'Datos de prueba cargados correctamente' as status;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_ccts FROM centros_trabajo;
SELECT COUNT(*) as total_evaluaciones FROM evaluaciones;
SELECT COUNT(*) as total_estudiantes FROM estudiantes;
SELECT COUNT(*) as total_niveles_integracion FROM niveles_integracion_estudiante;
