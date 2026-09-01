const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const validate = require('../middleware/validate');

// GET /api/users/profile
router.get('/profile', authenticate, ctrl.getProfile);

// PATCH /api/users/profile
router.patch('/profile', authenticate, uploadImage.single('avatar'), ctrl.updateProfile);

// PATCH /api/users/password
router.patch('/password', authenticate, [
  body('current_password').notEmpty().withMessage('Mot de passe actuel requis.'),
  body('new_password').isLength({ min:8 }).withMessage('Nouveau mot de passe: minimum 8 caractères.'),
], validate, ctrl.changePassword);

// GET /api/users/downloads
router.get('/downloads', authenticate, ctrl.getMyDownloads);

// GET /api/users/wishlist
router.get('/wishlist', authenticate, ctrl.getWishlist);

// POST /api/users/wishlist
router.post('/wishlist', authenticate, ctrl.toggleWishlist);

// GET /api/users/subscription
router.get('/subscription', authenticate, ctrl.getSubscription);

// ── Admin ──
router.get('/admin', authenticate, authorize('admin'), ctrl.adminList);
router.patch('/admin/:id', authenticate, authorize('admin'), ctrl.adminUpdateUser);

module.exports = router;
