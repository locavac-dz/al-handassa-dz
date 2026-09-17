-- ============================================================
-- Module Recrutement — Offres d'emploi BTP
-- ============================================================

CREATE TABLE IF NOT EXISTS job_offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  -- Infos offre
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(300) UNIQUE NOT NULL,
  description   TEXT,
  missions      TEXT,
  profile       TEXT,
  -- Localisation
  wilaya        INTEGER,
  city          VARCHAR(100),
  -- Paramètres
  contract_type VARCHAR(50),   -- CDI, CDD, Stage, Freelance, Alternance
  specialty     VARCHAR(100),  -- Gros Œuvre, Bureau d'études…
  level         VARCHAR(50),   -- Junior, Confirmé, Senior, Chef de projet
  education     VARCHAR(100),  -- Licence, Master, Ingénieur, BTS…
  experience    VARCHAR(50),   -- 0-1 an, 1-3 ans, 3-5 ans, +5 ans
  salary_range  VARCHAR(100),  -- optionnel
  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  -- Statut
  is_active     BOOLEAN DEFAULT TRUE,
  is_featured   BOOLEAN DEFAULT FALSE,
  expires_at    DATE,
  views_count   INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_slug       ON job_offers(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_active     ON job_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_wilaya     ON job_offers(wilaya);
CREATE INDEX IF NOT EXISTS idx_jobs_company    ON job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_specialty  ON job_offers(specialty);
CREATE INDEX IF NOT EXISTS idx_jobs_contract   ON job_offers(contract_type);
