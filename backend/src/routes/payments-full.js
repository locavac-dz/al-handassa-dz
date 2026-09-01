const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const SATIMLive = require('../config/satim-live');

const satim = new SATIMLive();

// SATIM Payment - LIVE INTEGRATION
router.post('/satim/initiate', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order from database
    const { query } = require('../config/database');
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Create payment with SATIM LIVE
    const payment = await satim.createPayment(order);

    if (payment.success) {
      // Update order with transaction ID
      await query(
        'UPDATE orders SET transaction_id = $1, payment_status = $2 WHERE id = $3',
        [payment.transaction_id, 'pending', orderId]
      );

      res.json({
        success: true,
        payment_url: payment.payment_url,
        transaction_id: payment.transaction_id,
        amount: payment.amount
      });
    } else {
      res.status(400).json({ success: false, error: payment.error });
    }

  } catch (error) {
    console.error('SATIM initiate error:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// BaridiMob Payment
router.post('/baridimob/initiate', authenticate, async (req, res) => {
  const { orderId, amount, phone } = req.body;
  // Integration with BaridiMob API
  res.json({
    success: true,
    payment_url: `https://baridimob.poste.dz/pay/${orderId}`,
    reference: `BAR-${orderId}`
  });
});

// Bank Transfer Payment
router.post('/bank-transfer/initiate', authenticate, (req, res) => {
  res.json({
    success: true,
    account: 'DZAA123456789123456789',
    iban: 'DZ12345ABCD67890EF',
    swift: 'BADRDZAB',
    reference: `BANK-${Date.now()}`
  });
});

// Payment Status
router.get('/:orderId/status', authenticate, (req, res) => {
  res.json({ status: 'completed', amount: 5000, method: 'card' });
});

module.exports = router;
