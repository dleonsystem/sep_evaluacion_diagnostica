
const { query } = require('../dist/config/database');

async function verify() {
    try {
        console.log('--- VERIFYING UPLOAD RESULTS ---');

        console.log('\n--- ESCUELAS (Last 5) ---');
        const escuelas = await query('SELECT id, cct, nombre, id_nivel FROM escuelas ORDER BY created_at DESC LIMIT 5');
        console.table(escuelas.rows);

        console.log('\n--- GRUPOS (Last 5) ---');
        const grupos = await query('SELECT id, escuela_id, grado_id, nombre, nivel_educativo FROM grupos ORDER BY created_at DESC LIMIT 5');
        console.table(grupos.rows);

        console.log('\n--- ESTUDIANTES (Last 5) ---');
        const estudiantes = await query('SELECT id, nombre, grupo_id, curp FROM estudiantes ORDER BY created_at DESC LIMIT 5');
        console.table(estudiantes.rows);

        console.log('\n--- EVALUACIONES (Last 10) ---');
        const evaluaciones = await query('SELECT id, estudiante_id, materia_id, periodo_id, valoracion, fecha_evaluacion FROM evaluaciones ORDER BY created_at DESC LIMIT 10');
        console.table(evaluaciones.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error verifying results:', err);
        process.exit(1);
    }
}

verify();
