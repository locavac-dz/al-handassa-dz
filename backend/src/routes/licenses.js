const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');
const { validateLicense } = require('../controllers/licenseController');

// Endpoint public appelé par l'app desktop (BétonLab DG, etc.) : pas de
// session plateforme possible, donc pas de middleware authenticate ici.
const licenseValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // largement suffisant pour des essais légitimes
  message: { error: 'Trop de tentatives, réessayez dans quelques minutes.' },
});

// POST /api/licenses/validate
router.post('/validate', licenseValidateLimiter, validateLicense);

module.exports = router;
