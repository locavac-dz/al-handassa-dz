const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const pwdRules = [
  body('password').isLength({ min: 8 }).withMessage('Mot de passe: minimum 8 caractères.'),
];

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('first_name').trim().notEmpty().withMessage('Prénom requis.'),
  body('last_name').trim().notEmpty().withMessage('Nom requis.'),
  ...pwdRules,
], validate, ctrl.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
], validate, ctrl.login);

// POST /api/auth/refresh
router.post('/refresh', [
  body('refresh_token').notEmpty().withMessage('Refresh token requis.'),
], validate, ctrl.refresh);

// POST /api/auth/logout
router.post('/logout', authenticate, ctrl.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
], validate, ctrl.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis.'),
  ...pwdRules,
], validate, ctrl.resetPassword);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.getMe);

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', ctrl.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authenticate, ctrl.resendVerification);

module.exports = router;
