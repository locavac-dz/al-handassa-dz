const express   = require('express');
const router    = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const sharp     = require('sharp');
const auth  = authenticate;
const admin = authorize('admin');

const uploadDir = path.join(__dirname, '../../../uploads/professionals');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function arr(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val) return [val];
  return [];
}

// ══════════════════════════════════════════════════════════
// PUBLIC
// ══════════════════════════════════════════════════════════

// GET /api/professionals
router.get('/', async (req, res) => {
  try {
    const { wilaya, specialty, availability, search, page=1, limit=24 } = req.query;
    const params = [];
    const conds  = ['p.is_active = TRUE'];

    if (wilaya)       { params.push(parseInt(wilaya)); conds.push(`p.wilaya=$${params.length}`); }
    if (specialty)    { params.push(specialty);         conds.push(`$${params.length} = ANY(p.specialties)`); }
    if (availability) { params.push(availability);      conds.push(`p.availability=$${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length}
                  OR p.title ILIKE $${params.length} OR p.tagline ILIKE $${params.length}
                  OR p.bio ILIKE $${params.length})`);
    }

    const where  = conds.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const [rows, total] = await Promise.all([
      query(`SELECT id, slug, first_name, last_name, photo_url, title, tagline,
                    specialties, skills, wilaya, city, availability, contract_pref,
                    experience_years, education, is_verified, is_premium, views_count
             FROM professionals p WHERE ${where}
             ORDER BY p.is_premium DESC, p.is_verified DESC, p.views_count DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      query(`SELECT COUNT(*) FROM professionals p WHERE ${where}`, params.slice(0,-2)),
    ]);

    res.json({ success:true, data:rows.rows, total:parseInt(total.rows[0].count),
               page:parseInt(page), limit:parseInt(limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET /api/professionals/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM professionals WHERE slug=$1 AND is_active=TRUE`,
      [req.params.slug]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Profil introuvable' });
    query(`UPDATE professionals SET views_count=views_count+1 WHERE id=$1`, [rows[0].id]).catch(()=>{});
    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════

router.get('/admin/list', auth, admin, async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM professionals ORDER BY created_at DESC LIMIT 500`);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/admin', auth, admin, upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, title, tagline, bio, wilaya, city,
            specialties, skills, languages, experience_years, education, institution,
            availability, contract_pref, email, phone, linkedin_url, portfolio_url,
            is_verified, is_premium } = req.body;

    if (!first_name || !last_name)
      return res.status(400).json({ success:false, message:'Prénom et nom requis' });

    let slug = slugify(`${first_name} ${last_name}`) + '-' + Date.now().toString(36);
    let photo_url = null;

    if (req.file) {
      const dest = path.join(uploadDir, `photo-${slug}.jpg`);
      await sharp(req.file.path).resize(300,300,{fit:'cover'}).jpeg({quality:85}).toFile(dest);
      fs.unlinkSync(req.file.path);
      photo_url = `/uploads/professionals/photo-${slug}.jpg`;
    }

    const { rows } = await query(`
      INSERT INTO professionals
        (slug,first_name,last_name,photo_url,title,tagline,bio,wilaya,city,
         specialties,skills,languages,experience_years,education,institution,
         availability,contract_pref,email,phone,linkedin_url,portfolio_url,
         is_verified,is_premium)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING *`,
      [slug,first_name,last_name,photo_url,title||null,tagline||null,bio||null,
       wilaya?parseInt(wilaya):null,city||null,
       arr(specialties),arr(skills),arr(languages),
       experience_years?parseInt(experience_years):null,
       education||null,institution||null,
       availability||null,contract_pref||null,
       email||null,phone||null,linkedin_url||null,portfolio_url||null,
       is_verified==='true',is_premium==='true']);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.patch('/admin/:id', auth, admin, upload.single('photo'), async (req, res) => {
  try {
    const exist = await query(`SELECT * FROM professionals WHERE id=$1`, [req.params.id]);
    if (!exist.rows.length) return res.status(404).json({ success:false, message:'Introuvable' });
    const pr = exist.rows[0];

    const { first_name, last_name, title, tagline, bio, wilaya, city,
            specialties, skills, languages, experience_years, education, institution,
            availability, contract_pref, email, phone, linkedin_url, portfolio_url,
            is_verified, is_premium, is_active } = req.body;

    let photo_url = pr.photo_url;
    if (req.file) {
      const dest = path.join(uploadDir, `photo-${pr.slug}.jpg`);
      await sharp(req.file.path).resize(300,300,{fit:'cover'}).jpeg({quality:85}).toFile(dest);
      fs.unlinkSync(req.file.path);
      photo_url = `/uploads/professionals/photo-${pr.slug}.jpg`;
    }

    const { rows } = await query(`
      UPDATE professionals SET
        first_name=$1,last_name=$2,photo_url=$3,title=$4,tagline=$5,bio=$6,
        wilaya=$7,city=$8,specialties=$9,skills=$10,languages=$11,
        experience_years=$12,education=$13,institution=$14,
        availability=$15,contract_pref=$16,email=$17,phone=$18,
        linkedin_url=$19,portfolio_url=$20,
        is_verified=$21,is_premium=$22,is_active=$23,updated_at=NOW()
      WHERE id=$24 RETURNING *`,
      [first_name??pr.first_name, last_name??pr.last_name, photo_url,
       title??pr.title, tagline??pr.tagline, bio??pr.bio,
       wilaya!==undefined?(wilaya?parseInt(wilaya):null):pr.wilaya,
       city??pr.city,
       specialties!==undefined?arr(specialties):pr.specialties,
       skills!==undefined?arr(skills):pr.skills,
       languages!==undefined?arr(languages):pr.languages,
       experience_years!==undefined?(experience_years?parseInt(experience_years):null):pr.experience_years,
       education??pr.education, institution??pr.institution,
       availability??pr.availability, contract_pref??pr.contract_pref,
       email??pr.email, phone??pr.phone,
       linkedin_url??pr.linkedin_url, portfolio_url??pr.portfolio_url,
       is_verified!==undefined?(is_verified==='true'):pr.is_verified,
       is_premium!==undefined?(is_premium==='true'):pr.is_premium,
       is_active!==undefined?(is_active==='true'):pr.is_active,
       req.params.id]);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.delete('/admin/:id', auth, admin, async (req, res) => {
  try {
    await query(`UPDATE professionals SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
