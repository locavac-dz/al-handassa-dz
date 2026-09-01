const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

// Register as Seller
router.post('/sellers/register', authenticate, async (req, res) => {
  const { business_name, tax_id, bank_account } = req.body;
  // Create seller account with commission setup
  res.json({
    success: true,
    seller_id: 'SELL-' + Date.now(),
    commission_rate: 0.15, // 15%
    commission_model: 'per-transaction'
  });
});

// Seller Products
router.get('/sellers/:sellerId/products', async (req, res) => {
  res.json({
    data: [
      { id: 1, title: 'Product 1', price: 5000, seller_id: req.params.sellerId }
    ]
  });
});

// Seller Dashboard
router.get('/sellers/dashboard', authenticate, authorize('seller'), (req, res) => {
  res.json({
    sales: { total: 250000, this_month: 25000 },
    products: 15,
    commission_due: 37500,
    ratings: 4.8
  });
});

// Commission Payout
router.post('/sellers/payout', authenticate, authorize('seller'), (req, res) => {
  res.json({ success: true, payout_id: 'PAYOUT-' + Date.now() });
});

module.exports = router;
