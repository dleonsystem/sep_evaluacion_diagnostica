import { query, pool } from './dist/config/database.js';
import fs from 'fs';

async function check() {
    try {
        const res = await query(`SELECT
  s.id,
  s.consecutivo,
  s.cct,
  s.archivo_original as "archivoOriginal",
  s.fecha_carga as "fechaCarga",
  s.estado_validacion as "estadoValidacion",
  s.nivel_educativo as "nivelEducativo",
  s.archivo_path as "archivoPath",
  s.archivo_size as "archivoSize",
  s.procesado_externamente as "procesadoExternamente",
  s.detalles_error as "errores",
  s.resultados,
  t.nombre as turno
          FROM solicitudes_eia2 s
          LEFT JOIN escuelas e ON e.cct = s.cct
          LEFT JOIN cat_turnos t ON t.id_turno = e.id_turno ORDER BY fecha_carga DESC LIMIT 10 OFFSET 0`);
        fs.writeFileSync('admin-test.json', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
