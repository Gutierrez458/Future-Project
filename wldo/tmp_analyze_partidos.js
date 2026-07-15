const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const counts = await pool.query(`
      SELECT
        fase,
        count(*) AS total,
        count(*) FILTER (WHERE fecha_hora <= '2026-06-25') AS hasta_25,
        count(*) FILTER (WHERE fecha_hora <= '2026-06-25' AND goles_local IS NOT NULL AND goles_visitante IS NOT NULL) AS con_resultado,
        count(*) FILTER (WHERE fecha_hora <= '2026-06-25' AND (goles_local IS NULL OR goles_visitante IS NULL)) AS sin_resultado
      FROM partidos
      GROUP BY fase
      ORDER BY fase;
    `);
    console.log('PHASE COUNTS:', JSON.stringify(counts.rows, null, 2));
    const bydate = await pool.query(`
      SELECT fecha_hora::date AS fecha, count(*) AS total, count(*) FILTER (WHERE goles_local IS NOT NULL AND goles_visitante IS NOT NULL) AS con_resultado, count(*) FILTER (WHERE goles_local IS NULL OR goles_visitante IS NULL) AS sin_resultado
      FROM partidos
      WHERE fecha_hora <= '2026-06-25'
      GROUP BY fecha_hora::date
      ORDER BY fecha_hora::date;
    `);
    console.log('DATE COUNTS:', JSON.stringify(bydate.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();