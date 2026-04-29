const { Pool } = require('pg');
const pool = new Pool({
  host: '168.255.101.99',
  port: 5432,
  user: 'usr_evaluaciond_qa',
  password: 'F67*Hm21erZ0y$p0w*',
  database: 'EvaluacionDiagnosticaQA'
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'");
    console.log('Columns in usuarios:', res.rows.map(r => r.column_name).join(', '));
    const user = await pool.query("SELECT * FROM usuarios WHERE email = 'senadocomite@gmail.com'");
    console.log('User senadocomite:', JSON.stringify(user.rows, null, 2));
    const ticket = await pool.query("SELECT * FROM tickets_soporte WHERE user_email = 'senadocomite@gmail.com' OR user_fullname ILIKE '%senado%'");
    console.log('Ticket for senadocomite:', JSON.stringify(ticket.rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
