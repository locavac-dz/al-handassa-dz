const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const ExcelJS = require('exceljs');

// Cohort analysis
router.get('/cohorts', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        DATE_TRUNC('month', u.created_at) as cohort_month,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', u.created_at) THEN o.id END) as month_0,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', u.created_at) + interval '1 month' THEN o.id END) as month_1
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
      GROUP BY DATE_TRUNC('month', u.created_at)
      ORDER BY cohort_month DESC
      LIMIT 12
    `);

    res.json({ cohorts: result.rows });
  } catch (error) {
    next(error);
  }
});

// Churn prediction — clients dont le dernier achat payé date de plus de 90 jours (ou qui n'ont jamais acheté)
router.get('/churn-prediction', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.email, u.first_name,
        MAX(o.created_at) as last_purchase,
        EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as days_since_purchase,
        COUNT(o.id) as total_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
      GROUP BY u.id, u.email, u.first_name
      HAVING MAX(o.created_at) < NOW() - interval '90 days' OR MAX(o.created_at) IS NULL
      ORDER BY last_purchase DESC NULLS LAST
      LIMIT 500
    `);

    const atriskUsers = result.rows.map(user => ({
      ...user,
      churnRisk: user.days_since_purchase === null ? 'never_purchased'
        : user.days_since_purchase > 180 ? 'high' : 'medium'
    }));

    res.json({ atriskUsers });
  } catch (error) {
    next(error);
  }
});

// Revenue forecasting (simple linear regression)
router.get('/forecast', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // 90 jours consécutifs, jours sans vente à 0 : la pente reflète le temps réel
    const result = await query(`
      SELECT d.day::date as date, COALESCE(SUM(o.total_amount), 0) as revenue
      FROM generate_series(DATE_TRUNC('day', NOW()) - interval '89 days', DATE_TRUNC('day', NOW()), interval '1 day') AS d(day)
      LEFT JOIN orders o ON DATE_TRUNC('day', o.created_at) = d.day AND o.status = 'paid'
      GROUP BY d.day
      ORDER BY d.day
    `);

    const data = result.rows;

    // Régression linéaire simple
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => parseFloat(d.revenue) || 0);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;

    // Forecast next 30 days
    const forecast = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      predictedRevenue: Math.max(0, intercept + slope * (n + i))
    }));

    res.json({
      historical: data,
      forecast,
      trend: slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'flat'
    });
  } catch (error) {
    next(error);
  }
});

// Export as Excel
router.get('/export/excel', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const ordersResult = await query(`
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, u.email, u.first_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 1000
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order', key: 'order_number', width: 16 },
      { header: 'Customer', key: 'first_name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Amount', key: 'total_amount', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'created_at', width: 15 }
    ];

    worksheet.addRows(ordersResult.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
});

// Custom report builder
// Colonnes et filtres passent par une liste blanche / des paramètres liés : aucune valeur venant du
// client n'est concaténée dans le SQL (le SELECT dynamique permettait de lire password_hash ou
// d'exécuter des requêtes empilées).
const REPORT_COLUMNS = {
  order_number:        'o.order_number',
  status:              'o.status',
  subtotal:            'o.subtotal',
  discount_amount:     'o.discount_amount',
  total_amount:        'o.total_amount',
  payment_method:      'o.payment_method',
  coupon_code:         'o.coupon_code',
  created_at:          'o.created_at',
  customer_email:      'u.email',
  customer_first_name: 'u.first_name',
  customer_last_name:  'u.last_name',
};
const ORDER_STATUSES = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'];
const REPORT_MAX_ROWS = 10000;

router.post('/custom-report', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { columns, filters = {}, format = 'json' } = req.body || {};

    if (!Array.isArray(columns) || !columns.length || columns.length > Object.keys(REPORT_COLUMNS).length) {
      return res.status(400).json({ error: 'columns doit être une liste non vide de colonnes autorisées.' });
    }
    const unknown = columns.filter(c => typeof c !== 'string' || !Object.hasOwn(REPORT_COLUMNS, c));
    if (unknown.length) {
      return res.status(400).json({ error: 'Colonne non autorisée.', allowed: Object.keys(REPORT_COLUMNS) });
    }
    if (!['json', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: "format doit être 'json' ou 'xlsx'." });
    }
    if (typeof filters !== 'object' || filters === null || Array.isArray(filters)) {
      return res.status(400).json({ error: 'filters invalide.' });
    }

    const conds = [];
    const params = [];
    const isoDate = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;

    for (const [key, op] of [['dateFrom', '>='], ['dateTo', '<=']]) {
      if (filters[key] === undefined || filters[key] === null || filters[key] === '') continue;
      if (typeof filters[key] !== 'string' || !isoDate.test(filters[key]) || Number.isNaN(Date.parse(filters[key]))) {
        return res.status(400).json({ error: `${key} invalide (format AAAA-MM-JJ attendu).` });
      }
      params.push(filters[key]);
      conds.push(`o.created_at ${op} $${params.length}`);
    }
    if (filters.status) {
      if (!ORDER_STATUSES.includes(filters.status)) {
        return res.status(400).json({ error: 'status invalide.', allowed: ORDER_STATUSES });
      }
      params.push(filters.status);
      conds.push(`o.status = $${params.length}::order_status`);
    }
    if (filters.minAmount !== undefined && filters.minAmount !== null && filters.minAmount !== '') {
      const min = Number(filters.minAmount);
      if (!Number.isFinite(min) || min < 0) return res.status(400).json({ error: 'minAmount invalide.' });
      params.push(min);
      conds.push(`o.total_amount >= $${params.length}`);
    }

    const select = columns.map(c => `${REPORT_COLUMNS[c]} AS "${c}"`).join(', ');
    const sql = `SELECT ${select} FROM orders o JOIN users u ON o.user_id = u.id
                 ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''}
                 ORDER BY o.created_at DESC LIMIT ${REPORT_MAX_ROWS}`;
    const result = await query(sql, params);

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      worksheet.columns = columns.map(col => ({ header: col, key: col }));
      worksheet.addRows(result.rows);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({ data: result.rows });
    }

  } catch (error) {
    next(error);
  }
});

// Segment analytics — clients selon leurs achats PAYÉS
const SEGMENT_HAVING = {
  'all': '',
  'high-value': 'HAVING COALESCE(SUM(o.total_amount), 0) > 10000',
  'frequent-buyers': 'HAVING COUNT(o.id) > 5',
  'dormant': "HAVING MAX(o.created_at) < NOW() - interval '6 months'",
};
router.get('/segments/:segment', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { segment } = req.params;
    if (!Object.hasOwn(SEGMENT_HAVING, segment)) {
      return res.status(400).json({ error: 'Segment inconnu.', allowed: Object.keys(SEGMENT_HAVING) });
    }

    // Les alias (total_purchases…) ne sont pas utilisables dans WHERE : filtre sur agrégats via HAVING
    const result = await query(`
      SELECT
        u.id, u.email, u.first_name,
        COUNT(o.id) as purchase_count,
        COALESCE(SUM(o.total_amount), 0) as total_purchases,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.created_at) as last_purchase
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
      GROUP BY u.id, u.email, u.first_name
      ${SEGMENT_HAVING[segment]}
      ORDER BY total_purchases DESC
      LIMIT 500
    `);

    res.json({ segment, users: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
