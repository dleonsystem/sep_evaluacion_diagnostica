import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const { Pool } = require('pg');
const crypto = require('crypto');
const readline = require('readline');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function createAdminUser() {
    const client = await pool.connect();
    try {
        console.log('--- Generador de Usuario Administrador EIA ---');
        console.log('Conectando a la base de datos...');

        // 1. Detectar estructura de DB
        const rolesTableCheck = await client.query(
            "SELECT to_regclass('public.cat_roles_usuario') as exists"
        );
        const hasRolesTable = !!rolesTableCheck.rows[0].exists;
        console.log(`Tabla 'cat_roles_usuario': ${hasRolesTable ? 'DETECTADA' : 'NO DETECTADA'}`);

        const userColumnsCheck = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'"
        );
        const columns = userColumnsCheck.rows.map(row => row.column_name);

        // Detectar columna de password
        let passwordColumn = '';
        if (columns.includes('password_hash')) passwordColumn = 'password_hash';
        else if (columns.includes('contrasena_hash')) passwordColumn = 'contrasena_hash';
        else {
            console.error('Columnas encontradas:', columns);
            throw new Error('No se encontró columna para contraseña (password_hash o contrasena_hash)');
        }
        console.log(`Columna para contraseña: ${passwordColumn}`);

        // Detectar nombres de columnas variables
        const colNombre = columns.includes('nombre') ? 'nombre' : null;
        const colPaterno = columns.includes('apepaterno') ? 'apepaterno' : (columns.includes('apellido_paterno') ? 'apellido_paterno' : null);
        const colMaterno = columns.includes('apematerno') ? 'apematerno' : (columns.includes('apellido_materno') ? 'apellido_materno' : null);

        if (!colNombre || !colPaterno) {
            throw new Error('No se pudieron identificar las columnas de nombre/apellido en la tabla usuarios.');
        }

        // 2. Solicitar datos
        console.log('\nIngrese los datos del nuevo administrador:');
        const email = await askQuestion('Email (admin@sep.gob.mx): ') || 'admin@sep.gob.mx';
        const password = await askQuestion('Contraseña (admin123): ') || 'admin123';
        const nombre = await askQuestion('Nombre (Administrador): ') || 'Administrador';
        const apepaterno = await askQuestion('Apellido Paterno (Sistema): ') || 'Sistema';

        // 3. Determinar Rol
        let roleValue;
        if (hasRolesTable) {
            const rolesRes = await client.query('SELECT * FROM cat_roles_usuario');
            // Buscar rol con código ADMIN, COORDINADOR_FEDERAL
            const adminRole = rolesRes.rows.find(r =>
                ['COORDINADOR_FEDERAL', 'ADMIN', 'ADMINISTRADOR'].includes(r.codigo?.toUpperCase())
            );

            if (adminRole) {
                roleValue = adminRole.id_rol;
                console.log(`Rol asignado: ${adminRole.codigo} (ID: ${roleValue})`);
            } else {
                console.warn('⚠️ No se encontró rol "COORDINADOR_FEDERAL" o "ADMIN".');
                console.log('Roles disponibles:', rolesRes.rows.map(r => `${r.id_rol}:${r.codigo}`).join(', '));
                const roleInput = await askQuestion('Ingrese el ID del rol a asignar: ');
                roleValue = parseInt(roleInput, 10);
            }
        } else {
            roleValue = 'COORDINADOR_FEDERAL';
            console.log(`Rol asignado textualmente: ${roleValue}`);
        }

        // 4. Generar Hash
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
        const finalHash = `${salt}:${passwordHash}`;

        // 5. Insertar
        const insertData = {};

        // Verificacion email vs correo
        const colEmail = columns.includes('email') ? 'email' : (columns.includes('correo') ? 'correo' : null);
        if (!colEmail) throw new Error('No se encontró columna para email/correo');

        insertData[colEmail] = email;
        insertData[colNombre] = nombre;
        insertData[colPaterno] = apepaterno;
        if (colMaterno) insertData[colMaterno] = null;
        insertData['rol'] = roleValue;
        insertData[passwordColumn] = finalHash;
        insertData['activo'] = true;

        if (columns.includes('fecha_registro')) insertData['fecha_registro'] = new Date();
        else if (columns.includes('fecha_creacion')) insertData['fecha_creacion'] = new Date();

        const fields = Object.keys(insertData);
        const placeHolders = fields.map((_, i) => `$${i + 1}`);
        const values = fields.map(k => insertData[k]);

        const queryText = `INSERT INTO usuarios (${fields.join(', ')}) VALUES (${placeHolders.join(', ')}) RETURNING id`;

        const res = await client.query(queryText, values);
        console.log(`\n✅ Usuario creado exitosamente con ID: ${res.rows[0].id}`);

    } catch (error) {
        if (error.code === '23505') {
            const detail = error.detail || '';
            console.error('\n❌ Error: El usuario o correo ya existe en la base de datos.');
            console.error(detail);
        } else {
            console.error('\n❌ Error inesperado:', error.message);
        }
    } finally {
        client.release();
        await pool.end(); // Wait for pool to close
        rl.close();
        process.exit(0);
    }
}

createAdminUser();
