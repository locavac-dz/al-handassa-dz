require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Ciment\\TP.zip";

const CATALOG = [
  {
    entryName: 'TP/TP 00-Controlab_Granulat et ciment.pdf',
    dest_name: 'labo-ciment-tp00-controlab-granulat-ciment.pdf',
    slug:      'labo-ciment-tp00-controlab-granulat-ciment',
    title:     'TP Ciment — Contrôle de Laboratoire : Granulats et Ciment',
    description: 'TP de contrôle de laboratoire portant sur les granulats et le ciment. Présente les essais d\'identification et de caractérisation des matériaux : analyse granulométrique, équivalent de sable, coefficient Los Angeles pour les granulats, et finesse Blaine, consistance normale et temps de prise pour le ciment. Fiche de contrôle complète.',
    level: 'debutant',
    thumb_color: '#4527A0', thumb_icon: '⚗️',
  },
  {
    entryName: 'TP/TP 01-Ciments.pdf',
    dest_name: 'labo-ciment-tp01-ciments-general.pdf',
    slug:      'labo-ciment-tp01-ciments-general',
    title:     'TP Ciment — Étude Générale des Ciments',
    description: 'TP d\'introduction à l\'étude des ciments en laboratoire. Présente les différentes classes de ciment (CEM I, II, III…), leurs caractéristiques normatives et les essais d\'identification : prise, résistance, finesse et stabilité. Support pédagogique complet avec protocoles d\'essais et interprétation des résultats.',
    level: 'debutant',
    thumb_color: '#4527A0', thumb_icon: '⚗️',
  },
  {
    entryName: 'TP/TP 07 Etude des ciments- Prise et Consistance.pdf',
    dest_name: 'labo-ciment-tp07-prise-consistance.pdf',
    slug:      'labo-ciment-tp07-prise-consistance',
    title:     'TP Ciment — Prise et Consistance Normale',
    description: 'TP sur la détermination de la consistance normale et des temps de prise du ciment à l\'appareil de Vicat. Protocole d\'essai détaillé : préparation de la pâte pure, mesure de la consistance normale, suivi du début et de la fin de prise. Tableaux de relevé et interprétation des résultats selon la norme EN 196.',
    level: 'intermediaire',
    thumb_color: '#311B92', thumb_icon: '⏱️',
  },
  {
    entryName: 'TP/TP 08 Ciment Caractéristiques Mécaniques.pdf',
    dest_name: 'labo-ciment-tp08-caracteristiques-mecaniques.pdf',
    slug:      'labo-ciment-tp08-caracteristiques-mecaniques',
    title:     'TP Ciment — Caractéristiques Mécaniques',
    description: 'TP sur la détermination des caractéristiques mécaniques du ciment : résistance à la compression et à la flexion sur éprouvettes prismatiques 4×4×16 cm à 2, 7 et 28 jours. Protocole de confection des mortiers normalisés, conservation des éprouvettes et essais de rupture. Classe de résistance selon la norme EN 197-1.',
    level: 'intermediaire',
    thumb_color: '#311B92', thumb_icon: '🔬',
  },
];

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
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Ciment</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='materiaux' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'materiaux' introuvable");
  const catId = catRes.rows[0].id;

  const zip = new AdmZip(TP_ZIP);

  console.log(`\n⚗️  Import TP Laboratoire — Ciment (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      const entry = zip.getEntry(doc.entryName);
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE — ${doc.entryName}`); errors++; continue; }

      const destPath  = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-tp-ciment-${doc.slug}.svg`;
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const buf       = entry.getData();
      const sizeMb    = parseFloat((buf.length / 1024 / 1024).toFixed(2));

      fs.writeFileSync(destPath, buf);
      fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(doc), 'utf8');

      const tags = ['Ciment', 'Laboratoire'];
      await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
        VALUES ($1,$2,$3,'tp_pdf',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,$9,NOW())`,
        [doc.title, doc.slug, doc.description, catId, fileUrl, sizeMb, thumbUrl, doc.level, tags]);

      console.log(`  ✅ ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
