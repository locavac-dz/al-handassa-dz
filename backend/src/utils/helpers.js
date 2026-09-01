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

function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return { limit: l, offset: (p - 1) * l, page: p };
}

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-DZ', { style: 'decimal' }).format(amount) + ' DZD';
}

function sanitizeUser(user) {
  const { password_hash, refresh_token, email_verify_token, password_reset_token, ...safe } = user;
  return safe;
}

module.exports = { slugify, generateToken, paginate, formatPrice, sanitizeUser };
