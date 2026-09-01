const express  = require('express');
const router   = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const authMiddleware  = authenticate;
const adminMiddleware = authorize('admin');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const sharp    = require('sharp');

// ── Upload config ─────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../../uploads/companies');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

async function resizeImage(src, dest, width, height) {
  await sharp(src).resize(width, height, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(dest);
  fs.unlinkSync(src);
}

// ══════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════════

// GET /api/companies — liste (annuaire)
router.get('/', async (req, res) => {
  try {
    const { wilaya, specialty, search, premium, page = 1, limit = 24 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conds  = ['c.is_active = TRUE'];

    if (wilaya)    { params.push(parseInt(wilaya)); conds.push(`${params.length} = ANY(c.wilayas)`); }
    if (specialty) { params.push(specialty);        conds.push(`$${params.length} = ANY(c.specialties)`); }
    if (premium === 'true') conds.push('c.is_premium = TRUE');
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(c.name ILIKE $${params.length} OR c.tagline ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    const where = conds.join(' AND ');
    params.push(parseInt(limit), offset);

    const [rows, countRow] = await Promise.all([
      query(`SELECT c.id, c.slug, c.name, c.logo_url, c.tagline, c.specialties,
                    c.wilayas, c.wilaya_siege, c.size_range, c.is_verified, c.is_premium,
                    c.founded_year, c.views_count,
                    (SELECT COUNT(*) FROM company_projects WHERE company_id=c.id) AS projects_count
             FROM companies c WHERE ${where}
             ORDER BY c.is_premium DESC, c.is_verified DESC, c.views_count DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      query(`SELECT COUNT(*) FROM companies c WHERE ${where}`, params.slice(0,-2)),
    ]);

    res.json({ success: true, data: rows.rows, total: parseInt(countRow.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/companies/:slug — profil complet
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM companies WHERE slug=$1 AND is_active=TRUE`, [req.params.slug]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Entreprise introuvable' });

    const company = rows[0];
    const projects = await query(`SELECT * FROM company_projects WHERE company_id=$1 ORDER BY sort_order, year DESC`, [company.id]);

    // incrément vues
    query(`UPDATE companies SET views_count=views_count+1 WHERE id=$1`, [company.id]).catch(()=>{});

    res.json({ success: true, data: { ...company, projects: projects.rows } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ══════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════

// GET /api/admin/companies
router.get('/admin/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, (SELECT COUNT(*) FROM company_projects WHERE company_id=c.id) AS projects_count
      FROM companies c ORDER BY c.created_at DESC LIMIT 200`);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/companies
router.post('/admin', authMiddleware, adminMiddleware, upload.fields([{ name:'logo', maxCount:1 },{ name:'cover', maxCount:1 }]), async (req, res) => {
  try {
    const { name, tagline, description, specialties, wilayas, wilaya_siege,
            size_range, founded_year, email, phone, website, address, agrement,
            is_verified, is_premium } = req.body;

    let slug = slugify(name);
    const exists = await query(`SELECT id FROM companies WHERE slug=$1`, [slug]);
    if (exists.rows.length) slug = slug + '-' + Date.now().toString(36);

    let logo_url = null, cover_url = null;

    if (req.files?.logo?.[0]) {
      const dest = path.join(uploadDir, `logo-${slug}.jpg`);
      await resizeImage(req.files.logo[0].path, dest, 300, 300);
      logo_url = `/uploads/companies/logo-${slug}.jpg`;
    }
    if (req.files?.cover?.[0]) {
      const dest = path.join(uploadDir, `cover-${slug}.jpg`);
      await resizeImage(req.files.cover[0].path, dest, 1200, 400);
      cover_url = `/uploads/companies/cover-${slug}.jpg`;
    }

    const specs = Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []);
    const wils  = Array.isArray(wilayas) ? wilayas.map(Number) : (wilayas ? [Number(wilayas)] : []);

    const { rows } = await query(`
      INSERT INTO companies (slug,name,logo_url,cover_url,tagline,description,specialties,wilayas,
        wilaya_siege,size_range,founded_year,email,phone,website,address,agrement,is_verified,is_premium)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [slug,name,logo_url,cover_url,tagline,description,specs,wils,
       wilaya_siege||null,size_range||null,founded_year||null,
       email||null,phone||null,website||null,address||null,agrement||null,
       is_verified==='true',is_premium==='true']);

    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/admin/companies/:id
router.patch('/admin/:id', authMiddleware, adminMiddleware, upload.fields([{ name:'logo', maxCount:1 },{ name:'cover', maxCount:1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT * FROM companies WHERE id=$1`, [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Introuvable' });

    const c = existing.rows[0];
    const { name, tagline, description, specialties, wilayas, wilaya_siege,
            size_range, founded_year, email, phone, website, address, agrement,
            is_verified, is_premium, is_active } = req.body;

    let { logo_url, cover_url } = c;

    if (req.files?.logo?.[0]) {
      const dest = path.join(uploadDir, `logo-${c.slug}.jpg`);
      await resizeImage(req.files.logo[0].path, dest, 300, 300);
      logo_url = `/uploads/companies/logo-${c.slug}.jpg`;
    }
    if (req.files?.cover?.[0]) {
      const dest = path.join(uploadDir, `cover-${c.slug}.jpg`);
      await resizeImage(req.files.cover[0].path, dest, 1200, 400);
      cover_url = `/uploads/companies/cover-${c.slug}.jpg`;
    }

    const specs = specialties ? (Array.isArray(specialties) ? specialties : [specialties]) : c.specialties;
    const wils  = wilayas ? (Array.isArray(wilayas) ? wilayas.map(Number) : [Number(wilayas)]) : c.wilayas;

    const { rows } = await query(`
      UPDATE companies SET
        name=$1, logo_url=$2, cover_url=$3, tagline=$4, description=$5,
        specialties=$6, wilayas=$7, wilaya_siege=$8, size_range=$9,
        founded_year=$10, email=$11, phone=$12, website=$13, address=$14,
        agrement=$15, is_verified=$16, is_premium=$17, is_active=$18, updated_at=NOW()
      WHERE id=$19 RETURNING *`,
      [name||c.name, logo_url, cover_url, tagline??c.tagline, description??c.description,
       specs, wils, wilaya_siege??c.wilaya_siege, size_range??c.size_range,
       founded_year??c.founded_year, email??c.email, phone??c.phone,
       website??c.website, address??c.address, agrement??c.agrement,
       is_verified!==undefined ? is_verified==='true' : c.is_verified,
       is_premium!==undefined  ? is_premium==='true'  : c.is_premium,
       is_active!==undefined   ? is_active==='true'   : c.is_active,
       id]);

    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/admin/companies/:id
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await query(`UPDATE companies SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/companies/:id/projects
router.post('/:id/projects', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, location, year, category, sort_order } = req.body;
    let image_url = null;
    if (req.file) {
      const dest = path.join(uploadDir, `proj-${Date.now()}.jpg`);
      await resizeImage(req.file.path, dest, 800, 600);
      image_url = `/uploads/companies/${path.basename(dest)}`;
    }
    const { rows } = await query(`
      INSERT INTO company_projects (company_id,title,description,image_url,location,year,category,sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, title, description||null, image_url, location||null,
       year||null, category||null, sort_order||0]);
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/companies/:id/projects/:pid
router.delete('/:id/projects/:pid', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await query(`DELETE FROM company_projects WHERE id=$1 AND company_id=$2`, [req.params.pid, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
