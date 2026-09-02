require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Granulats\\TP.zip";

const doc = {
  entryName: "TP/TP 05- Foisonnement d’un sable, Rapport GS....pdf",
  dest_name: 'labo-granulats-tp05-foisonnement-sable.pdf',
  slug:      'labo-granulats-tp05-foisonnement-sable',
  title:     'TP Granulats — Foisonnement d\'un Sable et Rapport GS',
  description: 'TP sur la détermination du coefficient de foisonnement d\'un sable et du rapport GS (granulats sur sable). Protocole de mesure du volume foisonné et du volume tassé, calcul du foisonnement et correction du dosage volumétrique en béton. Paramètre important pour les bétons dosés au volume sur chantier.',
  level: 'intermediaire', thumb_color: '#33691E', thumb_icon: '🪨',
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
  const c1 = doc.thumb_color, h = c1.replace(/^#/,'');
  const bg2 = '#'+[0,2,4].map(i=>Math.max(0,parseInt(h.slice(i,i+2),16)-50).toString(16).padStart(2,'0')).join('');
  const lines = wrapText(doc.title, 22);
  const titleY = lines.length===1?176:lines.length===2?168:158;
  const tl = lines.map((l,i)=>`<text x="200" y="${titleY+i*26}" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="-0.3">${esc(l)}</text>`).join('\n    ');
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
  <rect x="14" y="14" width="58" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">TP PDF</text>
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${tl}
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Granulats</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  const catRes = await query("SELECT id FROM categories WHERE slug='materiaux' LIMIT 1");
  const catId = catRes.rows[0].id;
  const zip = new AdmZip(TP_ZIP);

  const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
  if (exists.rows.length) { console.log('⏭️  Déjà en base'); process.exit(0); }

  // Trouver l'entrée en comparant les hex pour débogage
  const allEntries = zip.getEntries();
  let entry = null;
  for (const e of allEntries) {
    if (e.entryName.includes('Foisonnement') && e.entryName.includes('sable')) {
      entry = e;
      console.log('Entrée trouvée:', JSON.stringify(e.entryName));
      break;
    }
  }
  if (!entry) { console.log('❌ Entrée introuvable'); process.exit(1); }

  const buf = entry.getData();
  const sizeMb = parseFloat((buf.length / 1024 / 1024).toFixed(2));
  fs.writeFileSync(path.join(UPLOAD_DIR, doc.dest_name), buf);
  fs.writeFileSync(path.join(THUMB_DIR, `thumb-tp-granulats-${doc.slug}.svg`), makeSVG(doc), 'utf8');

  await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
    VALUES ($1,$2,$3,'tp_pdf',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,$9,NOW())`,
    [doc.title, doc.slug, doc.description, catId,
     `/uploads/products/${doc.dest_name}`, sizeMb,
     `/uploads/images/thumbs/thumb-tp-granulats-${doc.slug}.svg`,
     doc.level, ['Granulats', 'Laboratoire']]);

  console.log(`✅ ${sizeMb} Mo — ${doc.title}`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
