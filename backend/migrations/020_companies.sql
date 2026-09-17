-- ============================================================
-- Module Espace Entreprise — Vitrine
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(200) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  logo_url      TEXT,
  cover_url     TEXT,
  tagline       VARCHAR(300),
  description   TEXT,
  specialties   TEXT[]   DEFAULT '{}',   -- ['GO','SO','Routes','Hydraulique'...]
  wilayas       INTEGER[] DEFAULT '{}',  -- codes 1-58
  size_range    VARCHAR(20),             -- '1-10','11-50','51-200','200+'
  founded_year  INTEGER,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  website       VARCHAR(255),
  address       TEXT,
  wilaya_siege  INTEGER,                 -- wilaya principale
  agrement      VARCHAR(100),            -- numéro agrément
  is_verified   BOOLEAN DEFAULT FALSE,
  is_premium    BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  views_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   TEXT,
  location    VARCHAR(200),
  year        INTEGER,
  category    VARCHAR(100),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug       ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active     ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_wilaya     ON companies(wilaya_siege);
CREATE INDEX IF NOT EXISTS idx_company_projects_cid ON company_projects(company_id);
