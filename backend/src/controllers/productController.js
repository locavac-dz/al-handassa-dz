const { query } = require('../config/database');
const { slugify, paginate } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { generateThumb } = require('../utils/generateThumb');
const { generatePreviewAsync } = require('../utils/generatePreview');
const path = require('path');
const fs = require('fs');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { category, type, level, search, sort, free, exclude_type, exclude_category, tag } = req.query;

    const conditions = ['p.is_active = TRUE'];
    const params = [];
    let i = 1;

    if (category)          { conditions.push(`c.slug = $${i++}`); params.push(category); }
    if (type)              { conditions.push(`p.type = $${i++}`); params.push(type); }
    if (exclude_type)      { conditions.push(`p.type != $${i++}`); params.push(exclude_type); }
    if (exclude_category)  {
      const exCats = exclude_category.split(',').map(s => s.trim()).filter(Boolean);
      const placeholders = exCats.map(() => `$${i++}`).join(',');
      conditions.push(`(c.slug IS NULL OR c.slug NOT IN (${placeholders}))`);
      exCats.forEach(c => params.push(c));
    }
    if (level)        { conditions.push(`(p.study_level = $${i++} OR p.study_level = 'tous')`); params.push(level); }
    if (free === 'true') { conditions.push(`p.is_free = TRUE`); }
    if (tag)          { conditions.push(`$${i++} = ANY(p.tags)`); params.push(tag); }
    if (search) {
      conditions.push(`(to_tsvector('french', p.title || ' ' || COALESCE(p.description,'')) @@ plainto_tsquery('french', $${i++}))`);
      params.push(search);
    }

    const sortMap = {
      newest:  'p.created_at DESC',
      oldest:  'p.created_at ASC',
      popular: 'p.downloads_count DESC',
      rating:  'p.rating_avg DESC',
      price_asc:  'effective_price ASC',
      price_desc: 'effective_price DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const result = await query(
      `SELECT p.id, p.title, p.slug, p.type, p.study_level, p.price, p.discount_price,
              p.is_free, p.is_active, p.file_url, p.preview_url, p.thumbnail_url, p.rating_avg, p.rating_count, p.downloads_count,
              p.tags, p.language, p.created_at,
              c.name_fr AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              inst.display_name AS instructor_name,
              CASE WHEN p.discount_price IS NOT NULL AND (p.discount_ends_at IS NULL OR p.discount_ends_at > NOW())
                   THEN p.discount_price ELSE p.price END AS effective_price
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN instructors inst ON p.instructor_id = inst.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${i++} OFFSET $${i++}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await query(
      `SELECT p.*, c.name_fr AS category_name, c.slug AS category_slug,
              inst.display_name AS instructor_name, inst.institution, inst.bio AS instructor_bio, inst.avatar_url AS instructor_avatar
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN instructors inst ON p.instructor_id = inst.id
       WHERE p.slug = $1 AND p.is_active = TRUE`,
      [slug]
    );
    if (!result.rows.length) throw new AppError('Produit introuvable.', 404);

    const product = result.rows[0];

    // Incrémenter vues
    query('UPDATE products SET views_count = views_count + 1 WHERE id = $1', [product.id]).catch(() => {});

    // Avis récents (approuvés)
    const reviews = await query(
      `SELECT r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.study_level
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC LIMIT 5`,
      [product.id]
    );

    // Produits liés
    const related = await query(
      `SELECT id, title, slug, type, price, discount_price, is_free, thumbnail_url, rating_avg
       FROM products
       WHERE category_id = $1 AND id != $2 AND is_active = TRUE
       ORDER BY rating_avg DESC LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({ data: product, reviews: reviews.rows, related: related.rows });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title, description, type, category_id, study_level, instructor_id,
            price, discount_price, is_free, language, tags } = req.body;

    const slug = slugify(title) + '-' + Date.now();
    const file_url = req.files?.file?.[0]
      ? `/uploads/products/${req.files.file[0].filename}` : null;
    const thumbnail_url = req.files?.thumbnail?.[0]
      ? `/uploads/images/${req.files.thumbnail[0].filename}` : null;

    const result = await query(
      `INSERT INTO products (title, slug, description, type, category_id, study_level, instructor_id,
        price, discount_price, is_free, file_url, thumbnail_url, language, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [title, slug, description, type, category_id, study_level || 'tous',
       instructor_id || null, parseFloat(price) || 0, discount_price || null,
       is_free === 'true', file_url, thumbnail_url, language || 'fr',
       tags ? JSON.parse(tags) : []]
    );

    const product = result.rows[0];

    // Générer l'aperçu en arrière-plan si fichier PDF ou ZIP
    if (file_url && req.files?.file?.[0]) {
      const absPath = path.join(__dirname, '../../', file_url);
      generatePreviewAsync(absPath, product.id, product.slug, async (prodId, prevUrl, nbPages) => {
        try {
          await query(
            'UPDATE products SET preview_url=$1, preview_pages=$2 WHERE id=$3',
            [prevUrl, nbPages, prodId]
          );
        } catch (e) { console.warn('[Preview] DB update error:', e.message); }
      });
    }

    res.status(201).json({ data: product });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    const allowed = ['title','description','type','category_id','study_level','price',
                     'discount_price','discount_ends_at','is_free','language','tags','is_active','is_featured'];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${i++}`);
        params.push(fields[key]);
      }
    }
    if (!updates.length) throw new AppError('Aucun champ à mettre à jour.', 400);

    params.push(id);
    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );
    if (!result.rows.length) throw new AppError('Produit introuvable.', 404);
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await query(
      'UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError('Produit introuvable.', 404);
    res.json({ message: 'Produit désactivé.' });
  } catch (err) { next(err); }
}

async function download(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const prod = await query('SELECT id, title, file_url, price, is_free FROM products WHERE id=$1 AND is_active=TRUE', [id]);
    if (!prod.rows.length) throw new AppError('Produit introuvable.', 404);

    const product = prod.rows[0];

    if (!product.is_free) {
      // Vérifier achat ou abonnement
      const hasAccess = await query(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id=$1 AND oi.product_id=$2 AND o.status='paid'
         UNION
         SELECT 1 FROM users WHERE id=$1 AND subscription_plan IN ('standard','pro')
         AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())`,
        [userId, id]
      );
      if (!hasAccess.rows.length) {
        throw new AppError('Accès refusé. Achetez ce produit ou abonnez-vous.', 403);
      }
    }

    // Enregistrer le téléchargement
    await query(
      `INSERT INTO user_downloads (user_id, product_id) VALUES ($1,$2)
       ON CONFLICT (user_id, product_id) DO UPDATE SET downloaded_at = NOW()`,
      [userId, id]
    );
    await query('UPDATE products SET downloads_count = downloads_count + 1 WHERE id=$1', [id]);

    const filePath = path.join(__dirname, '../../', product.file_url);
    const ext = path.extname(product.file_url) || '.pdf'; // .zip, .pdf, etc.
    res.download(filePath, `${slugify(product.title)}${ext}`);
  } catch (err) { next(err); }
}

async function addReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Vérifier doublon
    const existing = await query('SELECT id FROM reviews WHERE user_id=$1 AND product_id=$2', [req.user.id, id]);
    if (existing.rows.length) throw new AppError('Vous avez déjà donné un avis pour ce produit.', 409);

    await query(
      'INSERT INTO reviews (user_id, product_id, rating, comment, is_approved) VALUES ($1,$2,$3,$4,TRUE)',
      [req.user.id, id, rating, comment || null]
    );

    // Mettre à jour rating_avg et rating_count
    await query(`
      UPDATE products SET
        rating_avg   = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1 AND is_approved=TRUE),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id=$1 AND is_approved=TRUE)
      WHERE id=$1`, [id]);

    res.status(201).json({ message: 'Avis publié avec succès. Merci !' });
  } catch (err) { next(err); }
}

async function uploadFile(req, res, next) {
  try {
    const { id } = req.params;

    const current = await query(
      'SELECT id, file_url, thumbnail_url FROM products WHERE id = $1',
      [id]
    );
    if (!current.rows.length) throw new AppError('Produit introuvable.', 404);

    const { file_url: oldFile, thumbnail_url: oldThumb } = current.rows[0];

    const updates = [];
    const params = [];
    let i = 1;

    // ── Fichier principal ─────────────────────────────────────────────────────
    if (req.files?.file?.[0]) {
      if (oldFile) {
        const abs = path.join(__dirname, '../../', oldFile);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
      updates.push(`file_url = $${i++}`);
      params.push(`/uploads/products/${req.files.file[0].filename}`);
    }

    // ── Miniature manuelle ────────────────────────────────────────────────────
    if (req.files?.thumbnail?.[0]) {
      if (oldThumb) {
        const abs = path.join(__dirname, '../../', oldThumb);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
      updates.push(`thumbnail_url = $${i++}`);
      params.push(`/uploads/products/${req.files.thumbnail[0].filename}`);
    }

    // ── Auto-génération miniature depuis PDF ──────────────────────────────────
    const newPdfFile = req.files?.file?.[0];
    const autoThumb  = req.body?.auto_thumb === 'true' || req.body?.auto_thumb === true;
    if (autoThumb && !req.files?.thumbnail?.[0]) {
      // Utiliser le nouveau PDF ou l'ancien s'il existe
      let pdfRelPath = newPdfFile
        ? `/uploads/products/${newPdfFile.filename}`
        : oldFile;

      if (pdfRelPath && pdfRelPath.endsWith('.pdf')) {
        const pdfAbs = path.join(__dirname, '../../', pdfRelPath);
        const baseName = path.basename(pdfRelPath, '.pdf');
        const thumbName = `thumb-${baseName}.jpg`;
        const thumbDir  = path.join(__dirname, '../../uploads/images/thumbs');
        const thumbAbs  = path.join(thumbDir, thumbName);
        fs.mkdirSync(thumbDir, { recursive: true });
        try {
          await generateThumb(pdfAbs, thumbAbs);
          if (oldThumb && oldThumb.startsWith('/uploads/images/thumbs/')) {
            const abs = path.join(__dirname, '../../', oldThumb);
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
          }
          updates.push(`thumbnail_url = $${i++}`);
          params.push(`/uploads/images/thumbs/${thumbName}`);
        } catch (thumbErr) {
          console.warn('⚠️ Génération miniature échouée:', thumbErr.message);
        }
      }
    }

    if (!updates.length) throw new AppError('Aucun fichier reçu.', 400);

    params.push(id);
    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, title, file_url, thumbnail_url`,
      params
    );

    res.json({
      message: 'Fichier(s) uploadé(s) avec succès.',
      data: result.rows[0],
    });
  } catch (err) {
    // Supprimer les fichiers orphelins en cas d'erreur DB
    ['file', 'thumbnail'].forEach(field => {
      req.files?.[field]?.[0] && (() => {
        try { fs.unlinkSync(req.files[field][0].path); } catch {}
      })();
    });
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, download, addReview, uploadFile };
