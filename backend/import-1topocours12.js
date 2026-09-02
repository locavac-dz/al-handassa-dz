require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const DOC = {
  src:       "D:\\Lycée 2024-2025\\Cours de Topographie\\COURS TOPO\\1topocours12.pdf",
  dest_name: "cours-topo-topocours12.pdf",
  slug:      "cours-pdf-topographie-topocours12",
  title:     "Topographie — Cours Complet (1topocours12)",
  description: "Cours complet de topographie couvrant les fondamentaux : instruments de mesure, nivellement, angles, distances et calculs topométriques. Document pédagogique structuré pour les formations en génie civil et travaux publics, niveau BTS et Licence.",
  level:     "intermediaire",
  tags:      ['Topographie'],
  thumb_color: "#1565C0",
  thumb_icon: "📐",
};

function makeSVG(doc) {
  function wrapText(text, maxChars) {
    const words = text.split(' '); const lines = []; let cur = '';
    for (const w of words) {
      if ((cur+' '+w).trim().length > maxChars) { if (cur) lines.push(cur.trim()); cur = w; }
      else { cur = (cur+' '+w).trim(); }
      if (lines.length >= 3) { lines[2] = lines[2].slice(0,maxChars-2)+'…'; break; }
    }
    if (cur && lines.length < 3) lines.push(cur.trim());
    return lines.slice(0,3);
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  const c1=doc.thumb_color, h=c1.replace(/^#/,'');
  const bg2='#'+[0,2,4].map(i=>Math.max(0,parseInt(h.slice(i,i+2),16)-50).toString(16).padStart(2,'0')).join('');
  const lines=wrapText(doc.title,22);
  const titleY=lines.length===1?176:lines.length===2?168:158;
  const tl=lines.map((l,i)=>`<text x="200" y="${titleY+i*26}" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="-0.3">${esc(l)}</text>`).join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="400" height="280" rx="12"/></clipPath>
  </defs>
  <rect width="400" height="280" rx="12" fill="url(#bg)"/>
  <rect width="400" height="280" rx="12" fill="white" opacity="0.06"/>
  <circle cx="340" cy="-20" r="130" fill="white" opacity="0.05" clip-path="url(#clip)"/>
  <rect x="14" y="14" width="72" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">COURS PDF</text>
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${tl}
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Topographie — Génie Civil</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catId = (await query("SELECT id FROM categories WHERE slug='topographie' LIMIT 1")).rows[0].id;

  const exists = await query('SELECT id FROM products WHERE slug=$1', [DOC.slug]);
  if (exists.rows.length) { console.log('⏭️  Déjà en base'); process.exit(0); }

  if (!fs.existsSync(DOC.src)) { console.log('❌ Fichier manquant:', DOC.src); process.exit(1); }

  const fileUrl   = `/uploads/products/${DOC.dest_name}`;
  const thumbName = `thumb-cours-${DOC.slug}.svg`;
  const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
  const sizeMb    = parseFloat((fs.statSync(DOC.src).size/1024/1024).toFixed(2));

  fs.copyFileSync(DOC.src, path.join(UPLOAD_DIR, DOC.dest_name));
  fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(DOC), 'utf8');

  await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
    VALUES ($1,$2,$3,'cours_pdf',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,$9,NOW())`,
    [DOC.title, DOC.slug, DOC.description, catId, fileUrl, sizeMb, thumbUrl, DOC.level, DOC.tags]);

  console.log(`✅ Intégré — [cours_pdf] ${DOC.title}  (${sizeMb} Mo)  tags: [${DOC.tags.join(', ')}]`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
