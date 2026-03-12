import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'eia_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function inspectDatabase() {
    try {
        console.log('=== CONECTANDO A LA BASE DE DATOS ===\n');
        
        // 1. Listar todas las tablas
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('=== TABLAS EN LA BASE DE DATOS ===');
        console.log('Total:', tablesResult.rows.length);
        tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
        
        console.log('\n=== ESTRUCTURA DETALLADA DE CADA TABLA ===\n');
        
        // 2. Para cada tabla, obtener su estructura completa
        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            
            console.log(`\n### ${tableName.toUpperCase()}`);
            console.log('─'.repeat(80));
            
            // Obtener columnas
            const columnsResult = await pool.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default,
                    udt_name
                FROM information_schema.columns
                WHERE table_name = $1
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [tableName]);
            
            console.log('\nCOLUMNAS:');
            columnsResult.rows.forEach(col => {
                let type = col.data_type;
                if (col.character_maximum_length) {
                    type += `(${col.character_maximum_length})`;
                } else if (col.udt_name && col.data_type === 'USER-DEFINED') {
                    type = col.udt_name;
                }
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                console.log(`  ${col.column_name.padEnd(30)} ${type.padEnd(25)} ${nullable}${defaultVal}`);
            });
            
            // Obtener constraints (PK, FK, UNIQUE, CHECK)
            const constraintsResult = await pool.query(`
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    cc.check_clause
                FROM information_schema.table_constraints AS tc
                LEFT JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                LEFT JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                LEFT JOIN information_schema.check_constraints AS cc
                    ON cc.constraint_name = tc.constraint_name
                WHERE tc.table_name = $1
                AND tc.table_schema = 'public'
                ORDER BY tc.constraint_type, tc.constraint_name;
            `, [tableName]);
            
            if (constraintsResult.rows.length > 0) {
                console.log('\nCONSTRAINTS:');
                constraintsResult.rows.forEach(cons => {
                    if (cons.constraint_type === 'PRIMARY KEY') {
                        console.log(`  PK: ${cons.column_name}`);
                    } else if (cons.constraint_type === 'FOREIGN KEY') {
                        console.log(`  FK: ${cons.column_name} -> ${cons.foreign_table_name}(${cons.foreign_column_name})`);
                    } else if (cons.constraint_type === 'UNIQUE') {
                        console.log(`  UNIQUE: ${cons.column_name}`);
                    } else if (cons.constraint_type === 'CHECK') {
                        console.log(`  CHECK: ${cons.check_clause}`);
                    }
                });
            }
            
            // Obtener índices
            const indexesResult = await pool.query(`
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = $1
                AND schemaname = 'public'
                ORDER BY indexname;
            `, [tableName]);
            
            if (indexesResult.rows.length > 0) {
                console.log('\nÍNDICES:');
                indexesResult.rows.forEach(idx => {
                    console.log(`  ${idx.indexname}`);
                    console.log(`    ${idx.indexdef}`);
                });
            }
        }
        
        // 3. Obtener ENUMs personalizados
        console.log('\n\n=== TIPOS ENUM PERSONALIZADOS ===\n');
        const enumsResult = await pool.query(`
            SELECT 
                t.typname AS enum_name,
                e.enumlabel AS enum_value,
                e.enumsortorder
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            ORDER BY t.typname, e.enumsortorder;
        `);
        
        const enumsByType = {};
        enumsResult.rows.forEach(row => {
            if (!enumsByType[row.enum_name]) {
                enumsByType[row.enum_name] = [];
            }
            enumsByType[row.enum_name].push(row.enum_value);
        });
        
        Object.entries(enumsByType).forEach(([enumName, values]) => {
            console.log(`${enumName}: ${values.join(', ')}`);
        });
        
        console.log('\n\n=== INSPECCIÓN COMPLETADA ===');
        
    } catch (err) {
        console.error('ERROR:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspectDatabase();
