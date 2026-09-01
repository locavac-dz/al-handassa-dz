const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Coupons en mémoire (remplacer par DB en production)
const coupons = {
  'WELCOME10': { code: 'WELCOME10', discount: 10, type: 'percent', min_amount: 0, max_uses: -1, uses: 0, expiry: '2099-12-31' },
  'SUMMER20': { code: 'SUMMER20', discount: 20, type: 'percent', min_amount: 5000, max_uses: 100, uses: 45, expiry: '2026-09-30' },
  'FLAT500': { code: 'FLAT500', discount: 500, type: 'fixed', min_amount: 2000, max_uses: 50, uses: 12, expiry: '2026-12-31' },
  'STUDENT15': { code: 'STUDENT15', discount: 15, type: 'percent', min_amount: 1000, max_uses: -1, uses: 0, expiry: '2026-12-31' }
};

// Valider un coupon
router.post('/validate', authenticate, (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) {
      return res.status(400).json({ error: 'Code et montant requis' });
    }

    const coupon = coupons[code.toUpperCase()];
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon invalide' });
    }

    // Vérifier l'expiration
    if (new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ error: 'Coupon expiré' });
    }

    // Vérifier les utilisations
    if (coupon.max_uses > 0 && coupon.uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Nombre d\'utilisations atteint' });
    }

    // Vérifier le montant minimum
    if (amount < coupon.min_amount) {
      return res.status(400).json({
        error: `Montant minimum: ${coupon.min_amount} DA`
      });
    }

    // Calculer la réduction
    const discount = coupon.type === 'percent'
      ? Math.round(amount * coupon.discount / 100)
      : coupon.discount;

    const finalAmount = Math.max(0, amount - discount);

    return res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.type,
      discount_value: coupon.discount,
      discount_amount: discount,
      original_amount: amount,
      final_amount: finalAmount,
      message: `✅ Coupon appliqué: -${discount} DA`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Appliquer un coupon (enregistrer l'utilisation)
router.post('/apply/:code', authenticate, (req, res) => {
  try {
    const coupon = coupons[req.params.code.toUpperCase()];
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon invalide' });
    }

    // Incrémenter l'utilisation
    if (coupon.max_uses > 0) {
      coupon.uses++;
    }

    res.json({
      success: true,
      message: 'Coupon appliqué',
      remaining_uses: coupon.max_uses > 0 ? coupon.max_uses - coupon.uses : 'Illimité'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste des coupons disponibles (public)
router.get('/available', (req, res) => {
  const available = Object.values(coupons)
    .filter(c => new Date(c.expiry) >= new Date() && (c.max_uses < 0 || c.uses < c.max_uses))
    .map(c => ({
      code: c.code,
      type: c.type,
      value: c.discount,
      min_amount: c.min_amount,
      description: c.type === 'percent'
        ? `${c.discount}% de réduction`
        : `${c.discount} DA de réduction`
    }));

  res.json({ data: available });
});

module.exports = router;
