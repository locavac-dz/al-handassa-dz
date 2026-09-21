-- ─────────────────────────────────────────────────────────────────
-- NEWSLETTER : double opt-in
-- Avant, n'importe qui pouvait abonner (ou ré-abonner après désinscription) l'adresse d'un tiers
-- sans que celui-ci ait rien demandé. Un abonné n'est désormais destinataire qu'après avoir cliqué
-- le lien de confirmation reçu par email.
-- Les abonnés actifs existants sont conservés (considérés comme confirmés) UNE SEULE FOIS, à
-- l'ajout de la colonne : la migration reste sûre à rejouer sans re-confirmer les nouveaux inscrits.
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers' AND column_name = 'is_confirmed') THEN
    ALTER TABLE newsletter_subscribers
      ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN confirmed_at TIMESTAMPTZ;
    UPDATE newsletter_subscribers SET is_confirmed = TRUE, confirmed_at = subscribed_at WHERE is_active = TRUE;
  END IF;
END $$;

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter_subscribers(token);
