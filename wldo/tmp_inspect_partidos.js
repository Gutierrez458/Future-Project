const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const cols = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='partidos' ORDER BY ordinal_position");
    console.log('COLUMNS:');
    cols.rows.forEach(r => console.log(`${r.column_name} | ${r.data_type} | ${r.is_nullable}`));

    const counts = await pool.query("SELECT count(*) total, count(*) filter (WHERE fecha_hora <= '2026-06-25') hasta_25, count(*) filter (WHERE fecha_hora <= '2026-06-25' AND goles_local IS NOT NULL AND goles_visitante IS NOT NULL) con_resultado, count(*) filter (WHERE fecha_hora <= '2026-06-25' AND (goles_local IS NULL OR goles_visitante IS NULL)) sin_resultado FROM partidos");
    console.log('COUNTS: ' + JSON.stringify(counts.rows[0]));

    const phases = await pool.query("SELECT DISTINCT fase FROM partidos ORDER BY fase");
    console.log('PHASES: ' + JSON.stringify(phases.rows));

    const rows = await pool.query("SELECT p.id_partido, p.fecha_hora, p.fase, p.goles_local, p.goles_visitante, l.nombre AS local, v.nombre AS visitante, e.nombre AS estadio FROM partidos p LEFT JOIN selecciones l ON p.id_local = l.id_seleccion LEFT JOIN selecciones v ON p.id_visitante = v.id_seleccion LEFT JOIN estadios e ON p.id_estadio = e.id_estadio WHERE p.fecha_hora <= '2026-06-25' ORDER BY p.fecha_hora, p.id_partido LIMIT 100");
    console.log('EXISTING FIRST 100: ' + JSON.stringify(rows.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
