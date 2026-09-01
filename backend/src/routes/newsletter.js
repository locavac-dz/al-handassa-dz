const router = require('express').Router();
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

// POST /api/newsletter/subscribe
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail(),
  body('first_name').optional().trim(),
], validate, async (req, res, next) => {
  try {
    const { email, first_name, study_level } = req.body;
    const token = generateToken(16);

    await query(
      `INSERT INTO newsletter_subscribers (email, first_name, study_level, token)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET is_active=TRUE, first_name=COALESCE($2,newsletter_subscribers.first_name)`,
      [email, first_name||null, study_level||null, token]
    );

    sendEmail({
      to: email,
      subject: '📧 Bienvenue dans la newsletter Al Handassa.dz !',
      html: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#1B3A6B">Inscription confirmée ! 🎉</h2>
        <p>Vous recevrez chaque semaine les dernières ressources en génie civil et architecture.</p>
        <p style="margin-top:20px;font-size:12px;color:#888">
          <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${token}">Se désabonner</a>
        </p>
      </div>`,
    }).catch(() => {});

    res.json({ message: 'Inscription réussie ! Vérifiez votre email.' });
  } catch (err) { next(err); }
});

// GET /api/newsletter/unsubscribe?token=xxx
router.get('/unsubscribe', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) throw new AppError('Token requis.', 400);
    await query(
      'UPDATE newsletter_subscribers SET is_active=FALSE, unsubscribed_at=NOW() WHERE token=$1',
      [token]
    );
    res.json({ message: 'Désabonnement effectué.' });
  } catch (err) { next(err); }
});

// POST /api/newsletter/send — admin seulement
router.post('/send', authenticate, authorize('admin'), [
  body('subject').notEmpty(),
  body('html').notEmpty(),
], validate, async (req, res, next) => {
  try {
    const { subject, html, filter_level } = req.body;
    let sqlQ = 'SELECT email FROM newsletter_subscribers WHERE is_active=TRUE';
    const params = [];
    if (filter_level) { sqlQ += ' AND study_level=$1'; params.push(filter_level); }

    const subscribers = await query(sqlQ, params);
    const emails = subscribers.rows.map(r => r.email);

    // Envoi par batch de 50
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      await sendEmail({ to: batch.join(','), subject, html });
    }

    res.json({ message: `Newsletter envoyée à ${emails.length} abonnés.` });
  } catch (err) { next(err); }
});

module.exports = router;
