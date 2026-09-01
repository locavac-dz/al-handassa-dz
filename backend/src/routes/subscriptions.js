const router = require('express').Router();
const { body } = require('express-validator');
const { query, getClient } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const PLANS = {
  standard: { monthly: 990, annual: 8900 },
  pro:      { monthly: 2490, annual: 22500 },
};

// GET /api/subscriptions/plans — tarifs publics
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      { id: 'free', name: 'Gratuit', prices: { monthly: 0, annual: 0 },
        features: ['5 téléchargements/mois','Cours gratuits','3 vidéos gratuites'] },
      { id: 'standard', name: 'Standard', prices: PLANS.standard,
        features: ['Téléchargements illimités','50+ ouvrages','Vidéos HD','Examens corrigés','Normes DTR/RPA'] },
      { id: 'pro', name: 'Pro Ingénieur', prices: PLANS.pro,
        features: ['Tout Standard','200+ publications','Webinaires live','Modèles BIM','Certificat'] },
    ],
  });
});

// POST /api/subscriptions — s'abonner (crée commande + paiement)
router.post('/', authenticate, [
  body('plan').isIn(['standard','pro']),
  body('billing_cycle').isIn(['monthly','annual']),
  body('payment_method').isIn(['cib','dahabiya','baridimob','ccp_virement','code_prepaye']),
], validate, async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { plan, billing_cycle, payment_method } = req.body;
    const amount = PLANS[plan][billing_cycle];

    // Créer commande pour l'abonnement
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, subtotal, total_amount, payment_method)
       VALUES ($1,'pending',$2,$2,$3) RETURNING *`,
      [req.user.id, amount, payment_method]
    );
    const order = orderRes.rows[0];

    await client.query(
      `INSERT INTO order_items (order_id, item_type, title, unit_price, quantity, subtotal)
       VALUES ($1,'subscription',$2,$3,1,$3)`,
      [order.id, `Abonnement ${plan} (${billing_cycle})`, amount]
    );

    const subRes = await client.query(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, amount, payment_method)
       VALUES ($1,$2,$3,'pending',$4,$5) RETURNING id`,
      [req.user.id, plan, billing_cycle, amount, payment_method]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Abonnement initié. Procédez au paiement.',
      order_id: order.id,
      order_number: order.order_number,
      subscription_id: subRes.rows[0].id,
      amount,
      billing_cycle,
      plan,
      next_step: `/api/payment/${payment_method === 'cib' || payment_method === 'dahabiya' ? 'satim' : payment_method}/initiate`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/subscriptions/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, o.order_number
       FROM subscriptions s LEFT JOIN orders o ON o.user_id=s.user_id AND o.status='paid'
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 5`,
      [req.user.id]
    );
    const user = await query('SELECT subscription_plan, subscription_expires_at FROM users WHERE id=$1', [req.user.id]);
    res.json({
      current_plan: user.rows[0].subscription_plan,
      expires_at: user.rows[0].subscription_expires_at,
      history: result.rows,
    });
  } catch (err) { next(err); }
});

// DELETE /api/subscriptions — annuler le renouvellement
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await query(
      `UPDATE subscriptions SET auto_renew=FALSE, cancelled_at=NOW()
       WHERE user_id=$1 AND status='active'`,
      [req.user.id]
    );
    res.json({ message: 'Renouvellement automatique annulé. Votre accès reste valable jusqu\'à expiration.' });
  } catch (err) { next(err); }
});

// ── Admin ──
router.get('/admin/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT
        subscription_plan,
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE subscription_expires_at > NOW() OR subscription_plan='free') AS active_users
      FROM users GROUP BY subscription_plan
    `);
    const revenue = await query(`
      SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS revenue
      FROM orders WHERE status='paid'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 12
    `);
    res.json({ plans: stats.rows, revenue: revenue.rows });
  } catch (err) { next(err); }
});

module.exports = router;
