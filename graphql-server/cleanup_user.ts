import { pool } from './src/config/database.js'; // Note the .js extension for ES modules compatibility or path as is
import dotenv from 'dotenv';
dotenv.config();

/**
 * Script de limpieza para pruebas (ELIMINACIÓN DE USUARIO Y REGISTROS)
 * Uso: npx ts-node cleanup_user.ts [EMAIL]
 */

const emailToDelete = process.argv[2] || 'senadocomite@gmail.com';

async function cleanup() {
  console.log(`--- INICIA LIMPIEZA PARA USUARIO: ${emailToDelete} ---`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener ID del usuario
    const userRes = await client.query('SELECT id FROM usuarios WHERE email = $1', [emailToDelete]);
    if (userRes.rows.length === 0) {
      console.warn(`No se encontró el usuario principal con email: ${emailToDelete}`);
    } else {
      const userId = userRes.rows[0].id;

      // 2. Eliminar de log_actividades
      const logRes = await client.query('DELETE FROM log_actividades WHERE id_usuario = $1', [userId]);
      console.log(`- log_actividades: ${logRes.rowCount} eliminados`);

      // 3. Eliminar evaluaciones (cascada manual si no está en BD)
      // Buscamos solicitudes de este usuario
      const solRes = await client.query('SELECT id FROM solicitudes_eia2 WHERE usuario_id = $1', [userId]);
      const solIds = solRes.rows.map(r => r.id);
      
      if (solIds.length > 0) {
        // Eliminar evaluaciones
        const evalRes = await client.query('DELETE FROM evaluaciones WHERE solicitud_id = ANY($1)', [solIds]);
        console.log(`- evaluaciones: ${evalRes.rowCount} eliminadas`);

        // Eliminar solicitudes
        const solDelRes = await client.query('DELETE FROM solicitudes_eia2 WHERE id = ANY($1)', [solIds]);
        console.log(`- solicitudes_eia2: ${solDelRes.rowCount} eliminadas`);
      }
      
      // 4. Eliminar asociaciones CCT
      const assocRes = await client.query('DELETE FROM usuarios_centros_trabajo WHERE usuario_id = $1', [userId]);
      console.log(`- usuarios_centros_trabajo: ${assocRes.rowCount} eliminados`);

      // 5. Eliminar tickets de soporte
      const ticketRes = await client.query('DELETE FROM tickets_soporte WHERE usuario_id = $1 OR user_email = $2', [userId, emailToDelete]);
      console.log(`- tickets_soporte: ${ticketRes.rowCount} eliminados`);
    }

    // 6. Eliminar credenciales_eia2 (importante para resetear el CCT en el flujo de primera vez)
    const credRes = await client.query('DELETE FROM credenciales_eia2 WHERE correo_validado = $1', [emailToDelete]);
    console.log(`- credenciales_eia2: ${credRes.rowCount} eliminadas`);

    // 7. Finalmente eliminar el usuario
    const finalRes = await client.query('DELETE FROM usuarios WHERE email = $1', [emailToDelete]);
    console.log(`- usuarios: ${finalRes.rowCount} eliminado(s)`);

    await client.query('COMMIT');
    console.log(`\n--- LIMPIEZA COMPLETADA CON ÉXITO ---`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ERROR durante la limpieza:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanup();
