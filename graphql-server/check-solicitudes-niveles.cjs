const { Client } = require('pg');

const client = new Client({
  host: '168.255.101.99',
  port: 5432,
  database: 'EvaluacionDiagnosticaQA',
  user: 'usr_evaluaciond_qa',
  password: 'F67*Hm21erZ0y$p0w*'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, cct, nivel_educativo 
      FROM solicitudes_eia2 
      WHERE cct IN ('15DPR0186U', '03DTM0029Y');
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

run();
