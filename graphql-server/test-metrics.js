import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function testMetrics() {
    console.log('--- Testing Dashboard Metrics Queries ---');

    const queries = [
        {
            name: 'Basic Counters',
            sql: 'SELECT COUNT(*) as count FROM usuarios'
        },
        {
            name: 'Trend Data',
            sql: `
                SELECT TO_CHAR(fecha_carga, 'YYYY-MM-DD') as fecha, COUNT(*) as cantidad 
                FROM solicitudes_eia2 
                WHERE fecha_carga > NOW() - INTERVAL '30 days' 
                GROUP BY TO_CHAR(fecha_carga, 'YYYY-MM-DD') 
                ORDER BY fecha ASC
            `
        },
        {
            name: 'Distribution by Level',
            sql: `
                SELECT ne.codigo as label, COUNT(*) as cantidad 
                FROM solicitudes_eia2 s 
                JOIN cat_nivel_educativo ne ON s.nivel_educativo = ne.id 
                GROUP BY ne.codigo
            `
        },
        {
            name: 'Support Efficiency',
            sql: `
                SELECT 
                  COALESCE(AVG(EXTRACT(EPOCH FROM (res.fecha_respuesta - t.created_at))/3600), 0) as avg_hours
                FROM tickets_soporte t
                CROSS JOIN LATERAL (
                  SELECT created_at as fecha_respuesta 
                  FROM comentarios_ticket 
                  WHERE ticket_id = t.id 
                  ORDER BY created_at ASC 
                  LIMIT 1
                ) res
            `
        }
    ];

    for (const q of queries) {
        try {
            console.log(`Executing: ${q.name}...`);
            const start = Date.now();
            const res = await pool.query(q.sql);
            const duration = Date.now() - start;
            console.log(`✅ Success (${duration}ms). Rows: ${res.rowCount}`);
            if (res.rows.length > 0) {
                console.log('Sample data:', res.rows[0]);
            }
        } catch (err) {
            console.error(`❌ Error in ${q.name}:`, err.message);
        }
    }

    await pool.end();
}

testMetrics();
