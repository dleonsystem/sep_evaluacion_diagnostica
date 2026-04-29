const { Pool } = require('pg');
const pool = new Pool({
  host: '168.255.101.99',
  port: 5432,
  user: 'usr_evaluaciond_qa',
  password: 'F67*Hm21erZ0y$p0w*',
  database: 'EvaluacionDiagnosticaQA'
});

async function checkColumns() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY column_name");
    console.log('Columns in usuarios:');
    res.rows.forEach(r => console.log(' - ' + r.column_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
