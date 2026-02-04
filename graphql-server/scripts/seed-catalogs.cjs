
const { query } = require('../dist/config/database');

async function seed() {
    try {
        console.log('--- SEEDING CATALOGS ---');

        const runQuery = async (name, sql) => {
            console.log(`Seeding ${name}...`);
            try {
                await query(sql);
            } catch (e) {
                console.error(`Error seeding ${name}:`, e.message);
            }
        };

        // cat_turnos
        await runQuery('cat_turnos', `
      INSERT INTO cat_turnos (id_turno, nombre, codigo, descripcion) VALUES
      (1, 'MATUTINO', 'MAT', 'Turno de la mañana'),
      (2, 'VESPERTINO', 'VES', 'Turno de la tarde'),
      (3, 'NOCTURNO', 'NOC', 'Turno de la noche'),
      (4, 'CONTINUO', 'CON', 'Turno de jornada completa')
      ON CONFLICT (id_turno) DO NOTHING;
    `);

        // cat_niveles_educativos
        await runQuery('cat_niveles_educativos', `
      INSERT INTO cat_niveles_educativos (id_nivel, nombre, codigo, descripcion, orden) VALUES
      (1, 'PREESCOLAR', 'PRE', 'Educación Preescolar', 1),
      (2, 'PRIMARIA', 'PRI', 'Educación Primaria', 2),
      (3, 'SECUNDARIA', 'SEC', 'Educación Secundaria', 3),
      (4, 'TELESECUNDARIA', 'TEL', 'Educación Telesecundaria', 4)
      ON CONFLICT (id_nivel) DO NOTHING;
    `);

        // cat_entidades_federativas
        await runQuery('cat_entidades_federativas', `
      INSERT INTO cat_entidades_federativas (id_entidad, nombre, abreviatura, codigo_sep, region) VALUES
      (1, 'AGUASCALIENTES', 'AS', '01', 'CENTRO-NORTE'),
      (14, 'JALISCO', 'JC', '14', 'OCCIDENTE'),
      (9, 'CIUDAD DE MÉXICO', 'DF', '09', 'CENTRO')
      ON CONFLICT (id_entidad) DO NOTHING;
    `);

        // cat_ciclos_escolares
        await runQuery('cat_ciclos_escolares', `
      INSERT INTO cat_ciclos_escolares (id_ciclo, nombre, fecha_inicio, fecha_fin, activo) VALUES
      (1, '2024-2025', '2024-08-01', '2025-07-31', true)
      ON CONFLICT (id_ciclo) DO NOTHING;
    `);

        // cat_grados
        await runQuery('cat_grados', `
      INSERT INTO cat_grados (id_grado, nivel_educativo, grado_numero, grado_nombre, orden) VALUES
      (101, 1, 1, '1° Preescolar', 1), (102, 1, 2, '2° Preescolar', 2), (103, 1, 3, '3° Preescolar', 3),
      (201, 2, 1, '1° Primaria', 1), (202, 2, 2, '2° Primaria', 2), (203, 2, 3, '3° Primaria', 3), (204, 2, 4, '4° Primaria', 4), (205, 2, 5, '5° Primaria', 5), (206, 2, 6, '6° Primaria', 6),
      (301, 3, 1, '1° Secundaria', 1), (302, 3, 2, '2° Secundaria', 2), (303, 3, 3, '3° Secundaria', 3)
      ON CONFLICT (id_grado) DO NOTHING;
    `);

        // materias
        await runQuery('materias', `
      INSERT INTO materias (id, codigo, nombre, nivel_educativo, activa) VALUES
      (gen_random_uuid(), 'LEN', 'Lenguajes', 2, true),
      (gen_random_uuid(), 'SPC', 'Saberes y Pensamiento Científico', 2, true),
      (gen_random_uuid(), 'ENS', 'Ética, Naturaleza y Sociedades', 2, true),
      (gen_random_uuid(), 'HYC', 'De lo Humano y lo Comunitario', 2, true)
      ON CONFLICT (codigo) DO NOTHING;
    `);

        // periodos_evaluacion - Manual check to avoid duplicate inserts
        console.log('Seeding periodos_evaluacion...');
        const pCheck = await query("SELECT id FROM periodos_evaluacion WHERE nombre = 'Periodo 1'");
        if (pCheck.rows.length === 0) {
            await query(`
        INSERT INTO periodos_evaluacion (id, nombre, ciclo_escolar, fecha_inicio, fecha_fin, activo) VALUES
        (gen_random_uuid(), 'Periodo 1', '2024-2025', '2024-09-01', '2024-11-30', true)
      `);
        }

        console.log('--- SEEDING COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding catalogs:', err);
        process.exit(1);
    }
}

seed();
