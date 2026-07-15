/**
 * app.js — Lógica principal del Sistema Mundial 2026
 * - Mapas reales con Leaflet + geolocalización + rutas OSRM
 * - CRUD persistente vía API REST (http://localhost:3000/api)
 */

var currentRole = 'admin';
var currentSection = 'dashboard';
var currentAdminTab = 'selecciones';
var leafletMap = null;
var mapEstadio = null;
var routeLayer = null;

// URL base de la API (servidor Node.js).
// Si la página se abre A TRAVÉS del servidor (http://localhost:3000, http://<IP-de-la-lap>:3000
// o una URL en la nube), usa el MISMO host automáticamente → así ambas laptops se conectan
// al mismo servidor y base de datos sin tener que editar nada en cada dispositivo.
// Solo si abres el archivo directo (file://) recurre al servidor local.
var API_BASE = (location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api';

// ─── PERMISOS POR ROL ──────────────────────────────────────────────────────────
// panel: abrir el panel Administrador · usuarios: gestionar cuentas
// editar: CRUD de contenido · simular: simular partidos y modificar tablas
var PERMISOS = {
  admin:  { panel: true,  usuarios: true,  editar: true,  simular: true  },
  editor: { panel: true,  usuarios: false, editar: true,  simular: true  },
  viewer: { panel: false, usuarios: false, editar: false, simular: false }
};
function puede(accion) {
  return !!(PERMISOS[currentRole] && PERMISOS[currentRole][accion]);
}

// Credenciales demo (autollenado al elegir una pastilla de rol)
var DEMO_CREDS = {
  admin:  { user: 'admin@mundial2026.mx',  pass: 'Admin#2026'  },
  editor: { user: 'editor@mundial2026.mx', pass: 'Editor#2026' },
  viewer: { user: 'viewer@mundial2026.mx', pass: 'Viewer#2026' }
};

// ─── NOTIFICACIÓN TOAST ────────────────────────────────────────────────────────
function showToast(msg, type) {
  var t = type || 'success';
  var el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
    'padding:12px 20px', 'border-radius:10px', 'font-size:13px',
    'font-weight:500', 'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
    'animation:fadeInUp 0.3s ease', 'max-width:320px',
    t === 'success' ? 'background:#22c55e;color:#fff' :
    t === 'error'   ? 'background:#ef4444;color:#fff' :
                      'background:#3b82f6;color:#fff'
  ].join(';');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ─── API HELPERS ───────────────────────────────────────────────────────────────
async function apiGet(path) {
  try {
    var res = await fetch(API_BASE + path);
    var json = await res.json();
    return json.ok ? json.data : null;
  } catch (e) {
    console.warn('API no disponible:', e.message);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    var res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function apiPut(path, body) {
  try {
    var res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function apiDelete(path) {
  try {
    var res = await fetch(API_BASE + path, { method: 'DELETE' });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── SINCRONIZACIÓN EN TIEMPO REAL (SSE) ─────────────────────────────────────────
// Cada pestaña abre un canal permanente con el servidor. Cuando un compañero simula
// un partido (o restablece las tablas), el servidor lo "empuja" por ese canal y esta
// pestaña actualiza sus tablas sola, sin recargar. Ese es el objetivo del proyecto.
//
// IMPORTANTE: para que funcione ENTRE VARIAS PERSONAS, todas deben usar el MISMO
// servidor (uno solo en la nube), no un backend en el localhost de cada quien.
// En ese caso, apunta API_BASE (arriba) a la URL del servidor compartido.

// Identificador único de ESTA pestaña. Sirve para no aplicar dos veces el cambio
// que uno mismo originó (el servidor nos reenvía nuestro propio evento).
var CLIENT_ID = 'c-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
var _sseConn = null;

function iniciarTiempoReal() {
  if (_sseConn) return;                          // ya conectado
  if (typeof EventSource === 'undefined') return; // navegador sin soporte
  try {
    _sseConn = new EventSource(API_BASE + '/events');
  } catch (e) { return; }

  _sseConn.onopen = function () { actualizarBadgeVivo(true); };

  _sseConn.onerror = function () {
    // EventSource reintenta la conexión automáticamente; solo reflejamos el estado.
    actualizarBadgeVivo(false);
  };

  _sseConn.onmessage = function (ev) {
    var msg;
    try { msg = JSON.parse(ev.data); } catch (_) { return; }
    if (!msg || !msg.tipo) return;

    // Estado inicial (o tras reconectar): rehacemos las tablas desde cero con lo que
    // manda el servidor. Es idempotente, así que da igual cuántas veces llegue.
    if (msg.tipo === 'sync') { sincronizarDesdeServidor(msg.partidos); return; }

    // Si el evento lo originó esta misma pestaña, ya lo aplicamos localmente. Ignorar.
    if (msg.origin && msg.origin === CLIENT_ID) return;

    if (msg.tipo === 'simular') {
      aplicarResultado(msg.local, msg.visitante, msg.golesLocal, msg.golesVisitante);
      refrescarVistaActual();
      showToast('⚽ Un compañero simuló: ' + msg.local + ' ' + msg.golesLocal + ' – ' +
                msg.golesVisitante + ' ' + msg.visitante, 'info');
    } else if (msg.tipo === 'reset') {
      revertirTablasLocal();
      showToast('🔄 Un compañero restableció las tablas', 'info');
    }
  };
}

// Reconstruye las tablas locales a partir del estado autoritativo del servidor:
// vuelve a los resultados oficiales y reaplica todas las simulaciones vigentes.
function sincronizarDesdeServidor(partidos) {
  if (_snapshotTablas) revertirTablasLocal();    // deja las tablas oficiales y limpia el snapshot
  if (partidos && partidos.length) {
    partidos.forEach(function (p) {
      aplicarResultado(p.local, p.visitante, p.golesLocal, p.golesVisitante);
    });
  }
  refrescarVistaActual();
}

// Repinta la sección visible actual tras un cambio recibido en vivo.
function refrescarVistaActual() {
  if (currentSection === 'grupos') renderDraw();
  else if (currentSection === 'clasificacion') renderGrupos();
  else if (currentSection === 'selecciones') renderSelecciones();
  // grupos y clasificación también se repintan dentro de aplicarResultado.
}

// Indicador flotante "En vivo" para que se vea que la sincronización está activa.
function actualizarBadgeVivo(online) {
  var b = document.getElementById('live-sync-badge');
  if (!b) {
    b = document.createElement('div');
    b.id = 'live-sync-badge';
    b.style.cssText = 'position:fixed;top:12px;right:16px;z-index:9998;display:flex;' +
      'align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:11.5px;' +
      'font-weight:600;box-shadow:0 2px 12px rgba(0,0,0,.25);transition:opacity .3s';
    document.body.appendChild(b);
  }
  if (online) {
    b.style.background = 'rgba(34,197,94,.15)'; b.style.color = '#16a34a';
    b.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;' +
      'animation:pulse 1.6s infinite"></span> En vivo';
  } else {
    b.style.background = 'rgba(239,68,68,.15)'; b.style.color = '#dc2626';
    b.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#ef4444"></span> Reconectando…';
  }
}

// ─── AUTENTICACIÓN ─────────────────────────────────────────────────────────────
// La pastilla solo autollena las credenciales demo; el rol real lo define el login.
function selectRole(el) {
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  var c = DEMO_CREDS[el.dataset.role];
  if (c) {
    document.getElementById('login-user').value = c.user;
    document.getElementById('login-pass').value = c.pass;
  }
  var err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

async function doLogin() {
  var email = (document.getElementById('login-user').value || '').trim();
  var pass = document.getElementById('login-pass').value || '';
  var errBox = document.getElementById('login-error');
  var btn = document.getElementById('btn-login');
  function showError(msg) {
    if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
    else showToast(msg, 'error');
  }
  if (errBox) errBox.style.display = 'none';

  if (!email || !pass) { showError('Ingresa tu correo y contraseña.'); return; }

  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  var resp = await apiPost('/login', { email: email, password: pass });
  if (btn) { btn.disabled = false; btn.style.opacity = ''; }

  if (!resp || !resp.ok) {
    var msg = (resp && resp.error) || '';
    if (!msg || /failed to fetch|networkerror|load failed/i.test(msg)) {
      showError('No se pudo conectar con el servidor. Inicia el backend (npm start) y verifica PostgreSQL.');
    } else {
      showError(msg); // p.ej. "Correo o contraseña incorrectos"
    }
    return;
  }
  enterApp(resp.data);
}

// Configura la interfaz una vez validado el usuario (rol proveniente de la DB).
function enterApp(user) {
  currentRole = (user && user.rol) || 'viewer';
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('sidebar').style.display = 'flex';
  document.getElementById('main').style.display = 'flex';
  var roleNames = { admin: 'Administrador', editor: 'Editor de contenido', viewer: 'Visitante' };
  var nombre = (user && user.nombre) || roleNames[currentRole] || 'Usuario';
  document.getElementById('user-name-disp').textContent = nombre;
  document.getElementById('user-role-disp').textContent = roleNames[currentRole] || currentRole;
  document.getElementById('user-avatar').textContent = (nombre[0] || 'U').toUpperCase();
  // Solo admin y editor ven el panel de gestión.
  var verPanel = puede('panel');
  document.getElementById('admin-section').style.display = verPanel ? 'block' : 'none';
  document.getElementById('admin-nav').style.display = verPanel ? 'flex' : 'none';
  document.getElementById('db-badge').style.display = 'flex';
  nav('dashboard', document.querySelector('.nav-item[onclick*="dashboard"]'));
  renderConfederaciones();
  renderDraw();
  renderGrupos();
  renderPartidos('todos');
  renderSelecciones();
  renderEstadios();
  renderSimulador();
  renderBracket();
  renderGeo();
  renderBoletos();
  renderAcerca();
  renderAdmin();
  iniciarTiempoReal();   // abre el canal en vivo para recibir simulaciones de los demás
}

function doLogout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main').style.display = 'none';
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  currentRole = 'admin';
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-role="admin"]').classList.add('active');
  document.getElementById('admin-section').style.display = 'block';
  document.getElementById('admin-nav').style.display = 'flex';
  currentAdminTab = 'selecciones';
  // Deja el formulario listo y limpio para el siguiente ingreso.
  document.getElementById('login-user').value = DEMO_CREDS.admin.user;
  document.getElementById('login-pass').value = DEMO_CREDS.admin.pass;
  var err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

// ─── NAVEGACIÓN ────────────────────────────────────────────────────────────────
function nav(sec, el) {
  var targetSection = document.getElementById('sec-' + sec);
  if (!targetSection) return;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  targetSection.classList.add('active');
  var titles = {
    dashboard: 'Inicio', confederaciones: 'Confederaciones', selecciones: 'Selecciones',
    grupos: 'Grupos', calendario: 'Calendario', clasificacion: 'Clasificación',
    simulador: 'Simulador', fasefinal: 'Fase Final', estadios: 'Estadios',
    geolocalizacion: 'Geolocalización', boletos: 'Boletos', admin: 'Administrador',
    acerca: 'Acerca del Proyecto'
  };
  document.getElementById('topbar-title').textContent = titles[sec] || sec.toUpperCase();
  currentSection = sec;
  // Actualiza datos dinámicos al mostrar secciones con tablas.
  if (sec === 'grupos') renderDraw();
  if (sec === 'clasificacion') renderGrupos();
  if (sec === 'admin') renderAdmin();
  if (sec === 'geolocalizacion' && leafletMap) setTimeout(function(){ leafletMap.invalidateSize(true); }, 200);
}

// ─── RENDER CLASIFICACIÓN (TABLA GENERAL DE LOS 48) ─────────────────────────────
function faseClass(fase) {
  if (fase.indexOf('Cuartos') !== -1) return 'fase-cuartos';
  if (fase.indexOf('Octavos') !== -1) return 'fase-octavos';
  if (fase.indexOf('Dieciseisavos') !== -1) return 'fase-dieci';
  return 'fase-grupos';
}
function renderGrupos() {
  var g = document.getElementById('groups-grid');
  if (!g) return;
  g.innerHTML = `
    <div class="tg-scroll">
    <table class="tg-general">
      <thead>
        <tr>
          <th>Grupo</th><th class="tg-team-col">Equipo</th><th>Rank FIFA</th>
          <th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>Dif</th><th>Pts</th>
          <th class="tg-fase-col">Fase Alcanzada</th>
        </tr>
      </thead>
      <tbody>
        ${tablaGeneral.map(r => {
          var grupo=r[0], team=r[1], rank=r[2], pj=r[3], pg=r[4], pe=r[5], pp=r[6], gf=r[7], gc=r[8], dg=r[9], pts=r[10], fase=r[11];
          return `
          <tr class="${faseClass(fase)}">
            <td class="tg-grupo">${grupo}</td>
            <td class="tg-team"><span class="team-flag">${flagByTeam[team]||'🏳️'}</span> ${team}</td>
            <td class="tg-rank">#${rank}</td>
            <td>${pj}</td><td>${pg}</td><td>${pe}</td><td>${pp}</td><td>${gf}</td><td>${gc}</td>
            <td class="${dg>0?'diff-pos':dg<0?'diff-neg':''}">${dg>0?'+':''}${dg}</td>
            <td class="tg-pts">${pts}</td>
            <td class="tg-fase">${fase}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
    <div class="tg-legend">
      <span class="tg-leg fase-cuartos">Clasificado a Cuartos</span>
      <span class="tg-leg fase-octavos">Eliminado en Octavos</span>
      <span class="tg-leg fase-dieci">Eliminado en Dieciseisavos</span>
      <span class="tg-leg fase-grupos">Eliminado en Fase de Grupos</span>
    </div>`;
}

// ─── RENDER CALENDARIO ─────────────────────────────────────────────────────────
function renderPartidos(f) {
  var list = document.getElementById('calendario-list');
  if (!list) return;
  var data = f === 'todos' ? partidosData : partidosData.filter(p => p.status === f || p.group === f);

  // Agrupar por fecha respetando el orden en que aparecen
  var groups = [];
  var byDate = {};
  data.forEach(p => {
    if (!byDate[p.date]) { byDate[p.date] = []; groups.push(p.date); }
    byDate[p.date].push(p);
  });

  if (!groups.length) {
    list.innerHTML = '<div class="empty-state"><i class="ti ti-calendar-off"></i><div>No hay partidos para este filtro</div></div>';
    return;
  }

  list.innerHTML = groups.map(date => `
    <div class="cal-day">
      <div class="cal-day-head"><i class="ti ti-calendar" aria-hidden="true"></i> ${date}</div>
      <div class="partidos-list">
        ${byDate[date].map(p => `
        <div class="partido-card">
          <div class="partido-header">
            <span><i class="ti ti-map-pin" style="font-size:12px"></i> ${p.stadium}</span>
            <span class="status-badge ${p.status === 'en vivo' ? 'status-live' : p.status === 'completado' ? 'status-done' : 'status-next'}">${p.status === 'en vivo' ? 'EN VIVO' : p.status === 'completado' ? 'Finalizado' : 'Próximo'}</span>
          </div>
          <div class="partido-body">
            <div class="team-match"><div class="team-match-flag">${p.home}</div><div class="team-match-name">${p.homeN}</div></div>
            <div class="score-box">
              <div class="score-main" style="${p.status === 'en vivo' ? 'color:#CE1126' : ''}">${p.score}</div>
              <div class="score-time">${p.time}</div>
            </div>
            <div class="team-match"><div class="team-match-flag">${p.away}</div><div class="team-match-name">${p.awayN}</div></div>
          </div>
          <div class="partido-footer">
            <span style="font-size:11px;color:var(--color-text-tertiary)">${p.group.toUpperCase()}</span>
            <div class="share-btns">
              <button class="share-btn share-wa" onclick="sharePartido('whatsapp','${p.homeN}','${p.awayN}','${p.score}')"><i class="ti ti-brand-whatsapp"></i></button>
              <button class="share-btn share-fb" onclick="sharePartido('facebook','${p.homeN}','${p.awayN}','${p.score}')">fb</button>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>`).join('');
}

// ─── RENDER CONFEDERACIONES ────────────────────────────────────────────────────
function renderConfederaciones() {
  var g = document.getElementById('confed-grid');
  if (!g) return;
  g.innerHTML = confederaciones.map(c => `
  <div class="confed-card">
    <div class="confed-head" style="background:linear-gradient(135deg,${c.color},#0A1628)">
      <div class="confed-emoji">${c.emoji}</div>
      <div>
        <div class="confed-name">${c.name}</div>
        <div class="confed-region">${c.region}</div>
      </div>
      <div class="confed-count">${c.teams.length}</div>
    </div>
    <div class="confed-teams">
      ${c.teams.map(t => `<span class="confed-team" onclick="showSeleccion('${t.replace(/'/g,"\\'")}')">${flagByTeam[t] || '🏳️'} ${t}</span>`).join('')}
    </div>
  </div>`).join('');
}

// ─── CUADRO EMERGENTE: DETALLE DE SELECCIÓN ─────────────────────────────────────
function showSeleccion(name) {
  var info = getSeleccionInfo(name);
  var body = document.getElementById('sel-modal-body');
  body.innerHTML = `
    <div class="sel-modal-header">
      <div class="sel-modal-flag">${info.flag}</div>
      <div class="sel-modal-titlewrap">
        <div class="sel-modal-name">${info.name}</div>
        <div class="sel-modal-confed">${info.confed}</div>
      </div>
      <button class="map-close" onclick="closeSeleccion()">×</button>
    </div>
    <div class="sel-modal-body">
      <div class="sel-modal-badges">
        <div class="sel-badge"><div class="sel-badge-lbl">Ranking FIFA</div><div class="sel-badge-val">#${info.ranking}</div></div>
        <div class="sel-badge"><div class="sel-badge-lbl">Grupo</div><div class="sel-badge-val">${info.group.replace('Grupo ','')}</div></div>
        <div class="sel-badge"><div class="sel-badge-lbl">Puntos</div><div class="sel-badge-val">${info.stats.pts}</div></div>
      </div>

      <div class="sel-modal-cols">
        <div class="sel-modal-block">
          <div class="sel-modal-block-title"><i class="ti ti-user"></i> Entrenador</div>
          <div class="sel-modal-block-text">${info.entrenador}</div>
        </div>
        <div class="sel-modal-block">
          <div class="sel-modal-block-title"><i class="ti ti-flag-checkered"></i> Fase alcanzada</div>
          <div class="sel-modal-block-text">${info.fase}</div>
        </div>
      </div>

      <div class="sel-modal-block">
        <div class="sel-modal-block-title"><i class="ti ti-book"></i> Historia</div>
        <div class="sel-modal-block-text">${info.historia}</div>
      </div>

      <div class="sel-modal-cols">
        <div class="sel-modal-block sel-pro">
          <div class="sel-modal-block-title"><i class="ti ti-thumb-up"></i> Ventajas</div>
          <ul class="sel-modal-ul">${info.ventajas.map(v => `<li>${v}</li>`).join('')}</ul>
        </div>
        <div class="sel-modal-block sel-con">
          <div class="sel-modal-block-title"><i class="ti ti-thumb-down"></i> Desventajas</div>
          <ul class="sel-modal-ul">${info.desventajas.map(v => `<li>${v}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="sel-modal-block">
        <div class="sel-modal-block-title"><i class="ti ti-building-stadium"></i> Estadio donde juega</div>
        <div class="sel-modal-block-text">${info.estadio.name} · ${info.estadio.city} ${info.estadio.country}</div>
        <a class="sel-maps-btn" href="${info.estadio.mapsUrl}" target="_blank" rel="noopener">
          <i class="ti ti-map-pin"></i> Ver en Google Maps
        </a>
      </div>
    </div>`;
  document.getElementById('sel-overlay-container').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSeleccion() {
  document.getElementById('sel-overlay-container').style.display = 'none';
  document.body.style.overflow = '';
}

// ─── RENDER GRUPOS (TABLAS DE ESTADÍSTICAS) ─────────────────────────────────────
function renderDraw() {
  var g = document.getElementById('draw-grid');
  if (!g) return;
  g.innerHTML = gruposData.map(gr => `
  <div class="gt-card">
    <div class="gt-title">Grupo ${gr.name}</div>
    <div class="gt-scroll">
    <table class="gt-table">
      <thead>
        <tr>
          <th class="gt-flag-col">Bandera</th>
          <th class="gt-team-col">Selección</th>
          <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
          <th>GF</th><th>GC</th><th>DG</th><th>PT</th>
        </tr>
      </thead>
      <tbody>
        ${gr.teams.map(t => `
        <tr>
          <td class="gt-flag">${t.flag}</td>
          <td class="gt-team">${t.name}</td>
          <td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td>
          <td>${t.gf}</td><td>${t.gc}</td>
          <td class="${t.dif > 0 ? 'diff-pos' : t.dif < 0 ? 'diff-neg' : ''}">${t.dif > 0 ? '+' : ''}${t.dif}</td>
          <td class="gt-pts">${t.pts}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`).join('');
}

// ─── SIMULADOR ─────────────────────────────────────────────────────────────────
function renderSimulador() {
  var box = document.getElementById('simulador-box');
  if (!box) return;
  var opts = selData.map(s => `<option value="${s.name}">${s.flag} ${s.name}</option>`).join('');
  var acciones = puede('simular') ? `
    <div class="sim-actions" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      <button class="btn-sm primary sim-btn" onclick="simularPartido()"><i class="ti ti-player-play"></i> Simular partido</button>
      <button class="btn-sm sim-btn" onclick="restablecerTablas()"><i class="ti ti-rotate-2"></i> Restablecer tablas</button>
    </div>
    <div class="sim-hint" style="text-align:center;font-size:11.5px;color:var(--color-text-secondary);margin-top:8px">Cada simulación suma un partido a las tablas de puntos y clasificación. Recarga la página o pulsa «Restablecer» para volver a los resultados oficiales.</div>
  ` : `
    <div class="sim-hint" style="display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;padding:9px 12px;border-radius:8px;background:rgba(239,68,68,0.10);color:#ef4444;font-size:12.5px">
      <i class="ti ti-lock"></i> Modo solo lectura: tu rol de Visitante no puede simular partidos ni modificar las tablas.
    </div>`;
  box.innerHTML = `
  <div class="sim-panel">
    <div class="sim-teams">
      <div class="sim-side">
        <label class="form-label">Selección local</label>
        <select class="form-input" id="sim-home">${opts}</select>
      </div>
      <div class="sim-vs">VS</div>
      <div class="sim-side">
        <label class="form-label">Selección visitante</label>
        <select class="form-input" id="sim-away">${opts}</select>
      </div>
    </div>
    ${acciones}
    <div id="sim-result"></div>
  </div>`;
  var away = document.getElementById('sim-away');
  if (away.options.length > 1) away.selectedIndex = 1;
}

var apellidosGenericos = ['Silva','García','Traoré','Kim','Ahmed','Johnson','Müller','Rossi','Novak','Okafor','Hansen','Yılmaz','Santos','Pérez','Nakamura','Diallo','Petrov','Haddad','Andersson','Costa'];

// Elige un goleador de la plantilla (sesgado hacia los delanteros, que van primero en la lista)
function elegirGoleador(team) {
  var lista = plantillas[team];
  if (lista && lista.length) {
    var idx = Math.floor(Math.pow(Math.random(), 1.6) * lista.length);
    return lista[idx];
  }
  return apellidosGenericos[Math.floor(Math.random() * apellidosGenericos.length)];
}

// Genera los eventos de gol (minuto + goleador) para un equipo
function generarGoles(team, n) {
  var eventos = [];
  var usados = {};
  for (var i = 0; i < n; i++) {
    var min;
    do { min = Math.floor(Math.random() * 90) + 1; } while (usados[min]);
    usados[min] = true;
    eventos.push({ team: team, min: min, autor: elegirGoleador(team), penal: Math.random() < 0.12 });
  }
  return eventos;
}

// ─── APLICAR EL RESULTADO SIMULADO A LAS TABLAS ─────────────────────────────────
// Guarda una copia de las tablas oficiales para poder restablecerlas en la sesión.
var _snapshotTablas = null;
function guardarSnapshotTablas() {
  if (_snapshotTablas) return;
  _snapshotTablas = {
    statsByTeam: JSON.parse(JSON.stringify(statsByTeam)),
    gruposData: JSON.parse(JSON.stringify(gruposData)),
    tablaGeneral: JSON.parse(JSON.stringify(tablaGeneral))
  };
}

// Criterio de desempate: puntos, luego diferencia de goles, luego goles a favor.
function ordenarEquipos(a, b) {
  return b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.name.localeCompare(b.name);
}

// Suma un marcador a un objeto de estadísticas { pj, g, e, p, gf, gc, dif, pts }.
function acumularStats(s, favor, contra) {
  s.pj += 1;
  s.gf += favor;
  s.gc += contra;
  s.dif = s.gf - s.gc;
  if (favor > contra) { s.g += 1; s.pts += 3; }
  else if (favor === contra) { s.e += 1; s.pts += 1; }
  else { s.p += 1; }
}

// Suma un marcador a la fila del equipo en la tabla general de los 48.
// Columnas: [grupo, equipo, rank, PJ, PG, PE, PP, GF, GC, DG, PTS, fase]
function acumularTablaGeneral(team, favor, contra) {
  var row = tablaGeneral.find(r => r[1] === team);
  if (!row) return;
  row[3] += 1;              // PJ
  row[7] += favor;         // GF
  row[8] += contra;        // GC
  row[9] = row[7] - row[8]; // DG
  if (favor > contra) { row[4] += 1; row[10] += 3; }
  else if (favor === contra) { row[5] += 1; row[10] += 1; }
  else { row[6] += 1; }
}

// Reordena la tabla general manteniendo el bloque por grupo (A..L).
function reordenarTablaGeneral() {
  tablaGeneral.sort((a, b) =>
    a[0].localeCompare(b[0]) || b[10] - a[10] || b[9] - a[9] || b[7] - a[7]
  );
}

// Reconstruye selData (usado en la vista Selecciones) desde las tablas de grupo.
function rebuildSelData() {
  selData = gruposData.flatMap(gr => gr.teams.map((team, index) => ({
    ...team, group: 'Grupo ' + gr.name, rank: index + 1
  })));
}

// Aplica el resultado de un partido simulado a todas las tablas y las repinta.
// Devuelve el grupo afectado (si ambos equipos son del mismo grupo) o null.
function aplicarResultado(homeN, awayN, hg, ag) {
  guardarSnapshotTablas();
  var mismoGrupo = groupByTeam[homeN] && groupByTeam[homeN] === groupByTeam[awayN];

  // 1) Tabla general de los 48 (siempre se actualiza)
  acumularTablaGeneral(homeN, hg, ag);
  acumularTablaGeneral(awayN, ag, hg);
  reordenarTablaGeneral();

  // 2) Tabla del grupo y estadísticas por equipo (solo si comparten grupo)
  if (mismoGrupo) {
    var gr = gruposData.find(g => g.name === groupByTeam[homeN]);
    if (gr) {
      var th = gr.teams.find(t => t.name === homeN);
      var ta = gr.teams.find(t => t.name === awayN);
      if (th) acumularStats(th, hg, ag);
      if (ta) acumularStats(ta, ag, hg);
      gr.teams.sort(ordenarEquipos);
      gr.teams.forEach((t, i) => { t.q = i < 2; }); // los 2 primeros clasifican
    }
    acumularStats(statsByTeam[homeN], hg, ag);
    acumularStats(statsByTeam[awayN], ag, hg);
    rebuildSelData();
    renderSelecciones();
  }

  // 3) Repintar las secciones con tablas
  renderDraw();
  renderGrupos();
  return mismoGrupo ? groupByTeam[homeN] : null;
}

// Restablece las tablas al estado oficial: revierte los cambios locales de la sesión
// y borra los partidos simulados de la base de datos (revirtiendo la clasificación).
// Revierte las tablas locales a los resultados oficiales (sin tocar la base de datos).
// La usan tanto el botón «Restablecer» como el reset recibido en vivo de un compañero.
function revertirTablasLocal() {
  if (!_snapshotTablas) return false;
  var snap = _snapshotTablas;
  Object.keys(statsByTeam).forEach(k => delete statsByTeam[k]);
  Object.entries(snap.statsByTeam).forEach(([k, v]) => { statsByTeam[k] = Object.assign({}, v); });
  gruposData.length = 0;
  snap.gruposData.forEach(g => gruposData.push(JSON.parse(JSON.stringify(g))));
  tablaGeneral.length = 0;
  snap.tablaGeneral.forEach(r => tablaGeneral.push(r.slice()));
  _snapshotTablas = null;
  rebuildSelData();
  renderDraw(); renderGrupos(); renderSelecciones();
  return true;
}

async function restablecerTablas() {
  if (!puede('simular')) { showToast('Tu rol no permite modificar las tablas', 'error'); return; }

  var huboLocal = revertirTablasLocal();

  // Revertir también en la base de datos (y avisar en vivo a los demás con origin).
  var resp = await apiPost('/partidos/simular/reset', { origin: CLIENT_ID });
  if (resp && resp.ok) {
    var n = resp.data ? (resp.data.eliminados || 0) : 0;
    showToast('Restablecido: ' + n + ' simulación(es) borradas de la base de datos' + (huboLocal ? ' y tablas locales' : ''), 'success');
  } else if (huboLocal) {
    showToast('Tablas locales restablecidas (base de datos no disponible)', 'info');
  } else {
    showToast('Las tablas ya están en su estado oficial', 'info');
  }
}

function simularPartido() {
  if (!puede('simular')) { showToast('Tu rol no permite simular partidos', 'error'); return; }
  var homeN = document.getElementById('sim-home').value;
  var awayN = document.getElementById('sim-away').value;
  if (homeN === awayN) { showToast('Elige dos selecciones distintas', 'error'); return; }

  // Probabilidad ponderada por los puntos acumulados en la fase de grupos
  var hs = statsByTeam[homeN] || { pts: 0 };
  var as = statsByTeam[awayN] || { pts: 0 };
  var homeAdv = 0.35; // ventaja de localía
  function goals(mine, rival) {
    var strength = (mine.pts + 3) / (mine.pts + rival.pts + 6);
    var base = strength * 3.2 + Math.random() * 1.8;
    return Math.max(0, Math.round(base - 0.9));
  }
  var hg = goals(hs, as) + (Math.random() < homeAdv ? 1 : 0);
  var ag = goals(as, hs);

  // Goleadores y minutos
  var eventos = generarGoles(homeN, hg).concat(generarGoles(awayN, ag))
    .sort((a, b) => a.min - b.min);

  var timeline = eventos.length
    ? eventos.map(e => `
        <div class="goal-event ${e.team === homeN ? 'goal-home' : 'goal-away'}">
          <span class="goal-min">${e.min}'</span>
          <span class="goal-icon">⚽</span>
          <span class="goal-author">${e.autor}${e.penal ? ' <span class="goal-pen">(pen)</span>' : ''}</span>
          <span class="goal-team">${flagByTeam[e.team]} ${e.team}</span>
        </div>`).join('')
    : '<div class="goal-none">Sin goles — empate a cero</div>';

  var res = document.getElementById('sim-result');
  var ganador = hg > ag ? homeN : ag > hg ? awayN : null;

  // Aplicar el resultado a las tablas (puntos, clasificación general y grupo)
  var grupoAfectado = aplicarResultado(homeN, awayN, hg, ag);
  var alcance = grupoAfectado
    ? `Grupo ${grupoAfectado} y clasificación general`
    : 'clasificación general';
  showToast(`Resultado aplicado a la ${alcance}`, 'success');

  res.innerHTML = `
    <div class="sim-scoreboard">
      <div class="sim-team-res"><div class="sim-flag">${flagByTeam[homeN]}</div><div>${homeN}</div></div>
      <div class="sim-score">${hg} — ${ag}</div>
      <div class="sim-team-res"><div class="sim-flag">${flagByTeam[awayN]}</div><div>${awayN}</div></div>
    </div>
    <div class="sim-verdict">${ganador ? '🏆 Gana ' + ganador : '🤝 Empate'}</div>
    <div class="sim-applied" style="display:flex;align-items:center;gap:8px;justify-content:center;margin:10px 0;padding:8px 12px;background:var(--color-background-success,rgba(34,197,94,0.12));color:var(--color-text-success,#22c55e);border-radius:8px;font-size:12.5px">
      <i class="ti ti-circle-check"></i>
      <span>Resultado sumado a la ${alcance}.</span>
      <a onclick="nav('clasificacion', document.querySelector('.nav-item[onclick*=clasificacion]'))" style="cursor:pointer;text-decoration:underline;font-weight:600">Ver tabla</a>
    </div>
    <div id="sim-db-status" style="display:flex;align-items:center;gap:8px;justify-content:center;margin:-2px 0 10px;font-size:12px;color:var(--color-text-secondary)">
      <i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Guardando en la base de datos…
    </div>
    <div class="goal-timeline">
      <div class="goal-timeline-title"><i class="ti ti-ball-football"></i> Goleadores</div>
      ${timeline}
    </div>
    <div class="share-btns" style="justify-content:center;margin-top:10px">
      <button class="share-btn share-wa" onclick="sharePartido('whatsapp','${homeN}','${awayN}','${hg} — ${ag}')"><i class="ti ti-brand-whatsapp"></i> Compartir resultado</button>
    </div>`;

  // Persistir el resultado en PostgreSQL (partido + clasificación)
  persistirSimulacion(homeN, awayN, hg, ag);
}

// Guarda el partido simulado en la base de datos y refleja el estado en la interfaz.
async function persistirSimulacion(homeN, awayN, hg, ag) {
  var resp = await apiPost('/partidos/simular', {
    local: homeN, visitante: awayN, golesLocal: hg, golesVisitante: ag,
    origin: CLIENT_ID   // identifica esta pestaña para no aplicar el cambio dos veces
  });
  var el = document.getElementById('sim-db-status');
  if (!el) return;
  if (resp && resp.ok) {
    var detalle = resp.data && resp.data.actualizoClasificacion
      ? 'partido + clasificación del grupo actualizados'
      : 'partido registrado';
    el.innerHTML = '<i class="ti ti-database"></i> Guardado en la base de datos (' + detalle + ').';
    el.style.color = 'var(--color-text-success,#22c55e)';
  } else {
    var msg = (resp && resp.error) || '';
    var noConexion = !msg || /failed to fetch|networkerror|load failed/i.test(msg);
    el.innerHTML = '<i class="ti ti-database-off"></i> ' + (noConexion
      ? 'No se pudo guardar en la base de datos (cambio solo local). Inicia el backend.'
      : ('No se guardó en la base de datos: ' + msg));
    el.style.color = '#ef4444';
  }
}

// ─── FASE FINAL (ELIMINATORIAS REALES DEL TORNEO) ───────────────────────────────
var bracketRound = 'd16';
function bracketTab(round, el) {
  bracketRound = round;
  document.querySelectorAll('#bracket-tabs .admin-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderBracketRound();
}

// Tarjeta de partido eliminatorio ya jugado
function koPlayedCard(m, n, costo) {
  var local = m[0], gl = m[1], gv = m[2], visit = m[3], ganador = m[4], fecha = m[5], sede = m[6], nota = m[7];
  var lWin = ganador === local, vWin = ganador === visit;
  return `
    <div class="d16-card">
      <div class="d16-head">Partido ${n}</div>
      <div class="ko-row ${lWin ? 'ko-win' : ''}">
        <span class="d16-flag">${flagByTeam[local] || '🏳️'}</span>
        <span class="ko-name">${local}</span><span class="ko-goals">${gl}</span>
      </div>
      <div class="ko-row ${vWin ? 'ko-win' : ''}">
        <span class="d16-flag">${flagByTeam[visit] || '🏳️'}</span>
        <span class="ko-name">${visit}</span><span class="ko-goals">${gv}</span>
      </div>
      <div class="d16-meta">
        <div><i class="ti ti-calendar"></i> ${fecha} · <i class="ti ti-map-pin"></i> ${sede}</div>
        ${nota ? `<div class="ko-nota"><i class="ti ti-info-circle"></i> ${nota}</div>` : ''}
        <div><i class="ti ti-ticket"></i> ${costo}</div>
      </div>
    </div>`;
}
// Tarjeta de partido eliminatorio por jugarse (cuartos)
function koFixtureCard(m, n) {
  var local = m[0], visit = m[1], fecha = m[2], sede = m[3], hora = m[4];
  return `
    <div class="d16-card">
      <div class="d16-head">Cuartos · Partido ${n}</div>
      <div class="d16-teams">
        <div class="d16-team"><span class="d16-flag">${flagByTeam[local] || '🏳️'}</span><span class="d16-name">${local}</span></div>
        <div class="d16-vs">VS</div>
        <div class="d16-team"><span class="d16-flag">${flagByTeam[visit] || '🏳️'}</span><span class="d16-name">${visit}</span></div>
      </div>
      <div class="d16-meta">
        <div><i class="ti ti-calendar"></i> ${fecha} · ${hora}</div>
        <div><i class="ti ti-map-pin"></i> ${sede}</div>
        <div><i class="ti ti-ticket"></i> Desde $4,500 MXN</div>
      </div>
    </div>`;
}

function renderBracketRound() {
  var box = document.getElementById('bracket-body');
  if (!box) return;
  if (bracketRound === 'd16') {
    box.innerHTML = `
      <div class="d16-info"><i class="ti ti-bolt"></i> <b>Ronda de 32</b> · 32 equipos clasificados, 16 partidos (28 jun – 3 jul).</div>
      <div class="d16-grid">${dieciseisavos.map((m, i) => koPlayedCard(m, 73 + i, 'Desde $2,000 MXN')).join('')}</div>`;
  } else if (bracketRound === 'octavos') {
    box.innerHTML = `
      <div class="d16-info"><i class="ti ti-bolt"></i> <b>Octavos de Final</b> · 16 equipos, 8 partidos (4 – 7 jul).</div>
      <div class="d16-grid">${octavos.map((m, i) => koPlayedCard(m, 89 + i, 'Desde $3,000 MXN')).join('')}</div>`;
  } else if (bracketRound === 'cuartos') {
    box.innerHTML = `
      <div class="d16-info"><i class="ti ti-clock"></i> <b>Cuartos de Final</b> · cruces definidos, por jugarse (9 – 11 jul).</div>
      <div class="d16-grid">${cuartos.map((m, i) => koFixtureCard(m, 97 + i)).join('')}</div>
      <div class="section-title" style="margin:1.5rem 0 0.75rem">Resto del calendario</div>
      <div class="resto-list">
        ${restoCalendario.map(r => `
          <div class="resto-item">
            <div class="resto-fase">${r[0]}</div>
            <div class="resto-teams">${r[1]}</div>
            <div class="resto-meta"><i class="ti ti-calendar"></i> ${r[2]} · <i class="ti ti-map-pin"></i> ${r[3]}</div>
          </div>`).join('')}
      </div>`;
  }
}

function renderBracket() {
  var box = document.getElementById('bracket');
  if (!box) return;
  box.innerHTML = `
    <div class="admin-tabs" id="bracket-tabs">
      <div class="admin-tab active" onclick="bracketTab('d16', this)">Dieciseisavos</div>
      <div class="admin-tab" onclick="bracketTab('octavos', this)">Octavos</div>
      <div class="admin-tab" onclick="bracketTab('cuartos', this)">Cuartos y +</div>
    </div>
    <div id="bracket-body"></div>`;
  bracketRound = 'd16';
  renderBracketRound();
}

// ─── GEOLOCALIZACIÓN ────────────────────────────────────────────────────────────
function renderGeo() {
  var box = document.getElementById('geo-box');
  if (!box) return;
  box.innerHTML = `
    <div class="geo-intro">
      Selecciona un estadio y usa tu ubicación GPS para calcular la ruta en tiempo real (OpenStreetMap + OSRM).
    </div>
    <div class="geo-list">
      ${estadiosData.map((e, i) => `
        <div class="geo-card" onclick="showMap(${i})">
          <div class="geo-icon">📍</div>
          <div class="geo-info">
            <div class="geo-name">${e.name}</div>
            <div class="geo-city">${e.city} ${e.country}</div>
          </div>
          <i class="ti ti-route geo-arrow"></i>
        </div>`).join('')}
    </div>`;
}

// ─── BOLETOS ────────────────────────────────────────────────────────────────────
function renderBoletos() {
  var box = document.getElementById('boletos-list');
  if (!box) return;
  var rows = [];
  estadiosData.forEach(e => e.matches.forEach(m => rows.push({ stadium: e.name, city: e.city, country: e.country, ...m })));
  box.innerHTML = `
    <div class="boletos-grid">
      ${rows.map((r, i) => `
        <div class="boleto-card">
          <div class="boleto-stub">
            <div class="boleto-teams">${r.teams}</div>
            <div class="boleto-meta"><i class="ti ti-calendar" style="font-size:12px"></i> ${r.date} · ${r.time}</div>
            <div class="boleto-meta"><i class="ti ti-map-pin" style="font-size:12px"></i> ${r.stadium}, ${r.city} ${r.country}</div>
          </div>
          <div class="boleto-price">
            <div class="boleto-price-val">${r.price}</div>
            <button class="btn-sm primary" onclick="comprarBoleto('${r.teams.replace(/'/g,'')}')"><i class="ti ti-ticket"></i> Comprar</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function comprarBoleto(match) {
  showToast('🎟️ Boleto reservado: ' + match, 'success');
}

// ─── ACERCA DEL PROYECTO ────────────────────────────────────────────────────────
function renderAcerca() {
  var box = document.getElementById('acerca-box');
  if (!box) return;
  var modulos = [
    ['ti-home', 'Inicio', 'Panel general con métricas del torneo'],
    ['ti-world', 'Confederaciones', '6 regiones FIFA y sus selecciones'],
    ['ti-flag-2', 'Selecciones', '48 planteles con estadísticas'],
    ['ti-grid-dots', 'Grupos', 'Tablas finales de los 12 grupos'],
    ['ti-calendar-event', 'Calendario', 'Los 72 partidos de la fase de grupos'],
    ['ti-list-numbers', 'Clasificación', 'Tabla general de los 48 equipos'],
    ['ti-device-gamepad-2', 'Simulador', 'Simulación con goleadores y minutos'],
    ['ti-tournament', 'Fase Final', 'Dieciseisavos, octavos y cuartos'],
    ['ti-building-stadium', 'Estadios', '16 sedes del torneo'],
    ['ti-map-pin', 'Geolocalización', 'Rutas GPS con Leaflet + OSRM'],
    ['ti-ticket', 'Boletos', 'Compra de entradas'],
    ['ti-settings', 'Administrador', 'CRUD conectado a PostgreSQL'],
    ['ti-info-circle', 'Acerca del Proyecto', 'Documentación de la arquitectura']
  ];
  box.innerHTML = `
    <div class="about-hero">
      <div class="about-trophy">🏆</div>
      <div>
        <div class="about-title">Sistema Mundial 2026</div>
        <div class="about-sub">Gestión oficial del torneo · México · Estados Unidos · Canadá</div>
      </div>
    </div>
    <div class="about-text">
      Aplicación web full-stack para administrar el Mundial 2026. El proyecto está dividido en
      <b>13 módulos</b> que cubren desde la información de selecciones y confederaciones hasta la
      compra de boletos, geolocalización de estadios y un panel administrativo con persistencia en
      base de datos. Frontend en HTML/CSS/JavaScript, backend en Node.js + Express y base de datos PostgreSQL.
    </div>
    <div class="about-stack">
      <span class="stack-chip">HTML5</span>
      <span class="stack-chip">CSS3</span>
      <span class="stack-chip">JavaScript</span>
      <span class="stack-chip">Node.js</span>
      <span class="stack-chip">Express</span>
      <span class="stack-chip">PostgreSQL</span>
      <span class="stack-chip">Leaflet</span>
      <span class="stack-chip">OSRM</span>
    </div>
    <div class="about-modules-title">Arquitectura completa — ${modulos.length} módulos</div>
    <div class="about-modules">
      ${modulos.map((m, i) => `
        <div class="about-module">
          <div class="about-module-num">${i + 1}</div>
          <i class="ti ${m[0]}"></i>
          <div>
            <div class="about-module-name">${m[1]}</div>
            <div class="about-module-desc">${m[2]}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function filterPartidos(f, el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderPartidos(f);
}

// ─── RENDER SELECCIONES ────────────────────────────────────────────────────────
function renderSelecciones() {
  var g = document.getElementById('sel-grid');
  g.innerHTML = selData.map(s => `
  <div class="sel-card">
    <div class="sel-card-header">
      <div class="sel-flag-big">${s.flag}</div>
      <div class="sel-info">
        <div class="sel-country">${s.name}</div>
        <div class="sel-group">${s.group} · Posición ${s.rank}</div>
      </div>
    </div>
    <div class="sel-body">
      <div class="sel-stats">
        <div class="sel-stat"><div class="sel-stat-val" style="color:#C9A84C">${s.pts}</div><div class="sel-stat-lbl">Puntos</div></div>
        <div class="sel-stat"><div class="sel-stat-val" style="color:#22c55e">${s.gf}</div><div class="sel-stat-lbl">GF</div></div>
        <div class="sel-stat"><div class="sel-stat-val" style="color:${s.dif >= 0 ? '#22c55e' : '#ef4444'}">${s.dif > 0 ? '+' : ''}${s.dif}</div><div class="sel-stat-lbl">DG</div></div>
      </div>
      <div class="sel-players">
        <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Rendimiento</div>
        <div class="player-row"><span style="flex:1">Partidos jugados</span><span class="player-pos">${s.pj}</span></div>
        <div class="player-row"><span style="flex:1">Victorias · Empates · Derrotas</span><span class="player-pos">${s.g} · ${s.e} · ${s.p}</span></div>
        <div class="player-row"><span style="flex:1">Goles en contra</span><span class="player-pos">${s.gc}</span></div>
      </div>
    </div>
  </div>`).join('');
}

// ─── RENDER ESTADIOS ───────────────────────────────────────────────────────────
function renderEstadios() {
  var g = document.getElementById('estadios-grid');
  g.innerHTML = estadiosData.map((e, i) => `
  <div class="estadio-card">
    <div class="estadio-visual">${e.emoji}</div>
    <div class="estadio-body">
      <div class="estadio-name">${e.name}</div>
      <div class="estadio-city"><i class="ti ti-map-pin" aria-hidden="true"></i>${e.city} ${e.country}</div>
      <div class="estadio-detail-block">
        <div class="estadio-detail-title">Ubicación</div>
        <div class="estadio-detail-value">${e.address || e.city + ' · ' + e.country}</div>
      </div>
      <div class="estadio-detail-block">
        <div class="estadio-detail-title">Información del estadio</div>
        <div class="estadio-detail-value">${e.description || 'Sede del Mundial 2026 con partidos destacados y excelente infraestructura.'}</div>
      </div>
      <div class="estadio-meta">
        <div class="meta-item"><div class="meta-lbl">Capacidad</div><div class="meta-val">${e.cap}</div></div>
        <div class="meta-item"><div class="meta-lbl">Césped</div><div class="meta-val">${e.turf}</div></div>
        <div class="meta-item"><div class="meta-lbl">Construido</div><div class="meta-val">${e.built}</div></div>
      </div>
      <div class="estadio-schedule">
        <div class="estadio-detail-title" style="margin-bottom:4px">Partidos programados</div>
        ${e.matches.map(match => `
          <div class="estadio-schedule-item">
            <div class="schedule-teams">${match.teams}</div>
            <div class="schedule-meta">${match.date} · ${match.time}</div>
            <div class="schedule-price">${match.price}</div>
          </div>`).join('')}
      </div>
      <button class="btn-route" onclick="showMap(${i})"><i class="ti ti-route" aria-hidden="true"></i> Ver ruta al estadio</button>
    </div>
  </div>`).join('');
}

// ─── MAPA REAL CON LEAFLET + GEOLOCALIZACIÓN + OSRM ─────────────────────────────
function showMap(idx) {
  mapEstadio = estadiosData[idx];
  
  var container = document.getElementById('map-overlay-container');
  container.style.display = 'block';
  document.body.style.overflow = 'hidden';

  document.getElementById('map-modal-title').textContent = '📍 Ruta: ' + mapEstadio.name;
  document.getElementById('map-city-label').textContent = mapEstadio.name;

  document.getElementById('route-steps').innerHTML = `
    <li class="route-step" id="step-gps">
      <div class="route-icon" style="animation:pulse 1.2s infinite"><i class="ti ti-current-location" style="font-size:14px"></i></div>
      <div><div style="font-weight:500">Cargando mapa del estadio...</div>
      <div style="color:var(--color-text-secondary);font-size:12px">Solicitando permiso de ubicación GPS</div></div>
    </li>`;

  // Limpiar mapa anterior si existe
  if (leafletMap) {
    try { leafletMap.remove(); } catch(e) {}
    leafletMap = null;
    routeLayer = null;
  }

  // Esperar a que el modal sea visible antes de inicializar Leaflet
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      initializeMapAndLocation(mapEstadio);
    });
  });
}

function initializeMapAndLocation(estadio) {
  // Verificar que Leaflet esté disponible
  if (typeof L === 'undefined') {
    showMapError('Leaflet no está disponible. Verifica tu conexión a internet.');
    return;
  }

  // Verificar que el elemento del mapa existe
  var mapElement = document.getElementById('leaflet-map');
  if (!mapElement) {
    showMapError('Elemento del mapa no encontrado en el DOM');
    return;
  }

  try {
    // Crear nuevo mapa centrado en el estadio
    leafletMap = L.map('leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    });

    // Centrar en las coordenadas del estadio
    var coords = estadio.coords || [20, -100];
    leafletMap.setView(coords, 14);

    // Agregar capa de mapa base (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(leafletMap);

    // Agregar marcador del estadio
    var estadioMarker = L.marker(coords, {
      icon: L.divIcon({
        html: '<div style="font-size:36px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">&#127967;</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        className: ''
      })
    }).addTo(leafletMap);
    estadioMarker.bindPopup('<b>' + estadio.name + '</b><br>' + estadio.city + ', ' + (estadio.country || '')).openPopup();

    // Forzar que Leaflet recalcule el tamaño (necesario cuando el modal acaba de mostrarse)
    setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(true); }, 100);
    setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(true); }, 400);
    setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(true); }, 800);

  } catch(err) {
    console.error('Error inicializando Leaflet:', err);
    showMapError('Error al cargar el mapa: ' + err.message);
    return;
  }

  // Solicitar la geolocalización del usuario
  if (!navigator.geolocation) {
    document.getElementById('route-steps').innerHTML = `
      <li class="route-step">
        <div class="route-icon"><i class="ti ti-map-pin" style="font-size:14px;color:#ef4444"></i></div>
        <div><div style="font-weight:500">${estadio.name}</div>
        <div style="color:var(--color-text-secondary);font-size:12px">${estadio.city} — Tu navegador no soporta geolocalización</div></div>
      </li>`;
    return;
  }

  // Mostrar mensaje de espera mientras se solicita el permiso
  document.getElementById('route-steps').innerHTML = `
    <li class="route-step" id="step-gps">
      <div class="route-icon" style="animation:pulse 1.2s infinite"><i class="ti ti-current-location" style="font-size:14px;color:#3b82f6"></i></div>
      <div><div style="font-weight:500">Solicitando tu ubicación GPS...</div>
      <div style="color:var(--color-text-secondary);font-size:12px">Acepta el permiso en el navegador para generar la ruta</div></div>
    </li>`;

  navigator.geolocation.getCurrentPosition(
    function(position) {
      console.log('✅ Ubicación GPS obtenida:', position.coords.latitude, position.coords.longitude);
      drawRoute(
        position.coords.latitude,
        position.coords.longitude,
        estadio.coords[0],
        estadio.coords[1],
        estadio
      );
    },
    function(error) {
      var msgs = {
        1: 'Permiso de ubicación denegado por el usuario.',
        2: 'No se pudo determinar tu ubicación GPS.',
        3: 'Tiempo de espera agotado al obtener ubicación.'
      };
      console.warn('Geolocalización error:', error.code, error.message);
      // El mapa del estadio sigue visible aunque falle la ubicación
      document.getElementById('route-steps').innerHTML = `
        <li class="route-step">
          <div class="route-icon"><i class="ti ti-alert-circle" style="font-size:14px;color:#f59e0b"></i></div>
          <div><div style="font-weight:500;color:#92400e">${msgs[error.code] || 'Error de ubicación'}</div>
          <div style="color:var(--color-text-secondary);font-size:12px">Se muestra el estadio en el mapa</div></div>
        </li>
        <li class="route-step">
          <div class="route-icon"><i class="ti ti-map-pin" style="font-size:14px;color:#ef4444"></i></div>
          <div><div style="font-weight:500">${estadio.name}</div>
          <div style="color:var(--color-text-secondary);font-size:12px">${estadio.city}, ${estadio.country || ''}</div></div>
        </li>`;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function stadiumIcon() {
  return L.divIcon({
    html: '<div style="font-size:28px;line-height:1">🏟️</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    className: ''
  });
}

function userIcon() {
  return L.divIcon({
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.4)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: ''
  });
}

function initLeafletMap(estadio) {
  // Esta función ya no se usa - todo está en showMap()
}

function drawRoute(userLat, userLng, destLat, destLng, estadio) {
  if (!leafletMap) return;

  // Agregar marker del usuario
  L.marker([userLat, userLng], { icon: userIcon() })
    .addTo(leafletMap)
    .bindPopup('<b>Tu ubicación</b>');

  // Ajustar vista para mostrar ambos puntos
  var bounds = L.latLngBounds([[userLat, userLng], [destLat, destLng]]);
  leafletMap.fitBounds(bounds, { padding: [40, 40] });

  // Llamar a OSRM (enrutador OpenStreetMap gratuito) para calcular la ruta
  var osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;

  fetch(osrmUrl)
    .then(r => r.json())
    .then(data => {
      if (data.code !== 'Ok' || !data.routes.length) {
        showRouteAsLine(userLat, userLng, destLat, destLng, estadio);
        return;
      }
      var route = data.routes[0];
      var distKm = (route.distance / 1000).toFixed(1);
      var durMin = Math.round(route.duration / 60);
      var hours  = Math.floor(durMin / 60);
      var mins   = durMin % 60;
      var durStr = hours > 0 ? hours + 'h ' + mins + 'min' : mins + 'min';

      // Dibujar la polilínea de la ruta
      var coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      if (routeLayer) leafletMap.removeLayer(routeLayer);
      routeLayer = L.polyline(coords, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1
      }).addTo(leafletMap);

      leafletMap.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

      // Actualizar los pasos de la ruta
      var llegada = new Date(Date.now() + route.duration * 1000);
      var h = llegada.getHours().toString().padStart(2, '0');
      var m = llegada.getMinutes().toString().padStart(2, '0');

      document.getElementById('route-steps').innerHTML = `
        <li class="route-step">
          <div class="route-icon"><i class="ti ti-current-location" style="font-size:14px"></i></div>
          <div><div style="font-weight:500">Tu ubicación actual</div>
          <div style="color:var(--color-text-secondary);font-size:12px">Coordenadas: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}</div></div>
        </li>
        <li class="route-step">
          <div class="route-icon"><i class="ti ti-car" style="font-size:14px"></i></div>
          <div><div style="font-weight:500">Ruta en carretera hacia ${estadio.city}</div>
          <div style="color:var(--color-text-secondary);font-size:12px">⏱ ${durStr} · 📏 ${distKm} km</div></div>
        </li>
        <li class="route-step">
          <div class="route-icon"><i class="ti ti-map-pin" style="font-size:14px;color:#ef4444"></i></div>
          <div><div style="font-weight:500">${estadio.name}</div>
          <div style="color:var(--color-text-secondary);font-size:12px">${estadio.city} — Llegada estimada: ${h}:${m}</div></div>
        </li>`;
    })
    .catch(() => {
      showRouteAsLine(userLat, userLng, destLat, destLng, estadio);
    });
}

function showRouteAsLine(userLat, userLng, destLat, destLng, estadio) {
  // Fallback: línea recta con distancia calculada
  L.marker([userLat, userLng], { icon: userIcon() }).addTo(leafletMap);
  if (routeLayer) leafletMap.removeLayer(routeLayer);
  routeLayer = L.polyline([[userLat, userLng], [destLat, destLng]], {
    color: '#f59e0b', weight: 4, dashArray: '8,4', opacity: 0.8
  }).addTo(leafletMap);

  var R = 6371;
  var dLat = (destLat - userLat) * Math.PI / 180;
  var dLon = (destLng - userLng) * Math.PI / 180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(userLat*Math.PI/180)*Math.cos(destLat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  var distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);

  document.getElementById('route-steps').innerHTML = `
    <li class="route-step">
      <div class="route-icon"><i class="ti ti-current-location" style="font-size:14px"></i></div>
      <div><div style="font-weight:500">Tu ubicación actual</div>
      <div style="color:var(--color-text-secondary);font-size:12px">${userLat.toFixed(4)}, ${userLng.toFixed(4)}</div></div>
    </li>
    <li class="route-step">
      <div class="route-icon"><i class="ti ti-route" style="font-size:14px;color:#f59e0b"></i></div>
      <div><div style="font-weight:500">Distancia directa</div>
      <div style="color:var(--color-text-secondary);font-size:12px">📏 ${distKm} km en línea recta</div></div>
    </li>
    <li class="route-step">
      <div class="route-icon"><i class="ti ti-map-pin" style="font-size:14px;color:#ef4444"></i></div>
      <div><div style="font-weight:500">${estadio.name}</div>
      <div style="color:var(--color-text-secondary);font-size:12px">${estadio.city} ${estadio.country}</div></div>
    </li>`;
}

function showMapError(msg) {
  document.getElementById('route-steps').innerHTML = `
    <li class="route-step">
      <div class="route-icon"><i class="ti ti-alert-circle" style="font-size:14px;color:#ef4444"></i></div>
      <div><div style="font-weight:500;color:#ef4444">Error de ubicación</div>
      <div style="color:var(--color-text-secondary);font-size:12px">${msg}</div></div>
    </li>`;
}

function closeMap() {
  document.getElementById('map-overlay-container').style.display = 'none';
  document.body.style.overflow = '';
  if (routeLayer) {
    leafletMap && leafletMap.removeLayer(routeLayer);
    routeLayer = null;
  }
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
}

// ─── COMPARTIR ─────────────────────────────────────────────────────────────────
function sharePartido(net, h, a, s) {
  var msg = encodeURIComponent('⚽ ' + h + ' ' + s + ' ' + a + ' | #Mundial2026 #FIFA2026');
  if (net === 'whatsapp') window.open('https://wa.me/?text=' + msg, '_blank');
  else if (net === 'facebook') window.open('https://www.facebook.com/sharer/sharer.php?u=https://mundial2026.mx&quote=' + msg, '_blank');
}

function shareRoute(net) {
  if (!mapEstadio) return;
  var msg = encodeURIComponent('📍 Me dirijo al ' + mapEstadio.name + ' en ' + mapEstadio.city + ' para el #Mundial2026!');
  if (net === 'whatsapp') window.open('https://wa.me/?text=' + msg, '_blank');
  else if (net === 'facebook') window.open('https://www.facebook.com/sharer/sharer.php?u=https://maps.google.com&quote=' + msg, '_blank');
}

// ─── PANEL ADMINISTRATIVO ──────────────────────────────────────────────────────
function renderAdmin() {
  var verPanel = puede('panel');
  document.getElementById('admin-no-access').style.display = verPanel ? 'none' : 'block';
  document.getElementById('admin-panel').style.display = verPanel ? 'block' : 'none';
  // La gestión de usuarios es exclusiva del administrador.
  var tabUsuarios = document.getElementById('admin-tab-usuarios');
  if (tabUsuarios) tabUsuarios.style.display = puede('usuarios') ? '' : 'none';
  if (!verPanel) return;
  // Si el rol no puede gestionar usuarios pero estaba en esa pestaña, vuelve a Selecciones.
  if (currentAdminTab === 'usuarios' && !puede('usuarios')) currentAdminTab = 'selecciones';
  loadAdminTab(currentAdminTab);
}

function adminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentAdminTab = tab;
  loadAdminTab(tab);
}

// ─── ADMIN: TABS CON API REAL ──────────────────────────────────────────────────
function loadAdminTab(tab) {
  var c = document.getElementById('admin-content');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--color-text-secondary)"><i class="ti ti-loader-2" style="font-size:24px;animation:spin 1s linear infinite"></i><br>Cargando desde base de datos...</div>';
  if (tab === 'selecciones')  loadAdminSelecciones();
  else if (tab === 'estadios') loadAdminEstadios();
  else if (tab === 'partidos') loadAdminPartidos();
  else if (tab === 'grupos')   loadAdminGrupos();
  else if (tab === 'usuarios') {
    if (!puede('usuarios')) { showToast('Solo el administrador gestiona usuarios', 'error'); currentAdminTab = 'selecciones'; loadAdminSelecciones(); return; }
    loadAdminUsuarios();
  }
}

// ── SELECCIONES ────────────────────────────────────────────────────────────────
async function loadAdminSelecciones() {
  var c = document.getElementById('admin-content');
  var dbData = await apiGet('/selecciones');

  // Si la DB no está disponible, usar datos locales
  var displayData = dbData && dbData.length ? dbData.map(d => ({
    id: d.id, flag: d.bandera, name: d.pais, group: d.grupo
  })) : selData.map((s, i) => ({ id: i+1, flag: s.flag, name: s.name, group: s.group }));

  var dbStatus = dbData ? '✅ Datos desde PostgreSQL' : '⚠️ DB no disponible — datos locales';

  c.innerHTML = `
    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;padding:4px 8px;background:var(--color-background-secondary);border-radius:4px;display:inline-block">${dbStatus}</div>
    <table class="crud-table"><thead><tr><th>Bandera</th><th>Selección</th><th>Grupo</th><th>Acciones</th></tr></thead>
    <tbody id="sel-admin-body">
      ${displayData.map(s => `<tr id="sel-row-${s.id}">
        <td>${s.flag}</td><td>${s.name}</td><td>${s.group}</td>
        <td class="action-btns">
          <button class="btn-sm" onclick="editSeleccion(${s.id},'${s.flag}','${s.name}','${s.group}')"><i class="ti ti-edit"></i></button>
          <button class="btn-sm danger" onclick="deleteSeleccion(${s.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table>
    <div class="crud-form">
      <div class="crud-form-title">Nueva selección</div>
      <div class="form-row">
        <div><label class="form-label">País</label><input class="form-input" id="sel-pais" placeholder="Ej. Bolivia"></div>
        <div><label class="form-label">Bandera (emoji)</label><input class="form-input" id="sel-bandera" placeholder="🇧🇴" maxlength="4"></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">Grupo</label>
          <select class="form-input" id="sel-grupo">
            ${['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => `<option value="Grupo ${g}">Grupo ${g}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Entrenador</label><input class="form-input" id="sel-entrenador" placeholder="Nombre del DT"></div>
      </div>
      <div class="form-actions">
        <button class="btn-sm primary" onclick="saveSeleccion()"><i class="ti ti-database-plus"></i> Guardar en DB</button>
        <button class="btn-sm" onclick="loadAdminTab('selecciones')">Cancelar</button>
      </div>
    </div>`;
}

async function saveSeleccion() {
  var pais = document.getElementById('sel-pais').value.trim();
  var bandera = document.getElementById('sel-bandera').value.trim();
  var grupo = document.getElementById('sel-grupo').value;
  var entrenador = document.getElementById('sel-entrenador').value.trim();

  if (!pais) { showToast('El nombre del país es requerido', 'error'); return; }

  var result = await apiPost('/selecciones', { pais, bandera: bandera || '🏳️', grupo, entrenador });
  if (result.ok) {
    showToast('✅ Selección "' + pais + '" guardada en PostgreSQL');
    loadAdminTab('selecciones');
  } else {
    // Fallback: guardar localmente en selData
    var nuevoId = selData.length + 1;
    selData.push({ flag: bandera || '🏳️', name: pais, group: grupo, rank: nuevoId, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0 });
    showToast('⚠️ DB no disponible. Guardado localmente', 'info');
    loadAdminTab('selecciones');
  }
}

async function deleteSeleccion(id) {
  if (!confirm('¿Eliminar esta selección?')) return;
  var result = await apiDelete('/selecciones/' + id);
  if (result.ok) {
    showToast('Selección eliminada');
  } else {
    showToast('⚠️ No se pudo eliminar de DB', 'error');
  }
  loadAdminTab('selecciones');
}

function editSeleccion(id, flag, name, group) {
  document.getElementById('sel-pais').value = name;
  document.getElementById('sel-bandera').value = flag;
  document.getElementById('sel-grupo').value = group;
  // Cambiar botón a "Actualizar"
  var btn = document.querySelector('#admin-content .form-actions .btn-sm.primary');
  if (btn) {
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Actualizar en DB';
    btn.onclick = async function() {
      var pais = document.getElementById('sel-pais').value.trim();
      var bandera = document.getElementById('sel-bandera').value.trim();
      var grupo = document.getElementById('sel-grupo').value;
      var entrenador = document.getElementById('sel-entrenador').value.trim();
      var result = await apiPut('/selecciones/' + id, { pais, bandera, grupo, entrenador });
      if (result.ok) showToast('✅ Selección actualizada');
      else showToast('⚠️ Error al actualizar', 'error');
      loadAdminTab('selecciones');
    };
  }
}

// ── ESTADIOS ───────────────────────────────────────────────────────────────────
async function loadAdminEstadios() {
  var c = document.getElementById('admin-content');
  var dbData = await apiGet('/estadios');
  var displayData = dbData && dbData.length ? dbData.map(d => ({
    id: d.id, name: d.nombre, city: d.ciudad, country: d.pais, cap: d.capacidad
  })) : estadiosData.map((e, i) => ({ id: i+1, name: e.name, city: e.city, country: e.country, cap: e.cap }));

  var dbStatus = dbData ? '✅ Datos desde PostgreSQL' : '⚠️ DB no disponible — datos locales';

  c.innerHTML = `
    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;padding:4px 8px;background:var(--color-background-secondary);border-radius:4px;display:inline-block">${dbStatus}</div>
    <table class="crud-table"><thead><tr><th>Estadio</th><th>Ciudad</th><th>País</th><th>Capacidad</th><th>Acciones</th></tr></thead>
    <tbody>
      ${displayData.map(e => `<tr>
        <td>${e.name}</td><td>${e.city}</td><td>${e.country}</td><td>${e.cap}</td>
        <td class="action-btns">
          <button class="btn-sm" onclick="editEstadio(${e.id},'${e.name}','${e.city}','${e.country}',${e.cap})"><i class="ti ti-edit"></i></button>
          <button class="btn-sm danger" onclick="deleteEstadio(${e.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table>
    <div class="crud-form">
      <div class="crud-form-title">Nuevo estadio</div>
      <div class="form-row">
        <div><label class="form-label">Nombre</label><input class="form-input" id="est-nombre" placeholder="Estadio Olímpico Universitario"></div>
        <div><label class="form-label">Ciudad</label><input class="form-input" id="est-ciudad" placeholder="Ciudad de México"></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">País</label>
          <select class="form-input" id="est-pais">
            <option value="🇲🇽 México">🇲🇽 México</option>
            <option value="🇺🇸 Estados Unidos">🇺🇸 Estados Unidos</option>
            <option value="🇨🇦 Canadá">🇨🇦 Canadá</option>
          </select>
        </div>
        <div><label class="form-label">Capacidad</label><input class="form-input" type="number" id="est-cap" placeholder="75000"></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">Latitud</label><input class="form-input" type="number" step="any" id="est-lat" placeholder="19.3029"></div>
        <div><label class="form-label">Longitud</label><input class="form-input" type="number" step="any" id="est-lng" placeholder="-99.1506"></div>
      </div>
      <div class="form-actions">
        <button class="btn-sm primary" onclick="saveEstadio()"><i class="ti ti-database-plus"></i> Guardar en DB</button>
        <button class="btn-sm" onclick="loadAdminTab('estadios')">Cancelar</button>
      </div>
    </div>`;
}

async function saveEstadio() {
  var nombre = document.getElementById('est-nombre').value.trim();
  var ciudad = document.getElementById('est-ciudad').value.trim();
  var pais   = document.getElementById('est-pais').value;
  var cap    = parseInt(document.getElementById('est-cap').value) || 0;
  var lat    = parseFloat(document.getElementById('est-lat').value) || 0;
  var lng    = parseFloat(document.getElementById('est-lng').value) || 0;

  if (!nombre) { showToast('El nombre del estadio es requerido', 'error'); return; }

  var result = await apiPost('/estadios', { nombre, ciudad, pais, capacidad: cap, lat, lng });
  if (result.ok) {
    showToast('✅ Estadio "' + nombre + '" guardado en PostgreSQL');
    estadiosData.push({ emoji: '🏟️', name: nombre, city: ciudad, country: pais.split(' ')[0], cap: cap.toLocaleString(), turf: 'Natural', built: new Date().getFullYear(), coords: [lat, lng] });
    renderEstadios();
    loadAdminTab('estadios');
  } else {
    estadiosData.push({ emoji: '🏟️', name: nombre, city: ciudad, country: pais.split(' ')[0], cap: cap.toLocaleString(), turf: 'Natural', built: new Date().getFullYear(), coords: [lat, lng] });
    showToast('⚠️ DB no disponible. Guardado localmente', 'info');
    renderEstadios();
    loadAdminTab('estadios');
  }
}

async function deleteEstadio(id) {
  if (!confirm('¿Eliminar este estadio?')) return;
  var result = await apiDelete('/estadios/' + id);
  if (result.ok) showToast('Estadio eliminado');
  else showToast('⚠️ No se pudo eliminar de DB', 'error');
  loadAdminTab('estadios');
}

function editEstadio(id, nombre, ciudad, pais, cap) {
  document.getElementById('est-nombre').value = nombre;
  document.getElementById('est-ciudad').value = ciudad;
  document.getElementById('est-cap').value = cap;
}

// ── PARTIDOS ───────────────────────────────────────────────────────────────────
async function loadAdminPartidos() {
  var c = document.getElementById('admin-content');
  var dbData = await apiGet('/partidos');
  var displayData = dbData && dbData.length ? dbData.map(d => ({
    id: d.id, home: d.local, away: d.visitante, score: (d.goles_local !== null ? d.goles_local + '—' + d.goles_visitante : 'vs'), date: d.fecha, stadium: d.estadio
  })) : partidosData.slice(0, 10).map((p, i) => ({ id: i+1, home: p.homeN, away: p.awayN, score: p.score, date: p.date, stadium: p.stadium }));

  var dbStatus = dbData ? '✅ Datos desde PostgreSQL' : '⚠️ DB no disponible — datos locales';

  c.innerHTML = `
    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;padding:4px 8px;background:var(--color-background-secondary);border-radius:4px;display:inline-block">${dbStatus}</div>
    <table class="crud-table"><thead><tr><th>Local</th><th>Marcador</th><th>Visitante</th><th>Fecha</th><th>Estadio</th><th>Acciones</th></tr></thead>
    <tbody>
      ${displayData.map(p => `<tr>
        <td>${p.home}</td><td>${p.score}</td><td>${p.away}</td>
        <td style="font-size:11px">${String(p.date).substring(0, 10)}</td>
        <td style="font-size:11px">${p.stadium}</td>
        <td class="action-btns">
          <button class="btn-sm" onclick="alert('Edición en próxima versión')"><i class="ti ti-edit"></i></button>
          <button class="btn-sm danger" onclick="deletePartido(${p.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table>
    <div class="crud-form">
      <div class="crud-form-title">Registrar nuevo partido</div>
      <div class="form-row">
        <div><label class="form-label">Selección Local</label><select class="form-input" id="part-local">${selData.map(s => `<option>${s.flag} ${s.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Selección Visitante</label><select class="form-input" id="part-visit">${selData.map(s => `<option>${s.flag} ${s.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">Estadio</label><select class="form-input" id="part-estadio">${estadiosData.map(e => `<option>${e.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Fecha y hora</label><input class="form-input" type="datetime-local" id="part-fecha"></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">Grupo</label>
          <select class="form-input" id="part-grupo">
            ${['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => `<option value="Grupo ${g}">Grupo ${g}</option>`).join('')}
            <option value="Octavos">Octavos</option><option value="Cuartos">Cuartos</option>
            <option value="Semifinal">Semifinal</option><option value="Final">Final</option>
          </select>
        </div>
        <div><label class="form-label">Estado</label>
          <select class="form-input" id="part-estado">
            <option value="próximo">Próximo</option>
            <option value="en vivo">En Vivo</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-sm primary" onclick="savePartido()"><i class="ti ti-database-plus"></i> Guardar en DB</button>
        <button class="btn-sm" onclick="loadAdminTab('partidos')">Cancelar</button>
      </div>
    </div>`;
}

async function savePartido() {
  var local    = document.getElementById('part-local').value;
  var visitante= document.getElementById('part-visit').value;
  var estadio  = document.getElementById('part-estadio').value;
  var fecha    = document.getElementById('part-fecha').value;
  var grupo    = document.getElementById('part-grupo').value;
  var estado   = document.getElementById('part-estado').value;

  if (!fecha) { showToast('La fecha es requerida', 'error'); return; }

  var result = await apiPost('/partidos', { local, visitante, estadio, fecha, grupo, estado });
  if (result.ok) {
    showToast('✅ Partido guardado en PostgreSQL');
  } else {
    showToast('⚠️ DB no disponible. No se pudo guardar', 'error');
  }
  loadAdminTab('partidos');
}

async function deletePartido(id) {
  if (!confirm('¿Eliminar este partido?')) return;
  var result = await apiDelete('/partidos/' + id);
  if (result.ok) showToast('Partido eliminado');
  else showToast('⚠️ Error al eliminar', 'error');
  loadAdminTab('partidos');
}

// ── GRUPOS ─────────────────────────────────────────────────────────────────────
async function loadAdminGrupos() {
  var c = document.getElementById('admin-content');
  var dbStatus = '⚠️ Datos locales (grupos calculados dinámicamente)';

  c.innerHTML = `
    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;padding:4px 8px;background:var(--color-background-secondary);border-radius:4px;display:inline-block">${dbStatus}</div>
    <table class="crud-table"><thead><tr><th>Grupo</th><th>Selección</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th><th>Clasif.</th></tr></thead>
    <tbody>
      ${gruposData.flatMap(gr => gr.teams.map(t => `<tr>
        <td style="font-weight:600">Grupo ${gr.name}</td><td>${t.flag} ${t.name}</td>
        <td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td>
        <td>${t.gf}</td><td>${t.gc}</td>
        <td style="font-weight:600">${t.pts}</td>
        <td>${t.q ? '<span style="font-size:11px;color:var(--color-text-success);background:var(--color-background-success);padding:2px 6px;border-radius:4px">✓ Sí</span>' : '—'}</td>
      </tr>`)).join('')}
    </tbody></table>`;
}

// ── USUARIOS ───────────────────────────────────────────────────────────────────
async function loadAdminUsuarios() {
  var c = document.getElementById('admin-content');
  var dbData = await apiGet('/usuarios');
  var displayData = dbData && dbData.length ? dbData : [
    { id: 1, nombre: 'Admin', email: 'admin@mundial2026.mx', rol: 'admin', ultimo_acceso: 'Hoy 09:45' },
    { id: 2, nombre: 'Editor', email: 'editor@mundial2026.mx', rol: 'editor', ultimo_acceso: 'Hoy 08:12' },
    { id: 3, nombre: 'Visitante', email: 'viewer@mundial2026.mx', rol: 'viewer', ultimo_acceso: 'Ayer 15:30' }
  ];
  var dbStatus = dbData ? '✅ Datos desde PostgreSQL' : '⚠️ DB no disponible — datos locales';

  c.innerHTML = `
    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;padding:4px 8px;background:var(--color-background-secondary);border-radius:4px;display:inline-block">${dbStatus}</div>
    <table class="crud-table"><thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Último acceso</th><th>Acciones</th></tr></thead>
    <tbody>
      ${displayData.map(u => `<tr>
        <td>${u.nombre}</td><td>${u.email}</td>
        <td><span style="font-size:11px;padding:2px 8px;background:var(--color-background-${u.rol==='admin'?'danger':u.rol==='editor'?'warning':'secondary'});color:var(--color-text-${u.rol==='admin'?'danger':u.rol==='editor'?'warning':'secondary'});border-radius:4px">${u.rol}</span></td>
        <td>${u.ultimo_acceso || '—'}</td>
        <td class="action-btns">
          <button class="btn-sm"><i class="ti ti-edit"></i></button>
          ${u.rol !== 'admin' ? `<button class="btn-sm danger" onclick="deleteUsuario(${u.id})"><i class="ti ti-trash"></i></button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody></table>
    <div class="crud-form">
      <div class="crud-form-title">Nuevo usuario</div>
      <div class="form-row">
        <div><label class="form-label">Nombre</label><input class="form-input" id="usr-nombre" placeholder="Nombre completo"></div>
        <div><label class="form-label">Email</label><input class="form-input" type="email" id="usr-email" placeholder="correo@ejemplo.com"></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">Rol</label>
          <select class="form-input" id="usr-rol">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div><label class="form-label">Contraseña inicial</label><input class="form-input" type="password" id="usr-pass" placeholder="••••••••"></div>
      </div>
      <div class="form-actions">
        <button class="btn-sm primary" onclick="saveUsuario()"><i class="ti ti-user-plus"></i> Crear usuario</button>
        <button class="btn-sm" onclick="loadAdminTab('usuarios')">Cancelar</button>
      </div>
    </div>`;
}

async function saveUsuario() {
  var nombre = document.getElementById('usr-nombre').value.trim();
  var email  = document.getElementById('usr-email').value.trim();
  var rol    = document.getElementById('usr-rol').value;

  if (!nombre || !email) { showToast('Nombre y email son requeridos', 'error'); return; }

  var result = await apiPost('/usuarios', { nombre, email, rol });
  if (result.ok) {
    showToast('✅ Usuario "' + nombre + '" creado en PostgreSQL');
    loadAdminTab('usuarios');
  } else {
    showToast('⚠️ DB no disponible. No se pudo crear', 'error');
  }
}

async function deleteUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  var result = await apiDelete('/usuarios/' + id);
  if (result.ok) showToast('Usuario eliminado');
  else showToast('⚠️ Error al eliminar', 'error');
  loadAdminTab('usuarios');
}

// ─── DB STATUS CHECK ───────────────────────────────────────────────────────────
async function checkDbStatus() {
  var result = await apiGet('/ping');
  if (result && result.message) {
    showToast('✅ ' + result.message, 'success');
  } else {
    showToast('❌ Servidor no disponible. Ejecuta: node server.js', 'error');
  }
}

