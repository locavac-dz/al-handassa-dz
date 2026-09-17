-- ============================================================
-- Module Annuaire Professionnel
-- ============================================================

CREATE TABLE IF NOT EXISTS professionals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(300) UNIQUE NOT NULL,
  -- Identité
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  photo_url     TEXT,
  title         VARCHAR(200),          -- "Ingénieur en Génie Civil", "Architecte DPLG"…
  tagline       VARCHAR(300),          -- accroche courte
  bio           TEXT,                  -- présentation longue
  -- Localisation
  wilaya        INTEGER,
  city          VARCHAR(100),
  -- Profil professionnel
  specialties   TEXT[]  DEFAULT '{}',  -- domaines d'expertise
  skills        TEXT[]  DEFAULT '{}',  -- compétences techniques (ETABS, BIM, AutoCAD…)
  languages     TEXT[]  DEFAULT '{}',  -- Arabe, Français, Anglais…
  experience_years INTEGER,
  education     VARCHAR(200),          -- diplôme principal
  institution   VARCHAR(200),
  -- Disponibilité
  availability  VARCHAR(50),           -- Disponible, En poste, Freelance, Ouvert aux opportunités
  contract_pref VARCHAR(100),          -- CDI, Freelance, Mission, Stage…
  -- Contact & liens
  email         VARCHAR(255),
  phone         VARCHAR(50),
  linkedin_url  TEXT,
  portfolio_url TEXT,
  -- Statut
  is_verified   BOOLEAN DEFAULT FALSE,
  is_premium    BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  views_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pros_slug       ON professionals(slug);
CREATE INDEX IF NOT EXISTS idx_pros_active     ON professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_pros_wilaya     ON professionals(wilaya);
CREATE INDEX IF NOT EXISTS idx_pros_avail      ON professionals(availability);
