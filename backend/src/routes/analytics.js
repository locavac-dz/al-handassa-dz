const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

// Toutes les statistiques sont calculées en base. Le chiffre d'affaires ne compte que les commandes
// payées (orders.status = 'paid') ; il n'existe pas de colonne orders.payment_status.

// Variation en % entre la période courante et la précédente (null si la précédente est vide)
function pctChange(current, previous) {
  const c = parseFloat(current) || 0;
  const p = parseFloat(previous) || 0;
  if (p === 0) return c === 0 ? 0 : null;
  return ((c - p) / p) * 100;
}

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [totals, monthly, growth, recent, periods] = await Promise.all([
      query(`SELECT
               (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'paid') AS revenue,
               (SELECT COUNT(*) FROM orders) AS orders,
               (SELECT COUNT(*) FROM users) AS users,
               (SELECT COUNT(DISTINCT user_id) FROM orders WHERE status = 'paid') AS buyers`),
      query(`SELECT DATE_TRUNC('month', created_at) AS month, COALESCE(SUM(total_amount), 0) AS amount
               FROM orders WHERE status = 'paid' AND created_at > NOW() - interval '12 months'
              GROUP BY 1 ORDER BY 1`),
      query(`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS users
               FROM users WHERE created_at > NOW() - interval '12 months'
              GROUP BY 1 ORDER BY 1`),
      query(`SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, u.first_name, u.last_name
               FROM orders o JOIN users u ON u.id = o.user_id
              ORDER BY o.created_at DESC LIMIT 10`),
      // 30 derniers jours contre les 30 jours précédents
      query(`SELECT
               COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid' AND created_at > NOW() - interval '30 days'), 0) AS rev_cur,
               COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid' AND created_at <= NOW() - interval '30 days' AND created_at > NOW() - interval '60 days'), 0) AS rev_prev,
               COUNT(*) FILTER (WHERE created_at > NOW() - interval '30 days') AS ord_cur,
               COUNT(*) FILTER (WHERE created_at <= NOW() - interval '30 days' AND created_at > NOW() - interval '60 days') AS ord_prev,
               (SELECT COUNT(*) FROM users WHERE created_at > NOW() - interval '30 days') AS usr_cur,
               (SELECT COUNT(*) FROM users WHERE created_at <= NOW() - interval '30 days' AND created_at > NOW() - interval '60 days') AS usr_prev
             FROM orders`),
    ]);

    const t = totals.rows[0];
    const p = periods.rows[0];
    const totalUsers = parseInt(t.users, 10) || 0;
    const fmtMonth = (d) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    res.json({
      totalRevenue: parseFloat(t.revenue) || 0,
      totalOrders: parseInt(t.orders, 10) || 0,
      totalUsers,
      // part des utilisateurs ayant au moins une commande payée
      conversionRate: totalUsers > 0 ? (parseInt(t.buyers, 10) || 0) / totalUsers : 0,
      monthlyRevenue: monthly.rows.map(r => ({ month: fmtMonth(r.month), amount: parseFloat(r.amount) || 0 })),
      userGrowth: growth.rows.map(r => ({ month: fmtMonth(r.month), users: parseInt(r.users, 10) || 0 })),
      recentOrders: recent.rows.map(o => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: `${o.first_name} ${o.last_name}`.trim(),
        total_amount: parseFloat(o.total_amount) || 0,
        status: o.status,
        created_at: o.created_at,
      })),
      revenueChange: pctChange(p.rev_cur, p.rev_prev),
      ordersChange: pctChange(p.ord_cur, p.ord_prev),
      usersChange: pctChange(p.usr_cur, p.usr_prev),
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/revenue — chiffre d'affaires mensuel (12 derniers mois, commandes payées)
router.get('/revenue', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month, COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders WHERE status = 'paid' AND created_at > NOW() - interval '12 months'
        GROUP BY 1 ORDER BY 1`
    );
    res.json({ data: result.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) || 0 })) });
  } catch (err) { next(err); }
});

// GET /api/analytics/users — nombre cumulé d'inscrits à la fin de chaque mois (12 derniers mois)
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(m.month, 'YYYY-MM-DD') AS date,
              (SELECT COUNT(*) FROM users u WHERE u.created_at < m.month + interval '1 month') AS total
         FROM generate_series(DATE_TRUNC('month', NOW()) - interval '11 months', DATE_TRUNC('month', NOW()), interval '1 month') AS m(month)
        ORDER BY m.month`
    );
    res.json({ data: result.rows.map(r => ({ date: r.date, total: parseInt(r.total, 10) || 0 })) });
  } catch (err) { next(err); }
});

module.exports = router;
