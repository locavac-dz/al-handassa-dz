-- ─────────────────────────────────────────────────────────────────
-- LICENCES LOGICIELLES (BétonLab DG et futurs produits "logiciels")
-- Émises automatiquement à la confirmation de paiement (satimCallback,
-- validation manuelle admin), validées côté serveur par l'app cliente.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS software_licenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key   VARCHAR(30) UNIQUE NOT NULL,
  app_slug      VARCHAR(50) NOT NULL,
  license_plan  VARCHAR(20) NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  order_item_id INTEGER REFERENCES order_items(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  activated_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_software_licenses_status CHECK (status IN ('active', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_software_licenses_key  ON software_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_software_licenses_user ON software_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_software_licenses_app  ON software_licenses(app_slug);
