const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const rows = await pool.query("SELECT id_estadio, nombre, ciudad, pais FROM estadios ORDER BY id_estadio");
    console.log(JSON.stringify(rows.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
