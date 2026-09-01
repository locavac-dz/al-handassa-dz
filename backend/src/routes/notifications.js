const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Send notification (Email, SMS, Push)
router.post('/send', authenticate, async (req, res) => {
  const { userId, type, title, message, data } = req.body;

  try {
    // Email
    if (type === 'email' || type === 'all') {
      // await emailService.send(user.email, title, message);
    }

    // SMS (Twilio)
    if (type === 'sms' || type === 'all') {
      // await smsService.send(user.phone, message);
    }

    // Push (Firebase)
    if (type === 'push' || type === 'all') {
      // await pushService.send(user.device_token, { title, message, data });
    }

    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user notifications
router.get('/', authenticate, (req, res) => {
  const notifications = [
    { id: 1, title: 'Commande confirmée', message: 'Votre achat #123 est confirmé', read: false, created_at: '2026-09-01T10:00:00Z' },
    { id: 2, title: 'Nouveau produit', message: 'Cours Structure Métallique disponible', read: false, created_at: '2026-09-01T09:00:00Z' },
    { id: 3, title: 'Remise appliquée', message: 'Coupon WELCOME10 vous donne 10% de réduction', read: true, created_at: '2026-08-31T15:00:00Z' }
  ];
  res.json({ data: notifications });
});

// Mark as read
router.patch('/:id/read', authenticate, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
