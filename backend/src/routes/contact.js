/**
 * routes/contact.js — Al Handassa.dz
 * POST /api/contact — formulaire de contact
 */
const express = require('express');
const router  = express.Router();
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');

// Rate limit strict pour éviter le spam : 5 messages / heure par IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 5,
  message: { message: 'Trop de messages envoyés. Réessayez dans une heure.' },
});

const SUBJECTS = {
  support:      '🔧 Support technique',
  commande:     '📦 Question commande',
  contenu:      '📚 Suggestion de contenu',
  partenariat:  '🤝 Partenariat',
  signalement:  '⚠️ Signalement d\'erreur',
  autre:        '💬 Autre',
};

// Échappement HTML : name, email et sujet viennent d'un visiteur anonyme et finissent dans un email HTML
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Validation d'adresse SANS regex à retour arrière (l'ancienne /^[^\s@]+@[^\s@]+\.[^\s@]+$/ était
// quadratique : ~400 Ko de points suffisaient à bloquer le serveur plusieurs minutes, sans authentification).
function isValidEmail(email) {
  if (email.length < 5 || email.length > 254) return false;
  if (/[\s<>",;\\]/.test(email)) return false;          // classe de caractères : temps linéaire
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

router.post('/', contactLimiter, async (req, res) => {
  const body = req.body || {};
  // Types et longueurs contrôlés AVANT tout autre traitement
  for (const field of ['name', 'email', 'subject', 'message']) {
    if (typeof body[field] !== 'string') {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
  }
  const name = body.name.trim().replace(/[\r\n]+/g, ' ');
  const email = body.email.trim();
  const subject = body.subject.trim();
  const message = body.message;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }
  if (name.length > 100) {
    return res.status(400).json({ message: 'Le nom est trop long (100 caractères maximum).' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Adresse email invalide.' });
  }
  if (message.length < 20) {
    return res.status(400).json({ message: 'Le message est trop court (20 caractères minimum).' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ message: 'Le message est trop long (5000 caractères maximum).' });
  }

  // Sujet : uniquement l'une des valeurs proposées par le formulaire (jamais du texte libre dans l'email)
  const subjectLabel = SUBJECTS[subject] || SUBJECTS.autre;
  const adminEmail   = process.env.SMTP_USER || 'contact@handassi.dz';

  // Si SMTP non configuré → log + 200 quand même (évite d'afficher une erreur à l'utilisateur)
  const smtpReady = process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'VOTRE_MOT_DE_PASSE_APPLICATION_GMAIL_16_CHARS';

  if (!smtpReady) {
    console.log('[CONTACT] SMTP non configuré — message reçu de', email, ':', subject);
    return res.json({ message: 'Message reçu. Nous vous répondrons rapidement.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    // Email à l'administrateur
    await transporter.sendMail({
      from: `"Al Handassa.dz Contact" <${adminEmail}>`,
      to: adminEmail,
      replyTo: { name, address: email },
      subject: `[Contact] ${subjectLabel} — ${name}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f4f6fb;padding:32px 16px">
          <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
            <div style="background:linear-gradient(135deg,#1B3A6B,#2563eb);padding:28px 32px;color:white">
              <h2 style="margin:0;font-size:1.3rem">📬 Nouveau message de contact</h2>
              <p style="margin:6px 0 0;opacity:.8;font-size:.9rem">Al Handassa.dz — Formulaire de contact</p>
            </div>
            <div style="padding:28px 32px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#64748b;font-size:.85rem;font-weight:700;width:30%">NOM</td>
                    <td style="padding:8px 0;color:#1e293b;font-weight:600">${esc(name)}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:.85rem;font-weight:700">EMAIL</td>
                    <td style="padding:8px 0"><a href="mailto:${esc(email)}" style="color:#1B3A6B">${esc(email)}</a></td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:.85rem;font-weight:700">SUJET</td>
                    <td style="padding:8px 0;color:#1e293b">${esc(subjectLabel)}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
              <h4 style="color:#64748b;font-size:.85rem;font-weight:700;margin:0 0 12px">MESSAGE</h4>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;color:#1e293b;font-size:.95rem;line-height:1.7;white-space:pre-wrap">${esc(message)}</div>
              <div style="margin-top:24px">
                <a href="mailto:${esc(email)}?subject=Re: ${encodeURIComponent(subjectLabel)}"
                   style="display:inline-block;background:#1B3A6B;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.9rem">
                  ↩ Répondre à ${esc(name)}
                </a>
              </div>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:.8rem;margin-top:16px">Al Handassa.dz — contact@handassi.dz</p>
        </div>`,
    });

    // Email de confirmation à l'expéditeur
    await transporter.sendMail({
      from: `"Al Handassa.dz" <${adminEmail}>`,
      to: { name, address: email },
      subject: 'Votre message a bien été reçu — Al Handassa.dz',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f4f6fb;padding:32px 16px">
          <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
            <div style="background:linear-gradient(135deg,#1B3A6B,#2563eb);padding:28px 32px;color:white">
              <h2 style="margin:0;font-size:1.3rem">✅ Message reçu !</h2>
            </div>
            <div style="padding:28px 32px">
              <p style="color:#1e293b;font-size:1rem">Bonjour <strong>${esc(name)}</strong>,</p>
              <p style="color:#475569;line-height:1.7">Nous avons bien reçu votre message concernant <strong>${esc(subjectLabel)}</strong>.</p>
              <p style="color:#475569;line-height:1.7">Notre équipe vous répondra sous <strong>24 à 48 heures</strong> (jours ouvrés : dimanche–jeudi).</p>
              <div style="background:#f0f9ff;border-left:4px solid #1B3A6B;border-radius:0 8px 8px 0;padding:16px;margin:20px 0">
                <p style="margin:0;color:#1e293b;font-size:.9rem;line-height:1.6"><strong>Récapitulatif :</strong><br>
                Sujet : ${esc(subjectLabel)}<br>
                Date  : ${new Date().toLocaleDateString('fr-DZ', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <p style="color:#475569;font-size:.9rem">Si votre demande est urgente, vous pouvez aussi nous joindre directement à
                <a href="mailto:contact@handassi.dz" style="color:#1B3A6B">contact@handassi.dz</a>.
              </p>
              <p style="color:#1e293b;font-size:.95rem;margin-top:24px">À bientôt sur Al Handassa.dz 🏗️</p>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:.8rem;margin-top:16px">
            <a href="https://handassi.dz" style="color:#94a3b8">Al Handassa.dz</a> ·
            <a href="https://handassi.dz/contact.html" style="color:#94a3b8">Se désinscrire</a>
          </p>
        </div>`,
    });

    res.json({ message: 'Message envoyé avec succès. Vous allez recevoir un email de confirmation.' });

  } catch (err) {
    console.error('[CONTACT] Erreur SMTP :', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'envoi. Réessayez ou écrivez directement à contact@handassi.dz' });
  }
});

module.exports = router;
