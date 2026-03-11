import { query } from './src/config/database.js';
import crypto from 'crypto';

async function testLogin(email, password) {
    console.log(`Testing login for ${email}...`);
    try {
        const result = await query(
            `SELECT u.id, u.email, u.password_hash, u.activo FROM usuarios u WHERE u.email = $1`,
            [email]
        );

        console.log(`User found: ${result.rows.length}`);
        if (result.rows.length === 0) return;

        const usuario = result.rows[0];
        console.log(`User ID: ${usuario.id}, Activo: ${usuario.activo}`);

        const hashGuardado = usuario.password_hash ?? '';
        const [salt, hash] = hashGuardado.split(':');

        if (!salt || !hash) {
            console.log('No salt/hash found');
            return;
        }

        const hashCalculado = crypto.scryptSync(password, salt, 64).toString('hex');
        console.log(`Hashes match: ${hash === hashCalculado}`);

        if (hash === hashCalculado) {
            console.log('Attempting UPDATE...');
            await query('UPDATE usuarios SET updated_at = NOW() WHERE id = $1', [usuario.id]);
            console.log('UPDATE success');
        }
    } catch (err) {
        console.error('Login test failed:', err);
    }
}

testLogin('admin@sep.gob.mx', 'admin123').then(() => process.exit());
