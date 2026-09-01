const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get Stock
router.get('/products/:productId/stock', (req, res) => {
  res.json({
    product_id: req.params.productId,
    quantity: 234,
    reserved: 12,
    available: 222,
    low_stock_threshold: 50
  });
});

// Update Stock
router.patch('/products/:productId/stock', authenticate, authorize('admin'), (req, res) => {
  const { quantity } = req.body;
  res.json({ success: true, new_quantity: quantity });
});

// Low Stock Alert
router.get('/low-stock', authenticate, authorize('admin'), (req, res) => {
  res.json({
    data: [
      { product_id: 5, title: 'Product 5', current: 3, threshold: 50 },
      { product_id: 12, title: 'Product 12', current: 8, threshold: 50 }
    ]
  });
});

// Stock History
router.get('/history/:productId', authenticate, authorize('admin'), (req, res) => {
  res.json({
    data: [
      { date: '2026-09-01', action: 'sold', quantity: 5, balance: 234 },
      { date: '2026-08-31', action: 'restocked', quantity: 100, balance: 239 }
    ]
  });
});

module.exports = router;
