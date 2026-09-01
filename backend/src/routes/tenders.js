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

// GET /api/tenders
router.get('/', async (req, res) => {
  try {
    const { wilaya, sector, status, owner_type, featured, search, page=1, limit=20 } = req.query;
    const params = [];
    const conds  = ['t.is_active = TRUE'];

    if (wilaya)     { params.push(parseInt(wilaya)); conds.push(`t.wilaya=$${params.length}`); }
    if (sector)     { params.push(sector);           conds.push(`t.sector=$${params.length}`); }
    if (status)     { params.push(status);           conds.push(`t.status=$${params.length}`); }
    if (owner_type) { params.push(owner_type);       conds.push(`t.owner_type=$${params.length}`); }
    if (featured==='true') conds.push('t.is_featured=TRUE');
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length} OR t.owner_name ILIKE $${params.length} OR t.reference ILIKE $${params.length})`);
    }

    const where  = conds.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit), offset);

    const [rows, total] = await Promise.all([
      query(`SELECT t.id, t.slug, t.title, t.reference, t.sector, t.owner_name, t.owner_type,
                    t.wilaya, t.city, t.budget_range, t.lot, t.status, t.is_featured,
                    t.published_at, t.deadline_at, t.opening_at, t.views_count,
                    c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                    c.is_verified AS company_verified
             FROM tenders t
             LEFT JOIN companies c ON c.id=t.company_id
             WHERE ${where}
             ORDER BY t.is_featured DESC, t.published_at DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      query(`SELECT COUNT(*) FROM tenders t WHERE ${where}`, params.slice(0,-2)),
    ]);

    res.json({ success:true, data:rows.rows, total:parseInt(total.rows[0].count),
               page:parseInt(page), limit:parseInt(limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET /api/tenders/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT t.*, c.name AS company_name, c.slug AS company_slug,
             c.logo_url AS company_logo, c.is_verified AS company_verified
      FROM tenders t
      LEFT JOIN companies c ON c.id=t.company_id
      WHERE t.slug=$1 AND t.is_active=TRUE`, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ success:false, message:'Appel d\'offres introuvable' });
    query(`UPDATE tenders SET views_count=views_count+1 WHERE id=$1`, [rows[0].id]).catch(()=>{});
    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════

router.get('/admin/list', auth, admin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT t.*, c.name AS company_name
      FROM tenders t LEFT JOIN companies c ON c.id=t.company_id
      ORDER BY t.created_at DESC LIMIT 500`);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/admin', auth, admin, async (req, res) => {
  try {
    const { title, description, lot, sector, reference, company_id, owner_name, owner_type,
            wilaya, city, budget_range, published_at, deadline_at, opening_at,
            cahier_url, contact_name, contact_email, contact_phone, contact_address,
            status, is_featured } = req.body;

    if (!title) return res.status(400).json({ success:false, message:'Titre requis' });

    const slug = slugify(title) + '-' + Date.now().toString(36);

    const { rows } = await query(`
      INSERT INTO tenders
        (slug,title,description,lot,sector,reference,company_id,owner_name,owner_type,
         wilaya,city,budget_range,published_at,deadline_at,opening_at,
         cahier_url,contact_name,contact_email,contact_phone,contact_address,
         status,is_featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
      [slug,title,description||null,lot||null,sector||null,reference||null,
       company_id||null,owner_name||null,owner_type||null,
       wilaya?parseInt(wilaya):null,city||null,budget_range||null,
       published_at||null,deadline_at||null,opening_at||null,
       cahier_url||null,contact_name||null,contact_email||null,
       contact_phone||null,contact_address||null,
       status||'open', is_featured==='true'||is_featured===true]);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.patch('/admin/:id', auth, admin, async (req, res) => {
  try {
    const exist = await query(`SELECT * FROM tenders WHERE id=$1`, [req.params.id]);
    if (!exist.rows.length) return res.status(404).json({ success:false, message:'Introuvable' });
    const t = exist.rows[0];

    const { title, description, lot, sector, reference, company_id, owner_name, owner_type,
            wilaya, city, budget_range, published_at, deadline_at, opening_at,
            cahier_url, contact_name, contact_email, contact_phone, contact_address,
            status, is_featured, is_active } = req.body;

    const { rows } = await query(`
      UPDATE tenders SET
        title=$1, description=$2, lot=$3, sector=$4, reference=$5,
        company_id=$6, owner_name=$7, owner_type=$8,
        wilaya=$9, city=$10, budget_range=$11,
        published_at=$12, deadline_at=$13, opening_at=$14,
        cahier_url=$15, contact_name=$16, contact_email=$17,
        contact_phone=$18, contact_address=$19,
        status=$20, is_featured=$21, is_active=$22, updated_at=NOW()
      WHERE id=$23 RETURNING *`,
      [title??t.title, description??t.description, lot??t.lot,
       sector??t.sector, reference??t.reference,
       company_id!==undefined?(company_id||null):t.company_id,
       owner_name??t.owner_name, owner_type??t.owner_type,
       wilaya!==undefined?(wilaya?parseInt(wilaya):null):t.wilaya,
       city??t.city, budget_range??t.budget_range,
       published_at??t.published_at, deadline_at??t.deadline_at, opening_at??t.opening_at,
       cahier_url??t.cahier_url, contact_name??t.contact_name,
       contact_email??t.contact_email, contact_phone??t.contact_phone,
       contact_address??t.contact_address,
       status??t.status,
       is_featured!==undefined?(is_featured==='true'||is_featured===true):t.is_featured,
       is_active!==undefined?(is_active==='true'||is_active===true):t.is_active,
       req.params.id]);

    res.json({ success:true, data:rows[0] });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.delete('/admin/:id', auth, admin, async (req, res) => {
  try {
    await query(`UPDATE tenders SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
