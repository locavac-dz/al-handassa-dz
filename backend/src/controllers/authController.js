const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateToken, sanitizeUser } = require('../utils/helpers');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordReset } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

async function register(req, res, next) {
  try {
    const { email, password, first_name, last_name, phone, wilaya_id, study_level, university } = req.body;

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) throw new AppError('Cet email est déjà utilisé.', 409);

    const password_hash = await bcrypt.hash(password, 12);
    const email_verify_token = generateToken();

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, wilaya_id, study_level, university, email_verify_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, email, first_name, last_name, role, subscription_plan, is_email_verified, created_at`,
      [email.toLowerCase(), password_hash, first_name, last_name, phone || null,
       wilaya_id || null, study_level || null, university || null, email_verify_token]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    // Email de vérification (non bloquant)
    sendVerificationEmail(user, email_verify_token).catch(e => console.error('[EMAIL]', e.message));

    res.status(201).json({
      message: 'Compte créé avec succès.',
      user: sanitizeUser(user),
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) throw new AppError('Email ou mot de passe incorrect.', 401);
    if (!user.is_active) throw new AppError('Compte désactivé. Contactez le support.', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Email ou mot de passe incorrect.', 401);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await query(
      'UPDATE users SET refresh_token = $1, last_login_at = NOW() WHERE id = $2',
      [refreshToken, user.id]
    );

    res.json({
      message: 'Connexion réussie.',
      user: sanitizeUser(user),
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw new AppError('Refresh token manquant.', 401);

    const payload = verifyRefreshToken(refresh_token);
    const result = await query(
      'SELECT id, role, refresh_token FROM users WHERE id = $1 AND is_active = TRUE',
      [payload.userId]
    );
    const user = result.rows[0];
    if (!user || user.refresh_token !== refresh_token) {
      throw new AppError('Refresh token invalide.', 401);
    }

    const newAccess = generateAccessToken(user.id, user.role);
    const newRefresh = generateRefreshToken(user.id);
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefresh, user.id]);

    res.json({ access_token: newAccess, refresh_token: newRefresh });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, email, first_name FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    // Réponse générique même si l'email n'existe pas (sécurité)
    if (user) {
      const token = generateToken();
      const expires = new Date(Date.now() + 3600 * 1000); // 1h
      await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [token, expires, user.id]
      );
      sendPasswordReset(user, token).catch(e => console.error('[EMAIL]', e.message));
    }

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const result = await query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    const user = result.rows[0];
    if (!user) throw new AppError('Token invalide ou expiré.', 400);

    const hash = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET password_hash=$1, password_reset_token=NULL, password_reset_expires=NULL, refresh_token=NULL WHERE id=$2',
      [hash, user.id]
    );
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const result = await query(
      `SELECT u.*, w.name_fr AS wilaya_name
       FROM users u LEFT JOIN wilayas w ON u.wilaya_id = w.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (err) { next(err); }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) throw new AppError('Token manquant.', 400);

    const result = await query(
      `UPDATE users
       SET is_email_verified = TRUE, email_verify_token = NULL
       WHERE email_verify_token = $1 AND is_email_verified = FALSE
       RETURNING id, email, first_name`,
      [token]
    );
    if (!result.rows.length) throw new AppError('Lien invalide ou déjà utilisé.', 400);

    // Email de bienvenue après vérification (non bloquant)
    sendWelcomeEmail(result.rows[0]).catch(e => console.error('[EMAIL]', e.message));

    res.json({ message: 'Email vérifié avec succès. Bienvenue sur Al Handassa.dz !' });
  } catch (err) { next(err); }
}

async function resendVerification(req, res, next) {
  try {
    const userRes = await query(
      'SELECT id, email, first_name, is_email_verified, email_verify_token FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (!user) throw new AppError('Utilisateur introuvable.', 404);
    if (user.is_email_verified) throw new AppError('Email déjà vérifié.', 400);

    // Regénérer un token si absent
    let token = user.email_verify_token;
    if (!token) {
      token = generateToken();
      await query('UPDATE users SET email_verify_token = $1 WHERE id = $2', [token, user.id]);
    }

    sendVerificationEmail(user, token).catch(e => console.error('[EMAIL]', e.message));
    res.json({ message: 'Email de vérification renvoyé. Vérifiez votre boîte mail.' });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, getMe, verifyEmail, resendVerification };
