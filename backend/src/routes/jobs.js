const express   = require('express');
const router    = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const auth  = authenticate;
const admin = authorize('admin');

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// ══════════════════════════════════════════════════════════
// PUBLIC
// ══════════════════════════════════════════════════════════

// GET /api/jobs — liste
router.get('/', async (req, res) => {
  try {
    const { wilaya, specialty, contract_type, level, search, featured, page=1, limit=20 } = req.query;
    const params = [];
    const conds  = ['j.is_active = TRUE', '(j.expires_at IS NULL OR j.expires_at >= CURRENT_DATE)'];

    if (wilaya)        { params.push(parseInt(wilaya));  conds.push(`j.wilaya=$${params.length}`); }
    if (specialty)     { params.push(specialty);          conds.push(`j.specialty=$${params.length}`); }
    if (contract_type) { params.push(contract_type);      conds.push(`j.contract_type=$${params.length}`); }
    if (level)         { params.push(level);              conds.push(`j.level=$${params.length}`); }
    if (featured==='true') conds.push('j.is_featured=TRUE');
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length} OR j.specialty ILIKE $${params.length})`);
    }

    const where  = conds.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const [rows, total] = await Promise.all([
      query(`SELECT j.id, j.slug, j.title, j.contract_type, j.specialty, j.level,
                    j.wilaya, j.city, j.salary_range, j.experience, j.education,
                    j.is_featured, j.expires_at, j.created_at, j.views_count,
                    c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                    c.is_verified AS company_verified
             FROM job_offers j
             LEFT JOIN companies c ON c.id=j.company_id
             WHERE ${where}
             ORDER BY j.is_featured DESC, j.created_at DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      query(`SELECT COUNT(*) FROM job_offers j WHERE ${where}`, params.slice(0,-2)),
    ]);

    res.json({ success:true, data:rows.rows, total:parseInt(total.rows[0].count),
               page:parseInt(page), limit:parseInt(limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET /api/jobs/:slug — détail
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT j.*, c.name AS company_name, c.slug AS company_slug,
             c.logo_url AS company_logo, c.tagline AS company_tagline,
             c.is_verified AS company_verified, c.wilaya_siege AS company_wilaya
      FROM job_offers j
      LEFT JOIN companies c ON c.id=j.company_id
      WHERE j.slug=$1 AND j.is_active=TRUE`, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ success:false, message:'Offre introuvable' });
    query(`UPDATE job_offers SET views_count=views_count+1 WHERE id=$1`, [rows[0].id]).catch(()=>{});
    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════

// GET /api/jobs/admin/list
router.get('/admin/list', auth, admin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT j.*, c.name AS company_name
      FROM job_offers j
      LEFT JOIN companies c ON c.id=j.company_id
      ORDER BY j.created_at DESC LIMIT 500`);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/jobs/admin
router.post('/admin', auth, admin, async (req, res) => {
  try {
    const { title, description, missions, profile, company_id, wilaya, city,
            contract_type, specialty, level, education, experience, salary_range,
            contact_email, contact_phone, is_featured, expires_at } = req.body;

    if (!title) return res.status(400).json({ success:false, message:'Titre requis' });

    let slug = slugify(title) + '-' + Date.now().toString(36);

    const { rows } = await query(`
      INSERT INTO job_offers
        (title,slug,description,missions,profile,company_id,wilaya,city,
         contract_type,specialty,level,education,experience,salary_range,
         contact_email,contact_phone,is_featured,expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [title,slug,description||null,missions||null,profile||null,
       company_id||null, wilaya?parseInt(wilaya):null, city||null,
       contract_type||null,specialty||null,level||null,education||null,
       experience||null,salary_range||null,contact_email||null,contact_phone||null,
       is_featured==='true'||is_featured===true,
       expires_at||null]);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// PATCH /api/jobs/admin/:id
router.patch('/admin/:id', auth, admin, async (req, res) => {
  try {
    const exist = await query(`SELECT * FROM job_offers WHERE id=$1`, [req.params.id]);
    if (!exist.rows.length) return res.status(404).json({ success:false, message:'Introuvable' });
    const j = exist.rows[0];

    const { title, description, missions, profile, company_id, wilaya, city,
            contract_type, specialty, level, education, experience, salary_range,
            contact_email, contact_phone, is_featured, is_active, expires_at } = req.body;

    const { rows } = await query(`
      UPDATE job_offers SET
        title=$1, description=$2, missions=$3, profile=$4, company_id=$5,
        wilaya=$6, city=$7, contract_type=$8, specialty=$9, level=$10,
        education=$11, experience=$12, salary_range=$13, contact_email=$14,
        contact_phone=$15, is_featured=$16, is_active=$17, expires_at=$18, updated_at=NOW()
      WHERE id=$19 RETURNING *`,
      [title??j.title, description??j.description, missions??j.missions, profile??j.profile,
       company_id!==undefined?(company_id||null):j.company_id,
       wilaya!==undefined?(wilaya?parseInt(wilaya):null):j.wilaya,
       city??j.city, contract_type??j.contract_type, specialty??j.specialty,
       level??j.level, education??j.education, experience??j.experience,
       salary_range??j.salary_range, contact_email??j.contact_email,
       contact_phone??j.contact_phone,
       is_featured!==undefined?(is_featured==='true'||is_featured===true):j.is_featured,
       is_active!==undefined?(is_active==='true'||is_active===true):j.is_active,
       expires_at!==undefined?(expires_at||null):j.expires_at,
       req.params.id]);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// DELETE /api/jobs/admin/:id
router.delete('/admin/:id', auth, admin, async (req, res) => {
  try {
    await query(`UPDATE job_offers SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
