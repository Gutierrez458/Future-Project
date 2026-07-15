const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='estadios' ORDER BY ordinal_position");
    console.log('COLUMNS', JSON.stringify(cols.rows, null, 2));
    const rows = await pool.query("SELECT id_estadio, nombre, ciudad, latitud, longitud FROM estadios ORDER BY id_estadio");
    console.log('ROWS', JSON.stringify(rows.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
