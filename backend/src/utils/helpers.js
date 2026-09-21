const crypto = require('crypto');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// page/limit viennent de la query string : "abc", "-5", "1e9" ou un tableau ne doivent ni casser le SQL
// (LIMIT NaN → erreur 500) ni permettre de vider une table (LIMIT 1000000).
function paginate(page, limit, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const rawPage = parseInt(page, 10);
  const rawLimit = parseInt(limit, 10);
  const p = Number.isFinite(rawPage) ? Math.min(100000, Math.max(1, rawPage)) : 1;
  const l = Number.isFinite(rawLimit) ? Math.min(maxLimit, Math.max(1, rawLimit)) : defaultLimit;
  return { limit: l, offset: (p - 1) * l, page: p, currentPage: p };
}

// Montant en DZD saisi par un admin/instructeur : nombre fini >= 0 (vide → 0). Un prix négatif annulait le
// total d'un panier ; « abc » devenait silencieusement 0.
function parsePrice(value) {
  if (value === undefined || value === null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99999999) {
    const { AppError } = require('../middleware/errorHandler');
    throw new AppError('Prix invalide (nombre positif requis).', 400);
  }
  return Math.round(n * 100) / 100;
}

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-DZ', { style: 'decimal' }).format(amount) + ' DZD';
}

function sanitizeUser(user) {
  const { password_hash, refresh_token, email_verify_token, password_reset_token, ...safe } = user;
  return safe;
}

module.exports = { slugify, generateToken, paginate, parsePrice, formatPrice, sanitizeUser };
