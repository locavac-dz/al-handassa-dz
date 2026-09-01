const router = require('express').Router();
const { body } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize, optionalAuth, requireSubscription } = require('../middleware/auth');
const { uploadVideo, uploadImage } = require('../middleware/upload');
const { paginate, slugify } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

// GET /api/videos
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { category, level, free, search, source } = req.query;

    const conds = ['v.is_active=TRUE'];
    const params = [];
    let i = 1;
    if (category) { conds.push(`c.slug=$${i++}`); params.push(category); }
    if (level) { conds.push(`v.study_level=$${i++}`); params.push(level); }
    if (free === 'true') conds.push('v.is_free=TRUE');
    if (source) { conds.push(`v.source=$${i++}`); params.push(source); }
    if (search) {
      conds.push(`to_tsvector('french',v.title) @@ plainto_tsquery('french',$${i++})`);
      params.push(search);
    }

    const where = `WHERE ${conds.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) FROM videos v LEFT JOIN categories c ON v.category_id=c.id ${where}`, params);
    params.push(limit, offset);

    const result = await query(
      `SELECT v.id, v.title, v.slug, v.study_level, v.duration_seconds, v.thumbnail_url,
              v.video_url, v.source, v.price, v.is_free, v.views_count, v.rating_avg, v.tags, v.language, v.published_at,
              v.chapters,
              c.name_fr AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              inst.display_name AS instructor_name
       FROM videos v
       LEFT JOIN categories c ON v.category_id=c.id
       LEFT JOIN instructors inst ON v.instructor_id=inst.id
       ${where}
       ORDER BY v.published_at DESC NULLS LAST
       LIMIT $${i++} OFFSET $${i}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);
    res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

// GET /api/videos/:slug
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT v.*, c.name_fr AS category_name, inst.display_name AS instructor_name, inst.institution
       FROM videos v
       LEFT JOIN categories c ON v.category_id=c.id
       LEFT JOIN instructors inst ON v.instructor_id=inst.id
       WHERE v.slug=$1 AND v.is_active=TRUE`,
      [req.params.slug]
    );
    if (!result.rows.length) throw new AppError('Vidéo introuvable.', 404);
    const video = result.rows[0];
    query('UPDATE videos SET views_count=views_count+1 WHERE id=$1', [video.id]).catch(()=>{});

    // URL vidéo seulement si accès autorisé
    let videoUrl = null;
    if (video.is_free) {
      videoUrl = video.video_url;
    } else if (req.user) {
      const access = await query(
        `SELECT 1 FROM user_video_access WHERE user_id=$1 AND video_id=$2
         UNION SELECT 1 FROM users WHERE id=$1 AND subscription_plan IN ('standard','pro')
         AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())`,
        [req.user.id, video.id]
      );
      if (access.rows.length) videoUrl = video.video_url;
    }

    res.json({ data: { ...video, video_url: videoUrl } });
  } catch (err) { next(err); }
});

// POST /api/videos — admin/instructor
router.post('/', authenticate, authorize('admin','instructor'),
  uploadVideo.fields([{ name:'video', maxCount:1 }, { name:'thumbnail', maxCount:1 }]),
  [
    body('title').trim().notEmpty().withMessage('Titre requis.'),
    body('price').isFloat({ min:0 }).withMessage('Prix invalide (nombre positif requis).'),
  ], validate,
  async (req, res, next) => {
    try {
      const { title, description, category_id, study_level, instructor_id, price, is_free, language, tags } = req.body;
      const slug = slugify(title) + '-' + Date.now();
      const video_url = req.files?.video?.[0] ? `/uploads/videos/${req.files.video[0].filename}` : null;
      const thumbnail_url = req.files?.thumbnail?.[0] ? `/uploads/images/${req.files.thumbnail[0].filename}` : null;

      const result = await query(
        `INSERT INTO videos (title, slug, description, category_id, study_level, instructor_id, price, is_free, video_url, thumbnail_url, language, tags, is_active, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,NOW()) RETURNING *`,
        [title, slug, description, category_id, study_level||'tous', instructor_id||null,
         parseFloat(price)||0, is_free==='true', video_url, thumbnail_url, language||'fr', tags?JSON.parse(tags):[]]
      );
      res.status(201).json({ data: result.rows[0] });
    } catch (err) { next(err); }
  }
);

module.exports = router;
