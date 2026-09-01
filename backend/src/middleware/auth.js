const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email, role, subscription_plan, subscription_expires_at, is_active FROM users WHERE id = $1',
      [payload.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable.' });
    if (!user.is_active) return res.status(403).json({ error: 'Compte désactivé.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expirée, reconnectez-vous.' });
    return res.status(401).json({ error: 'Token invalide.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Accès refusé — droits insuffisants.' });
    }
    next();
  };
}

function requireSubscription(...plans) {
  return (req, res, next) => {
    const user = req.user;
    if (!plans.includes(user.subscription_plan)) {
      return res.status(403).json({
        error: 'Contenu réservé aux abonnés.',
        required_plans: plans,
        current_plan: user.subscription_plan,
        upgrade_url: '/pricing',
      });
    }
    if (user.subscription_plan !== 'free' && user.subscription_expires_at) {
      if (new Date(user.subscription_expires_at) < new Date()) {
        return res.status(403).json({ error: 'Abonnement expiré. Renouvelez votre abonnement.', upgrade_url: '/pricing' });
      }
    }
    next();
  };
}

// Optionnel — enrichit req.user si token présent, ne bloque pas
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const result = await query('SELECT id, email, role, subscription_plan FROM users WHERE id = $1', [payload.userId]);
    req.user = result.rows[0] || null;
  } catch (_) { req.user = null; }
  next();
}

module.exports = { authenticate, authorize, requireSubscription, optionalAuth };
