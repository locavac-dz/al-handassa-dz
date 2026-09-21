-- ─────────────────────────────────────────────────────────────────
-- DÉRIVE SCHÉMA / CODE : colonnes et valeurs d'enum utilisées par le code
-- mais absentes de schema.sql et des migrations précédentes (elles n'existaient
-- que sur la base de production, ajoutées à la main ou par des scripts one-shot).
-- Sur une base neuve, /api/videos et la génération d'aperçus répondaient 500.
-- Idempotente (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE videos   ADD COLUMN IF NOT EXISTS source        TEXT;
ALTER TABLE videos   ADD COLUMN IF NOT EXISTS chapters      JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS preview_pages INTEGER;

-- Types de produit acceptés par POST /api/products et proposés par le panneau admin
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'sujet';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'td_pdf';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'tp_pdf';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'tuto_pdf';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'document_word';
