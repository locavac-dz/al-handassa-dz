const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { sanitizeUser, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

async function getProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT u.*, w.name_fr AS wilaya_name,
              COUNT(DISTINCT ud.product_id) AS downloads_count,
              COUNT(DISTINCT uva.video_id) AS videos_watched
       FROM users u
       LEFT JOIN wilayas w ON u.wilaya_id = w.id
       LEFT JOIN user_downloads ud ON u.id = ud.user_id
       LEFT JOIN user_video_access uva ON u.id = uva.user_id
       WHERE u.id = $1
       GROUP BY u.id, w.name_fr`,
      [req.user.id]
    );
    res.json({ data: sanitizeUser(result.rows[0]) });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const { first_name, last_name, phone, wilaya_id, study_level, university } = req.body;
    const avatar_url = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const fields = { first_name, last_name, phone, wilaya_id, study_level, university };
    if (avatar_url) fields.avatar_url = avatar_url;

    const updates = [];
    const params = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) { updates.push(`${k}=$${i++}`); params.push(v); }
    }
    if (!updates.length) throw new AppError('Aucune donnée à mettre à jour.', 400);
    params.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING *`,
      params
    );
    res.json({ data: sanitizeUser(result.rows[0]) });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const user = result.rows[0];

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) throw new AppError('Mot de passe actuel incorrect.', 400);

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1, refresh_token=NULL WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié. Reconnectez-vous.' });
  } catch (err) { next(err); }
}

async function getMyDownloads(req, res, next) {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.type, p.thumbnail_url, p.file_url, ud.downloaded_at
       FROM user_downloads ud
       JOIN products p ON ud.product_id = p.id
       WHERE ud.user_id=$1
       ORDER BY ud.downloaded_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
}

async function getWishlist(req, res, next) {
  try {
    const result = await query(
      `SELECT w.id, w.added_at,
              p.id AS product_id, p.title, p.slug, p.type::varchar AS type, p.price, p.thumbnail_url, p.rating_avg,
              'product' AS item_type
       FROM wishlist w JOIN products p ON w.product_id = p.id
       WHERE w.user_id=$1
       UNION ALL
       SELECT w.id, w.added_at,
              v.id, v.title, v.slug, 'video'::varchar, v.price, v.thumbnail_url, v.rating_avg,
              'video'
       FROM wishlist w JOIN videos v ON w.video_id = v.id
       WHERE w.user_id=$1
       ORDER BY added_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
}

async function toggleWishlist(req, res, next) {
  try {
    const { product_id, video_id } = req.body;
    if (!product_id && !video_id) throw new AppError('product_id ou video_id requis.', 400);

    const field = product_id ? 'product_id' : 'video_id';
    const val = product_id || video_id;

    const exists = await query(
      `SELECT id FROM wishlist WHERE user_id=$1 AND ${field}=$2`,
      [req.user.id, val]
    );
    if (exists.rows.length) {
      await query(`DELETE FROM wishlist WHERE user_id=$1 AND ${field}=$2`, [req.user.id, val]);
      return res.json({ message: 'Retiré des favoris.', wished: false });
    }
    await query(`INSERT INTO wishlist (user_id, ${field}) VALUES ($1,$2)`, [req.user.id, val]);
    res.json({ message: 'Ajouté aux favoris.', wished: true });
  } catch (err) { next(err); }
}

async function getSubscription(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, p.method AS payment_method_used
       FROM subscriptions s LEFT JOIN payments p ON s.payment_id = p.id
       WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const user = await query(
      'SELECT subscription_plan, subscription_expires_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json({
      current_plan: user.rows[0].subscription_plan,
      expires_at: user.rows[0].subscription_expires_at,
      latest_subscription: result.rows[0] || null,
    });
  } catch (err) { next(err); }
}

// Admin
async function adminList(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { role, plan, search } = req.query;

    const conditions = [];
    const params = [];
    let i = 1;
    if (role) { conditions.push(`role=$${i++}`); params.push(role); }
    if (plan) { conditions.push(`subscription_plan=$${i++}`); params.push(plan); }
    if (search) {
      conditions.push(`(email ILIKE $${i} OR first_name ILIKE $${i} OR last_name ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT id, email, first_name, last_name, role, subscription_plan, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );
    const total = parseInt((await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0,-2))).rows[0].count, 10);
    res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

async function adminUpdateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, is_active, subscription_plan, subscription_expires_at } = req.body;
    const result = await query(
      `UPDATE users SET role=COALESCE($1,role), is_active=COALESCE($2,is_active),
        subscription_plan=COALESCE($3,subscription_plan), subscription_expires_at=COALESCE($4,subscription_expires_at)
       WHERE id=$5 RETURNING id, email, role, subscription_plan, is_active`,
      [role, is_active, subscription_plan, subscription_expires_at, id]
    );
    if (!result.rows.length) throw new AppError('Utilisateur introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
}

module.exports = {
  getProfile, updateProfile, changePassword,
  getMyDownloads, getWishlist, toggleWishlist, getSubscription,
  adminList, adminUpdateUser,
};
