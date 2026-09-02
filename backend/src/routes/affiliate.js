const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const crypto = require('crypto');

// Register as affiliate
router.post('/register', authenticate, async (req, res) => {
  try {
    const { bankAccount, businessName } = req.body;

    // Generate unique affiliate code
    const affiliateCode = `AFF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const result = await query(
      `INSERT INTO affiliates (user_id, code, status, commission_rate, bank_account, business_name, created_at)
       VALUES ($1, $2, 'active', 10, $3, $4, NOW())
       RETURNING *`,
      [req.user.id, affiliateCode, bankAccount, businessName]
    );

    res.json({
      success: true,
      affiliate: result.rows[0],
      affiliateLink: `${process.env.APP_URL}?ref=${affiliateCode}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get affiliate dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const affiliateResult = await query(
      'SELECT * FROM affiliates WHERE user_id = $1',
      [req.user.id]
    );

    if (!affiliateResult.rows.length) {
      return res.status(404).json({ error: 'Not an affiliate' });
    }

    const affiliate = affiliateResult.rows[0];

    // Get sales data
    const [salesResult, revenueResult, clicksResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count FROM orders WHERE affiliate_id = $1 AND payment_status = 'completed'`,
        [affiliate.id]
      ),
      query(
        `SELECT SUM(total_amount * commission_rate / 100) as total FROM orders
         WHERE affiliate_id = $1 AND payment_status = 'completed'`,
        [affiliate.id]
      ),
      query(
        `SELECT COUNT(*) as count FROM activity_log WHERE source_affiliate = $1`,
        [affiliate.id]
      )
    ]);

    res.json({
      affiliate,
      stats: {
        totalSales: parseInt(salesResult.rows[0]?.count) || 0,
        totalCommission: parseFloat(revenueResult.rows[0]?.total) || 0,
        totalClicks: parseInt(clicksResult.rows[0]?.count) || 0,
        conversionRate: clicksResult.rows[0]?.count > 0
          ? ((parseInt(salesResult.rows[0]?.count) / parseInt(clicksResult.rows[0]?.count)) * 100).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request payout
router.post('/payout/request', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    const affiliateResult = await query(
      'SELECT * FROM affiliates WHERE user_id = $1',
      [req.user.id]
    );

    if (!affiliateResult.rows.length) {
      return res.status(404).json({ error: 'Not an affiliate' });
    }

    const affiliate = affiliateResult.rows[0];

    if (affiliate.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const payoutResult = await query(
      `INSERT INTO affiliate_payouts (affiliate_id, amount, status, created_at)
       VALUES ($1, $2, 'pending', NOW())
       RETURNING *`,
      [affiliate.id, amount]
    );

    res.json({
      success: true,
      payout: payoutResult.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payout history
router.get('/payouts', authenticate, async (req, res) => {
  try {
    const affiliateResult = await query(
      'SELECT id FROM affiliates WHERE user_id = $1',
      [req.user.id]
    );

    if (!affiliateResult.rows.length) {
      return res.status(404).json({ error: 'Not an affiliate' });
    }

    const result = await query(
      'SELECT * FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY created_at DESC',
      [affiliateResult.rows[0].id]
    );

    res.json({ payouts: result.rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top affiliates (public)
router.get('/top', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        a.code, a.business_name,
        COUNT(o.id) as total_sales,
        SUM(o.total_amount * a.commission_rate / 100) as total_commission
      FROM affiliates a
      LEFT JOIN orders o ON a.id = o.affiliate_id AND o.payment_status = 'completed'
      WHERE a.status = 'active'
      GROUP BY a.id, a.code, a.business_name, a.commission_rate
      ORDER BY total_commission DESC
      LIMIT 10
    `);

    res.json({ topAffiliates: result.rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
