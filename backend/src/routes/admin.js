const router = require('express').Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');
const { sendPaymentValidated, sendPaymentRejected } = require('../utils/email');

// All routes require authenticate + authorize('admin')
router.use(authenticate, authorize('admin'));

// GET /api/admin/products — liste TOUS les produits (actifs + inactifs)
router.get('/products', async (req, res, next) => {
  try {
    const { page, limit: lim, search, type } = req.query;
    const { limit, offset, currentPage } = paginate(page, lim);

    const conditions = [];
    const params = [];
    let i = 1;

    if (search) {
      conditions.push(`(p.title ILIKE $${i++})`);
      params.push(`%${search}%`);
    }
    if (type) {
      conditions.push(`p.type = $${i++}`);
      params.push(type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM products p ${where}`, params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const result = await query(
      `SELECT p.id, p.title, p.slug, p.type, p.price, p.is_free, p.is_active,
              p.file_url, p.thumbnail_url, p.created_at, p.downloads_count,
              p.study_level, p.description, p.category_id,
              c.name_fr AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page: currentPage, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/products/:id/toggle-active — activer/désactiver un produit
// PATCH /api/admin/products/:id — modifier type, catégorie, tags, prix, titre
router.patch('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['title','type','category_id','price','is_free','tags'];
    const updates = [];
    const params  = [];
    let i = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        let val = req.body[key];
        if (key === 'tags') {
          // Accepte string JSON ou tableau
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch { val = val.split(',').map(t=>t.trim()).filter(Boolean); }
          }
          updates.push(`${key} = $${i++}`);
          params.push(val);
        } else if (key === 'is_free') {
          updates.push(`${key} = $${i++}`);
          params.push(val === true || val === 'true');
        } else if (key === 'price') {
          updates.push(`${key} = $${i++}`);
          params.push(parseFloat(val) || 0);
        } else {
          updates.push(`${key} = $${i++}`);
          params.push(val);
        }
      }
    }
    if (!updates.length) throw new AppError('Aucun champ à mettre à jour.', 400);

    params.push(id);
    const result = await query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING id, title, type, category_id, price, is_free, tags`,
      params
    );
    if (!result.rows.length) throw new AppError('Produit introuvable.', 404);
    res.json({ data: result.rows[0], message: 'Produit mis à jour.' });
  } catch (err) { next(err); }
});

router.patch('/products/:id/toggle-active', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE products SET is_active = NOT is_active WHERE id = $1 RETURNING id, title, is_active`,
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Produit introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'paid') AS total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') AS pending_payments,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) AS new_users_today,
        (SELECT COUNT(*) FROM videos WHERE is_active = TRUE) AS total_videos,
        (SELECT COUNT(*) FROM articles WHERE is_published = TRUE) AS total_articles,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND type = 'logiciels') AS total_logiciels,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND type IN ('ouvrage','cours_pdf','normes','pack','exercices')) AS total_ressources
    `);

    const recentOrdersResult = await query(`
      SELECT
        o.id, o.order_number, o.status, o.total_amount, o.created_at,
        u.first_name, u.last_name, u.email,
        JSON_AGG(oi.title) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at,
               u.first_name, u.last_name, u.email
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    const recentUsersResult = await query(`
      SELECT id, email, first_name, last_name, role, subscription_plan, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `);

    // Répartition par niveau d'études
    const levelsResult = await query(`
      SELECT study_level, COUNT(*) AS total
      FROM products WHERE is_active = TRUE
      GROUP BY study_level ORDER BY study_level
    `);

    // Répartition par type de produit
    const typesResult = await query(`
      SELECT type, COUNT(*) AS total
      FROM products WHERE is_active = TRUE
      GROUP BY type ORDER BY total DESC
    `);

    // Répartition par catégorie (top 6)
    const categoriesResult = await query(`
      SELECT c.name_fr AS name, COUNT(p.id) AS total
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
      GROUP BY c.name_fr ORDER BY total DESC LIMIT 6
    `);

    const stats = statsResult.rows[0];

    res.json({
      total_users:       parseInt(stats.total_users),
      total_products:    parseInt(stats.total_products),
      total_orders:      parseInt(stats.total_orders),
      total_revenue:     parseFloat(stats.total_revenue),
      pending_orders:    parseInt(stats.pending_orders),
      pending_payments:  parseInt(stats.pending_payments),
      new_users_today:   parseInt(stats.new_users_today),
      total_videos:      parseInt(stats.total_videos),
      total_articles:    parseInt(stats.total_articles),
      total_logiciels:   parseInt(stats.total_logiciels),
      total_ressources:  parseInt(stats.total_ressources),
      recent_orders:     recentOrdersResult.rows,
      recent_users:      recentUsersResult.rows,
      levels_breakdown:  levelsResult.rows,
      types_breakdown:   typesResult.rows,
      categories_breakdown: categoriesResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res, next) => {
  try {
    const { status, method, page, limit } = req.query;
    const { limit: lim, offset, currentPage } = paginate(page, limit);

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (method) {
      params.push(method);
      conditions.push(`p.method = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM payments p ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(lim, offset);

    const paymentsResult = await query(
      `SELECT
        p.id, p.method, p.status, p.amount,
        p.gateway_reference AS reference,
        p.baridimob_ref, p.initiated_at, p.completed_at,
        p.failure_reason AS notes,
        p.created_at,
        o.id AS order_id, o.order_number, o.total_amount, o.status AS order_status,
        u.first_name, u.last_name, u.email
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = p.user_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: paymentsResult.rows,
      pagination: { total, page: currentPage, limit: lim, pages: Math.ceil(total / lim) },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/payments/:id/validate
router.patch('/payments/:id/validate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get payment with order info
    const paymentResult = await query(
      `SELECT p.*, o.id AS order_id, o.user_id
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1`,
      [id]
    );

    if (!paymentResult.rows.length) {
      return next(new AppError('Paiement introuvable.', 404));
    }

    const payment = paymentResult.rows[0];

    // Update payment status to 'completed'
    const updatedPaymentResult = await query(
      `UPDATE payments
       SET status = 'completed', notes = COALESCE($1, notes), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes || null, id]
    );

    // Update order status to 'paid'
    await query(
      `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [payment.order_id]
    );

    // Insert user_downloads for product items
    await query(
      `INSERT INTO user_downloads (user_id, product_id, order_item_id)
       SELECT o.user_id, oi.product_id, oi.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND oi.item_type = 'product'
       ON CONFLICT DO NOTHING`,
      [payment.order_id]
    );

    // Email notification (non bloquant)
    const orderFull = await query('SELECT * FROM orders WHERE id=$1', [payment.order_id]);
    const userInfo = await query('SELECT email, first_name FROM users WHERE id=$1', [payment.user_id]);
    const orderItems = await query(
      'SELECT title, unit_price AS subtotal FROM order_items WHERE order_id=$1',
      [payment.order_id]
    );
    sendPaymentValidated(orderFull.rows[0], userInfo.rows[0], orderItems.rows).catch(() => {});

    res.json({
      message: 'Paiement validé. Accès déverrouillé.',
      payment: updatedPaymentResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/payments/:id/reject
router.patch('/payments/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get payment with order info
    const paymentResult = await query(
      `SELECT p.*, o.id AS order_id
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1`,
      [id]
    );

    if (!paymentResult.rows.length) {
      return next(new AppError('Paiement introuvable.', 404));
    }

    const payment = paymentResult.rows[0];

    // Update payment status to 'failed'
    await query(
      `UPDATE payments
       SET status = 'failed', notes = COALESCE($1, notes), updated_at = NOW()
       WHERE id = $2`,
      [notes || null, id]
    );

    // Update order status to 'failed'
    await query(
      `UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [payment.order_id]
    );

    // Email notification (non bloquant)
    const orderFull = await query('SELECT * FROM orders WHERE id=$1', [payment.order_id]);
    const userInfo = await query(
      'SELECT u.email, u.first_name FROM users u JOIN orders o ON u.id = o.user_id WHERE o.id=$1',
      [payment.order_id]
    );
    sendPaymentRejected(orderFull.rows[0], userInfo.rows[0], notes).catch(() => {});

    res.json({ message: 'Paiement rejeté.' });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════
// RÉFÉRENTIELS (catégories, instructeurs) — pour les selects
// ═══════════════════════════════════════════════════════════

router.get('/refs', async (req, res, next) => {
  try {
    const [cats, insts] = await Promise.all([
      query('SELECT id, name_fr, slug FROM categories WHERE is_active=TRUE ORDER BY name_fr'),
      query('SELECT id, display_name FROM instructors ORDER BY display_name'),
    ]);
    res.json({ categories: cats.rows, instructors: insts.rows });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════
// CATÉGORIES
// ═══════════════════════════════════════════════════════════

router.get('/categories', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(p.id) AS products_count, COUNT(v.id) AS videos_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
      LEFT JOIN videos v ON v.category_id = c.id AND v.is_active = TRUE
      GROUP BY c.id ORDER BY c.sort_order, c.name_fr
    `);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name_fr, name_ar, slug, icon, description, sort_order } = req.body;
    if (!name_fr) throw new AppError('Le nom (FR) est requis.', 400);
    const finalSlug = slug || name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO categories (name_fr, name_ar, slug, icon, description, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name_fr, name_ar || name_fr, finalSlug, icon || '📁', description || null, parseInt(sort_order) || 0]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const { name_fr, name_ar, icon, description, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE categories SET name_fr=$1, name_ar=$2, icon=$3, description=$4,
       sort_order=$5, is_active=$6 WHERE id=$7 RETURNING *`,
      [name_fr, name_ar || name_fr, icon, description || null,
       parseInt(sort_order) || 0, is_active !== false, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Catégorie introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════
// VIDÉOS
// ═══════════════════════════════════════════════════════════

router.get('/videos', async (req, res, next) => {
  try {
    const { page, limit: lim, search, category } = req.query;
    const { limit, offset, currentPage } = paginate(page, lim);
    const conditions = [];
    const params = [];
    let i = 1;
    if (search) { conditions.push(`v.title ILIKE $${i++}`); params.push(`%${search}%`); }
    if (category) { conditions.push(`v.category_id = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = parseInt((await query(`SELECT COUNT(*) FROM videos v ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const result = await query(
      `SELECT v.id, v.title, v.slug, v.study_level, v.price, v.is_free, v.is_active,
              v.video_host, v.video_url, v.thumbnail_url, v.duration_seconds,
              v.views_count, v.created_at,
              c.name_fr AS category_name,
              inst.display_name AS instructor_name
       FROM videos v
       LEFT JOIN categories c ON v.category_id = c.id
       LEFT JOIN instructors inst ON v.instructor_id = inst.id
       ${where} ORDER BY v.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`, params
    );
    res.json({ data: result.rows, pagination: { page: currentPage, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

router.post('/videos', async (req, res, next) => {
  try {
    const { title, description, category_id, study_level, instructor_id,
            video_url, video_host, thumbnail_url, duration_seconds,
            price, is_free, language, tags, is_featured } = req.body;
    if (!title) throw new AppError('Le titre est requis.', 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9À-ɏ]+/gi, '-').replace(/^-|-$/g,'') + '-' + Date.now();
    const result = await query(
      `INSERT INTO videos (title, slug, description, category_id, study_level, instructor_id,
        video_url, video_host, thumbnail_url, duration_seconds, price, is_free, language, tags, is_featured, is_active, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,TRUE,NOW()) RETURNING *`,
      [title, slug, description || null, category_id || null,
       study_level || 'tous', instructor_id || null,
       video_url || null, video_host || 'youtube',
       thumbnail_url || null, parseInt(duration_seconds) || null,
       parseFloat(price) || 0, is_free === true || is_free === 'true',
       language || 'fr', tags ? JSON.parse(tags) : [], is_featured === true || is_featured === 'true']
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/videos/:id', async (req, res, next) => {
  try {
    const { title, description, category_id, study_level, instructor_id,
            video_url, video_host, thumbnail_url, duration_seconds,
            price, is_free, language, tags, is_featured } = req.body;
    const result = await query(
      `UPDATE videos SET title=$1, description=$2, category_id=$3, study_level=$4, instructor_id=$5,
        video_url=$6, video_host=$7, thumbnail_url=$8, duration_seconds=$9,
        price=$10, is_free=$11, language=$12, tags=$13, is_featured=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [title, description || null, category_id || null,
       study_level || 'tous', instructor_id || null,
       video_url || null, video_host || 'youtube',
       thumbnail_url || null, parseInt(duration_seconds) || null,
       parseFloat(price) || 0, is_free === true || is_free === 'true',
       language || 'fr', tags ? JSON.parse(tags) : [],
       is_featured === true || is_featured === 'true', req.params.id]
    );
    if (!result.rows.length) throw new AppError('Vidéo introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.patch('/videos/:id/toggle-active', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE videos SET is_active = NOT is_active WHERE id=$1 RETURNING id, title, is_active`,
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Vidéo introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════

router.get('/articles', async (req, res, next) => {
  try {
    const { page, limit: lim, search, category } = req.query;
    const { limit, offset, currentPage } = paginate(page, lim);
    const conditions = [];
    const params = [];
    let i = 1;
    if (search) { conditions.push(`a.title ILIKE $${i++}`); params.push(`%${search}%`); }
    if (category) { conditions.push(`a.category_id = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = parseInt((await query(`SELECT COUNT(*) FROM articles a ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const result = await query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.is_published, a.is_free, a.price,
              a.read_time_min, a.views_count, a.created_at, a.published_at,
              c.name_fr AS category_name,
              inst.display_name AS author_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN instructors inst ON a.author_id = inst.id
       ${where} ORDER BY a.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`, params
    );
    res.json({ data: result.rows, pagination: { page: currentPage, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

router.post('/articles', async (req, res, next) => {
  try {
    const { title, excerpt, content, category_id, author_id, thumbnail_url,
            read_time_min, is_free, price, language, tags, doi, is_published } = req.body;
    if (!title) throw new AppError('Le titre est requis.', 400);
    if (!content) throw new AppError('Le contenu est requis.', 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9À-ɏ]+/gi, '-').replace(/^-|-$/g,'') + '-' + Date.now();
    const pub = is_published === true || is_published === 'true';
    const result = await query(
      `INSERT INTO articles (title, slug, excerpt, content, category_id, author_id, thumbnail_url,
        read_time_min, is_free, price, language, tags, doi, is_published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [title, slug, excerpt || null, content,
       category_id || null, author_id || null, thumbnail_url || null,
       parseInt(read_time_min) || null,
       is_free === true || is_free === 'true', parseFloat(price) || 0,
       language || 'fr', tags ? JSON.parse(tags) : [], doi || null,
       pub, pub ? new Date() : null]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/articles/:id', async (req, res, next) => {
  try {
    const { title, excerpt, content, category_id, author_id, thumbnail_url,
            read_time_min, is_free, price, language, tags, doi, is_published } = req.body;
    const pub = is_published === true || is_published === 'true';
    const result = await query(
      `UPDATE articles SET title=$1, excerpt=$2, content=$3, category_id=$4, author_id=$5,
        thumbnail_url=$6, read_time_min=$7, is_free=$8, price=$9, language=$10,
        tags=$11, doi=$12, is_published=$13,
        published_at = CASE WHEN $13=TRUE AND published_at IS NULL THEN NOW() ELSE published_at END,
        updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [title, excerpt || null, content, category_id || null, author_id || null,
       thumbnail_url || null, parseInt(read_time_min) || null,
       is_free === true || is_free === 'true', parseFloat(price) || 0,
       language || 'fr', tags ? JSON.parse(tags) : [], doi || null, pub, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.patch('/articles/:id/toggle-published', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE articles SET is_published = NOT is_published,
        published_at = CASE WHEN NOT is_published AND published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id=$1 RETURNING id, title, is_published`,
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/admin/articles/:id
router.delete('/articles/:id', async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM articles WHERE id=$1 RETURNING id, title',
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    res.json({ message: `Article "${result.rows[0].title}" supprimé.` });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════
// NIVEAUX D'ÉTUDES — CRUD
// ═══════════════════════════════════════════════════════════

// GET /api/admin/study-levels/:id/resources — ressources d'un niveau
router.get('/study-levels/:id/resources', async (req, res, next) => {
  try {
    const levelRes = await query('SELECT * FROM study_levels WHERE id=$1', [req.params.id]);
    if (!levelRes.rows.length) throw new AppError('Niveau introuvable.', 404);
    const level = levelRes.rows[0];
    const dbVal = level.db_value;

    const [products, videos, articles] = await Promise.all([
      query(`SELECT p.id, p.title, p.slug, p.type, p.is_active, p.is_free, p.price,
                    p.thumbnail_url, c.name_fr AS category_name
             FROM products p LEFT JOIN categories c ON p.category_id=c.id
             WHERE p.study_level=$1 ORDER BY p.created_at DESC`, [dbVal]),
      query(`SELECT v.id, v.title, v.slug, v.video_host, v.is_active, v.is_free, v.price,
                    v.thumbnail_url, c.name_fr AS category_name
             FROM videos v LEFT JOIN categories c ON v.category_id=c.id
             WHERE v.study_level=$1 ORDER BY v.created_at DESC`, [dbVal]),
      query(`SELECT a.id, a.title, a.slug, a.is_published, a.is_free, a.price,
                    a.thumbnail_url, c.name_fr AS category_name
             FROM articles a LEFT JOIN categories c ON a.category_id=c.id
             WHERE a.category_id IS NOT NULL OR a.is_published IS NOT NULL
             ORDER BY a.created_at DESC LIMIT 100`),
    ]);

    res.json({
      level,
      products:  products.rows,
      videos:    videos.rows,
      articles:  articles.rows,
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/resources/assign-level — assigner un niveau à une ressource
router.patch('/resources/assign-level', async (req, res, next) => {
  try {
    const { type, id, db_value } = req.body;
    if (!['product','video'].includes(type)) throw new AppError('Type invalide.', 400);
    const table = type === 'product' ? 'products' : 'videos';
    const result = await query(
      `UPDATE ${table} SET study_level=$1, updated_at=NOW() WHERE id=$2 RETURNING id, title, study_level`,
      [db_value, id]
    );
    if (!result.rows.length) throw new AppError('Ressource introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// GET /api/admin/study-levels
router.get('/study-levels', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM study_levels ORDER BY sort_order, id'
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/admin/study-levels
router.post('/study-levels', async (req, res, next) => {
  try {
    const { slug, label_fr, label_ar, icon, color, db_value, sort_order } = req.body;
    if (!label_fr) throw new AppError('Le libellé (FR) est requis.', 400);
    if (!db_value) throw new AppError('La valeur base de données est requise.', 400);
    const finalSlug = slug || label_fr.toLowerCase().replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');

    // Ajouter la valeur ENUM si elle n'existe pas encore
    const enumCheck = await query(
      "SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='content_level' AND enumlabel=$1",
      [db_value]
    );
    if (!enumCheck.rows.length) {
      await query(`ALTER TYPE content_level ADD VALUE IF NOT EXISTS '${db_value}'`);
    }

    const result = await query(
      `INSERT INTO study_levels (slug, label_fr, label_ar, icon, color, db_value, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [finalSlug, label_fr, label_ar || label_fr, icon || '🎓',
       color || '#1B3A6B', db_value, parseInt(sort_order) || 0]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/admin/study-levels/:id
router.put('/study-levels/:id', async (req, res, next) => {
  try {
    const { label_fr, label_ar, icon, color, db_value, sort_order, is_active } = req.body;
    if (!label_fr) throw new AppError('Le libellé (FR) est requis.', 400);

    // Ajouter la valeur ENUM si nouvelle
    if (db_value) {
      const enumCheck = await query(
        "SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='content_level' AND enumlabel=$1",
        [db_value]
      );
      if (!enumCheck.rows.length) {
        await query(`ALTER TYPE content_level ADD VALUE IF NOT EXISTS '${db_value}'`);
      }
    }

    const result = await query(
      `UPDATE study_levels SET label_fr=$1, label_ar=$2, icon=$3, color=$4,
       db_value=$5, sort_order=$6, is_active=$7 WHERE id=$8 RETURNING *`,
      [label_fr, label_ar || label_fr, icon || '🎓', color || '#1B3A6B',
       db_value, parseInt(sort_order) || 0, is_active !== false, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Niveau introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/admin/study-levels/:id
router.delete('/study-levels/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM study_levels WHERE id=$1', [req.params.id]);
    res.json({ message: 'Niveau supprimé.' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════
// UTILISATEURS
// ═══════════════════════════════════════════════════════════

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { limit: lim, offset, currentPage } = paginate(page, limit);

    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(lim, offset);
    const usersResult = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
              u.is_active, u.created_at,
              COUNT(DISTINCT o.id) AS order_count
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: usersResult.rows,
      pagination: { total, page: currentPage, limit: lim, pages: Math.ceil(total / lim) },
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, email, is_active',
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Utilisateur introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user', 'moderator'].includes(role)) {
      throw new AppError('Rôle invalide.', 400);
    }
    const result = await query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role',
      [role, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Utilisateur introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
