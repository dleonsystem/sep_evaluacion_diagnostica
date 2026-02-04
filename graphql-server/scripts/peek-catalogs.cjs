
const { query } = require('../dist/config/database');

async function peek() {
    try {
        const tables = [
            'materias',
            'periodos_evaluacion'
        ];

        for (const table of tables) {
            console.log(`--- ${table.toUpperCase()} ---`);
            try {
                const result = await query(`SELECT * FROM ${table} LIMIT 5`);
                console.table(result.rows);
            } catch (e) {
                console.error(`Error querying ${table}:`, e.message);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error peeking catalogs:', err);
        process.exit(1);
    }
}

peek();
