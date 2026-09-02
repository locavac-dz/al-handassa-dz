const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const crypto = require('crypto');

// Generate referral code for user
router.post('/generate', authenticate, async (req, res) => {
  try {
    // Check if user already has referral code
    const existing = await query(
      'SELECT * FROM referral_codes WHERE referrer_id = $1 AND is_active = TRUE',
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        code: existing.rows[0].code,
        link: `${process.env.APP_URL}?ref=${existing.rows[0].code}`
      });
    }

    // Generate new code
    const code = `REF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const result = await query(
      `INSERT INTO referral_codes (referrer_id, code, is_active, created_at)
       VALUES ($1, $2, TRUE, NOW())
       RETURNING *`,
      [req.user.id, code]
    );

    res.json({
      success: true,
      code: result.rows[0].code,
      link: `${process.env.APP_URL}?ref=${code}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track referral click
router.get('/click/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const codeResult = await query(
      'SELECT referrer_id FROM referral_codes WHERE code = $1 AND is_active = TRUE',
      [code]
    );

    if (codeResult.rows.length > 0) {
      // Log the click
      await query(
        `INSERT INTO referral_clicks (referrer_id, clicked_at)
         VALUES ($1, NOW())`,
        [codeResult.rows[0].referrer_id]
      );

      // Set cookie for tracking
      res.cookie('referral_code', code, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true
      });
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register with referral code
router.post('/signup', async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;

    // Create user (assume auth service handles this)
    // This is simplified - integrate with your actual user creation

    let newUserId = null;
    if (newUserId && referralCode) {
      // Find referrer
      const referrerResult = await query(
        'SELECT referrer_id FROM referral_codes WHERE code = $1',
        [referralCode]
      );

      if (referrerResult.rows.length > 0) {
        const referrerId = referrerResult.rows[0].referrer_id;

        // Record referral
        await query(
          `INSERT INTO referrals (referrer_id, referred_id, code, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW())`,
          [referrerId, newUserId, referralCode]
        );

        // Award referrer points
        await query(
          `UPDATE user_rewards SET referral_points = referral_points + 100
           WHERE user_id = $1`,
          [referrerId]
        );
      }
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate referral (when referred user makes first purchase)
router.post('/activate/:referralId', authenticate, async (req, res) => {
  try {
    const { referralId } = req.params;

    // Update referral status
    const referralResult = await query(
      'SELECT referrer_id FROM referrals WHERE id = $1 AND referred_id = $2',
      [referralId, req.user.id]
    );

    if (referralResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    const referrerId = referralResult.rows[0].referrer_id;

    // Mark as active
    await query(
      `UPDATE referrals SET status = 'active', activated_at = NOW()
       WHERE id = $1`,
      [referralId]
    );

    // Award both users rewards
    // Referrer gets 500 points
    await query(
      `UPDATE user_rewards SET referral_points = referral_points + 500
       WHERE user_id = $1`,
      [referrerId]
    );

    // Referred user gets 200 points
    await query(
      `UPDATE user_rewards SET referral_points = referral_points + 200
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ success: true, message: 'Referral activated! Both users awarded points.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get referral stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalResult, activeResult, rewardsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1', [req.user.id]),
      query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1 AND status = \'active\'', [req.user.id]),
      query('SELECT referral_points FROM user_rewards WHERE user_id = $1', [req.user.id])
    ]);

    const rewards = rewardsResult.rows[0]?.referral_points || 0;

    res.json({
      totalReferrals: parseInt(totalResult.rows[0]?.count) || 0,
      activeReferrals: parseInt(activeResult.rows[0]?.count) || 0,
      referralPoints: rewards,
      pendingRewards: (rewards / 100).toFixed(0) + ' DA'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.first_name, u.email,
        COUNT(r.id) as referral_count,
        SUM(CASE WHEN r.status = 'active' THEN 1 ELSE 0 END) as active_count,
        COALESCE(wr.referral_points, 0) as total_points
      FROM users u
      LEFT JOIN referrals r ON u.id = r.referrer_id
      LEFT JOIN user_rewards wr ON u.id = wr.user_id
      GROUP BY u.id, u.first_name, u.email, wr.referral_points
      HAVING COUNT(r.id) > 0
      ORDER BY active_count DESC
      LIMIT 20
    `);

    res.json({ leaderboard: result.rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem referral points
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    const rewardsResult = await query(
      'SELECT referral_points FROM user_rewards WHERE user_id = $1',
      [req.user.id]
    );

    if (!rewardsResult.rows.length || rewardsResult.rows[0].referral_points < amount) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Create credit
    await query(
      `INSERT INTO user_credits (user_id, amount, type, created_at)
       VALUES ($1, $2, 'referral_redemption', NOW())`,
      [req.user.id, amount / 100]
    );

    // Deduct points
    await query(
      `UPDATE user_rewards SET referral_points = referral_points - $1
       WHERE user_id = $2`,
      [amount, req.user.id]
    );

    res.json({
      success: true,
      creditAmount: amount / 100,
      message: `${amount / 100} DA credit added to your account!`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
