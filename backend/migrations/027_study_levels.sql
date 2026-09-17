-- ─────────────────────────────────────────────────────────────────
-- STUDY_LEVELS : table jamais versionnée (create_study_levels.sql
-- traînait sur le disque, jamais committé ni appliqué). Référencée par
-- GET /api/study-levels (app.js) et tout /api/admin/study-levels
-- (admin.js) — ces routes échouaient systématiquement en base réelle.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_levels (
  id         SERIAL PRIMARY KEY,
  slug       VARCHAR(50)  UNIQUE NOT NULL,
  label_fr   VARCHAR(100) NOT NULL,
  label_ar   VARCHAR(100),
  icon       VARCHAR(10)  DEFAULT '🎓',
  color      VARCHAR(30)  DEFAULT '#1B3A6B',
  db_value   VARCHAR(30)  NOT NULL,
  racine     VARCHAR(30),
  sort_order SMALLINT     DEFAULT 0,
  is_active  BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO study_levels (slug, label_fr, icon, color, db_value, sort_order) VALUES
  ('prepa',     'Classes Prepa',     '📐', '#6c757d', 'prepa',         1),
  ('bac',       'Bac Technique',     '🎒', '#e63946', 'debutant',      2),
  ('bts',       'BTS Genie Civil',   '🏫', '#f59e0b', 'intermediaire', 3),
  ('bts_bat',   'BTS Batiment',      '🏠', '#17a2b8', 'intermediaire', 4),
  ('licence',   'Licence L3',        '🎓', '#1B3A6B', 'intermediaire', 5),
  ('master',    'Master Ingenieur',  '🏗', '#C8A142', 'avance',        6),
  ('ingenieur', 'Ingenieur Etat',    '🏛', '#28a745', 'ingenieur',     7)
ON CONFLICT (slug) DO NOTHING;
