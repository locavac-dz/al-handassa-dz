const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const validate = require('../middleware/validate');

// Niveaux acceptés (enum study_level en base)
const STUDY_LEVELS = ['bac_technique', 'bts', 'licence', 'master', 'ingenieur', 'professionnel'];
const CONFIRM_COOLDOWN_MS = 10 * 60 * 1000;   // pas plus d'un email de confirmation / 10 min pour une même adresse

// Empêche d'utiliser le formulaire pour bombarder des tiers d'emails de confirmation
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes. Réessayez dans une heure.' },
});

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Les liens pointent vers l'API : API_URL si défini, sinon FRONTEND_URL (même origine en production)
const linkBase = () => (process.env.API_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
const confirmUrl = (token) => `${linkBase()}/api/newsletter/confirm?token=${token}`;
const unsubscribeUrl = (token) => `${linkBase()}/api/newsletter/unsubscribe?token=${token}`;

// Page HTML minimale pour les liens cliqués depuis un email
function page(res, status, title, message) {
  res.status(status).type('html').send(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Al Handassa.dz</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;margin:0;padding:48px 16px">
<div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:32px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.08)">
<h1 style="color:#1B3A6B;font-size:1.4rem;margin:0 0 12px">${esc(title)}</h1>
<p style="color:#475569;line-height:1.6;margin:0 0 20px">${esc(message)}</p>
<a href="${esc(process.env.FRONTEND_URL || '/')}" style="color:#1B3A6B">Retour au site</a>
</div></body></html>`);
}

const isToken = (t) => typeof t === 'string' && /^[0-9a-f]{8,255}$/i.test(t);

// POST /api/newsletter/subscribe — première étape du double opt-in
router.post('/subscribe', subscribeLimiter, [
  body('email').isEmail().isLength({ max: 254 }).normalizeEmail(),
  body('first_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }),
  body('study_level').optional({ checkFalsy: true }).isIn(STUDY_LEVELS),
], validate, async (req, res, next) => {
  try {
    const { email, first_name, study_level } = req.body;
    // Réponse identique que l'adresse soit nouvelle, déjà inscrite ou en attente : pas d'énumération
    const generic = { message: "Si cette adresse est valide, un email de confirmation vient de vous être envoyé. Cliquez sur le lien qu'il contient pour finaliser votre inscription." };

    const existing = (await query(
      'SELECT is_confirmed, is_active, confirmation_sent_at FROM newsletter_subscribers WHERE email=$1', [email]
    )).rows[0];

    if (existing && existing.is_confirmed && existing.is_active) return res.json(generic);   // déjà abonné
    if (existing?.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < CONFIRM_COOLDOWN_MS) {
      return res.json(generic);                                                              // confirmation déjà envoyée
    }

    // Nouveau jeton à chaque demande ; l'abonné (ou ré-abonné après désinscription) reste INACTIF tant que
    // le lien n'a pas été cliqué : personne ne peut inscrire l'adresse d'un tiers.
    const token = generateToken(16);
    await query(
      `INSERT INTO newsletter_subscribers (email, first_name, study_level, token, is_active, is_confirmed, confirmation_sent_at)
       VALUES ($1,$2,$3,$4,FALSE,FALSE,NOW())
       ON CONFLICT (email) DO UPDATE SET
         token=$4, is_active=FALSE, is_confirmed=FALSE, confirmation_sent_at=NOW(),
         first_name=COALESCE($2, newsletter_subscribers.first_name),
         study_level=COALESCE($3, newsletter_subscribers.study_level)`,
      [email, first_name || null, study_level || null, token]
    );

    sendEmail({
      to: email,
      subject: '📧 Confirmez votre inscription à la newsletter Al Handassa.dz',
      html: `<div style="font-family:sans-serif;padding:24px;max-width:600px">
        <h2 style="color:#1B3A6B">Bonjour${first_name ? ' ' + esc(first_name) : ''},</h2>
        <p>Nous avons reçu une demande d'inscription à la newsletter Al Handassa.dz avec cette adresse.</p>
        <p><a href="${confirmUrl(token)}" style="display:inline-block;background:#1B3A6B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Confirmer mon inscription</a></p>
        <p style="margin-top:20px;font-size:12px;color:#888">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : vous ne recevrez rien.</p>
      </div>`,
    }).catch((e) => console.error('[NEWSLETTER] confirmation non envoyée :', e.message));

    res.json(generic);
  } catch (err) { next(err); }
});

// GET /api/newsletter/confirm?token=xxx — lien reçu par email
router.get('/confirm', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!isToken(token)) return page(res, 400, 'Lien invalide', "Ce lien de confirmation n'est pas valide.");
    const r = await query(
      `UPDATE newsletter_subscribers
          SET is_confirmed=TRUE, is_active=TRUE, confirmed_at=COALESCE(confirmed_at, NOW()), unsubscribed_at=NULL
        WHERE token=$1 RETURNING id`, [token]);
    if (!r.rowCount) return page(res, 404, 'Lien expiré', "Ce lien de confirmation est expiré ou déjà remplacé. Réinscrivez-vous depuis le site.");
    page(res, 200, 'Inscription confirmée', 'Merci ! Vous recevrez désormais notre newsletter. Un lien de désinscription figure dans chaque email.');
  } catch (err) { next(err); }
});

// Désinscription : GET (lien dans l'email) et POST (List-Unsubscribe-Post, désinscription en un clic)
async function unsubscribe(token) {
  if (!isToken(token)) return false;
  const r = await query(
    'UPDATE newsletter_subscribers SET is_active=FALSE, unsubscribed_at=NOW() WHERE token=$1 RETURNING id', [token]);
  return r.rowCount > 0;
}
router.get('/unsubscribe', async (req, res, next) => {
  try {
    const done = await unsubscribe(req.query.token);
    if (!done) return page(res, 404, 'Lien invalide', "Ce lien de désinscription n'est pas valide ou a déjà été remplacé.");
    page(res, 200, 'Désinscription effectuée', 'Vous ne recevrez plus notre newsletter.');
  } catch (err) { next(err); }
});
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const done = await unsubscribe(req.query.token);
    res.status(done ? 200 : 404).json({ message: done ? 'Désinscription effectuée.' : 'Lien invalide.' });
  } catch (err) { next(err); }
});

// POST /api/newsletter/send — admin seulement
// Un email par abonné CONFIRMÉ et actif : chacun ne voit que sa propre adresse (l'ancien envoi mettait
// 50 adresses dans « to », lisibles par tous) et reçoit son propre lien de désinscription.
router.post('/send', authenticate, authorize('admin'), [
  body('subject').isString().trim().notEmpty().isLength({ max: 200 }),
  body('html').isString().notEmpty(),
  body('filter_level').optional({ checkFalsy: true }).isIn(STUDY_LEVELS),
], validate, async (req, res, next) => {
  try {
    const { subject, html, filter_level } = req.body;
    let sqlQ = 'SELECT email, token FROM newsletter_subscribers WHERE is_active=TRUE AND is_confirmed=TRUE';
    const params = [];
    if (filter_level) { sqlQ += ' AND study_level=$1'; params.push(filter_level); }

    const subscribers = (await query(sqlQ, params)).rows;

    // Envoi en arrière-plan : la requête ne reste pas ouverte pendant des minutes (le transporteur limite
    // déjà le débit) ; le résultat est journalisé.
    res.status(202).json({ message: `Envoi lancé pour ${subscribers.length} abonnés confirmés.`, recipients: subscribers.length });
    (async () => {
      let sent = 0, failed = 0;
      for (const s of subscribers) {
        try {
          await sendEmail({
            to: s.email,
            subject,
            html: `${html}<p style="margin-top:24px;font-size:12px;color:#888;text-align:center">
              <a href="${unsubscribeUrl(s.token)}" style="color:#888">Se désabonner</a></p>`,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl(s.token)}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
          sent++;
        } catch (e) {
          failed++;
          console.error('[NEWSLETTER] échec pour un destinataire :', e.message);
        }
      }
      console.log(`[NEWSLETTER] terminé : ${sent} envoyés, ${failed} échecs`);
    })().catch((e) => console.error('[NEWSLETTER] envoi interrompu :', e.message));
  } catch (err) { next(err); }
});

module.exports = router;
