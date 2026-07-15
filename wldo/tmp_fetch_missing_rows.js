const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const query = `SELECT p.id_partido, p.fecha_hora, p.id_local, l.nombre AS local, p.id_visitante, v.nombre AS visitante, p.id_estadio, e.nombre AS estadio, p.goles_local, p.goles_visitante, p.fase
      FROM partidos p
      LEFT JOIN selecciones l ON p.id_local = l.id_seleccion
      LEFT JOIN selecciones v ON p.id_visitante = v.id_seleccion
      LEFT JOIN estadios e ON p.id_estadio = e.id_estadio
      WHERE p.fecha_hora <= '2026-06-25' AND (p.goles_local IS NULL OR p.goles_visitante IS NULL)
      ORDER BY p.fecha_hora, p.id_partido`;
    const res = await pool.query(query);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
