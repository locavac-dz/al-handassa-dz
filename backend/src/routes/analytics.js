const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

// Analytics Dashboard (Admin only)
router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  // Mock data - connect to real DB
  const analytics = {
    revenue: {
      total: 2500000,
      monthly: 125000,
      trend: '+12%'
    },
    orders: {
      total: 5432,
      pending: 23,
      completed: 5400,
      average_value: 460
    },
    users: {
      total: 8943,
      active_month: 2341,
      new_this_month: 234
    },
    products: {
      total: 357,
      active: 340,
      low_stock: 17
    },
    topProducts: [
      { id: 1, title: 'Cours Béton Armé', sales: 234, revenue: 585000 },
      { id: 2, title: 'TP Structure', sales: 189, revenue: 472500 },
      { id: 3, title: 'Logiciel AutoCAD', sales: 156, revenue: 585000 }
    ],
    salesByCategory: {
      'cours_pdf': 45000,
      'td_pdf': 32000,
      'logiciels': 28000,
      'normes': 15000,
      'pack': 12000
    },
    conversionFunnel: {
      visitors: 50000,
      add_to_cart: 3500,
      checkout: 1200,
      completed: 560,
      conversion_rate: '1.12%'
    }
  };

  res.json(analytics);
});

// Revenue Chart Data
router.get('/revenue', authenticate, authorize('admin'), (req, res) => {
  const monthlyRevenue = [
    { month: 'Jan', revenue: 98000 },
    { month: 'Feb', revenue: 102000 },
    { month: 'Mar', revenue: 115000 },
    { month: 'Apr', revenue: 128000 },
    { month: 'May', revenue: 134000 },
    { month: 'Jun', revenue: 125000 }
  ];
  res.json({ data: monthlyRevenue });
});

// User Growth
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const userGrowth = [
    { date: '2026-06-01', total: 5000 },
    { date: '2026-06-15', total: 6200 },
    { date: '2026-07-01', total: 7500 },
    { date: '2026-07-15', total: 8200 },
    { date: '2026-08-01', total: 8943 }
  ];
  res.json({ data: userGrowth });
});

module.exports = router;
