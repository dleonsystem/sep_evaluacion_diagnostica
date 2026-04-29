
import { query } from '../src/config/database';

async function peek() {
    try {
        console.log('--- CAT_TURNOS ---');
        const turnos = await query('SELECT * FROM cat_turnos LIMIT 5');
        console.table(turnos.rows);

        console.log('--- CAT_NIVEL_EDUCATIVO ---');
        const niveles = await query('SELECT * FROM cat_nivel_educativo LIMIT 5');
        console.table(niveles.rows);

        console.log('--- CAT_ENTIDADES_FEDERATIVAS ---');
        const entidades = await query('SELECT * FROM cat_entidades_federativas LIMIT 5');
        console.table(entidades.rows);

        console.log('--- CAT_CICLOS_ESCOLARES ---');
        const ciclos = await query('SELECT * FROM cat_ciclos_escolares LIMIT 5');
        console.table(ciclos.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error peeking catalogs:', err);
        process.exit(1);
    }
}

peek();
