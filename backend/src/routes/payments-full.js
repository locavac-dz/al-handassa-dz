const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { SATIMPaymentGateway } = require('../config/satim');

const satim = new SATIMPaymentGateway();

// SATIM Payment
router.post('/satim/initiate', authenticate, async (req, res) => {
  const { orderId, amount } = req.body;
  const result = await satim.createPaymentRequest({ id: orderId, total_amount: amount, items: [] });
  res.json(result);
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
