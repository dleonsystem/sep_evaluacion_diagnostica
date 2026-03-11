const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', database: 'eia_db', user: 'postgres', password: '' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'preguntas_frecuentes';")
    .then(res => { console.log(JSON.stringify(res.rows, null, 2)); pool.end(); })
    .catch(e => { console.error(e); pool.end(); });
