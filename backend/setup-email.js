/**
 * ═══════════════════════════════════════════════════════════════
 *  Al Handassa.dz — Configuration Email SMTP
 *  Usage : node setup-email.js [gmail|brevo|test]
 * ═══════════════════════════════════════════════════════════════
 *
 *  PROBLÈME DÉTECTÉ : Orange.fr SMTP refuse le mot de passe.
 *
 *  Solutions recommandées (dans l'ordre) :
 *
 *  ── Option A : Gmail + Mot de passe d'application (GRATUIT) ──
 *
 *    1. Activez la validation en 2 étapes sur votre compte Google :
 *       https://myaccount.google.com/security
 *
 *    2. Créez un "Mot de passe d'application" :
 *       https://myaccount.google.com/apppasswords
 *       → Sélectionner "Autre (nom personnalisé)" → "Al Handassa SMTP"
 *       → Copiez le mot de passe de 16 caractères généré
 *
 *    3. Mettez à jour votre .env :
 *       SMTP_HOST=smtp.gmail.com
 *       SMTP_PORT=587
 *       SMTP_USER=votre.email@gmail.com
 *       SMTP_PASS=xxxx xxxx xxxx xxxx   ← le mot de passe d'app
 *       EMAIL_FROM="Al Handassa.dz <votre.email@gmail.com>"
 *
 *    Limite : 500 emails/jour (largement suffisant)
 *
 *  ── Option B : Brevo (ex-Sendinblue) — 300 emails/jour GRATUIT ──
 *
 *    1. Créez un compte sur https://app.brevo.com
 *    2. Allez dans SMTP & API → Clés SMTP
 *    3. Copiez le login SMTP et le mot de passe
 *    4. Mettez à jour .env :
 *       SMTP_HOST=smtp-relay.brevo.com
 *       SMTP_PORT=587
 *       SMTP_USER=votre.login.brevo@smtp-brevo.com
 *       SMTP_PASS=xsmtp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *       EMAIL_FROM="Al Handassa.dz <noreply@alhandassa.dz>"
 *
 *    Avantage : meilleure délivrabilité, domaine pro, statistiques
 *
 *  ── Option C : Corriger Orange.fr ──
 *
 *    Si votre mot de passe Orange a changé :
 *    1. Connectez-vous sur orange.fr
 *    2. Espace client → Mot de passe → Réinitialiser
 *    3. Mettez à jour SMTP_PASS dans .env
 *
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const cmd = process.argv[2] || 'test';

async function testSMTP(config, label) {
  console.log(`\n🔌 Test ${label}…`);
  const t = nodemailer.createTransport({ ...config, tls: { rejectUnauthorized: false } });
  try {
    await t.verify();
    console.log(`✅ ${label} : Connexion OK`);
    return true;
  } catch (err) {
    console.log(`❌ ${label} : ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Diagnostic SMTP — Al Handassa.dz');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test config actuelle
  await testSMTP({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }, `Config actuelle (${process.env.SMTP_HOST})`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Action recommandée :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n  Lisez les commentaires en haut de ce fichier');
  console.log('  (setup-email.js) pour configurer Gmail ou Brevo.');
  console.log('\n  Une fois configuré, relancez :');
  console.log('  node setup-email.js test\n');

  if (cmd === 'send-test' && process.argv[3]) {
    const TO = process.argv[3];
    console.log(`\n📨 Envoi email test vers ${TO}…`);
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });
    try {
      const info = await t.sendMail({
        from: process.env.EMAIL_FROM,
        to: TO,
        subject: '✅ Test SMTP — Al Handassa.dz',
        html: '<h1>Test réussi !</h1><p>Votre configuration SMTP fonctionne correctement.</p>',
      });
      console.log('✅ Email envoyé ! Message-ID :', info.messageId);
    } catch (err) {
      console.error('❌ Échec envoi :', err.message);
    }
  }
}

main();
