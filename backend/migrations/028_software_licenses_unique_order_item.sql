-- ─────────────────────────────────────────────────────────────────
-- LICENCES : une seule licence par article de commande
-- Filet de sécurité de la livraison idempotente (utils/fulfillment.js) : même si deux
-- livraisons se croisaient, la base refuse une seconde licence pour le même order_item.
-- Idempotent ; si des doublons existent déjà (à traiter à la main), l'index n'est pas créé
-- et la migration n'échoue pas — un NOTICE l'indique.
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM software_licenses
    WHERE order_item_id IS NOT NULL
    GROUP BY order_item_id HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'software_licenses : doublons sur order_item_id, index unique NON créé — dédoublonner puis relancer la migration.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_software_licenses_order_item
      ON software_licenses(order_item_id) WHERE order_item_id IS NOT NULL;
  END IF;
END $$;
