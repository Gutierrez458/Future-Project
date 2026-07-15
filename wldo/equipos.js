var mundialGrupos = {
  A: [['🇲🇽', 'México'], ['🇰🇷', 'Corea del Sur'], ['🇿🇦', 'Sudáfrica'], ['🇨🇿', 'Chequia']],
  B: [['🇨🇦', 'Canadá'], ['🇨🇭', 'Suiza'], ['🇧🇦', 'Bosnia y Herzegovina'], ['🇶🇦', 'Catar']],
  C: [['🇧🇷', 'Brasil'], ['🇲🇦', 'Marruecos'], ['🇭🇹', 'Haití'], ['🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Escocia']],
  D: [['🇺🇸', 'Estados Unidos'], ['🇵🇾', 'Paraguay'], ['🇦🇺', 'Australia'], ['🇹🇷', 'Turquía']],
  E: [['🇩🇪', 'Alemania'], ['🇨🇼', 'Curazao'], ['🇨🇮', 'Costa de Marfil'], ['🇪🇨', 'Ecuador']],
  F: [['🇳🇱', 'Países Bajos'], ['🇯🇵', 'Japón'], ['🇸🇪', 'Suecia'], ['🇹🇳', 'Túnez']],
  G: [['🇧🇪', 'Bélgica'], ['🇪🇬', 'Egipto'], ['🇮🇷', 'Irán'], ['🇳🇿', 'Nueva Zelanda']],
  H: [['🇪🇸', 'España'], ['🇨🇻', 'Cabo Verde'], ['🇸🇦', 'Arabia Saudita'], ['🇺🇾', 'Uruguay']],
  I: [['🇫🇷', 'Francia'], ['🇸🇳', 'Senegal'], ['🇮🇶', 'Irak'], ['🇳🇴', 'Noruega']],
  J: [['🇦🇷', 'Argentina'], ['🇩🇿', 'Argelia'], ['🇦🇹', 'Austria'], ['🇯🇴', 'Jordania']],
  K: [['🇵🇹', 'Portugal'], ['🇨🇩', 'RD Congo'], ['🇺🇿', 'Uzbekistán'], ['🇨🇴', 'Colombia']],
  L: [['🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Inglaterra'], ['🇭🇷', 'Croacia'], ['🇬🇭', 'Ghana'], ['🇵🇦', 'Panamá']]
};

var estadiosData = [
  {emoji: '🏟️', name: 'Estadio Azteca', city: 'Ciudad de México', country: '🇲🇽', address: 'Calzada de Tlalpan 3465, Coyoacán', cap: '87,523', turf: 'Natural', built: 1966, coords: [19.3029, -99.1506], description: 'Sede histórica del torneo con gran tradición y capacidad para miles de aficionados.', matches: [{date: '12 jun', time: '20:00', teams: 'México vs Sudáfrica', price: 'Desde $1,200 MXN'}, {date: '24 jun', time: '20:00', teams: 'México vs Chequia', price: 'Desde $1,600 MXN'}]},
  {emoji: '🏟️', name: 'Estadio BBVA', city: 'Monterrey, NL', country: '🇲🇽', address: 'Av. Fidel Velázquez 1301, Monterrey', cap: '53,500', turf: 'Natural', built: 2015, coords: [25.6694, -100.2437], description: 'Una de las sedes modernas de la región noreste con excelente conectividad.', matches: [{date: '14 jun', time: '20:00', teams: 'Colombia vs RD Congo', price: 'Desde $900 MXN'}, {date: '27 jun', time: '20:00', teams: 'Portugal vs Uzbekistán', price: 'Desde $1,100 MXN'}]},
  {emoji: '🏟️', name: 'Estadio Akron', city: 'Zapopan, Jalisco', country: '🇲🇽', address: 'Av. Chivas 1, Guadalajara', cap: '46,232', turf: 'Natural', built: 2010, coords: [20.6818, -103.4628], description: 'Sede moderna del futbol mexicano con ambiente vibrante en Jalisco.', matches: [{date: '16 jun', time: '20:00', teams: 'Brasil vs Marruecos', price: 'Desde $850 MXN'}, {date: '22 jun', time: '20:00', teams: 'Argentina vs Austria', price: 'Desde $1,050 MXN'}]},
  {emoji: '🏟️', name: 'AT&T Stadium', city: 'Arlington, Texas', country: '🇺🇸', address: 'One AT&T Way, Arlington, TX', cap: '80,000', turf: 'Artificial', built: 2009, coords: [32.7480, -97.0944], description: 'Estadio de gran capacidad y tecnología avanzada para recibir partidos de alto perfil.', matches: [{date: '19 jun', time: '20:00', teams: 'Estados Unidos vs Australia', price: 'Desde $180 USD'}, {date: '25 jun', time: '20:00', teams: 'Turquía vs Estados Unidos', price: 'Desde $220 USD'}]},
  {emoji: '🏟️', name: 'SoFi Stadium', city: 'Los Ángeles, CA', country: '🇺🇸', address: '1001 Stadium Dr, Inglewood, CA', cap: '70,240', turf: 'Artificial', built: 2020, coords: [33.9535, -118.3392], description: 'Una de las sedes más modernas y reconocibles del torneo.', matches: [{date: '15 jun', time: '20:00', teams: 'Países Bajos vs Japón', price: 'Desde $190 USD'}, {date: '21 jun', time: '20:00', teams: 'Bélgica vs Irán', price: 'Desde $210 USD'}]},
  {emoji: '🏟️', name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: '🇺🇸', address: '1 MetLife Stadium Dr, East Rutherford, NJ', cap: '82,500', turf: 'Artificial', built: 2010, coords: [40.8135, -74.0745], description: 'Gran estadio de la costa este con excelente acceso y alta capacidad.', matches: [{date: '18 jun', time: '20:00', teams: 'Alemania vs Costa de Marfil', price: 'Desde $170 USD'}, {date: '26 jun', time: '20:00', teams: 'Francia vs Irak', price: 'Desde $200 USD'}]},
  {emoji: '🏟️', name: 'Mercedes-Benz Stadium', city: 'Atlanta, GA', country: '🇺🇸', address: '1 AMB Drive Northwest, Atlanta, GA', cap: '71,000', turf: 'Artificial', built: 2017, coords: [33.7554, -84.4008], description: 'Sede moderna con diseño contemporáneo y ambiente internacional.', matches: [{date: '17 jun', time: '20:00', teams: 'Inglaterra vs Croacia', price: 'Desde $175 USD'}, {date: '23 jun', time: '20:00', teams: 'Panamá vs Croacia', price: 'Desde $155 USD'}]},
  {emoji: '🏟️', name: 'Gillette Stadium', city: 'Foxborough, MA', country: '🇺🇸', address: '1 Patriot Pl, Foxborough, MA', cap: '65,878', turf: 'Artificial', built: 2002, coords: [42.0909, -71.2643], description: 'Recibe partidos con una fuerte afición y muy buena logística.', matches: [{date: '20 jun', time: '20:00', teams: 'Japón vs Suecia', price: 'Desde $160 USD'}, {date: '24 jun', time: '20:00', teams: 'Canadá vs Catar', price: 'Desde $170 USD'}]},
  {emoji: '🏟️', name: 'NRG Stadium', city: 'Houston, TX', country: '🇺🇸', address: 'NRG Pkwy, Houston, TX', cap: '72,220', turf: 'Artificial', built: 2002, coords: [29.6847, -95.4107], description: 'Sede de gran tradición en el sur de Estados Unidos.', matches: [{date: '18 jun', time: '20:00', teams: 'Canadá vs Catar', price: 'Desde $165 USD'}, {date: '22 jun', time: '20:00', teams: 'Noruega vs Senegal', price: 'Desde $180 USD'}]},
  {emoji: '🏟️', name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City, MO', country: '🇺🇸', address: '1 Arrowhead Dr, Kansas City, MO', cap: '76,416', turf: 'Natural', built: 1972, coords: [39.0490, -94.4839], description: 'Estadio clásico con gran energía y tradición en la zona media del país.', matches: [{date: '16 jun', time: '20:00', teams: 'Alemania vs Curazao', price: 'Desde $150 USD'}, {date: '25 jun', time: '20:00', teams: 'Ecuador vs Alemania', price: 'Desde $185 USD'}]},
  {emoji: '🏟️', name: 'Hard Rock Stadium', city: 'Miami Gardens, FL', country: '🇺🇸', address: '347 Don Shula Dr, Miami Gardens, FL', cap: '64,767', turf: 'Natural', built: 1987, coords: [25.9580, -80.2389], description: 'Sede con ambiente tropical y excelente infraestructura.', matches: [{date: '17 jun', time: '20:00', teams: 'Uruguay vs Cabo Verde', price: 'Desde $160 USD'}, {date: '23 jun', time: '20:00', teams: 'Colombia vs Portugal', price: 'Desde $190 USD'}]},
  {emoji: '🏟️', name: 'Lincoln Financial Field', city: 'Philadelphia, PA', country: '🇺🇸', address: '1020 Pattison Ave, Philadelphia, PA', cap: '69,879', turf: 'Natural', built: 2003, coords: [39.9008, -75.1675], description: 'Estadio histórico con gran capacidad y cercanía al centro urbano.', matches: [{date: '19 jun', time: '20:00', teams: 'Escocia vs Marruecos', price: 'Desde $145 USD'}, {date: '27 jun', time: '20:00', teams: 'Argelia vs Austria', price: 'Desde $165 USD'}]},
  {emoji: '🏟️', name: 'Levi\'s Stadium', city: 'Santa Clara, CA', country: '🇺🇸', address: '4900 Marie P. DeBartolo Way, Santa Clara, CA', cap: '68,500', turf: 'Natural', built: 2014, coords: [37.4030, -121.9700], description: 'Sede tecnológica en la bahía de San Francisco con excelente acceso.', matches: [{date: '15 jun', time: '20:00', teams: 'España vs Arabia Saudita', price: 'Desde $175 USD'}, {date: '21 jun', time: '20:00', teams: 'Uruguay vs España', price: 'Desde $195 USD'}]},
  {emoji: '🏟️', name: 'Lumen Field', city: 'Seattle, WA', country: '🇺🇸', address: '800 Occidental Ave S, Seattle, WA', cap: '68,740', turf: 'Artificial', built: 2002, coords: [47.5952, -122.3316], description: 'Estadio con clima único y gran ambiente para los partidos de la fase de grupos.', matches: [{date: '20 jun', time: '20:00', teams: 'Ecuador vs Curazao', price: 'Desde $155 USD'}, {date: '26 jun', time: '20:00', teams: 'Nueva Zelanda vs Bélgica', price: 'Desde $170 USD'}]},
  {emoji: '🏟️', name: 'BC Place', city: 'Vancouver, BC', country: '🇨🇦', address: '777 Pacific Blvd, Vancouver, BC', cap: '54,500', turf: 'Artificial', built: 1983, coords: [49.2768, -123.1116], description: 'Sede canadiense con una de las vistas más impresionantes del torneo.', matches: [{date: '13 jun', time: '20:00', teams: 'Canadá vs Suiza', price: 'Desde $120 CAD'}, {date: '24 jun', time: '20:00', teams: 'Bélgica vs Irán', price: 'Desde $140 CAD'}]},
  {emoji: '🏟️', name: 'BMO Field', city: 'Toronto, ON', country: '🇨🇦', address: '170 Princes\' Boulevard, Toronto, ON', cap: '45,500', turf: 'Natural', built: 2007, coords: [43.6332, -79.4186], description: 'Estadio moderno con gran afluencia y cercanía a la zona metropolitana.', matches: [{date: '14 jun', time: '20:00', teams: 'Inglaterra vs Ghana', price: 'Desde $110 CAD'}, {date: '27 jun', time: '20:00', teams: 'Croacia vs Ghana', price: 'Desde $125 CAD'}]}
];

// ─── TABLAS FINALES DE GRUPOS (resultados oficiales del torneo) ──────────────────
// Orden = posición final. Columnas: [equipo, PJ, PG, PE, PP, GF, GC, DG, PTS]
var standings = {
  A: [['México',3,3,0,0,6,0,6,9],['Sudáfrica',3,1,1,1,2,3,-1,4],['Corea del Sur',3,1,0,2,2,3,-1,3],['Chequia',3,0,1,2,2,6,-4,1]],
  B: [['Suiza',3,2,1,0,7,3,4,7],['Canadá',3,1,1,1,8,3,5,4],['Bosnia y Herzegovina',3,1,1,1,5,6,-1,4],['Catar',3,0,1,2,2,10,-8,1]],
  C: [['Brasil',3,2,1,0,7,1,6,7],['Marruecos',3,2,1,0,6,3,3,7],['Escocia',3,1,0,2,1,4,-3,3],['Haití',3,0,0,3,2,8,-6,0]],
  D: [['Estados Unidos',3,2,0,1,8,4,4,6],['Australia',3,1,1,1,2,2,0,4],['Paraguay',3,1,1,1,2,4,-2,4],['Turquía',3,1,0,2,3,5,-2,3]],
  E: [['Alemania',3,2,0,1,10,4,6,6],['Costa de Marfil',3,2,0,1,4,2,2,6],['Ecuador',3,1,1,1,2,2,0,4],['Curazao',3,0,1,2,1,9,-8,1]],
  F: [['Países Bajos',3,2,1,0,10,4,6,7],['Japón',3,1,2,0,7,3,4,5],['Suecia',3,1,1,1,7,7,0,4],['Túnez',3,0,0,3,2,12,-10,0]],
  G: [['Bélgica',3,1,2,0,6,2,4,5],['Egipto',3,1,2,0,5,3,2,5],['Irán',3,0,3,0,3,3,0,3],['Nueva Zelanda',3,0,1,2,4,10,-6,1]],
  H: [['España',3,2,1,0,5,0,5,7],['Cabo Verde',3,0,3,0,2,2,0,3],['Uruguay',3,0,2,1,3,4,-1,2],['Arabia Saudita',3,0,2,1,1,5,-4,2]],
  I: [['Francia',3,3,0,0,10,2,8,9],['Noruega',3,2,0,1,8,7,1,6],['Senegal',3,1,0,2,8,6,2,3],['Irak',3,0,0,3,1,12,-11,0]],
  J: [['Argentina',3,3,0,0,8,1,7,9],['Austria',3,1,1,1,6,6,0,4],['Argelia',3,1,1,1,5,7,-2,4],['Jordania',3,0,0,3,3,8,-5,0]],
  K: [['Colombia',3,2,1,0,4,1,3,7],['Portugal',3,1,2,0,6,1,5,5],['RD Congo',3,1,1,1,4,3,1,4],['Uzbekistán',3,0,0,3,2,11,-9,0]],
  L: [['Inglaterra',3,2,1,0,6,2,4,7],['Croacia',3,2,0,1,5,5,0,6],['Ghana',3,1,1,1,2,2,0,4],['Panamá',3,0,0,3,0,4,-4,0]]
};

// ─── LOS 72 PARTIDOS DE LA FASE DE GRUPOS ───────────────────────────────────────
// [grupo, local, golesLocal, golesVisitante, visitante]
var partidosGrupos = [
  // Jornada 1
  ['A','México',2,0,'Sudáfrica'],['A','Corea del Sur',2,1,'Chequia'],['B','Canadá',1,1,'Bosnia y Herzegovina'],['D','Estados Unidos',4,1,'Paraguay'],
  ['B','Catar',1,1,'Suiza'],['C','Brasil',1,1,'Marruecos'],['C','Haití',0,1,'Escocia'],['D','Australia',2,0,'Turquía'],
  ['E','Alemania',7,1,'Curazao'],['F','Países Bajos',2,2,'Japón'],['E','Costa de Marfil',1,0,'Ecuador'],['F','Suecia',5,1,'Túnez'],
  ['H','España',0,0,'Cabo Verde'],['G','Bélgica',1,1,'Egipto'],['H','Arabia Saudita',1,1,'Uruguay'],['G','Irán',2,2,'Nueva Zelanda'],
  ['I','Francia',3,1,'Senegal'],['I','Irak',1,4,'Noruega'],['J','Argentina',3,0,'Argelia'],['J','Austria',3,1,'Jordania'],
  ['K','Portugal',1,1,'RD Congo'],['L','Inglaterra',4,2,'Croacia'],['L','Ghana',1,0,'Panamá'],['K','Uzbekistán',1,3,'Colombia'],
  // Jornada 2
  ['A','Chequia',1,1,'Sudáfrica'],['B','Suiza',4,1,'Bosnia y Herzegovina'],['B','Canadá',6,0,'Catar'],['A','México',1,0,'Corea del Sur'],
  ['D','Estados Unidos',2,0,'Australia'],['C','Escocia',0,1,'Marruecos'],['C','Brasil',3,0,'Haití'],['D','Turquía',0,1,'Paraguay'],
  ['F','Países Bajos',5,1,'Suecia'],['E','Alemania',2,1,'Costa de Marfil'],['E','Ecuador',0,0,'Curazao'],['F','Túnez',0,4,'Japón'],
  ['H','España',4,0,'Arabia Saudita'],['G','Bélgica',0,2,'Irán'],['H','Uruguay',2,2,'Cabo Verde'],['G','Nueva Zelanda',1,3,'Egipto'],
  ['J','Argentina',2,0,'Austria'],['I','Francia',3,0,'Irak'],['I','Noruega',3,2,'Senegal'],['J','Jordania',1,2,'Argelia'],
  ['K','Portugal',5,0,'Uzbekistán'],['L','Inglaterra',0,0,'Ghana'],['L','Panamá',0,1,'Croacia'],['K','Colombia',1,0,'RD Congo'],
  // Jornada 3
  ['B','Suiza',2,1,'Canadá'],['B','Bosnia y Herzegovina',3,1,'Catar'],['C','Escocia',0,3,'Brasil'],['C','Marruecos',4,2,'Haití'],
  ['A','Chequia',0,3,'México'],['A','Sudáfrica',1,0,'Corea del Sur'],['E','Curazao',0,2,'Costa de Marfil'],['E','Ecuador',2,1,'Alemania'],
  ['F','Japón',1,1,'Suecia'],['F','Túnez',1,3,'Países Bajos'],['D','Turquía',3,2,'Estados Unidos'],['D','Paraguay',0,0,'Australia'],
  ['I','Noruega',1,4,'Francia'],['I','Senegal',5,0,'Irak'],['H','Cabo Verde',0,0,'Arabia Saudita'],['H','Uruguay',0,1,'España'],
  ['G','Egipto',1,1,'Irán'],['G','Nueva Zelanda',1,5,'Bélgica'],['L','Panamá',0,2,'Inglaterra'],['L','Croacia',2,1,'Ghana'],
  ['K','Colombia',0,0,'Portugal'],['K','RD Congo',3,1,'Uzbekistán'],['J','Argelia',3,3,'Austria'],['J','Jordania',1,3,'Argentina']
];

// ─── FASE ELIMINATORIA (el sistema la genera a partir de la fase de grupos) ──────
// [local, golesLocal, golesVisitante, visitante, ganador, fecha, sede, nota]
var dieciseisavos = [
  ['Canadá',1,0,'Sudáfrica','Canadá','28 jun','Los Ángeles',''],
  ['Alemania',1,1,'Paraguay','Paraguay','29 jun','Boston','Paraguay avanza 4-3 en penales'],
  ['Países Bajos',1,1,'Marruecos','Marruecos','29 jun','Monterrey','Marruecos avanza 3-2 en penales'],
  ['Brasil',2,1,'Japón','Brasil','29 jun','Houston',''],
  ['Francia',3,0,'Suecia','Francia','30 jun','Nueva York/Nueva Jersey',''],
  ['Costa de Marfil',1,2,'Noruega','Noruega','30 jun','Dallas',''],
  ['México',2,0,'Ecuador','México','30 jun','Ciudad de México',''],
  ['Inglaterra',2,1,'RD Congo','Inglaterra','1 jul','Atlanta',''],
  ['Estados Unidos',2,0,'Bosnia y Herzegovina','Estados Unidos','1 jul','San Francisco',''],
  ['Bélgica',3,2,'Senegal','Bélgica','1 jul','Seattle','Tiempo extra'],
  ['Portugal',2,1,'Croacia','Portugal','2 jul','Toronto',''],
  ['España',3,0,'Austria','España','2 jul','Los Ángeles',''],
  ['Suiza',2,0,'Argelia','Suiza','2 jul','Vancouver',''],
  ['Argentina',3,2,'Cabo Verde','Argentina','3 jul','Miami','Tiempo extra'],
  ['Colombia',1,0,'Ghana','Colombia','3 jul','Kansas City',''],
  ['Australia',1,1,'Egipto','Egipto','3 jul','Dallas','Egipto avanza 4-2 en penales']
];
var octavos = [
  ['Paraguay',0,1,'Francia','Francia','4 jul','Filadelfia',''],
  ['Canadá',0,3,'Marruecos','Marruecos','4 jul','Houston',''],
  ['Brasil',1,2,'Noruega','Noruega','5 jul','Nueva York/Nueva Jersey',''],
  ['México',2,3,'Inglaterra','Inglaterra','5 jul','Ciudad de México',''],
  ['Portugal',0,1,'España','España','6 jul','Dallas',''],
  ['Estados Unidos',1,4,'Bélgica','Bélgica','6 jul','Seattle',''],
  ['Argentina',3,2,'Egipto','Argentina','7 jul','Atlanta',''],
  ['Suiza',0,0,'Colombia','Suiza','7 jul','Vancouver','Suiza avanza 4-3 en penales']
];
// Cuartos y siguientes: aún no se juegan (cruces ya definidos). [local, visitante, fecha, sede, hora]
var cuartos = [
  ['Francia','Marruecos','9 jul','Boston','14:00 CDMX'],
  ['España','Bélgica','10 jul','Los Ángeles','13:00 CDMX'],
  ['Noruega','Inglaterra','11 jul','Miami','15:00 CDMX'],
  ['Argentina','Suiza','11 jul','Kansas City','19:00 CDMX']
];
var restoCalendario = [
  ['Semifinal 1','Ganador Francia/Marruecos vs Ganador España/Bélgica','14 jul','Dallas'],
  ['Semifinal 2','Ganador Noruega/Inglaterra vs Ganador Argentina/Suiza','15 jul','Atlanta'],
  ['Tercer lugar','Perdedores de las semifinales','18 jul','Miami'],
  ['Final','Ganadores de las semifinales','19 jul','Nueva York/Nueva Jersey']
];

// ─── TABLA GENERAL DE LOS 48 EQUIPOS (torneo completo) ──────────────────────────
// [grupo, equipo, rankingFIFA, PJ, PG, PE, PP, GF, GC, DG, PTS, faseAlcanzada]
var tablaGeneral = [
  ['A','México',14,5,4,0,1,10,3,7,12,'Eliminado en Octavos de Final'],
  ['A','Sudáfrica',60,4,1,1,2,2,4,-2,4,'Eliminado en Dieciseisavos de Final'],
  ['A','Corea del Sur',25,3,1,0,2,2,3,-1,3,'Eliminado en Fase de Grupos'],
  ['A','Chequia',40,3,0,1,2,2,6,-4,1,'Eliminado en Fase de Grupos'],
  ['B','Suiza',19,5,3,2,0,9,3,6,11,'Clasificado a Cuartos de Final (vs Argentina)'],
  ['B','Canadá',30,5,2,1,2,9,6,3,7,'Eliminado en Octavos de Final'],
  ['B','Bosnia y Herzegovina',64,4,1,1,2,5,8,-3,4,'Eliminado en Dieciseisavos de Final'],
  ['B','Catar',56,3,0,1,2,2,10,-8,1,'Eliminado en Fase de Grupos'],
  ['C','Marruecos',7,5,3,2,0,10,4,6,11,'Clasificado a Cuartos de Final (vs Francia)'],
  ['C','Brasil',6,5,3,1,1,10,4,6,10,'Eliminado en Octavos de Final'],
  ['C','Escocia',42,3,1,0,2,1,4,-3,3,'Eliminado en Fase de Grupos'],
  ['C','Haití',83,3,0,0,3,2,8,-6,0,'Eliminado en Fase de Grupos'],
  ['D','Estados Unidos',17,5,3,0,2,11,8,3,9,'Eliminado en Octavos de Final'],
  ['D','Paraguay',41,6,1,3,2,3,6,-3,6,'Eliminado en Octavos de Final'],
  ['D','Australia',27,4,1,2,1,3,3,0,5,'Eliminado en Dieciseisavos de Final'],
  ['D','Turquía',22,3,1,0,2,3,5,-2,3,'Eliminado en Fase de Grupos'],
  ['E','Alemania',10,4,2,1,1,11,5,6,7,'Eliminado en Dieciseisavos de Final'],
  ['E','Costa de Marfil',33,4,2,0,2,5,4,1,6,'Eliminado en Dieciseisavos de Final'],
  ['E','Ecuador',23,4,1,1,2,2,4,-2,4,'Eliminado en Dieciseisavos de Final'],
  ['E','Curazao',82,3,0,1,2,1,9,-8,1,'Eliminado en Fase de Grupos'],
  ['F','Países Bajos',8,4,2,2,0,11,5,6,8,'Eliminado en Dieciseisavos de Final'],
  ['F','Japón',18,4,2,1,1,8,5,3,5,'Eliminado en Dieciseisavos de Final'],
  ['F','Suecia',38,4,1,1,2,7,10,-3,4,'Eliminado en Dieciseisavos de Final'],
  ['F','Túnez',45,3,0,0,3,2,12,-10,0,'Eliminado en Fase de Grupos'],
  ['G','Bélgica',9,5,3,2,0,13,5,8,11,'Clasificado a Cuartos de Final (vs España)'],
  ['G','Egipto',29,5,1,3,1,8,7,1,6,'Eliminado en Octavos de Final'],
  ['G','Irán',20,3,0,3,0,3,3,0,3,'Eliminado en Fase de Grupos'],
  ['G','Nueva Zelanda',85,3,0,1,2,4,10,-6,1,'Eliminado en Fase de Grupos'],
  ['H','España',2,5,4,1,0,9,0,9,13,'Clasificado a Cuartos de Final (vs Bélgica)'],
  ['H','Cabo Verde',67,4,0,3,1,4,5,-1,3,'Eliminado en Dieciseisavos de Final'],
  ['H','Uruguay',16,3,0,2,1,3,4,-1,2,'Eliminado en Fase de Grupos'],
  ['H','Arabia Saudita',61,3,0,2,1,1,5,-4,2,'Eliminado en Fase de Grupos'],
  ['I','Francia',3,5,5,0,0,14,2,12,15,'Clasificado a Cuartos de Final (vs Marruecos)'],
  ['I','Noruega',31,5,4,0,1,12,9,3,12,'Clasificado a Cuartos de Final (vs Inglaterra)'],
  ['I','Senegal',15,4,1,0,3,10,9,1,3,'Eliminado en Dieciseisavos de Final'],
  ['I','Irak',57,3,0,0,3,1,12,-11,0,'Eliminado en Fase de Grupos'],
  ['J','Argentina',1,5,5,0,0,14,5,9,15,'Clasificado a Cuartos de Final (vs Suiza)'],
  ['J','Austria',24,4,1,1,2,6,9,-3,4,'Eliminado en Dieciseisavos de Final'],
  ['J','Argelia',28,4,1,1,2,5,9,-4,4,'Eliminado en Dieciseisavos de Final'],
  ['J','Jordania',63,3,0,0,3,3,8,-5,0,'Eliminado en Fase de Grupos'],
  ['K','Colombia',13,5,3,2,0,5,1,4,11,'Eliminado en Octavos de Final'],
  ['K','Portugal',5,5,2,2,1,8,3,5,8,'Eliminado en Octavos de Final'],
  ['K','RD Congo',46,4,1,1,2,5,5,0,4,'Eliminado en Dieciseisavos de Final'],
  ['K','Uzbekistán',50,3,0,0,3,2,11,-9,0,'Eliminado en Fase de Grupos'],
  ['L','Inglaterra',4,5,4,1,0,11,5,6,13,'Clasificado a Cuartos de Final (vs Noruega)'],
  ['L','Croacia',11,4,2,0,2,6,7,-1,6,'Eliminado en Dieciseisavos de Final'],
  ['L','Ghana',73,4,1,1,2,2,3,-1,4,'Eliminado en Dieciseisavos de Final'],
  ['L','Panamá',34,3,0,0,3,0,4,-4,0,'Eliminado en Fase de Grupos']
];

// ─── PLANTILLAS (para el simulador de goleadores) ───────────────────────────────
var plantillas = {
  'Argentina':['L. Messi','J. Álvarez','L. Martínez','Á. Di María','E. Fernández','A. Mac Allister','N. González','T. Almada'],
  'Brasil':['Vinícius Jr','Rodrygo','Raphinha','Endrick','Neymar','B. Guimarães','L. Paquetá','Savinho'],
  'Francia':['K. Mbappé','O. Dembélé','M. Thuram','A. Griezmann','E. Camavinga','A. Tchouaméni','B. Barcola','R. Kolo Muani'],
  'España':['L. Yamal','Nico Williams','Á. Morata','Pedri','Gavi','F. Torres','D. Olmo','M. Merino'],
  'Inglaterra':['H. Kane','J. Bellingham','B. Saka','P. Foden','C. Palmer','M. Rashford','O. Watkins','J. Grealish'],
  'Portugal':['C. Ronaldo','B. Fernandes','R. Leão','B. Silva','G. Ramos','J. Félix','V. Ferreira','P. Neto'],
  'Países Bajos':['M. Depay','C. Gakpo','X. Simons','F. de Jong','D. Malen','W. Weghorst','T. Reijnders','C. Stengs'],
  'Bélgica':['R. Lukaku','K. De Bruyne','J. Doku','L. Trossard','L. Openda','Y. Tielemans','C. Bakayoko','A. Saelemaekers'],
  'Alemania':['K. Havertz','J. Musiala','F. Wirtz','N. Füllkrug','L. Sané','K. Adeyemi','S. Gnabry','T. Kroos'],
  'Croacia':['A. Kramarić','L. Modrić','B. Sosa','M. Pašalić','I. Perišić','M. Kovačić','M. Pjaca','D. Vlašić'],
  'Uruguay':['D. Núñez','F. Valverde','N. de la Cruz','M. Araújo','G. de Arrascaeta','R. Araújo','M. Pellistri','B. Rodríguez'],
  'Colombia':['L. Díaz','J. Córdoba','R. Ríos','J. Cuadrado','J. Lerma','D. Muñoz','J. Arias','L. Sinisterra'],
  'México':['S. Giménez','H. Lozano','R. Jiménez','A. Vega','E. Álvarez','O. Pineda','J. Macías','U. Antuna'],
  'Estados Unidos':['C. Pulisic','R. Aaronson','F. Balogun','W. McKennie','T. Weah','G. Reyna','J. Sargent','Y. Musah'],
  'Marruecos':['A. Hakimi','H. Ziyech','Y. En-Nesyri','B. Diaz','A. Taghnaouti','S. Amrabat','N. Aguerd','A. Ounahi'],
  'Noruega':['E. Haaland','M. Ødegaard','A. Sørloth','O. Bobb','K. Thorsby','S. Berge','J. Nusa','A. Sørloth'],
  'Japón':['T. Kubo','K. Mitoma','A. Ueda','D. Kamada','W. Endō','J. Itō','R. Doan','T. Minamino'],
  'Senegal':['S. Mané','N. Jackson','I. Sarr','P. Sarr','H. Diallo','B. Dia','P. Gueye','I. Ndiaye'],
  'Suiza':['B. Embolo','X. Shaqiri','D. Ndoye','R. Vargas','G. Xhaka','M. Amdouni','Z. Amdouni','R. Rodríguez'],
  'Egipto':['M. Salah','O. Marmoush','T. Trezeguet','M. Sherif','M. Elneny','E. Hamdi','M. Kahraba','A. Fatouh'],
  'Australia':['M. Duke','C. Goodwin','A. Mabil','R. McGree','J. Irvine','M. Leckie','K. Baccus','B. Kuol'],
  'Ecuador':['E. Valencia','K. Rodríguez','G. Plata','J. Sarmiento','M. Caicedo','P. Hincapié','J. Cifuentes','A. Preciado'],
  'Bosnia y Herzegovina':['E. Džeko','S. Dedić','A. Krunić','M. Demirović','H. Hajradinović','B. Cimirot','A. Bešić','A. Hadžiahmetović'],
  'Costa de Marfil':['S. Haller','N. Pépé','J. Kessié','S. Diakité','C. Adingra','O. Diakité','M. Sangaré','I. Sangaré']
};

// ─── ÍNDICES Y ESTADÍSTICAS DERIVADAS ───────────────────────────────────────────
var flagByTeam = {};
var groupByTeam = {};
Object.entries(mundialGrupos).forEach(([grupo, teams]) => teams.forEach(([flag, name]) => {
  flagByTeam[name] = flag;
  groupByTeam[name] = grupo;
}));

function emptyStats() { return { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0 }; }

// gruposData y statsByTeam se construyen desde las tablas finales oficiales (standings)
var statsByTeam = {};
var gruposData = Object.entries(standings).map(([name, rows]) => ({
  name: name,
  teams: rows.map((r, i) => {
    statsByTeam[r[0]] = { pj: r[1], g: r[2], e: r[3], p: r[4], gf: r[5], gc: r[6], dif: r[7], pts: r[8] };
    return { flag: flagByTeam[r[0]], name: r[0], pj: r[1], g: r[2], e: r[3], p: r[4], gf: r[5], gc: r[6], dif: r[7], pts: r[8], q: i < 2 };
  })
}));
Object.keys(flagByTeam).forEach(n => { if (!statsByTeam[n]) statsByTeam[n] = emptyStats(); });

var selData = gruposData.flatMap(gr => gr.teams.map((team, index) => ({
  ...team,
  group: 'Grupo ' + gr.name,
  rank: index + 1
})));

// ─── CONFEDERACIONES ────────────────────────────────────────────────────────────
var confederaciones = [
  { code: 'UEFA',     emoji: '🇪🇺', name: 'UEFA',     region: 'Europa',        color: '#003399',
    teams: ['Chequia','Suiza','Bosnia y Herzegovina','Escocia','Turquía','Alemania','Países Bajos','Suecia','Bélgica','España','Francia','Noruega','Austria','Portugal','Inglaterra','Croacia'] },
  { code: 'CAF',      emoji: '🌍', name: 'CAF',      region: 'África',         color: '#009639',
    teams: ['Sudáfrica','Marruecos','Costa de Marfil','Túnez','Egipto','Cabo Verde','Senegal','Argelia','RD Congo','Ghana'] },
  { code: 'AFC',      emoji: '🌏', name: 'AFC',      region: 'Asia',           color: '#DA291C',
    teams: ['Corea del Sur','Catar','Australia','Japón','Irán','Arabia Saudita','Irak','Jordania','Uzbekistán'] },
  { code: 'CONCACAF', emoji: '🌎', name: 'CONCACAF', region: 'Norte/Centroamérica', color: '#1D428A',
    teams: ['México','Canadá','Haití','Estados Unidos','Curazao','Panamá'] },
  { code: 'CONMEBOL', emoji: '🏆', name: 'CONMEBOL', region: 'Sudamérica',     color: '#FDB913',
    teams: ['Brasil','Paraguay','Ecuador','Uruguay','Argentina','Colombia'] },
  { code: 'OFC',      emoji: '🌊', name: 'OFC',      region: 'Oceanía',        color: '#00A0DF',
    teams: ['Nueva Zelanda'] }
];
var confedByTeam = {};
confederaciones.forEach(c => c.teams.forEach(t => confedByTeam[t] = c.code));

// ─── DETALLE DE SELECCIONES ─────────────────────────────────────────────────────
// Ranking FIFA y fase alcanzada se derivan de la tabla general oficial.
var rankingFIFA = {};
var faseByTeam = {};
tablaGeneral.forEach(r => { rankingFIFA[r[1]] = r[2]; faseByTeam[r[1]] = r[11]; });
var entrenadores = {
  'Argentina':'Lionel Scaloni','Brasil':'Dorival Júnior','España':'Luis de la Fuente','Francia':'Didier Deschamps',
  'Inglaterra':'Thomas Tuchel','Portugal':'Roberto Martínez','Alemania':'Julian Nagelsmann','México':'Javier Aguirre',
  'Estados Unidos':'Mauricio Pochettino','Uruguay':'Marcelo Bielsa','Países Bajos':'Ronald Koeman','Bélgica':'Rudi García',
  'Croacia':'Zlatko Dalić','Colombia':'Néstor Lorenzo','Marruecos':'Walid Regragui','Japón':'Hajime Moriyasu',
  'Canadá':'Jesse Marsch','Ecuador':'Sebastián Beccacece','Suiza':'Murat Yakin','Senegal':'Pape Thiaw',
  'Australia':'Tony Popovic','Corea del Sur':'Hong Myung-bo','Noruega':'Ståle Solbakken','Austria':'Ralf Rangnick',
  'Egipto':'Hossam Hassan','Irán':'Amir Ghalenoei','Paraguay':'Gustavo Alfaro'
};
var historiaSel = {
  'Argentina':'Tricampeona del mundo (1978, 1986 y 2022), es una de las mayores potencias del fútbol mundial y llega como vigente campeona.',
  'Brasil':'La selección más laureada de la historia con 5 títulos mundiales. El "Scratch" es sinónimo de fútbol ofensivo y talento.',
  'México':'Selección anfitriona y la más representativa de la CONCACAF. Disputa su Mundial en casa por tercera vez, con el Azteca como sede icónica.',
  'España':'Campeona del mundo en 2010 y referente del juego de posesión. Combina una generación joven con experiencia europea.',
  'Francia':'Bicampeona mundial (1998, 2018) y finalista en 2022. Una de las plantillas más profundas y talentosas del planeta.',
  'Inglaterra':'Campeona en 1966, vive una era dorada de talento joven y busca romper su larga sequía de títulos.',
  'Uruguay':'Bicampeona mundial y país con enorme tradición pese a su tamaño. La "Garra Charrúa" es su sello.',
  'Colombia':'Selección en crecimiento con una generación sólida; busca superar su histórico cuarto de final de 2014.',
  'Estados Unidos':'Coanfitrión del torneo. Aprovecha el impulso local y una camada de jóvenes formados en Europa.',
  'Canadá':'Coanfitrión y en pleno ascenso tras volver a un Mundial en 2022. Fútbol atlético y veloz.'
};

// Devuelve el estadio asociado a una selección (donde tiene partidos) con enlace a Google Maps.
function estadioDeSeleccion(name) {
  var est = estadiosData.find(e => e.matches.some(m => m.teams.indexOf(name) !== -1));
  if (!est) {
    var idx = (groupByTeam[name] ? groupByTeam[name].charCodeAt(0) - 65 : 0) % estadiosData.length;
    est = estadiosData[idx];
  }
  var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + est.coords[0] + ',' + est.coords[1];
  return { name: est.name, city: est.city, country: est.country, coords: est.coords, mapsUrl: mapsUrl };
}

// Consolida toda la información de una selección para el cuadro emergente.
function getSeleccionInfo(name) {
  var s = statsByTeam[name] || emptyStats();
  var ranking = rankingFIFA[name] || 80;
  var confed = (confederaciones.find(c => c.code === confedByTeam[name]) || {}).region || '—';
  var confedCode = confedByTeam[name] || '—';

  var ventajas = [];
  if (ranking <= 10) ventajas.push('Selección de élite mundial (Top 10 del ranking FIFA).');
  else if (ranking <= 25) ventajas.push('Ubicada entre las mejores del ranking FIFA (#' + ranking + ').');
  if (s.gf >= 4) ventajas.push('Ataque potente: ' + s.gf + ' goles a favor en la fase.');
  if (s.g >= 1) ventajas.push('Ya suma victorias en el torneo (' + s.g + ').');
  if (['UEFA','CONMEBOL'].indexOf(confedCode) !== -1) ventajas.push('Escuela futbolística de gran tradición.');
  if (!ventajas.length) ventajas.push('Equipo aguerrido con margen de sorpresa.');

  var desventajas = [];
  if (ranking > 40) desventajas.push('Menor experiencia en instancias decisivas (#' + ranking + ' FIFA).');
  if (s.gc >= 3) desventajas.push('Defensa vulnerable: ' + s.gc + ' goles en contra.');
  if (s.p >= 1) desventajas.push('Ya conoció la derrota en la fase de grupos.');
  if (s.g === 0 && s.pj > 0) desventajas.push('Aún sin ganar en el torneo.');
  if (!desventajas.length) desventajas.push('Presión alta por su condición de favorita.');

  var historia = historiaSel[name] ||
    (name + ' representa a la confederación ' + confedCode + ' (' + confed + ') en el Mundial 2026. ' +
     'Con tradición futbolística en su región, busca dejar su huella en el torneo.');

  return {
    name: name,
    flag: flagByTeam[name] || '🏳️',
    ranking: ranking,
    historia: historia,
    ventajas: ventajas,
    desventajas: desventajas,
    entrenador: entrenadores[name] || 'Seleccionador nacional',
    group: 'Grupo ' + (groupByTeam[name] || '—'),
    confed: confedCode + ' · ' + confed,
    fase: faseByTeam[name] || 'Fase de Grupos',
    estadio: estadioDeSeleccion(name),
    stats: s
  };
}

function formatDate(date) {
  var d = new Date(date + 'T20:00:00');
  var dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' ' + meses[d.getMonth()] + ' · 20:00';
}
function matchStadium(index) { return estadiosData[index % estadiosData.length].name; }

// Fecha del partido de grupos según su posición en el calendario (0-71)
function fechaGrupoPartido(i) {
  var d;
  if (i < 2) d = 11; else if (i < 5) d = 12; else if (i < 8) d = 13; else if (i < 12) d = 14;
  else if (i < 16) d = 15; else if (i < 19) d = 16; else if (i < 24) d = 17;
  else if (i < 28) d = 18; else if (i < 32) d = 19; else if (i < 35) d = 20; else if (i < 40) d = 21;
  else if (i < 44) d = 22; else if (i < 48) d = 23;
  else if (i < 54) d = 24; else if (i < 60) d = 25; else if (i < 66) d = 26; else d = 27;
  return '2026-06-' + (d < 10 ? '0' + d : d);
}

// El calendario muestra los 72 partidos de la fase de grupos (ya jugados)
var partidosData = partidosGrupos.map(function (m, i) {
  var grupo = m[0], home = m[1], gl = m[2], gv = m[3], away = m[4];
  return {
    home: flagByTeam[home], homeN: home, away: flagByTeam[away], awayN: away,
    score: gl + ' — ' + gv, status: 'completado', time: 'Final',
    stadium: matchStadium(i), date: formatDate(fechaGrupoPartido(i)),
    group: 'grupo ' + grupo.toLowerCase()
  };
});
