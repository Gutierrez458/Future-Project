const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:camaro@localhost:5432/maps' });
(async () => {
  try {
    const tables = ['continentes','selecciones','grupos','estadios','partidos','clasificaciones','usuarios','boletos','fase_final'];
    for (const t of tables) {
      const cols = await pool.query({
        text: "SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
        values: [t],
      });
      console.log('TABLE ' + t);
      if (cols.rows.length === 0) {
        console.log('NONE');
      } else {
        cols.rows.forEach(c => console.log(c.column_name + ' | ' + c.data_type + ' | ' + c.is_nullable));
      }
      console.log('');
    }
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
