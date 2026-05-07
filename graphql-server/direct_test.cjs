
const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: '168.255.101.99',
    user: 'usr_evaluaciond_qa',
    password: 'F67*Hm21erZ0y$p0w*',
    database: 'EvaluacionDiagnosticaQA',
    port: 5432,
    ssl: false // change to true if needed
  });

  try {
    await client.connect();
    console.log('--- CONEXIÓN EXITOSA ---');
    
    const sql = `
          SELECT
            t.numero_ticket as "folio",
            t.asunto,
            COALESCE(u.nombre, t.user_fullname, 'SIN NOMBRE') as nombre,
            COALESCE(u.email, t.user_email, 'SIN CORREO') as correo,
            t.created_at
          FROM tickets_soporte t
          LEFT JOIN usuarios u ON t.usuario_id = u.id
          WHERE t.deleted_at IS NULL 
          ORDER BY t.created_at DESC
          LIMIT 5
    `;
    
    const res = await client.query(sql);
    console.log(`TOTAL TICKETS EN DB: ${res.rows.length}`);
    
    res.rows.forEach((row, i) => {
      console.log(`[${i+1}] ${row.folio} - ${row.asunto} | ${row.nombre} (${row.correo}) | ${row.created_at}`);
    });

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}

test();
