const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/payment/satim/initiate — initier paiement CIB/Dahabiya
router.post('/satim/initiate', authenticate, [
  body('order_id').isUUID(),
], validate, ctrl.initiateSatim);

// GET /api/payment/satim/callback — retour SATIM
router.get('/satim/callback', ctrl.satimCallback);

// POST /api/payment/baridimob/initiate — initier BaridiMob
router.post('/baridimob/initiate', authenticate, [
  body('order_id').isUUID(),
], validate, ctrl.initiateBaridiMob);

// POST /api/payment/prepaid — utiliser un code prépayé
router.post('/prepaid', authenticate, [
  body('code').trim().notEmpty().withMessage('Code requis.'),
], validate, ctrl.redeemPrepaidCode);

// POST /api/payment/manual — CCP virement / espèces
router.post('/manual', authenticate, [
  body('order_id').isUUID(),
  body('method').isIn(['ccp_virement','especes']),
  body('reference').optional().trim(),
], validate, ctrl.submitManualPayment);

// GET /api/payment/history
router.get('/history', authenticate, ctrl.getMyPayments);

module.exports = router;
