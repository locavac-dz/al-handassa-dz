-- ============================================================
-- Module Appels d'offres BTP
-- ============================================================

CREATE TABLE IF NOT EXISTS tenders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(300) UNIQUE NOT NULL,
  -- Maître d'ouvrage
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  owner_name      VARCHAR(255),        -- si pas lié à une entreprise
  owner_type      VARCHAR(50),         -- Public, Privé, Semi-public
  -- Offre
  title           VARCHAR(255) NOT NULL,
  reference       VARCHAR(100),        -- numéro AO officiel
  description     TEXT,
  lot             VARCHAR(255),        -- lot concerné
  sector          VARCHAR(100),        -- Bâtiment, Routes, Hydraulique…
  wilaya          INTEGER,
  city            VARCHAR(100),
  budget_range    VARCHAR(100),        -- optionnel
  -- Délais
  published_at    DATE DEFAULT CURRENT_DATE,
  deadline_at     DATE,                -- date limite de soumission
  opening_at      DATE,                -- date d'ouverture des plis
  -- Documents
  cahier_url      TEXT,                -- lien/chemin CDC
  -- Contact
  contact_name    VARCHAR(150),
  contact_email   VARCHAR(255),
  contact_phone   VARCHAR(50),
  contact_address TEXT,
  -- Statut
  status          VARCHAR(20) DEFAULT 'open',  -- open, closed, awarded, cancelled
  is_featured     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  views_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_slug     ON tenders(slug);
CREATE INDEX IF NOT EXISTS idx_tenders_active   ON tenders(is_active);
CREATE INDEX IF NOT EXISTS idx_tenders_wilaya   ON tenders(wilaya);
CREATE INDEX IF NOT EXISTS idx_tenders_sector   ON tenders(sector);
CREATE INDEX IF NOT EXISTS idx_tenders_status   ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(deadline_at);
