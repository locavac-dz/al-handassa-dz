const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/orders — créer une commande
router.post('/', authenticate, [
  body('items').isArray({ min:1 }).withMessage('Panier vide.'),
  body('items.*.id').notEmpty().withMessage('Identifiant article requis.'),
  body('items.*.type').isIn(['product','video']).withMessage('Type article invalide (product ou video).'),
  body('payment_method').optional().isIn(['cib','dahabiya','baridimob','ccp_virement','especes','paypal','visa','code_prepaye']).withMessage('Méthode de paiement invalide.'),
], validate, ctrl.create);

// GET /api/orders — mes commandes
router.get('/', authenticate, ctrl.getMyOrders);

// GET /api/orders/purchases — produits achetés (commandes payées)
router.get('/purchases', authenticate, ctrl.getMyPurchases);

// GET /api/orders/:id — détail commande
router.get('/:id', authenticate, ctrl.getOne);

// ── Admin ──
router.get('/admin/all', authenticate, authorize('admin'), ctrl.adminList);
router.patch('/admin/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['pending','processing','paid','failed','refunded','cancelled']).withMessage('Statut invalide.'),
], validate, ctrl.updateStatus);

module.exports = router;
