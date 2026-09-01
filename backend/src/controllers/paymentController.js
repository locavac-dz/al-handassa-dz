const { query, getClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { sendPaymentReceived, sendPaymentValidated } = require('../utils/email');

// ─── SATIM (CIB / Dahabiya) ──────────────────────────────────────
async function initiateSatim(req, res, next) {
  try {
    const { order_id } = req.body;
    const orderRes = await query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [order_id, req.user.id]);
    if (!orderRes.rows.length) throw new AppError('Commande introuvable.', 404);

    const order = orderRes.rows[0];
    if (order.status !== 'pending') throw new AppError('Commande déjà traitée.', 400);

    // Créer une entrée paiement
    const payRes = await query(
      `INSERT INTO payments (order_id, user_id, method, status, amount)
       VALUES ($1,$2,'cib','pending',$3) RETURNING id`,
      [order_id, req.user.id, order.total_amount]
    );
    const paymentId = payRes.rows[0].id;

    // Construction URL SATIM (à adapter selon la doc SATIM officielle)
    const satimParams = new URLSearchParams({
      userName: process.env.SATIM_USERNAME,
      password: process.env.SATIM_PASSWORD,
      orderNumber: order.order_number,
      amount: Math.round(order.total_amount * 100), // centimes
      currency: '012', // DZD ISO 4217
      returnUrl: `${process.env.SATIM_SUCCESS_URL}?payment_id=${paymentId}`,
      failUrl: `${process.env.SATIM_FAIL_URL}?payment_id=${paymentId}`,
      language: 'FR',
      description: `Al Handassa.dz — Commande ${order.order_number}`,
    });

    const gatewayUrl = `${process.env.SATIM_API_URL}/register.do?${satimParams}`;

    // En production : appeler l'API SATIM et récupérer l'orderId + formUrl
    // Pour la démo, on simule la réponse
    const mockSatimResponse = {
      orderId: `SATIM-${Date.now()}`,
      formUrl: `https://satim.dz/payment/merchants/pay?mdOrder=SATIM-${Date.now()}`,
    };

    await query(
      'UPDATE payments SET satim_order_id=$1, gateway_response=$2 WHERE id=$3',
      [mockSatimResponse.orderId, JSON.stringify(mockSatimResponse), paymentId]
    );

    res.json({
      payment_id: paymentId,
      gateway: 'satim',
      redirect_url: mockSatimResponse.formUrl,
      satim_order_id: mockSatimResponse.orderId,
    });
  } catch (err) { next(err); }
}

// ─── SATIM Callback (retour depuis la page de paiement) ──────────
async function satimCallback(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { payment_id, orderId, respCode } = req.query;

    const payRes = await client.query('SELECT * FROM payments WHERE id=$1', [payment_id]);
    if (!payRes.rows.length) throw new AppError('Paiement introuvable.', 404);

    const payment = payRes.rows[0];
    const success = respCode === '00'; // 00 = succès SATIM

    await client.query(
      `UPDATE payments SET status=$1, ${success?'completed_at':'failed_at'}=NOW(), gateway_response=$2 WHERE id=$3`,
      [success ? 'completed' : 'failed', JSON.stringify(req.query), payment_id]
    );

    if (success) {
      await client.query(`UPDATE orders SET status='paid' WHERE id=$1`, [payment.order_id]);
      await unlockDownloads(client, payment.order_id, payment.user_id);
      await activateSubscriptionIfAny(client, payment.order_id, payment.user_id);
    } else {
      await client.query("UPDATE orders SET status='failed' WHERE id=$1", [payment.order_id]);
    }

    await client.query('COMMIT');
    const redirectUrl = success
      ? `${process.env.FRONTEND_URL}/payment/success?order=${payment.order_id}`
      : `${process.env.FRONTEND_URL}/payment/fail?reason=declined`;

    res.redirect(redirectUrl);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ─── BaridiMob ────────────────────────────────────────────────────
async function initiateBaridiMob(req, res, next) {
  try {
    const { order_id } = req.body;
    const orderRes = await query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [order_id, req.user.id]);
    if (!orderRes.rows.length) throw new AppError('Commande introuvable.', 404);

    const order = orderRes.rows[0];
    const payRes = await query(
      `INSERT INTO payments (order_id, user_id, method, status, amount)
       VALUES ($1,$2,'baridimob','pending',$3) RETURNING id`,
      [order_id, req.user.id, order.total_amount]
    );

    // Simulation de la référence BaridiMob
    const baridimobRef = `BM-${order.order_number}-${Date.now()}`;
    await query('UPDATE payments SET baridimob_ref=$1 WHERE id=$2', [baridimobRef, payRes.rows[0].id]);

    res.json({
      payment_id: payRes.rows[0].id,
      gateway: 'baridimob',
      reference: baridimobRef,
      amount: order.total_amount,
      currency: 'DZD',
      instructions: {
        fr: `Ouvrez BaridiMob, allez dans "Paiement de factures", saisissez la référence ${baridimobRef} et le montant ${order.total_amount} DZD.`,
        ar: `افتح تطبيق بريدي موب، اذهب إلى "دفع الفواتير"، أدخل المرجع ${baridimobRef} والمبلغ ${order.total_amount} دج.`,
      },
      merchant_code: process.env.BARIDIMOB_MERCHANT_ID || '000001',
    });
  } catch (err) { next(err); }
}

// ─── Code Prépayé ─────────────────────────────────────────────────
async function redeemPrepaidCode(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { code } = req.body;

    const codeRes = await client.query(
      `SELECT * FROM prepaid_codes WHERE code=$1 AND is_used=FALSE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [code.toUpperCase()]
    );
    if (!codeRes.rows.length) throw new AppError('Code invalide ou déjà utilisé.', 400);

    const prepaid = codeRes.rows[0];

    // Activer l'abonnement
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    await client.query(
      `UPDATE users SET subscription_plan=$1, subscription_expires_at=$2 WHERE id=$3`,
      [prepaid.plan, expires, req.user.id]
    );

    await client.query(
      'UPDATE prepaid_codes SET is_used=TRUE, used_by=$1, used_at=NOW() WHERE id=$2',
      [req.user.id, prepaid.id]
    );

    await client.query(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, amount, payment_method, starts_at, expires_at)
       VALUES ($1,$2,'monthly','active',$3,'code_prepaye',NOW(),$4)`,
      [req.user.id, prepaid.plan, prepaid.amount_dzd, expires]
    );

    await client.query('COMMIT');
    res.json({
      message: `Code activé ! Abonnement ${prepaid.plan} valable jusqu'au ${expires.toLocaleDateString('fr-DZ')}.`,
      expires_at: expires,
      plan: prepaid.plan,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ─── Paiement manuel (CCP / BaridiMob) — validation automatique ──
async function submitManualPayment(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { order_id, method, reference, proof_note } = req.body;
    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id=$1 AND user_id=$2',
      [order_id, req.user.id]
    );
    if (!orderRes.rows.length) throw new AppError('Commande introuvable.', 404);
    const order = orderRes.rows[0];
    if (order.status === 'paid') throw new AppError('Commande déjà validée.', 400);

    // Enregistrer le paiement comme complété immédiatement
    await client.query(
      `INSERT INTO payments (order_id, user_id, method, status, amount, gateway_response, completed_at)
       VALUES ($1,$2,$3,'completed',$4,$5,NOW())`,
      [order_id, req.user.id, method, order.total_amount,
       JSON.stringify({ reference, proof_note })]
    );

    // Passer la commande à "paid" directement
    await client.query("UPDATE orders SET status='paid' WHERE id=$1", [order_id]);

    // Débloquer les téléchargements (produits)
    await unlockDownloads(client, order_id, req.user.id);

    // Activer l'abonnement si la commande en contient un
    const activatedPlan = await activateSubscriptionIfAny(client, order_id, req.user.id);

    await client.query('COMMIT');

    // Email confirmation (non bloquant)
    const userRes = await query('SELECT email, first_name FROM users WHERE id=$1', [req.user.id]);
    const userInfo = userRes.rows[0];
    // Récupérer les items pour l'email
    const orderItems = await query('SELECT * FROM order_items WHERE order_id=$1', [order_id]);
    // Email "accès déverrouillé" plutôt que "en attente" — paiement validé instantanément
    sendPaymentValidated(order, userInfo, orderItems.rows).catch(e => {
      console.error('[EMAIL] sendPaymentValidated failed:', e.message);
    });
    // Si abonnement activé, envoyer aussi l'email de bienvenue abonnement (réutiliser sendWelcomeEmail)
    if (activatedPlan) {
      const { sendSubscriptionActivated } = require('../utils/email');
      if (sendSubscriptionActivated) {
        sendSubscriptionActivated(userInfo, activatedPlan).catch(e => {
          console.error('[EMAIL] sendSubscriptionActivated failed:', e.message);
        });
      }
    }

    res.json({
      message: activatedPlan
        ? `Abonnement ${activatedPlan.plan} activé jusqu'au ${new Date(activatedPlan.expires_at).toLocaleDateString('fr-DZ')} !`
        : 'Paiement confirmé ! Votre téléchargement est disponible.',
      order_number: order.order_number,
      order_id: order_id,
      auto_validated: true,
      subscription: activatedPlan,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ─── Historique paiements ─────────────────────────────────────────
async function getMyPayments(req, res, next) {
  try {
    const result = await query(
      `SELECT p.id, p.method, p.status, p.amount, p.initiated_at, p.completed_at,
              o.order_number
       FROM payments p JOIN orders o ON p.order_id = o.id
       WHERE p.user_id=$1
       ORDER BY p.initiated_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
}

// ─── Helpers internes ────────────────────────────────────────────
async function activateSubscriptionIfAny(client, orderId, userId) {
  const subItem = await client.query(
    `SELECT title FROM order_items WHERE order_id=$1 AND item_type='subscription' LIMIT 1`,
    [orderId]
  );
  if (!subItem.rows.length) return null;
  const match = subItem.rows[0].title.match(/Abonnement\s+(\w+)\s+\((\w+)\)/i);
  if (!match) return null;
  const plan = match[1];
  const cycle = match[2];
  const months = cycle === 'annual' ? 12 : 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);
  await client.query(
    `UPDATE users SET subscription_plan=$1, subscription_expires_at=$2 WHERE id=$3`,
    [plan, expires, userId]
  );
  await client.query(
    `UPDATE subscriptions SET status='active', starts_at=NOW(), expires_at=$1
     WHERE user_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1`,
    [expires, userId]
  );
  return { plan, billing_cycle: cycle, expires_at: expires };
}

async function unlockDownloads(client, orderId, userId) {
  const items = await client.query('SELECT * FROM order_items WHERE order_id=$1', [orderId]);
  for (const item of items.rows) {
    if (item.item_type === 'product' && item.product_id) {
      await client.query(
        `INSERT INTO user_downloads (user_id, product_id, order_item_id)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [userId, item.product_id, item.id]
      );
    }
  }
}

module.exports = { initiateSatim, satimCallback, initiateBaridiMob, redeemPrepaidCode, submitManualPayment, getMyPayments };
