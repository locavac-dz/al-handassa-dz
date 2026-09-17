-- ─────────────────────────────────────────────────────────────────
-- Migration 024 — Crédibilité académique des articles
-- ─────────────────────────────────────────────────────────────────

-- Statut de soumission
DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('draft', 'pending', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS status          article_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS abstract        TEXT,
  ADD COLUMN IF NOT EXISTS keywords        TEXT[],
  ADD COLUMN IF NOT EXISTS is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_note  TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at    TIMESTAMPTZ;

-- Index pour la file de modération
CREATE INDEX IF NOT EXISTS idx_articles_status    ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_verified  ON articles(is_verified, published_at DESC);

-- Mise à jour de la vue search (si elle existe) : on ne fait rien, les index suffisent
