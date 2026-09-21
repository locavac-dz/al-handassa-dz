/**
 * Livraison d'une commande payée — point d'entrée UNIQUE pour tous les moyens de paiement
 * (retour SATIM, validation manuelle admin CCP/BaridiMob…).
 *
 * settleOrder() est idempotente : le passage de la commande à 'paid' sert de verrou
 * (UPDATE ... WHERE status IN (...) — atomique en PostgreSQL). Seul l'appel qui fait
 * réellement basculer la commande livre : téléchargements, accès vidéo, abonnement, licences.
 * Un rejeu (callback rejoué, double clic admin, deux paiements pour une commande) ne
 * duplique donc rien.
 *
 * À appeler dans une transaction ouverte (client pg), avant COMMIT.
 */
const { issueSoftwareLicenses } = require('./license');

// États depuis lesquels une commande peut être marquée payée.
// 'paid' (déjà livrée), 'refunded' et 'cancelled' sont volontairement exclus.
const PAYABLE_ORDER_STATES = ['pending', 'processing', 'failed'];

async function unlockDownloads(client, orderId, userId) {
  await client.query(
    `INSERT INTO user_downloads (user_id, product_id, order_item_id)
     SELECT $2, oi.product_id, oi.id
     FROM order_items oi
     WHERE oi.order_id = $1 AND oi.item_type = 'product' AND oi.product_id IS NOT NULL
     ON CONFLICT DO NOTHING`,
    [orderId, userId]
  );
}

async function unlockVideos(client, orderId, userId) {
  await client.query(
    `INSERT INTO user_video_access (user_id, video_id, order_id)
     SELECT $2, oi.video_id, oi.order_id
     FROM order_items oi
     WHERE oi.order_id = $1 AND oi.item_type = 'video' AND oi.video_id IS NOT NULL
     ON CONFLICT (user_id, video_id) DO NOTHING`,
    [orderId, userId]
  );
}

async function activateSubscriptionIfAny(client, orderId, userId, paymentId) {
  const subItem = await client.query(
    `SELECT title, unit_price FROM order_items WHERE order_id=$1 AND item_type='subscription' LIMIT 1`,
    [orderId]
  );
  if (!subItem.rows.length) return null;

  // Le titre est produit par POST /api/subscriptions : "Abonnement <plan> (<cycle>)"
  const match = subItem.rows[0].title.match(/Abonnement\s+(\w+)\s+\((\w+)\)/i);
  if (!match) return null;
  const plan = match[1].toLowerCase();
  const cycle = match[2].toLowerCase();
  const months = cycle === 'annual' ? 12 : 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);

  await client.query(
    `UPDATE users SET subscription_plan=$1, subscription_expires_at=$2 WHERE id=$3`,
    [plan, expires, userId]
  );

  // Rattache la demande d'abonnement en attente la plus récente de l'utilisateur pour ce plan
  const updated = await client.query(
    `UPDATE subscriptions
        SET status='active', starts_at=NOW(), expires_at=$1, payment_id=$4, updated_at=NOW()
      WHERE id = (SELECT id FROM subscriptions
                   WHERE user_id=$2 AND status='pending' AND plan=$3::subscription_plan
                   ORDER BY created_at DESC LIMIT 1)`,
    [expires, userId, plan, paymentId || null]
  );
  if (!updated.rowCount) {
    // Aucune demande en attente (abonnement créé hors du flux normal) : on garde une trace
    await client.query(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, amount, payment_id, starts_at, expires_at)
       VALUES ($1,$2::subscription_plan,$3::billing_cycle,'active',$4,$5,NOW(),$6)`,
      [userId, plan, cycle === 'annual' ? 'annual' : 'monthly', subItem.rows[0].unit_price, paymentId || null, expires]
    );
  }
  return { plan, billing_cycle: cycle, expires_at: expires };
}

/**
 * @returns {{ fulfilled: boolean, licenses: object[], subscription: object|null }}
 *   fulfilled=false : la commande était déjà payée (rejeu) ou n'est plus payable (annulée/remboursée)
 */
async function settleOrder(client, { orderId, userId, paymentId }) {
  const gate = await client.query(
    `UPDATE orders SET status='paid', updated_at=NOW()
      WHERE id=$1 AND status = ANY($2::order_status[])
      RETURNING id`,
    [orderId, PAYABLE_ORDER_STATES]
  );
  if (!gate.rows.length) return { fulfilled: false, licenses: [], subscription: null };

  await unlockDownloads(client, orderId, userId);
  await unlockVideos(client, orderId, userId);
  const subscription = await activateSubscriptionIfAny(client, orderId, userId, paymentId);
  const licenses = await issueSoftwareLicenses(client, orderId, userId);
  return { fulfilled: true, licenses, subscription };
}

module.exports = { settleOrder, PAYABLE_ORDER_STATES };
