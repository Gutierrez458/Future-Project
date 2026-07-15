BEGIN;

ALTER TABLE selecciones
  ADD COLUMN IF NOT EXISTS bandera varchar(8);

ALTER TABLE clasificaciones
  ADD COLUMN IF NOT EXISTS victorias integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS empates integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS derrotas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diferencia_goles integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posicion integer;

INSERT INTO continentes (nombre) VALUES
  ('África'),
  ('América del Norte'),
  ('América del Sur'),
  ('Asia'),
  ('Europa'),
  ('Oceanía')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO grupos (nombre)
SELECT chr(code)
FROM generate_series(ascii('A'), ascii('L')) AS code
ON CONFLICT (nombre) DO NOTHING;

WITH equipos(grupo, nombre, bandera, continente) AS (
  VALUES
    ('A','México','🇲🇽','América del Norte'),
    ('A','Corea del Sur','🇰🇷','Asia'),
    ('A','Sudáfrica','🇿🇦','África'),
    ('A','Chequia','🇨🇿','Europa'),
    ('B','Canadá','🇨🇦','América del Norte'),
    ('B','Suiza','🇨🇭','Europa'),
    ('B','Bosnia y Herzegovina','🇧🇦','Europa'),
    ('B','Catar','🇶🇦','Asia'),
    ('C','Brasil','🇧🇷','América del Sur'),
    ('C','Marruecos','🇲🇦','África'),
    ('C','Haití','🇭🇹','América del Norte'),
    ('C','Escocia','🏴','Europa'),
    ('D','Estados Unidos','🇺🇸','América del Norte'),
    ('D','Paraguay','🇵🇾','América del Sur'),
    ('D','Australia','🇦🇺','Oceanía'),
    ('D','Turquía','🇹🇷','Europa'),
    ('E','Alemania','🇩🇪','Europa'),
    ('E','Curazao','🇨🇼','América del Norte'),
    ('E','Costa de Marfil','🇨🇮','África'),
    ('E','Ecuador','🇪🇨','América del Sur'),
    ('F','Países Bajos','🇳🇱','Europa'),
    ('F','Japón','🇯🇵','Asia'),
    ('F','Suecia','🇸🇪','Europa'),
    ('F','Túnez','🇹🇳','África'),
    ('G','Bélgica','🇧🇪','Europa'),
    ('G','Egipto','🇪🇬','África'),
    ('G','Irán','🇮🇷','Asia'),
    ('G','Nueva Zelanda','🇳🇿','Oceanía'),
    ('H','España','🇪🇸','Europa'),
    ('H','Cabo Verde','🇨🇻','África'),
    ('H','Arabia Saudita','🇸🇦','Asia'),
    ('H','Uruguay','🇺🇾','América del Sur'),
    ('I','Francia','🇫🇷','Europa'),
    ('I','Senegal','🇸🇳','África'),
    ('I','Irak','🇮🇶','Asia'),
    ('I','Noruega','🇳🇴','Europa'),
    ('J','Argentina','🇦🇷','América del Sur'),
    ('J','Argelia','🇩🇿','África'),
    ('J','Austria','🇦🇹','Europa'),
    ('J','Jordania','🇯🇴','Asia'),
    ('K','Portugal','🇵🇹','Europa'),
    ('K','RD Congo','🇨🇩','África'),
    ('K','Uzbekistán','🇺🇿','Asia'),
    ('K','Colombia','🇨🇴','América del Sur'),
    ('L','Inglaterra','🏴','Europa'),
    ('L','Croacia','🇭🇷','Europa'),
    ('L','Ghana','🇬🇭','África'),
    ('L','Panamá','🇵🇦','América del Norte')
)
INSERT INTO selecciones (nombre, bandera, id_continente, id_grupo)
SELECT e.nombre, e.bandera, c.id_continente, g.id_grupo
FROM equipos e
JOIN continentes c ON c.nombre = e.continente
JOIN grupos g ON g.nombre = e.grupo
ON CONFLICT (nombre) DO UPDATE
SET bandera = EXCLUDED.bandera,
    id_continente = EXCLUDED.id_continente,
    id_grupo = EXCLUDED.id_grupo;

-- ── PARTIDOS DEL TORNEO COMPLETO ─────────────────────────────────────────────────
-- 72 partidos de grupos (jugados) + Dieciseisavos (16) + Octavos (8) + Cuartos (4, por jugarse)
WITH partidos_data(fecha_hora, local, visitante, goles_local, goles_visitante, fase) AS (
  VALUES
    ('2026-06-11 18:00'::timestamp,'México','Sudáfrica',2,0,'Grupos'),
    ('2026-06-11 18:00'::timestamp,'Corea del Sur','Chequia',2,1,'Grupos'),
    ('2026-06-12 18:00'::timestamp,'Canadá','Bosnia y Herzegovina',1,1,'Grupos'),
    ('2026-06-12 18:00'::timestamp,'Estados Unidos','Paraguay',4,1,'Grupos'),
    ('2026-06-12 18:00'::timestamp,'Catar','Suiza',1,1,'Grupos'),
    ('2026-06-13 18:00'::timestamp,'Brasil','Marruecos',1,1,'Grupos'),
    ('2026-06-13 18:00'::timestamp,'Haití','Escocia',0,1,'Grupos'),
    ('2026-06-13 18:00'::timestamp,'Australia','Turquía',2,0,'Grupos'),
    ('2026-06-14 18:00'::timestamp,'Alemania','Curazao',7,1,'Grupos'),
    ('2026-06-14 18:00'::timestamp,'Países Bajos','Japón',2,2,'Grupos'),
    ('2026-06-14 18:00'::timestamp,'Costa de Marfil','Ecuador',1,0,'Grupos'),
    ('2026-06-14 18:00'::timestamp,'Suecia','Túnez',5,1,'Grupos'),
    ('2026-06-15 18:00'::timestamp,'España','Cabo Verde',0,0,'Grupos'),
    ('2026-06-15 18:00'::timestamp,'Bélgica','Egipto',1,1,'Grupos'),
    ('2026-06-15 18:00'::timestamp,'Arabia Saudita','Uruguay',1,1,'Grupos'),
    ('2026-06-15 18:00'::timestamp,'Irán','Nueva Zelanda',2,2,'Grupos'),
    ('2026-06-16 18:00'::timestamp,'Francia','Senegal',3,1,'Grupos'),
    ('2026-06-16 18:00'::timestamp,'Irak','Noruega',1,4,'Grupos'),
    ('2026-06-16 18:00'::timestamp,'Argentina','Argelia',3,0,'Grupos'),
    ('2026-06-17 18:00'::timestamp,'Austria','Jordania',3,1,'Grupos'),
    ('2026-06-17 18:00'::timestamp,'Portugal','RD Congo',1,1,'Grupos'),
    ('2026-06-17 18:00'::timestamp,'Inglaterra','Croacia',4,2,'Grupos'),
    ('2026-06-17 18:00'::timestamp,'Ghana','Panamá',1,0,'Grupos'),
    ('2026-06-17 18:00'::timestamp,'Uzbekistán','Colombia',1,3,'Grupos'),
    ('2026-06-18 18:00'::timestamp,'Chequia','Sudáfrica',1,1,'Grupos'),
    ('2026-06-18 18:00'::timestamp,'Suiza','Bosnia y Herzegovina',4,1,'Grupos'),
    ('2026-06-18 18:00'::timestamp,'Canadá','Catar',6,0,'Grupos'),
    ('2026-06-18 18:00'::timestamp,'México','Corea del Sur',1,0,'Grupos'),
    ('2026-06-19 18:00'::timestamp,'Estados Unidos','Australia',2,0,'Grupos'),
    ('2026-06-19 18:00'::timestamp,'Escocia','Marruecos',0,1,'Grupos'),
    ('2026-06-19 18:00'::timestamp,'Brasil','Haití',3,0,'Grupos'),
    ('2026-06-19 18:00'::timestamp,'Turquía','Paraguay',0,1,'Grupos'),
    ('2026-06-20 18:00'::timestamp,'Países Bajos','Suecia',5,1,'Grupos'),
    ('2026-06-20 18:00'::timestamp,'Alemania','Costa de Marfil',2,1,'Grupos'),
    ('2026-06-20 18:00'::timestamp,'Ecuador','Curazao',0,0,'Grupos'),
    ('2026-06-21 18:00'::timestamp,'Túnez','Japón',0,4,'Grupos'),
    ('2026-06-21 18:00'::timestamp,'España','Arabia Saudita',4,0,'Grupos'),
    ('2026-06-21 18:00'::timestamp,'Bélgica','Irán',0,2,'Grupos'),
    ('2026-06-21 18:00'::timestamp,'Uruguay','Cabo Verde',2,2,'Grupos'),
    ('2026-06-21 18:00'::timestamp,'Nueva Zelanda','Egipto',1,3,'Grupos'),
    ('2026-06-22 18:00'::timestamp,'Argentina','Austria',2,0,'Grupos'),
    ('2026-06-22 18:00'::timestamp,'Francia','Irak',3,0,'Grupos'),
    ('2026-06-22 18:00'::timestamp,'Noruega','Senegal',3,2,'Grupos'),
    ('2026-06-22 18:00'::timestamp,'Jordania','Argelia',1,2,'Grupos'),
    ('2026-06-23 18:00'::timestamp,'Portugal','Uzbekistán',5,0,'Grupos'),
    ('2026-06-23 18:00'::timestamp,'Inglaterra','Ghana',0,0,'Grupos'),
    ('2026-06-23 18:00'::timestamp,'Panamá','Croacia',0,1,'Grupos'),
    ('2026-06-23 18:00'::timestamp,'Colombia','RD Congo',1,0,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Suiza','Canadá',2,1,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Bosnia y Herzegovina','Catar',3,1,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Escocia','Brasil',0,3,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Marruecos','Haití',4,2,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Chequia','México',0,3,'Grupos'),
    ('2026-06-24 18:00'::timestamp,'Sudáfrica','Corea del Sur',1,0,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Curazao','Costa de Marfil',0,2,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Ecuador','Alemania',2,1,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Japón','Suecia',1,1,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Túnez','Países Bajos',1,3,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Turquía','Estados Unidos',3,2,'Grupos'),
    ('2026-06-25 18:00'::timestamp,'Paraguay','Australia',0,0,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Noruega','Francia',1,4,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Senegal','Irak',5,0,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Cabo Verde','Arabia Saudita',0,0,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Uruguay','España',0,1,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Egipto','Irán',1,1,'Grupos'),
    ('2026-06-26 18:00'::timestamp,'Nueva Zelanda','Bélgica',1,5,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'Panamá','Inglaterra',0,2,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'Croacia','Ghana',2,1,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'Colombia','Portugal',0,0,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'RD Congo','Uzbekistán',3,1,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'Argelia','Austria',3,3,'Grupos'),
    ('2026-06-27 18:00'::timestamp,'Jordania','Argentina',1,3,'Grupos'),
    ('2026-06-28 16:00'::timestamp,'Canadá','Sudáfrica',1,0,'Dieciseisavos'),
    ('2026-06-29 16:00'::timestamp,'Alemania','Paraguay',1,1,'Dieciseisavos'),
    ('2026-06-29 16:00'::timestamp,'Países Bajos','Marruecos',1,1,'Dieciseisavos'),
    ('2026-06-29 16:00'::timestamp,'Brasil','Japón',2,1,'Dieciseisavos'),
    ('2026-06-30 16:00'::timestamp,'Francia','Suecia',3,0,'Dieciseisavos'),
    ('2026-06-30 16:00'::timestamp,'Costa de Marfil','Noruega',1,2,'Dieciseisavos'),
    ('2026-06-30 16:00'::timestamp,'México','Ecuador',2,0,'Dieciseisavos'),
    ('2026-07-01 16:00'::timestamp,'Inglaterra','RD Congo',2,1,'Dieciseisavos'),
    ('2026-07-01 16:00'::timestamp,'Estados Unidos','Bosnia y Herzegovina',2,0,'Dieciseisavos'),
    ('2026-07-01 16:00'::timestamp,'Bélgica','Senegal',3,2,'Dieciseisavos'),
    ('2026-07-02 16:00'::timestamp,'Portugal','Croacia',2,1,'Dieciseisavos'),
    ('2026-07-02 16:00'::timestamp,'España','Austria',3,0,'Dieciseisavos'),
    ('2026-07-02 16:00'::timestamp,'Suiza','Argelia',2,0,'Dieciseisavos'),
    ('2026-07-03 16:00'::timestamp,'Argentina','Cabo Verde',3,2,'Dieciseisavos'),
    ('2026-07-03 16:00'::timestamp,'Colombia','Ghana',1,0,'Dieciseisavos'),
    ('2026-07-03 16:00'::timestamp,'Australia','Egipto',1,1,'Dieciseisavos'),
    ('2026-07-04 16:00'::timestamp,'Paraguay','Francia',0,1,'Octavos'),
    ('2026-07-04 16:00'::timestamp,'Canadá','Marruecos',0,3,'Octavos'),
    ('2026-07-05 16:00'::timestamp,'Brasil','Noruega',1,2,'Octavos'),
    ('2026-07-05 16:00'::timestamp,'México','Inglaterra',2,3,'Octavos'),
    ('2026-07-06 16:00'::timestamp,'Portugal','España',0,1,'Octavos'),
    ('2026-07-06 16:00'::timestamp,'Estados Unidos','Bélgica',1,4,'Octavos'),
    ('2026-07-07 16:00'::timestamp,'Argentina','Egipto',3,2,'Octavos'),
    ('2026-07-07 16:00'::timestamp,'Suiza','Colombia',0,0,'Octavos'),
    ('2026-07-09 16:00'::timestamp,'Francia','Marruecos',NULL,NULL,'Cuartos'),
    ('2026-07-10 16:00'::timestamp,'España','Bélgica',NULL,NULL,'Cuartos'),
    ('2026-07-11 16:00'::timestamp,'Noruega','Inglaterra',NULL,NULL,'Cuartos'),
    ('2026-07-11 16:00'::timestamp,'Argentina','Suiza',NULL,NULL,'Cuartos')
)
INSERT INTO partidos (id_local, id_visitante, fecha_hora, goles_local, goles_visitante, fase)
SELECT l.id_seleccion, v.id_seleccion, p.fecha_hora, p.goles_local, p.goles_visitante, p.fase
FROM partidos_data p
JOIN selecciones l ON l.nombre = p.local
JOIN selecciones v ON v.nombre = p.visitante;

-- ── TABLA DE POSICIONES (solo fase de grupos) ────────────────────────────────────
WITH stats AS (
  SELECT id_local AS id_seleccion, goles_local AS gf, goles_visitante AS gc
  FROM partidos
  WHERE fase = 'Grupos' AND goles_local IS NOT NULL AND goles_visitante IS NOT NULL
  UNION ALL
  SELECT id_visitante AS id_seleccion, goles_visitante AS gf, goles_local AS gc
  FROM partidos
  WHERE fase = 'Grupos' AND goles_local IS NOT NULL AND goles_visitante IS NOT NULL
),
tabla AS (
  SELECT
    s.id_seleccion,
    sel.id_grupo,
    SUM(CASE WHEN s.gf > s.gc THEN 3 WHEN s.gf = s.gc THEN 1 ELSE 0 END)::integer AS puntos,
    COUNT(*)::integer AS partidos_jugados,
    SUM(CASE WHEN s.gf > s.gc THEN 1 ELSE 0 END)::integer AS victorias,
    SUM(CASE WHEN s.gf = s.gc THEN 1 ELSE 0 END)::integer AS empates,
    SUM(CASE WHEN s.gf < s.gc THEN 1 ELSE 0 END)::integer AS derrotas,
    SUM(s.gf)::integer AS goles_a_favor,
    SUM(s.gc)::integer AS goles_en_contra,
    SUM(s.gf - s.gc)::integer AS diferencia_goles
  FROM stats s
  JOIN selecciones sel ON sel.id_seleccion = s.id_seleccion
  GROUP BY s.id_seleccion, sel.id_grupo
)
INSERT INTO clasificaciones (
  id_seleccion, id_grupo, puntos, partidos_jugados,
  victorias, empates, derrotas, goles_a_favor, goles_en_contra, diferencia_goles
)
SELECT
  id_seleccion, id_grupo, puntos, partidos_jugados,
  victorias, empates, derrotas, goles_a_favor, goles_en_contra, diferencia_goles
FROM tabla;

WITH ranked AS (
  SELECT
    c.id_clasificacion,
    row_number() OVER (
      PARTITION BY g.id_grupo
      ORDER BY
        c.puntos DESC,
        c.diferencia_goles DESC,
        c.goles_a_favor DESC,
        s.nombre ASC
    ) AS posicion
  FROM clasificaciones c
  JOIN selecciones s ON s.id_seleccion = c.id_seleccion
  JOIN grupos g ON g.id_grupo = c.id_grupo
)
UPDATE clasificaciones c
SET posicion = ranked.posicion
FROM ranked
WHERE ranked.id_clasificacion = c.id_clasificacion;

INSERT INTO usuarios (nombre, email) VALUES
  ('Administrador', 'admin@mundial2026.mx'),
  ('Editor', 'editor@mundial2026.mx'),
  ('Visitante', 'viewer@mundial2026.mx')
ON CONFLICT (email) DO NOTHING;

COMMIT;
