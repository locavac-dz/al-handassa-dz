const router = require('express').Router();
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { paginate, slugify } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

// ── Liste publique ────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { category, search, free, verified } = req.query;

    const conds = ["a.status='published'"];
    const params = [];
    let i = 1;
    if (category)       { conds.push(`c.slug=$${i++}`); params.push(category); }
    if (free === 'true')  conds.push('a.is_free=TRUE');
    if (verified === 'true') conds.push('a.is_verified=TRUE');
    if (search) {
      conds.push(`to_tsvector('french', a.title||' '||COALESCE(a.excerpt,'')) @@ plainto_tsquery('french',$${i++})`);
      params.push(search);
    }

    const where = `WHERE ${conds.join(' AND ')}`;
    const total = parseInt((await query(
      `SELECT COUNT(*) FROM articles a LEFT JOIN categories c ON a.category_id=c.id ${where}`, params
    )).rows[0].count, 10);

    params.push(limit, offset);
    const result = await query(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.abstract, a.thumbnail_url, a.read_time_min,
              a.is_free, a.price, a.views_count, a.tags, a.keywords, a.published_at,
              a.doi, a.is_verified, a.verified_at,
              c.name_fr AS category_name, c.slug AS category_slug,
              inst.display_name AS author_name, inst.title AS author_title,
              inst.institution AS author_institution, inst.is_verified AS author_verified
       FROM articles a
       LEFT JOIN categories c ON a.category_id=c.id
       LEFT JOIN instructors inst ON a.author_id=inst.id
       ${where}
       ORDER BY a.published_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );
    res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// ── File de modération (admin) ────────────────────────────────────────────────
router.get('/admin/pending', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const result = await query(
      `SELECT a.id, a.title, a.slug, a.abstract, a.status, a.submitted_at,
              a.is_verified, a.rejection_note,
              inst.display_name AS author_name, inst.title AS author_title,
              inst.institution AS author_institution
       FROM articles a
       LEFT JOIN instructors inst ON a.author_id=inst.id
       WHERE a.status IN ('pending','rejected')
       ORDER BY a.submitted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = parseInt((await query(
      `SELECT COUNT(*) FROM articles WHERE status IN ('pending','rejected')`
    )).rows[0].count, 10);
    res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// ── Détail article ────────────────────────────────────────────────────────────
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, c.name_fr AS category_name,
              inst.display_name AS author_name, inst.title AS author_title,
              inst.institution AS author_institution, inst.avatar_url AS author_avatar,
              inst.bio AS author_bio, inst.is_verified AS author_verified
       FROM articles a
       LEFT JOIN categories c ON a.category_id=c.id
       LEFT JOIN instructors inst ON a.author_id=inst.id
       WHERE a.slug=$1 AND a.status='published'`,
      [req.params.slug]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    const article = result.rows[0];
    query('UPDATE articles SET views_count=views_count+1 WHERE id=$1', [article.id]).catch(() => {});

    let content = article.is_free ? article.content : null;
    if (!content && req.user) {
      const access = await query(
        `SELECT 1 FROM users WHERE id=$1 AND subscription_plan IN ('standard','pro')
         AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())`,
        [req.user.id]
      );
      if (access.rows.length) content = article.content;
    }
    res.json({ data: { ...article, content, preview: content ? null : article.excerpt } });
  } catch (err) { next(err); }
});

// ── Soumission publique (auteur connecté) ─────────────────────────────────────
router.post('/submit', authenticate, [
  body('title').trim().notEmpty().withMessage('Titre requis.'),
  body('content').notEmpty().withMessage('Contenu requis.'),
  body('abstract').trim().notEmpty().withMessage('Résumé (abstract) requis.'),
], validate, async (req, res, next) => {
  try {
    const {
      title, excerpt, abstract, content, category_id,
      read_time_min, is_free, price, tags, keywords,
      doi, language, bibliography,
    } = req.body;

    // Récupérer ou créer l'entrée instructor liée à cet utilisateur
    let instrRes = await query('SELECT id FROM instructors WHERE user_id=$1', [req.user.id]);
    if (!instrRes.rows.length) {
      instrRes = await query(
        `INSERT INTO instructors (user_id, display_name, title, institution)
         SELECT id, COALESCE(first_name||' '||last_name, email), NULL, NULL
         FROM users WHERE id=$1 RETURNING id`,
        [req.user.id]
      );
    }
    const authorId = instrRes.rows[0].id;

    const slug = slugify(title) + '-' + Date.now();
    const tagsArr = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    const kwArr   = Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []);
    const biblArr = Array.isArray(bibliography) ? bibliography : (bibliography ? [bibliography] : []);

    const result = await query(
      `INSERT INTO articles
         (title, slug, excerpt, abstract, content, category_id, author_id,
          read_time_min, is_free, price, tags, keywords, doi, language,
          bibliography, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',NOW())
       RETURNING id, title, slug, status, submitted_at`,
      [title, slug, excerpt || null, abstract, content,
       category_id || null, authorId, read_time_min || null,
       is_free !== false, price || 0,
       tagsArr, kwArr, doi || null, language || 'fr', biblArr]
    );
    res.status(201).json({
      data: result.rows[0],
      message: 'Article soumis. Il sera publié après validation par notre équipe éditoriale.',
    });
  } catch (err) { next(err); }
});

// ── Modération : approuver ────────────────────────────────────────────────────
router.patch('/:id/approve', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE articles
       SET status='published', is_published=TRUE, is_verified=TRUE,
           verified_by=$1, verified_at=NOW(), published_at=NOW(), rejection_note=NULL
       WHERE id=$2 RETURNING id, title, status`,
      [req.user.id, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    res.json({ data: result.rows[0], message: 'Article approuvé et publié.' });
  } catch (err) { next(err); }
});

// ── Modération : rejeter ──────────────────────────────────────────────────────
router.patch('/:id/reject', authenticate, authorize('admin'), [
  body('note').trim().notEmpty().withMessage('Note de rejet requise.'),
], validate, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE articles
       SET status='rejected', is_published=FALSE, rejection_note=$1
       WHERE id=$2 RETURNING id, title, status`,
      [req.body.note, req.params.id]
    );
    if (!result.rows.length) throw new AppError('Article introuvable.', 404);
    res.json({ data: result.rows[0], message: 'Article rejeté.' });
  } catch (err) { next(err); }
});

// ── Création directe admin ────────────────────────────────────────────────────
router.post('/', authenticate, authorize('admin', 'instructor'), [
  body('title').trim().notEmpty(),
  body('content').notEmpty(),
], validate, async (req, res, next) => {
  try {
    const {
      title, excerpt, abstract, content, category_id, author_id,
      read_time_min, is_free, price, tags, keywords, doi, language, bibliography,
    } = req.body;
    const slug = slugify(title) + '-' + Date.now();
    const tagsArr = Array.isArray(tags) ? tags : [];
    const kwArr   = Array.isArray(keywords) ? keywords : [];
    const biblArr = Array.isArray(bibliography) ? bibliography : [];

    const result = await query(
      `INSERT INTO articles
         (title, slug, excerpt, abstract, content, category_id, author_id,
          read_time_min, is_free, price, tags, keywords, doi, language, bibliography,
          status, is_published, is_verified, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'published',TRUE,TRUE,NOW())
       RETURNING *`,
      [title, slug, excerpt || null, abstract || null, content,
       category_id || null, author_id || null, read_time_min || null,
       is_free !== false, price || 0, tagsArr, kwArr, doi || null,
       language || 'fr', biblArr]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
