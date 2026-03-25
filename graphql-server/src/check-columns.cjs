const { Pool } = require('pg');

const pool = new Pool({
  user: 'usr_evaluaciond_qa',
  host: '168.255.101.99',
  database: 'EvaluacionDiagnosticaQA',
  password: 'F67*Hm21erZ0y$p0w*',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkColumns() {
  try {
    const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'solicitudes_eia2'");
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
