/**
 * Utilitaires communs des tests d'intégration (node:test, aucune dépendance supplémentaire).
 *
 * À charger EN PREMIER dans chaque fichier de test : il fixe l'environnement (base de test, secrets, SMTP factice)
 * avant que l'application ne lise `process.env`.
 *
 * Base : TEST_DATABASE_URL (défaut postgres://postgres:postgres@localhost:5432/handassi_test). Le nom de la base doit
 * contenir « test » — garde-fou pour ne jamais exécuter ces tests (qui insèrent et suppriment des lignes) sur la base
 * de développement ou de production. Préparer la base : voir tests/README.md.
 */
const crypto = require('crypto');

process.env.NODE_ENV = 'test';
process.env.TRUST_PROXY = '1';                 // l'IP cliente vient de X-Forwarded-For (un compteur par IP dans les limiteurs)
process.env.DB_SSL = 'false';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/handassi_test';

const dbName = decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1));
if (!/test/i.test(dbName)) {
  throw new Error(`Base « ${dbName} » refusée : le nom doit contenir « test » (TEST_DATABASE_URL). Ces tests écrivent dans la base.`);
}

// Secrets propres aux tests, jamais ceux du .env de développement
Object.assign(process.env, {
  JWT_SECRET: 'test-jwt-secret-0123456789abcdef0123456789abcdef',
  JWT_REFRESH_SECRET: 'test-refresh-secret-fedcba9876543210fedcba9876543210',
  LICENSE_HMAC_SECRET: 'test-license-secret-0123456789abcdef',
  SATIM_MERCHANT_KEY: 'test-satim-merchant-key',
  SITE_URL: 'https://handassi.test',
  FRONTEND_URL: 'https://handassi.test',
  API_URL: 'https://api.handassi.test',
  EMAIL_FROM: 'test@handassi.test',
  SMTP_HOST: 'smtp.handassi.test',   // n'est jamais contacté : le transport est remplacé ci-dessous
});

// Aucun email réel : le transport nodemailer est remplacé par un enregistreur (avant le chargement de utils/email.js)
const sentMails = [];
require('nodemailer').createTransport = () => ({
  verify: async () => true,
  sendMail: async (mail) => { sentMails.push(mail); return { messageId: 'test' }; },
});

const { query, pool } = require('../src/config/database');

let ipCounter = 1;
const nextIp = () => { ipCounter++; return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`; };

/** Démarre l'application sur un port libre. Retourne { base, call, stop }. */
async function start() {
  try { await query('SELECT 1'); } catch (e) {
    throw new Error(`Base de test injoignable (${e.message}). Voir backend/tests/README.md pour la préparer.`);
  }
  const app = require('../src/app');
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  /** Appel HTTP. Chaque appel reçoit une IP distincte (limiteurs de débit) sauf si headers['X-Forwarded-For'] est fourni. */
  async function call(method, path, { token, body, headers = {}, redirect = 'follow' } = {}) {
    const res = await fetch(base + path, {
      method,
      redirect,
      headers: {
        'X-Forwarded-For': nextIp(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* corps non JSON (redirection, XML…) */ }
    return { status: res.status, json, text, location: res.headers.get('location') || '', headers: res.headers };
  }

  async function stop() {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
  return { base, call, stop };
}

/** Crée un compte via l'API (rôle « admin » appliqué en base). Retourne { id, token, email }. */
async function registerUser(ctx, prefix, tag, { role } = {}) {
  const email = `${prefix}-${tag}@example.com`;
  const r = await ctx.call('POST', '/api/auth/register', {
    body: { email, password: 'Test1234!x', first_name: 'Test', last_name: tag },
  });
  if (r.status !== 201 && r.status !== 200) throw new Error(`register ${tag} : ${r.status} ${r.text}`);
  const id = r.json.user.id;
  if (role) await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  return { id, token: r.json.access_token, email };
}

const one = async (sql, params) => (await query(sql, params)).rows[0];
const count = async (sql, params) => parseInt((await one(sql, params)).c, 10);

/**
 * Supprime toutes les données d'un jeu de test : comptes `<prefix>-*@example.com` et ce qui en dépend, produits et
 * vidéos dont le slug commence par `<prefix>-`. L'ordre respecte les clés étrangères.
 */
async function purge(prefix) {
  const mail = `${prefix}-%@example.com`;
  const slug = `${prefix}-%`;
  const users = `(SELECT id FROM users WHERE email LIKE $1)`;
  const products = `(SELECT id FROM products WHERE slug LIKE $1)`;
  await query(`DELETE FROM reviews WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM reviews WHERE product_id IN ${products}`, [slug]);
  await query(`DELETE FROM software_licenses WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM user_downloads WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM user_downloads WHERE product_id IN ${products}`, [slug]);
  await query(`DELETE FROM user_video_access WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM subscriptions WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM payments WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN ${users})`, [mail]);
  await query(`DELETE FROM orders WHERE user_id IN ${users}`, [mail]);
  await query(`DELETE FROM prepaid_codes WHERE used_by IN ${users} OR code LIKE $2`, [mail, prefix.toUpperCase() + '-%']);
  await query(`DELETE FROM users WHERE email LIKE $1`, [mail]);
  await query(`DELETE FROM products WHERE slug LIKE $1`, [slug]);
  await query(`DELETE FROM videos WHERE slug LIKE $1`, [slug]);
}

/** Signature HMAC-SHA256 d'un retour SATIM (même schéma que SATIMLive.verifyPaymentConfirmation). */
const satimSign = (params) => crypto.createHmac('sha256', process.env.SATIM_MERCHANT_KEY).update(JSON.stringify(params)).digest('hex');

module.exports = { start, registerUser, purge, one, count, query, nextIp, sentMails, satimSign };
