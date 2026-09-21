const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/productController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadProduct, uploadImage, uploadProductFiles } = require('../middleware/upload');
const validate = require('../middleware/validate');

// GET /api/products/search/query?q=mot — recherche par titre, description, catégorie ou tag
// (category_name / instructor_name viennent de jointures : ce ne sont pas des colonnes de products,
// l'ancienne requête échouait donc à chaque appel)
router.get('/search/query', optionalAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
    if (q.length < 2) return res.json({ data: [] });

    const { query } = require('../config/database');
    // % _ et \ saisis par l'utilisateur sont des caractères littéraux, pas des jokers LIKE
    const searchPattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;

    const result = await query(
      `SELECT p.id, p.slug, p.title, p.type, p.price, p.discount_price, p.is_free, p.rating_avg, p.rating_count,
              p.thumbnail_url, p.study_level,
              c.name_fr AS category_name, c.slug AS category_slug,
              inst.display_name AS instructor_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN instructors inst ON p.instructor_id = inst.id
       WHERE p.is_active = TRUE AND (
         LOWER(p.title) LIKE $1
         OR LOWER(COALESCE(p.description, '')) LIKE $1
         OR LOWER(COALESCE(c.name_fr, '')) LIKE $1
         OR LOWER(p.tags::text) LIKE $1
       )
       ORDER BY
         CASE WHEN LOWER(p.title) LIKE $1 THEN 1 ELSE 2 END,
         p.rating_avg DESC NULLS LAST,
         p.rating_count DESC NULLS LAST
       LIMIT 50`,
      [searchPattern]
    );

    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/products — liste publique avec filtres
router.get('/', optionalAuth, ctrl.list);

// GET /api/products/:slug
router.get('/:slug', optionalAuth, ctrl.getOne);

// POST /api/products — admin/instructor seulement
router.post('/', authenticate, authorize('admin','instructor'),
  uploadProduct.fields([{ name:'file', maxCount:1 }, { name:'thumbnail', maxCount:1 }]),
  [
    body('title').trim().notEmpty().withMessage('Titre requis.'),
    body('type').isIn(['ouvrage','cours_pdf','exercices','normes','logiciels','pack','sujet','td_pdf','tp_pdf','tuto_pdf']).withMessage('Type invalide.'),
    body('price').isFloat({ min:0 }).withMessage('Prix invalide (nombre positif requis).'),
  ], validate,
  ctrl.create
);

// PATCH /api/products/:id
router.patch('/:id', authenticate, authorize('admin','instructor'), ctrl.update);

// POST /api/products/:id/upload — upload fichier principal + miniature
router.post('/:id/upload',
  authenticate, authorize('admin', 'instructor'),
  uploadProductFiles.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  ctrl.uploadFile
);

// DELETE /api/products/:id (soft delete)
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

// GET /api/products/:id/download — téléchargement sécurisé
router.get('/:id/download', authenticate, ctrl.download);

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    const result = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = TRUE
       ORDER BY r.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ data: result.rows });
  } catch(err) { next(err); }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', authenticate, [
  body('rating').isInt({ min:1, max:5 }).withMessage('Note entre 1 et 5 requise.'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Commentaire trop long (max 1000 caractères).'),
], validate, ctrl.addReview);

module.exports = router;
