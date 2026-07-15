const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const rows = await pool.query(`SELECT p.id_partido, p.fecha_hora, p.id_local, l.nombre AS local, p.id_visitante, v.nombre AS visitante, p.goles_local, p.goles_visitante, p.fase, e.nombre AS estadio FROM partidos p LEFT JOIN selecciones l ON p.id_local=l.id_seleccion LEFT JOIN selecciones v ON p.id_visitante=v.id_seleccion LEFT JOIN estadios e ON p.id_estadio=e.id_estadio ORDER BY p.fecha_hora, p.id_partido`);
    console.log(JSON.stringify(rows.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();