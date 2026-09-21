-- ─────────────────────────────────────────────────────────────────
-- ARTICLES : status et is_published désynchronisés
-- Les routes publiques (liste, détail, sitemap) ne lisent que status = 'published', alors que le panneau
-- admin ne renseignait que is_published : tout article publié par l'admin restait « draft » et invisible.
-- Rattrapage des articles déjà publiés ; idempotent.
-- ─────────────────────────────────────────────────────────────────
UPDATE articles SET status = 'published' WHERE is_published = TRUE AND status = 'draft';
