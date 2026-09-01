const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },   // accepter les certs auto-signés en dev
  pool: true,                            // réutiliser les connexions
  maxConnections: 3,
  rateDelta: 1000,
  rateLimit: 5,                          // max 5 emails/seconde
});

// Vérifier la connexion au démarrage (non bloquant, juste un log)
transporter.verify().then(() => {
  console.log('[EMAIL] ✅ SMTP connecté :', process.env.SMTP_HOST);
}).catch(err => {
  console.error('[EMAIL] ⚠️  SMTP non disponible :', err.message);
  console.error('[EMAIL]    Vérifiez SMTP_HOST / SMTP_USER / SMTP_PASS dans .env');
});

// ─── Base layout ─────────────────────────────────────────────────────────────
function _wrap(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:#1B3A6B;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
        ⚙ Al Handassa<span style="color:#C8A142">.dz</span>
      </div>
      <div style="font-size:12px;color:#9bb3d4;margin-top:4px">Génie Civil & Architecture — Algérie</div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px">
      ${content}

      <!-- Footer -->
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8edf5;text-align:center;color:#94a3b8;font-size:12px">
        <p style="margin:0 0 4px">Al Handassa.dz — Plateforme de ressources pour ingénieurs algériens</p>
        <p style="margin:0">
          <a href="mailto:contact@handassi.dz" style="color:#1B3A6B;text-decoration:none">contact@handassi.dz</a>
          &nbsp;·&nbsp;
          <a href="${process.env.FRONTEND_URL}" style="color:#1B3A6B;text-decoration:none">Al Handassa.dz</a>
        </p>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function _btn(href, label, color = '#1B3A6B') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-top:8px">${label}</a>`;
}

function _badge(text, color = '#1B3A6B') {
  return `<span style="display:inline-block;background:${color}22;color:${color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${color}44">${text}</span>`;
}

function _orderTable(items = [], totalAmount) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f4f8;color:#374151">
        ${i.title || i.item_type || 'Article'}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f4f8;text-align:right;white-space:nowrap;color:#374151;font-weight:500">
        ${Number(i.subtotal || i.unit_price || 0).toLocaleString('fr-DZ')} DZD
      </td>
    </tr>`).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5eaf2;border-radius:8px;overflow:hidden;margin:20px 0">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:12px 16px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:600">Article</th>
          <th style="padding:12px 16px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:600">Prix</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f8fafc">
          <td style="padding:14px 16px;font-weight:700;color:#1B3A6B;font-size:16px">Total</td>
          <td style="padding:14px 16px;text-align:right;font-weight:700;color:#1B3A6B;font-size:16px">
            ${Number(totalAmount || 0).toLocaleString('fr-DZ')} DZD
          </td>
        </tr>
      </tfoot>
    </table>`;
}

// ─── Core send ────────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to, subject, html, text,
  });
}

// ─── 1. Vérification email ────────────────────────────────────────────────────
async function sendVerificationEmail(user, token) {
  const url = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;

  const html = _wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Bienvenue, ${user.first_name} ! 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b">Votre compte <strong>Al Handassa.dz</strong> a été créé avec succès.</p>

    <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:24px;text-align:center;margin:20px 0">
      <div style="font-size:40px;margin-bottom:12px">📧</div>
      <p style="margin:0 0 16px;color:#1e40af;font-weight:600;font-size:16px">Confirmez votre adresse email</p>
      <p style="margin:0 0 20px;color:#374151;font-size:14px">
        Cliquez sur le bouton ci-dessous pour activer votre compte.<br>
        Ce lien est valable <strong>24 heures</strong>.
      </p>
      ${_btn(url, '✅ Vérifier mon email', '#1B3A6B')}
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:14px 20px;margin:20px 0">
      <p style="margin:0 0 8px;color:#374151;font-weight:600;font-size:14px">Ce qui vous attend :</p>
      <ul style="margin:0;padding-left:18px;color:#64748b;font-size:14px">
        <li style="margin-bottom:4px">📄 Plus de 2 400 ressources PDF (béton armé, topographie, BIM…)</li>
        <li style="margin-bottom:4px">🎬 Tutoriels vidéo AutoCAD, Revit, ETABS</li>
        <li>📥 Téléchargements selon votre abonnement</li>
      </ul>
    </div>

    <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:16px">
      Si vous n'avez pas créé de compte, ignorez cet email.
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: '📧 Confirmez votre adresse email — Al Handassa.dz',
    html,
  });
}

// ─── 1b. Bienvenue (après vérification) ───────────────────────────────────────
async function sendWelcomeEmail(user) {
  const html = _wrap(`
    <h1 style="margin:0 0 8px;font-size:26px;color:#1B3A6B">Bienvenue, ${user.first_name} ! 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px">Votre compte <strong>Al Handassa.dz</strong> a été créé avec succès.</p>

    <div style="background:#f0f7ff;border-left:4px solid #1B3A6B;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
      <p style="margin:0;color:#1B3A6B;font-weight:600">Ce qui vous attend :</p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#374151;font-size:14px">
        <li style="margin-bottom:4px">📄 Plus de 2 400 ressources PDF (béton armé, topographie, BIM…)</li>
        <li style="margin-bottom:4px">🎬 Tutoriels vidéo AutoCAD, Revit, ETABS</li>
        <li style="margin-bottom:4px">📥 Téléchargements illimités selon votre abonnement</li>
      </ul>
    </div>

    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL + '/index.html#products', '📚 Explorer le catalogue', '#1B3A6B')}
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: '🎉 Bienvenue sur Al Handassa.dz !',
    html,
  });
}

// ─── 2. Confirmation de commande ──────────────────────────────────────────────
async function sendOrderConfirmation(order, user) {
  const html = _wrap(`
    <div style="margin-bottom:24px">
      ${_badge('✅ Commande enregistrée', '#059669')}
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Commande confirmée</h1>
    <p style="margin:0 0 4px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>
    <p style="margin:0 0 24px;color:#64748b">Votre commande <strong style="color:#1B3A6B">${order.order_number}</strong> a bien été enregistrée.</p>

    ${_orderTable(order.items || [], order.total_amount)}

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0;color:#92400e;font-size:14px">
        ⏳ <strong>Paiement en attente :</strong> Si vous avez choisi un virement CCP ou BaridiMob,
        votre accès sera déverrouillé dans les <strong>24h ouvrées</strong> après validation de votre paiement.
      </p>
    </div>

    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL + '/account.html#orders', '📋 Voir mes commandes', '#C8A142')}
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `✅ Commande enregistrée — ${order.order_number}`,
    html,
  });
}

// ─── 3. Paiement manuel reçu — OBSOLÈTE, conservé pour rétrocompat ───────────
// Note : submitManualPayment utilise désormais sendPaymentValidated directement
async function sendPaymentReceived(order, user, method) {
  const methodLabels = {
    ccp_virement: 'Virement CCP', baridimob: 'BaridiMob',
    especes: 'Espèces', code_prepaye: 'Code Prépayé',
  };
  const methodLabel = methodLabels[method] || method || 'Paiement';
  const html = _wrap(`
    <div style="margin-bottom:24px">${_badge('⏳ Paiement en cours', '#D97706')}</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Paiement reçu</h1>
    <p style="margin:0 0 20px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>
    <p style="color:#374151">Paiement de <strong>${Number(order.total_amount).toLocaleString('fr-DZ')} DZD</strong> par ${methodLabel} pour la commande <strong>${order.order_number}</strong> enregistré.</p>
    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL, '📋 Accéder à mon compte', '#1B3A6B')}
    </p>
  `);
  return sendEmail({ to: user.email, subject: `✅ Paiement confirmé — ${order.order_number}`, html });
}

// ─── 4. Paiement validé — Accès déverrouillé ─────────────────────────────────
async function sendPaymentValidated(order, user, items = []) {
  const html = _wrap(`
    <div style="margin-bottom:24px">
      ${_badge('✅ Paiement validé — Accès déverrouillé !', '#059669')}
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Votre paiement a été validé 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>

    <p style="color:#374151">
      Bonne nouvelle ! Votre paiement pour la commande
      <strong style="color:#1B3A6B">${order.order_number}</strong> a été <strong style="color:#059669">validé par notre équipe</strong>.
      Vos fichiers sont maintenant disponibles au téléchargement.
    </p>

    ${items.length ? _orderTable(items, order.total_amount) : ''}

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:500">
        🎯 Vos documents sont prêts ! Rendez-vous dans votre espace personnel pour les télécharger.
      </p>
    </div>

    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL + '/account.html#downloads', '📥 Télécharger mes fichiers', '#059669')}
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `✅ Paiement validé — Téléchargez vos fichiers (${order.order_number})`,
    html,
  });
}

// ─── 5. Paiement rejeté ───────────────────────────────────────────────────────
async function sendPaymentRejected(order, user, notes = '') {
  const html = _wrap(`
    <div style="margin-bottom:24px">
      ${_badge('❌ Paiement non confirmé', '#DC2626')}
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Paiement non confirmé</h1>
    <p style="margin:0 0 20px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>

    <p style="color:#374151">
      Nous n'avons pas pu confirmer votre paiement pour la commande
      <strong style="color:#1B3A6B">${order.order_number}</strong>.
    </p>

    ${notes ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 4px;color:#7f1d1d;font-weight:600;font-size:14px">Motif :</p>
      <p style="margin:0;color:#991b1b;font-size:14px">${notes}</p>
    </div>` : ''}

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;color:#374151;font-weight:600;font-size:14px">Que faire maintenant ?</p>
      <ul style="margin:0;padding-left:18px;color:#64748b;font-size:14px">
        <li style="margin-bottom:6px">Vérifiez que le montant et le numéro de référence correspondent</li>
        <li style="margin-bottom:6px">Renvoyez votre paiement avec les informations correctes</li>
        <li>Contactez-nous si vous pensez qu'il s'agit d'une erreur</li>
      </ul>
    </div>

    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL + '/account.html#orders', '🔄 Refaire un paiement', '#1B3A6B')}
      &nbsp;&nbsp;
      ${_btn('mailto:contact@handassi.dz?subject=Litige paiement ' + order.order_number, '✉ Contacter le support', '#6b7280')}
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `❌ Paiement non confirmé — Commande ${order.order_number}`,
    html,
  });
}

// ─── 6. Réinitialisation mot de passe ─────────────────────────────────────────
async function sendPasswordReset(user, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

  const html = _wrap(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Réinitialisation du mot de passe</h1>
    <p style="margin:0 0 20px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>

    <p style="color:#374151">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous.
       Ce lien est valable <strong>1 heure</strong>.</p>

    <p style="text-align:center;margin:28px 0">
      ${_btn(url, '🔑 Réinitialiser mon mot de passe', '#E63946')}
    </p>

    <div style="background:#f8fafc;border-radius:8px;padding:14px 20px;margin:20px 0">
      <p style="margin:0;color:#64748b;font-size:13px">
        🔒 Si vous n'avez pas demandé cette action, ignorez cet email. Votre mot de passe restera inchangé.
      </p>
    </div>
  `);

  return sendEmail({
    to: user.email,
    subject: '🔑 Réinitialisation de votre mot de passe — Al Handassa.dz',
    html,
  });
}

// ─── 7. Abonnement activé ─────────────────────────────────────────────────────
async function sendSubscriptionActivated(user, sub) {
  const planNames = { standard: 'Standard', pro: 'Pro Ingénieur' };
  const planName = planNames[sub.plan] || sub.plan;
  const cycleLabel = sub.billing_cycle === 'annual' ? 'annuel' : 'mensuel';
  const expires = new Date(sub.expires_at);
  const expiresStr = expires.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = _wrap(`
    <div style="margin-bottom:24px">
      ${_badge('✅ Abonnement activé !', '#059669')}
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#1B3A6B">Bienvenue dans le plan ${planName} 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b">Bonjour <strong>${user.first_name}</strong>,</p>

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:24px;margin:20px 0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:14px;padding:5px 0">Plan</td>
          <td style="text-align:right;font-weight:700;color:#15803d">${planName}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;padding:5px 0">Type</td>
          <td style="text-align:right;font-weight:600;color:#1B3A6B">${cycleLabel.charAt(0).toUpperCase() + cycleLabel.slice(1)}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;padding:5px 0">Expire le</td>
          <td style="text-align:right;font-weight:600;color:#1B3A6B">${expiresStr}</td>
        </tr>
      </table>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;color:#374151;font-weight:600;font-size:14px">Votre accès inclut :</p>
      <ul style="margin:0;padding-left:18px;color:#64748b;font-size:14px">
        ${sub.plan === 'pro' ? `
          <li style="margin-bottom:4px">✅ Tout le plan Standard</li>
          <li style="margin-bottom:4px">✅ 200+ publications scientifiques</li>
          <li style="margin-bottom:4px">✅ Webinaires live & Certificat</li>
          <li>✅ Modèles BIM & fichiers sources</li>` : `
          <li style="margin-bottom:4px">✅ Téléchargements illimités</li>
          <li style="margin-bottom:4px">✅ 50+ ouvrages numériques</li>
          <li style="margin-bottom:4px">✅ Normes DTR/RPA complètes</li>
          <li>✅ Vidéos pédagogiques HD</li>`}
      </ul>
    </div>

    <p style="text-align:center;margin:28px 0 8px">
      ${_btn(process.env.FRONTEND_URL + '/#products', '📚 Explorer le catalogue', '#059669')}
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `✅ Abonnement ${planName} activé — Al Handassa.dz`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPaymentReceived,
  sendPaymentValidated,
  sendPaymentRejected,
  sendPasswordReset,
  sendSubscriptionActivated,
};
