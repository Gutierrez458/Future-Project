/**
 * server.js — Backend API para Sistema Mundial 2026
 * Conecta a PostgreSQL en postgresql://localhost:5432/maps
 * Expone endpoints REST para CRUD de selecciones, estadios, partidos, grupos y usuarios
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Sirve archivos estáticos (index.html, etc.)

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://postgres:camaro@localhost:5432/maps',
});

async function initSchema() {
  const queries = [
    "ALTER TABLE continentes ADD COLUMN IF NOT EXISTS confederacion varchar(50)",
    "ALTER TABLE selecciones ADD COLUMN IF NOT EXISTS latitud numeric",
    "ALTER TABLE selecciones ADD COLUMN IF NOT EXISTS longitud numeric",
    "ALTER TABLE estadios ADD COLUMN IF NOT EXISTS pais varchar(100)",
    "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS grupo varchar(20)",
    "ALTER TABLE partidos ADD COLUMN IF NOT EXISTS estado varchar(20)",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol varchar(20) DEFAULT 'viewer'",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso timestamp",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash varchar(255)",
    "ALTER TABLE grupos ADD COLUMN IF NOT EXISTS selecciones jsonb"
  ];
  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (e) {
      console.warn('Esquema: no se pudo ejecutar', query, e.message);
    }
  }
}

// ─── CONTRASEÑAS (hash con scrypt, sin dependencias externas) ────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Asegura las 3 cuentas demo con su rol y contraseña por defecto.
async function seedUsers() {
  const defaults = [
    { nombre: 'Administrador', email: 'admin@mundial2026.mx',  rol: 'admin',  pass: 'Admin#2026'  },
    { nombre: 'Editor',        email: 'editor@mundial2026.mx', rol: 'editor', pass: 'Editor#2026' },
    { nombre: 'Visitante',     email: 'viewer@mundial2026.mx', rol: 'viewer', pass: 'Viewer#2026' }
  ];
  for (const u of defaults) {
    const existing = await pool.query(
      'SELECT id_usuario, password_hash FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1', [u.email]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (nombre, email, rol, password_hash, fecha_registro) VALUES ($1,$2,$3,$4,NOW())',
        [u.nombre, u.email, u.rol, hashPassword(u.pass)]
      );
      console.log('👤 Usuario creado:', u.email, '(' + u.rol + ')');
    } else {
      const row = existing.rows[0];
      // Fija el rol correcto; asigna contraseña por defecto solo si aún no tiene.
      if (row.password_hash) {
        await pool.query('UPDATE usuarios SET rol=$1 WHERE id_usuario=$2', [u.rol, row.id_usuario]);
      } else {
        await pool.query('UPDATE usuarios SET rol=$1, password_hash=$2 WHERE id_usuario=$3',
          [u.rol, hashPassword(u.pass), row.id_usuario]);
      }
    }
  }
}

pool.connect()
  .then(async () => {
    console.log('✅ Conectado a PostgreSQL — postgresql://localhost:5432/maps');
    await initSchema();
    console.log('✅ Esquema de base de datos inicializado');
    await seedUsers();
    console.log('✅ Usuarios demo verificados (admin/editor/viewer)');
  })
  .catch(err => console.error('❌ Error conectando a PostgreSQL:', err.message));

// ─── UTILIDADES ────────────────────────────────────────────────────────────────
function send(res, rows) { res.json({ ok: true, data: rows }); }
function err(res, e) { res.status(500).json({ ok: false, error: e.message }); }

async function getSelectionIdByName(name) {
  if (!name) return null;
  if (Number.isInteger(name)) return name;
  const result = await pool.query('SELECT id_seleccion FROM selecciones WHERE nombre=$1 LIMIT 1', [name]);
  return result.rows[0] ? result.rows[0].id_seleccion : null;
}

async function getStadiumIdByName(name) {
  if (!name) return null;
  if (Number.isInteger(name)) return name;
  const result = await pool.query('SELECT id_estadio FROM estadios WHERE nombre=$1 LIMIT 1', [name]);
  return result.rows[0] ? result.rows[0].id_estadio : null;
}

async function getUserIdByEmail(email) {
  if (!email) return null;
  const result = await pool.query('SELECT id_usuario FROM usuarios WHERE email=$1 LIMIT 1', [email]);
  return result.rows[0] ? result.rows[0].id_usuario : null;
}

// ─── SELECCIONES ───────────────────────────────────────────────────────────────
// GET   /api/selecciones         → listar todas
// POST  /api/selecciones         → crear nueva
// PUT   /api/selecciones/:id     → editar
// DELETE /api/selecciones/:id    → eliminar

app.get('/api/selecciones', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id_seleccion AS id,
         s.nombre,
         s.bandera,
         s.historia,
         s.ventajas,
         s.desventajas,
         s.ranking,
         s.confederacion,
         s.id_continente AS continente_id,
         c.nombre AS continente,
         s.id_grupo AS grupo_id,
         g.nombre AS grupo
       FROM selecciones s
       LEFT JOIN continentes c ON c.id_continente = s.id_continente
       LEFT JOIN grupos g ON g.id_grupo = s.id_grupo
       ORDER BY s.nombre`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.get('/api/selecciones/top10', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id_seleccion AS id,
         s.nombre,
         s.bandera,
         s.historia,
         s.ventajas,
         s.desventajas,
         s.ranking,
         s.confederacion,
         c.nombre AS continente,
         g.nombre AS grupo
       FROM selecciones s
       LEFT JOIN continentes c ON c.id_continente = s.id_continente
       LEFT JOIN grupos g ON g.id_grupo = s.id_grupo
       ORDER BY s.ranking DESC NULLS LAST LIMIT 10`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.get('/api/selecciones/confederacion/:confederacion', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id_seleccion AS id,
         s.nombre,
         s.bandera,
         s.historia,
         s.ventajas,
         s.desventajas,
         s.ranking,
         s.confederacion,
         c.nombre AS continente,
         g.nombre AS grupo
       FROM selecciones s
       LEFT JOIN continentes c ON c.id_continente = s.id_continente
       LEFT JOIN grupos g ON g.id_grupo = s.id_grupo
       WHERE LOWER(s.confederacion) = LOWER($1)
       ORDER BY s.ranking DESC NULLS LAST`,
      [req.params.confederacion]
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/selecciones', async (req, res) => {
  const nombre = req.body.nombre || req.body.pais;
  const bandera = req.body.bandera || req.body.flag;
  const historia = req.body.historia || '';
  const ventajas = req.body.ventajas || '';
  const desventajas = req.body.desventajas || '';
  const ranking = req.body.ranking || null;
  const confederacion = req.body.confederacion || req.body.confederation || '';
  const continente_id = req.body.continente_id || req.body.id_continente || req.body.continente || null;
  const grupo_id = req.body.grupo_id || req.body.id_grupo || req.body.grupo || null;
  const latitud = req.body.latitud || req.body.lat || null;
  const longitud = req.body.longitud || req.body.lng || null;
  try {
    const result = await pool.query(
      `INSERT INTO selecciones (nombre, bandera, historia, ventajas, desventajas, ranking, confederacion, id_continente, id_grupo, latitud, longitud)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id_seleccion AS id, nombre, bandera, historia, ventajas, desventajas, ranking, confederacion, id_continente AS continente_id, id_grupo AS grupo_id, latitud, longitud`,
      [nombre, bandera || '🏳️', historia, ventajas, desventajas, ranking, confederacion, continente_id, grupo_id, latitud, longitud]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.put('/api/selecciones/:id', async (req, res) => {
  const nombre = req.body.nombre || req.body.pais;
  const bandera = req.body.bandera || req.body.flag;
  const historia = req.body.historia || '';
  const ventajas = req.body.ventajas || '';
  const desventajas = req.body.desventajas || '';
  const ranking = req.body.ranking || null;
  const confederacion = req.body.confederacion || req.body.confederation || '';
  const continente_id = req.body.continente_id || req.body.id_continente || req.body.continente || null;
  const grupo_id = req.body.grupo_id || req.body.id_grupo || req.body.grupo || null;
  const latitud = req.body.latitud || req.body.lat || null;
  const longitud = req.body.longitud || req.body.lng || null;
  try {
    const result = await pool.query(
      `UPDATE selecciones SET nombre=$1, bandera=$2, historia=$3, ventajas=$4, desventajas=$5,
       ranking=$6, confederacion=$7, id_continente=$8, id_grupo=$9, latitud=$10, longitud=$11
       WHERE id_seleccion=$12 RETURNING id_seleccion AS id, nombre, bandera, historia, ventajas, desventajas, ranking, confederacion, id_continente AS continente_id, id_grupo AS grupo_id, latitud, longitud`,
      [nombre, bandera || '🏳️', historia, ventajas, desventajas, ranking, confederacion, continente_id, grupo_id, latitud, longitud, req.params.id]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.delete('/api/selecciones/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM selecciones WHERE id_seleccion=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ─── ESTADIOS ──────────────────────────────────────────────────────────────────
app.get('/api/estadios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id_estadio AS id,
         nombre,
         ciudad,
         COALESCE(pais, '') AS pais,
         capacidad,
         COALESCE(latitud, 0) AS lat,
         COALESCE(longitud, 0) AS lng,
         COALESCE(cesped, 'Natural') AS cesped,
         COALESCE(anio_construccion, 2000) AS anio_construccion
       FROM estadios ORDER BY nombre`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/estadios', async (req, res) => {
  const { nombre, ciudad, pais, capacidad, cesped, anio_construccion, lat, lng } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO estadios (nombre, ciudad, pais, capacidad, latitud, longitud, cesped, anio_construccion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id_estadio AS id, nombre, ciudad, COALESCE(pais, '') AS pais, capacidad, COALESCE(latitud, 0) AS lat, COALESCE(longitud, 0) AS lng, COALESCE(cesped, 'Natural') AS cesped, COALESCE(anio_construccion, 2000) AS anio_construccion`,
      [nombre, ciudad, pais || '', capacidad || 0, lat || 0, lng || 0, cesped || 'Natural', anio_construccion || 2000]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.put('/api/estadios/:id', async (req, res) => {
  const { nombre, ciudad, pais, capacidad, cesped, anio_construccion, lat, lng } = req.body;
  try {
    const result = await pool.query(
      `UPDATE estadios SET nombre=$1, ciudad=$2, pais=$3, capacidad=$4, latitud=$5, longitud=$6, cesped=$7, anio_construccion=$8
       WHERE id_estadio=$9 RETURNING id_estadio AS id, nombre, ciudad, COALESCE(pais, '') AS pais, capacidad, COALESCE(latitud, 0) AS lat, COALESCE(longitud, 0) AS lng, COALESCE(cesped, 'Natural') AS cesped, COALESCE(anio_construccion, 2000) AS anio_construccion`,
      [nombre, ciudad, pais || '', capacidad || 0, lat || 0, lng || 0, cesped || 'Natural', anio_construccion || 2000, req.params.id]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.delete('/api/estadios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM estadios WHERE id_estadio=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ─── PARTIDOS ──────────────────────────────────────────────────────────────────
app.get('/api/partidos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id_partido AS id,
         p.id_local,
         p.id_visitante,
         p.id_estadio,
         COALESCE(sl.nombre, '') AS local,
         COALESCE(sv.nombre, '') AS visitante,
         COALESCE(e.nombre, '') AS estadio,
         p.fecha_hora AS fecha,
         p.goles_local,
         p.goles_visitante,
         COALESCE(p.fase, '') AS fase,
         COALESCE(p.grupo, '') AS grupo,
         COALESCE(p.estado, 'próximo') AS estado
       FROM partidos p
       LEFT JOIN selecciones sl ON sl.id_seleccion = p.id_local
       LEFT JOIN selecciones sv ON sv.id_seleccion = p.id_visitante
       LEFT JOIN estadios e ON e.id_estadio = p.id_estadio
       ORDER BY p.fecha_hora`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/partidos', async (req, res) => {
  const { local, visitante, estadio, fecha, fase, grupo, goles_local, goles_visitante, estado } = req.body;
  try {
    const localId = await getSelectionIdByName(local);
    const visitanteId = await getSelectionIdByName(visitante);
    const estadioId = await getStadiumIdByName(estadio);
    const result = await pool.query(
      `INSERT INTO partidos (id_local, id_visitante, id_estadio, fecha_hora, fase, grupo, goles_local, goles_visitante, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id_partido AS id, id_local, id_visitante, id_estadio, fecha_hora AS fecha, goles_local, goles_visitante, fase, grupo, estado`,
      [localId, visitanteId, estadioId, fecha, fase || 'Grupos', grupo || '', goles_local || null, goles_visitante || null, estado || 'próximo']
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.put('/api/partidos/:id', async (req, res) => {
  const { local, visitante, estadio, fecha, fase, grupo, goles_local, goles_visitante, estado } = req.body;
  try {
    const localId = await getSelectionIdByName(local);
    const visitanteId = await getSelectionIdByName(visitante);
    const estadioId = await getStadiumIdByName(estadio);
    const result = await pool.query(
      `UPDATE partidos SET id_local=$1, id_visitante=$2, id_estadio=$3, fecha_hora=$4, fase=$5, grupo=$6, goles_local=$7, goles_visitante=$8, estado=$9
       WHERE id_partido=$10 RETURNING id_partido AS id, id_local, id_visitante, id_estadio, fecha_hora AS fecha, goles_local, goles_visitante, fase, grupo, estado`,
      [localId, visitanteId, estadioId, fecha, fase || 'Grupos', grupo || '', goles_local || null, goles_visitante || null, estado || 'próximo', req.params.id]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.delete('/api/partidos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM partidos WHERE id_partido=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ─── SIMULACIÓN DE PARTIDOS (persistente) ───────────────────────────────────────
// Suma/resta el marcador de un partido a la fila de clasificación del equipo.
async function ajustarClasificacion(client, idSel, idGrupo, favor, contra, signo) {
  const win = favor > contra ? 1 : 0;
  const draw = favor === contra ? 1 : 0;
  const loss = favor < contra ? 1 : 0;
  const pts = win * 3 + draw;
  const existing = await client.query(
    'SELECT id_clasificacion FROM clasificaciones WHERE id_seleccion=$1 LIMIT 1', [idSel]
  );
  if (existing.rows[0]) {
    await client.query(
      `UPDATE clasificaciones SET
         partidos_jugados = GREATEST(COALESCE(partidos_jugados,0) + $2, 0),
         victorias        = GREATEST(COALESCE(victorias,0)        + $3, 0),
         empates          = GREATEST(COALESCE(empates,0)          + $4, 0),
         derrotas         = GREATEST(COALESCE(derrotas,0)         + $5, 0),
         goles_a_favor    = GREATEST(COALESCE(goles_a_favor,0)    + $6, 0),
         goles_en_contra  = GREATEST(COALESCE(goles_en_contra,0)  + $7, 0),
         puntos           = GREATEST(COALESCE(puntos,0)           + $8, 0),
         diferencia_goles = GREATEST(COALESCE(goles_a_favor,0) + $6, 0) - GREATEST(COALESCE(goles_en_contra,0) + $7, 0)
       WHERE id_seleccion=$1`,
      [idSel, signo * 1, signo * win, signo * draw, signo * loss, signo * favor, signo * contra, signo * pts]
    );
  } else if (signo > 0) {
    await client.query(
      `INSERT INTO clasificaciones
         (id_seleccion, id_grupo, puntos, partidos_jugados, victorias, empates, derrotas, goles_a_favor, goles_en_contra, diferencia_goles, posicion)
       VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8,$9,0)`,
      [idSel, idGrupo, pts, win, draw, loss, favor, contra, favor - contra]
    );
  }
}

// Recalcula la posición dentro de un grupo (pts, dif, goles a favor).
async function recomputarPosiciones(client, idGrupo) {
  if (!idGrupo) return;
  await client.query(
    `WITH ranked AS (
       SELECT id_clasificacion,
              ROW_NUMBER() OVER (
                ORDER BY COALESCE(puntos,0) DESC,
                         COALESCE(diferencia_goles,0) DESC,
                         COALESCE(goles_a_favor,0) DESC
              ) AS pos
       FROM clasificaciones WHERE id_grupo=$1
     )
     UPDATE clasificaciones c SET posicion = r.pos
     FROM ranked r WHERE r.id_clasificacion = c.id_clasificacion`,
    [idGrupo]
  );
}

// Registra un partido simulado y actualiza la clasificación si ambos son del mismo grupo.
app.post('/api/partidos/simular', async (req, res) => {
  const { local, visitante, golesLocal, golesVisitante } = req.body || {};
  const gl = parseInt(golesLocal, 10);
  const gv = parseInt(golesVisitante, 10);
  if (!local || !visitante || Number.isNaN(gl) || Number.isNaN(gv)) {
    return res.status(400).json({ ok: false, error: 'Datos de partido inválidos' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locRow = await client.query('SELECT id_seleccion, id_grupo FROM selecciones WHERE nombre=$1 LIMIT 1', [local]);
    const visRow = await client.query('SELECT id_seleccion, id_grupo FROM selecciones WHERE nombre=$1 LIMIT 1', [visitante]);
    if (!locRow.rows[0] || !visRow.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Selección no encontrada en la base de datos' });
    }
    const loc = locRow.rows[0], vis = visRow.rows[0];
    const mismoGrupo = loc.id_grupo && loc.id_grupo === vis.id_grupo;

    let grupoNombre = null;
    if (mismoGrupo) {
      const g = await client.query('SELECT nombre FROM grupos WHERE id_grupo=$1', [loc.id_grupo]);
      grupoNombre = g.rows[0] ? String(g.rows[0].nombre).trim() : null;
    }

    const ins = await client.query(
      `INSERT INTO partidos (id_local, id_visitante, id_estadio, fecha_hora, goles_local, goles_visitante, fase, grupo, estado)
       VALUES ($1,$2,NULL,NOW(),$3,$4,'Simulación',$5,'completado') RETURNING id_partido AS id`,
      [loc.id_seleccion, vis.id_seleccion, gl, gv, grupoNombre]
    );

    if (mismoGrupo) {
      await ajustarClasificacion(client, loc.id_seleccion, loc.id_grupo, gl, gv, +1);
      await ajustarClasificacion(client, vis.id_seleccion, vis.id_grupo, gv, gl, +1);
      await recomputarPosiciones(client, loc.id_grupo);
    }

    await client.query('COMMIT');
    res.json({ ok: true, data: { id_partido: ins.rows[0].id, actualizoClasificacion: !!mismoGrupo, grupo: grupoNombre } });
  } catch (e) {
    await client.query('ROLLBACK');
    err(res, e);
  } finally {
    client.release();
  }
});

// Borra todos los partidos simulados y revierte su efecto en la clasificación.
app.post('/api/partidos/simular/reset', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sims = await client.query(
      `SELECT p.id_local, p.id_visitante, p.goles_local, p.goles_visitante,
              sl.id_grupo AS grupo_local, sv.id_grupo AS grupo_visitante
         FROM partidos p
         LEFT JOIN selecciones sl ON sl.id_seleccion = p.id_local
         LEFT JOIN selecciones sv ON sv.id_seleccion = p.id_visitante
        WHERE p.fase = 'Simulación'`
    );
    const gruposAfectados = new Set();
    for (const m of sims.rows) {
      const mismoGrupo = m.grupo_local && m.grupo_local === m.grupo_visitante;
      if (!mismoGrupo) continue; // los cruces entre grupos no tocaron la clasificación
      await ajustarClasificacion(client, m.id_local, m.grupo_local, m.goles_local, m.goles_visitante, -1);
      await ajustarClasificacion(client, m.id_visitante, m.grupo_visitante, m.goles_visitante, m.goles_local, -1);
      gruposAfectados.add(m.grupo_local);
    }
    for (const g of gruposAfectados) await recomputarPosiciones(client, g);
    const del = await client.query("DELETE FROM partidos WHERE fase='Simulación'");
    await client.query('COMMIT');
    res.json({ ok: true, data: { eliminados: del.rowCount } });
  } catch (e) {
    await client.query('ROLLBACK');
    err(res, e);
  } finally {
    client.release();
  }
});

// ─── GRUPOS ────────────────────────────────────────────────────────────────────
app.get('/api/grupos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_grupo AS id, nombre FROM grupos ORDER BY nombre');
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/grupos', async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO grupos (nombre) VALUES ($1) RETURNING id_grupo AS id, nombre`,
      [nombre]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

// ─── CONTINENTES ─────────────────────────────────────────────────────────────────
app.get('/api/continentes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id_continente AS id, nombre, COALESCE(confederacion, '') AS confederacion FROM continentes ORDER BY nombre`);
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/continentes', async (req, res) => {
  const { nombre, confederacion } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO continentes (nombre, confederacion) VALUES ($1,$2) RETURNING id_continente AS id, nombre, COALESCE(confederacion, '') AS confederacion`,
      [nombre, confederacion || '']
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

// ─── BOLETOS ───────────────────────────────────────────────────────────────────
app.get('/api/boletos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id_boleto AS id,
         b.asiento,
         b.precio,
         b.fecha_compra AS fecha_compra,
         b.id_partido,
         b.id_usuario,
         COALESCE(u.nombre, '') AS usuario,
         COALESCE(p.fase, '') AS fase,
         COALESCE(e.nombre, '') AS estadio,
         COALESCE(sl.nombre, '') AS local,
         COALESCE(sv.nombre, '') AS visitante
       FROM boletos b
       LEFT JOIN usuarios u ON u.id_usuario = b.id_usuario
       LEFT JOIN partidos p ON p.id_partido = b.id_partido
       LEFT JOIN estadios e ON e.id_estadio = p.id_estadio
       LEFT JOIN selecciones sl ON sl.id_seleccion = p.id_local
       LEFT JOIN selecciones sv ON sv.id_seleccion = p.id_visitante
       ORDER BY b.fecha_compra DESC`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/boletos', async (req, res) => {
  const { id_partido, id_usuario, asiento, precio } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO boletos (id_partido, id_usuario, asiento, precio, fecha_compra)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id_boleto AS id, id_partido, id_usuario, asiento, precio, fecha_compra`,
      [id_partido || null, id_usuario || null, asiento || '', precio || 0]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.delete('/api/boletos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM boletos WHERE id_boleto=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ─── FASE FINAL ─────────────────────────────────────────────────────────────────
app.get('/api/fase_final', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         f.id_fase_final AS id,
         f.id_partido,
         f.etapa,
         f.clasifica_id_seleccion AS clasifica_id_seleccion
       FROM fase_final f ORDER BY f.id_fase_final`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/fase_final', async (req, res) => {
  const { id_partido, etapa, clasifica_id_seleccion } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO fase_final (id_partido, etapa, clasifica_id_seleccion)
       VALUES ($1,$2,$3) RETURNING id_fase_final AS id, id_partido, etapa, clasifica_id_seleccion`,
      [id_partido || null, etapa || '', clasifica_id_seleccion || null]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

// ─── AUTENTICACIÓN ─────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Ingresa correo y contraseña' });
  }
  try {
    const result = await pool.query(
      `SELECT id_usuario, nombre, email, COALESCE(rol, 'viewer') AS rol, password_hash
         FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`,
      [String(email).trim()]
    );
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });
    }
    await pool.query('UPDATE usuarios SET ultimo_acceso=NOW() WHERE id_usuario=$1', [user.id_usuario]);
    res.json({ ok: true, data: { nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (e) { err(res, e); }
});

// ─── USUARIOS ──────────────────────────────────────────────────────────────────
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_usuario AS id,
         nombre,
         email,
         COALESCE(rol, 'viewer') AS rol,
         COALESCE(ultimo_acceso, fecha_registro) AS ultimo_acceso
       FROM usuarios ORDER BY id_usuario`
    );
    send(res, result.rows);
  } catch (e) { err(res, e); }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, rol, password } = req.body;
  try {
    const hash = password ? hashPassword(password) : null;
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, rol, password_hash, fecha_registro, ultimo_acceso)
       VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id_usuario AS id, nombre, email, rol, ultimo_acceso`,
      [nombre, email, rol || 'viewer', hash]
    );
    res.json({ ok: true, data: result.rows[0] });
  } catch (e) { err(res, e); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id_usuario=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { err(res, e); }
});

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/ping', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'PostgreSQL conectado ✅', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Error de conexión', error: e.message });
  }
});

// ─── INICIAR SERVIDOR ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌐 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🖥️  Frontend disponible en http://localhost:${PORT}/index.html\n`);
});
