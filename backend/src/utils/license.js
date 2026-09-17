// Génération et émission des licences logicielles (BétonLab DG, etc.)
// Le secret HMAC (LICENSE_HMAC_SECRET) ne doit JAMAIS être partagé avec le
// secret client-side de l'app concernée : il ne quitte jamais ce serveur.
const crypto = require('crypto');

const PLAN_CODES = { pro: 'PR', enterprise: 'EN' };

function generateLicenseKey(licensePlan, expiresAt) {
  const planCode = PLAN_CODES[licensePlan];
  if (!planCode) throw new Error(`Plan de licence inconnu : ${licensePlan}`);

  const yy = String(expiresAt.getFullYear()).slice(2);
  const mm = String(expiresAt.getMonth() + 1).padStart(2, '0');
  const yymm = yy + mm;

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) throw new Error('LICENSE_HMAC_SECRET manquant dans les variables d\'environnement.');

  // Nonce aléatoire mélangé dans le HMAC : sans lui, deux clients achetant le
  // même plan avec la même échéance (mois) recevraient la clé identique.
  const nonce = crypto.randomBytes(8).toString('hex');
  const mac = crypto.createHmac('sha256', secret).update(planCode + yymm + nonce).digest('hex').toUpperCase();
  const h1 = mac.slice(0, 8);
  const h2 = mac.slice(8, 16);

  // Forme canonique stockée en base : 24 caractères, sans tirets
  return `AH${planCode}${yymm}${h1}${h2}`;
}

function formatKeyForDisplay(rawKey) {
  return `${rawKey.slice(0,2)}-${rawKey.slice(2,4)}-${rawKey.slice(4,8)}-${rawKey.slice(8,16)}-${rawKey.slice(16,24)}`;
}

function normalizeKey(key) {
  return (key || '').toUpperCase().replace(/[\s-]/g, '');
}

// db : objet exposant .query(sql, params) — un client pg (dans une transaction)
// ou { query } avec la fonction query() de config/database.js.
async function issueSoftwareLicenses(db, orderId, userId) {
  const items = await db.query(
    `SELECT oi.id AS order_item_id, p.metadata
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 AND oi.item_type = 'product' AND p.metadata ? 'app_slug'`,
    [orderId]
  );

  const issued = [];
  for (const item of items.rows) {
    const meta = item.metadata || {};
    const appSlug = meta.app_slug;
    const licensePlan = meta.license_plan;
    const durationMonths = parseInt(meta.duration_months, 10);
    if (!appSlug || !licensePlan || !durationMonths) continue;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    // Aligner l'expiration en fin de mois, comme le fait le générateur de clés existant
    const expiryEom = new Date(expiresAt.getFullYear(), expiresAt.getMonth() + 1, 0);

    // Le nonce aléatoire dans generateLicenseKey() rend une collision
    // astronomiquement improbable ; on retente quand même plutôt que de
    // livrer silencieusement zéro licence pour un paiement encaissé.
    let inserted = null;
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const licenseKey = generateLicenseKey(licensePlan, expiryEom);
      const result = await db.query(
        `INSERT INTO software_licenses (license_key, app_slug, license_plan, user_id, order_item_id, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (license_key) DO NOTHING
         RETURNING license_key, app_slug, license_plan, expires_at`,
        [licenseKey, appSlug, licensePlan, userId, item.order_item_id, expiryEom]
      );
      inserted = result.rows[0] || null;
    }
    if (!inserted) throw new Error(`Impossible de générer une clé de licence unique pour order_item ${item.order_item_id} après 3 tentatives.`);
    issued.push(inserted);
  }
  return issued;
}

module.exports = { generateLicenseKey, formatKeyForDisplay, normalizeKey, issueSoftwareLicenses };
