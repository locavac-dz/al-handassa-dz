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
router.post('/custom-report', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { columns, filters, format } = req.body;

    let sql = 'SELECT ' + columns.join(', ') + ' FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';

    if (filters.dateFrom) sql += ` AND o.created_at >= '${filters.dateFrom}'`;
    if (filters.dateTo) sql += ` AND o.created_at <= '${filters.dateTo}'`;
    if (filters.status) sql += ` AND o.payment_status = '${filters.status}'`;
    if (filters.minAmount) sql += ` AND o.total_amount >= ${filters.minAmount}`;

    const result = await query(sql);

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      worksheet.columns = columns.map(col => ({ header: col, key: col }));
      worksheet.addRows(result.rows);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'json') {
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
