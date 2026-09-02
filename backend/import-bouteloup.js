/**
 * import-bouteloup.js — Al Handassa.dz
 * Importe les 4 cours thématiques D. Bouteloup, P. Nicolon, V. Six
 * Usage: node import-bouteloup.js [--dry-run]
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const DRY_RUN   = process.argv.includes('--dry-run');
const BASE_SRC  = "D:\\Mezaoui\\2_topo\\topo_pdf\\PDF\\D.Bouteloup, P.Nicolon, V.Six_124p\\";
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const DOCS = [
  {
    src:       BASE_SRC + "mesure des angles_D.Bouteloup, P.Nicolon, V.Six_23p.pdf",
    dest_name: "bouteloup-mesure-angles-23p.pdf",
    slug:      "bouteloup-mesure-des-angles-topographie",
    title:     "Mesure des Angles en Topographie",
    description: "Cours thématique sur la mesure des angles en topographie par D. Bouteloup, P. Nicolon et V. Six. 23 pages couvrant les instruments de mesure angulaire (théodolite, tachéomètre), les méthodes de visée, la lecture des cercles horizontaux et verticaux, et les corrections à appliquer. Document de référence pour les formations BTS et ingénieurs en génie civil.",
    level:     "intermediaire",
    thumb_color: "#0D47A1",
    thumb_icon: "📐",
    badge:     "23 pages",
  },
  {
    src:       BASE_SRC + "mesures des distances_D.Bouteloup, P.Nicolon, V.Six_33p.pdf",
    dest_name: "bouteloup-mesures-distances-33p.pdf",
    slug:      "bouteloup-mesures-des-distances-topographie",
    title:     "Mesures des Distances en Topographie",
    description: "Cours thématique dédié aux méthodes de mesure des distances en topographie par D. Bouteloup, P. Nicolon et V. Six. 33 pages traitant de la mesure directe au ruban, mesure indirecte par stadimétrie, distancemètre électronique (MED), corrections atmosphériques et réductions à l'horizon. Indispensable pour les levés et implantations sur chantier.",
    level:     "intermediaire",
    thumb_color: "#00695C",
    thumb_icon: "📏",
    badge:     "33 pages",
  },
  {
    src:       BASE_SRC + "mesure des altitudes_D.Bouteloup, P.Nicolon, V.Six_41p.pdf",
    dest_name: "bouteloup-mesure-altitudes-41p.pdf",
    slug:      "bouteloup-mesure-des-altitudes-topographie",
    title:     "Mesure des Altitudes en Topographie",
    description: "Cours thématique sur la mesure des altitudes (nivellement) par D. Bouteloup, P. Nicolon et V. Six. 41 pages couvrant le nivellement direct (nivellement géométrique), le nivellement indirect (trigonométrique), les cheminements de nivellement, la compensation des erreurs et les applications pratiques en génie civil.",
    level:     "intermediaire",
    thumb_color: "#4527A0",
    thumb_icon: "⛰️",
    badge:     "41 pages",
  },
  {
    src:       BASE_SRC + "Calculs topométriques_D.Bouteloup, P.Nicolon, V.Six_27p.pdf",
    dest_name: "bouteloup-calculs-topometriques-27p.pdf",
    slug:      "bouteloup-calculs-topometriques-topographie",
    title:     "Calculs Topométriques",
    description: "Cours thématique sur les calculs topométriques par D. Bouteloup, P. Nicolon et V. Six. 27 pages détaillant les calculs de coordonnées (relèvement, recoupement), les calculs de surfaces et volumes, la compensation par moindres carrés et les applications informatiques. Outil essentiel pour le traitement des données de levés topographiques.",
    level:     "avance",
    thumb_color: "#BF360C",
    thumb_icon: "🔢",
    badge:     "27 pages",
  },
];

// ── SVG thumbnail ─────────────────────────────────────────────────────────────
function makeSVG(doc) {
  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        if (cur) lines.push(cur.trim());
        cur = w;
      } else { cur = (cur + ' ' + w).trim(); }
      if (lines.length >= 3) { lines[2] = lines[2].slice(0, maxChars-2) + '…'; break; }
    }
    if (cur && lines.length < 3) lines.push(cur.trim());
    return lines.slice(0, 3);
  }
  function escXML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  const c1 = doc.thumb_color;
  const c2 = c1.replace(/^#/, '');
  const r = Math.max(0, parseInt(c2.slice(0,2),16)-50).toString(16).padStart(2,'0');
  const g = Math.max(0, parseInt(c2.slice(2,4),16)-50).toString(16).padStart(2,'0');
  const b = Math.max(0, parseInt(c2.slice(4,6),16)-50).toString(16).padStart(2,'0');
  const bg2 = `#${r}${g}${b}`;

  const lines = wrapText(doc.title, 22);
  const titleY = lines.length === 1 ? 176 : lines.length === 2 ? 168 : 158;
  const titleLines = lines.map((l, i) =>
    `<text x="200" y="${titleY + i*26}" text-anchor="middle" fill="white"
       font-family="'Segoe UI',Arial,sans-serif" font-size="17" font-weight="700"
       letter-spacing="-0.3">${escXML(l)}</text>`
  ).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="400" height="280" rx="12"/></clipPath>
  </defs>
  <rect width="400" height="280" rx="12" fill="url(#bg)"/>
  <rect width="400" height="280" rx="12" fill="white" opacity="0.06"/>
  <circle cx="340" cy="-20" r="130" fill="white" opacity="0.05" clip-path="url(#clip)"/>
  <!-- Badge type -->
  <rect x="14" y="14" width="68" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">COURS TOPO</text>
  <!-- Badge pages -->
  <rect x="316" y="14" width="70" height="24" rx="12" fill="rgba(255,255,255,0.15)"/>
  <text x="351" y="30" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="600">${escXML(doc.badge)}</text>
  <!-- Icône centrale -->
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${titleLines}
  <!-- Barre auteurs -->
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.75)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Bouteloup · Nicolon · Six</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='topographie' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'topographie' introuvable");
  const catId = catRes.rows[0].id;

  console.log(`\n📚 Import série Bouteloup & al. — ${DOCS.length} cours thématiques${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  let inserted = 0, skipped = 0, errors = 0;

  for (const doc of DOCS) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) {
        console.log(`  ⏭️  SKIP — ${doc.title}`);
        skipped++; continue;
      }
      if (!fs.existsSync(doc.src)) {
        console.log(`  ❌ MANQUANT — ${doc.src}`);
        errors++; continue;
      }

      const destPath  = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-bouteloup-${doc.slug.replace('bouteloup-','')}.svg`;
      const thumbPath = path.join(THUMB_DIR, thumbName);
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const fileSize  = fs.statSync(doc.src).size;
      const fileSizeMb = parseFloat((fileSize / 1024 / 1024).toFixed(2));

      if (!DRY_RUN) {
        fs.copyFileSync(doc.src, destPath);
        fs.writeFileSync(thumbPath, makeSVG(doc), 'utf8');

        await query(`
          INSERT INTO products
            (title, slug, description, type, category_id,
             file_url, file_size_mb, thumbnail_url,
             is_free, price, is_active, language, study_level, created_at)
          VALUES ($1,$2,$3,'ouvrage',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,NOW())
        `, [doc.title, doc.slug, doc.description, catId,
            fileUrl, fileSizeMb, thumbUrl, doc.level]);
      }

      console.log(`  ✅ ${fileSizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) {
      console.error(`  ❌ ERREUR — ${doc.title}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}`);
  if (DRY_RUN) console.log('  ℹ️  Dry-run — aucune modification');
  console.log();
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
