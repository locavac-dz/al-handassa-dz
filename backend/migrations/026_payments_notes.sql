-- ─────────────────────────────────────────────────────────────────
-- PAIEMENTS : colonnes notes/updated_at manquantes
-- Référencées par PATCH /api/admin/payments/:id/validate et /reject
-- (routes/admin.js) depuis le début, mais jamais ajoutées au schéma —
-- ces deux routes échouaient donc systématiquement en base réelle.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS notes      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_payments
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
