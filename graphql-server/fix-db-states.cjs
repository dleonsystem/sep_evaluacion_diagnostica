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
    // In QA, VALIDO is ID 1. PENDIENTE is ID 3.
    // If a request was successfully processed by uploadExcelAssessment recently,
    // it was mistakenly inserted as 3 or updated to 2. Let's fix them.
    // For the specific user's CCTs, set to 1 if they have no errors.
    const res = await client.query(`
      UPDATE solicitudes_eia2 
      SET estado_validacion = 1 
      WHERE cct IN ('15DPR0186U', '03DTM0029Y') 
      AND errores_validacion IS NULL;
    `);
    console.log(`Updated ${res.rowCount} rows.`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

run();
