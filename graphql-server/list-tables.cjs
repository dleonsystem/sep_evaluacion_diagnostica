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
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
    console.table(res.rows);
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

run();
