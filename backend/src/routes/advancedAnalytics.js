const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Cohort analysis
router.get('/cohorts', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        DATE_TRUNC('month', u.created_at) as cohort_month,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', u.created_at) THEN o.id END) as month_0,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', u.created_at) + interval '1 month' THEN o.id END) as month_1
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY DATE_TRUNC('month', u.created_at)
      ORDER BY cohort_month DESC
      LIMIT 12
    `);

    res.json({ cohorts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Churn prediction
router.get('/churn-prediction', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.email, u.first_name,
        MAX(o.created_at) as last_purchase,
        EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as days_since_purchase,
        COUNT(o.id) as total_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.email, u.first_name
      HAVING MAX(o.created_at) < NOW() - interval '90 days' OR MAX(o.created_at) IS NULL
      ORDER BY last_purchase DESC
    `);

    const atriskUsers = result.rows.map(user => ({
      ...user,
      churnRisk: user.days_since_purchase > 180 ? 'high' : user.days_since_purchase > 90 ? 'medium' : 'low'
    }));

    res.json({ atriskUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue forecasting (simple linear regression)
router.get('/forecast', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        SUM(total_amount) as revenue
      FROM orders
      WHERE payment_status = 'completed'
      AND created_at > NOW() - interval '90 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `);

    const data = result.rows;

    // Simple linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => parseFloat(d.revenue) || 0);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast next 30 days
    const forecast = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      predictedRevenue: Math.max(0, intercept + slope * (n + i))
    }));

    res.json({
      historical: data,
      forecast,
      trend: slope > 0 ? 'growing' : 'declining'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export as Excel
router.get('/export/excel', authenticate, authorize('admin'), async (req, res) => {
  try {
    const ordersResult = await query(`
      SELECT o.*, u.email, u.first_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 1000
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 12 },
      { header: 'Customer', key: 'first_name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Amount', key: 'total_amount', width: 12 },
      { header: 'Status', key: 'payment_status', width: 12 },
      { header: 'Date', key: 'created_at', width: 15 }
    ];

    worksheet.addRows(ordersResult.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
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

router.post('/custom-report', authenticate, authorize('admin'), async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Segment analytics
router.get('/segments/:segment', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { segment } = req.params;

    let where = '';
    if (segment === 'high-value') {
      where = 'WHERE total_purchases > 10000';
    } else if (segment === 'frequent-buyers') {
      where = 'WHERE purchase_count > 5';
    } else if (segment === 'dormant') {
      where = 'WHERE last_purchase < NOW() - interval \'6 months\'';
    }

    const result = await query(`
      SELECT
        u.id, u.email, u.first_name,
        COUNT(o.id) as purchase_count,
        SUM(o.total_amount) as total_purchases,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.created_at) as last_purchase
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.email, u.first_name
      ${where}
      ORDER BY total_purchases DESC
    `);

    res.json({ segment, users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
