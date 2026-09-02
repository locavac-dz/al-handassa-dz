/**
 * Script de test SMTP — lance avec : node test-email.js
 * Envoie un email de test à l'adresse SMTP_USER configurée dans .env
 */
require('dotenv').config();
const { sendWelcomeEmail, sendOrderConfirmation, sendPaymentReceived, sendPaymentValidated, sendPaymentRejected } = require('./src/utils/email');

const testUser = {
  email: process.env.SMTP_USER,
  first_name: 'Ahmed',
  last_name: 'Test',
};

const testOrder = {
  order_number: 'ORD-2026-TEST001',
  total_amount: 2500,
  items: [
    { title: 'Calcul Béton Armé — DTR BC 2.48', subtotal: 1500 },
    { title: 'Cours Topographie L3 — Nivellement', subtotal: 1000 },
  ],
};

async function run() {
  console.log('\n📧 Test SMTP — Al Handassa.dz\n');
  console.log(`Host  : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`User  : ${process.env.SMTP_USER}`);
  console.log(`From  : ${process.env.EMAIL_FROM}`);
  console.log(`To    : ${testUser.email}\n`);

  const tests = [
    { name: 'Bienvenue', fn: () => sendWelcomeEmail(testUser) },
    { name: 'Confirmation commande', fn: () => sendOrderConfirmation(testOrder, testUser) },
    { name: 'Paiement reçu (manuel)', fn: () => sendPaymentReceived(testOrder, testUser, 'ccp') },
    { name: 'Paiement validé', fn: () => sendPaymentValidated(testOrder, testUser, testOrder.items) },
    { name: 'Paiement rejeté', fn: () => sendPaymentRejected(testOrder, testUser, 'Référence CCP non trouvée dans notre relevé.') },
  ];

  for (const t of tests) {
    try {
      process.stdout.write(`  ⏳ ${t.name.padEnd(30)}`);
      await t.fn();
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log('\n✅ Terminé — Vérifiez votre boîte de réception.\n');
}

run();
