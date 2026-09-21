-- ─────────────────────────────────────────────────────────────────
-- INDEX MANQUANTS + CONTRAINTES D'INTÉGRITÉ
-- Idempotente. Les CHECK sont ajoutés NOT VALID puis validés : si des lignes existantes les violent
-- (données historiques), la contrainte reste active pour toute nouvelle écriture sans faire échouer
-- le déploiement — un NOTICE l'indique et une validation manuelle pourra suivre après nettoyage.
-- ─────────────────────────────────────────────────────────────────

-- Index sur les colonnes de jointure / de filtre utilisées par les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product  ON order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_video    ON order_items(video_id)   WHERE video_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user        ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active_new  ON products(created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_videos_active_pub    ON videos(published_at DESC NULLS LAST) WHERE is_active = TRUE;

-- Un utilisateur ne peut donner qu'un avis par produit / par vidéo (le contrôle applicatif
-- SELECT-puis-INSERT laissait passer deux avis simultanés). Non créé si des doublons existent déjà.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM reviews WHERE product_id IS NOT NULL GROUP BY user_id, product_id HAVING COUNT(*) > 1) THEN
    RAISE NOTICE 'reviews : doublons (user_id, product_id), index unique NON créé — dédoublonner puis relancer.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_user_product ON reviews(user_id, product_id) WHERE product_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM reviews WHERE video_id IS NOT NULL GROUP BY user_id, video_id HAVING COUNT(*) > 1) THEN
    RAISE NOTICE 'reviews : doublons (user_id, video_id), index unique NON créé — dédoublonner puis relancer.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_user_video ON reviews(user_id, video_id) WHERE video_id IS NOT NULL;
  END IF;
END $$;

-- Montants et quantités : jamais négatifs (un prix négatif annulait le total d'un panier)
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('products',    'chk_products_price_nonneg',      'price >= 0'),
    ('products',    'chk_products_discount_nonneg',   'discount_price IS NULL OR discount_price >= 0'),
    ('videos',      'chk_videos_price_nonneg',        'price >= 0'),
    ('orders',      'chk_orders_amounts_nonneg',      'subtotal >= 0 AND total_amount >= 0'),
    ('order_items', 'chk_order_items_qty_pos',        'quantity > 0'),
    ('order_items', 'chk_order_items_amounts_nonneg', 'unit_price >= 0 AND subtotal >= 0'),
    ('payments',    'chk_payments_amount_nonneg',     'amount >= 0')
  ) AS t(tbl, cname, expr)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c.cname) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', c.tbl, c.cname, c.expr);
      BEGIN
        EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', c.tbl, c.cname);
      EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '% : des lignes existantes la violent — contrainte laissée NOT VALID (nouvelles écritures contrôlées).', c.cname;
      END;
    END IF;
  END LOOP;
END $$;
