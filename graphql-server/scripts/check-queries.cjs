const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  const res = await client.query(`
    SELECT
        pid,
        query,
        state,
        wait_event_type,
        wait_event,
        now() - query_start as duration
    FROM
        pg_stat_activity
    WHERE
        state != 'idle'
        AND query NOT LIKE '%pg_stat_activity%'
    ORDER BY duration DESC;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
