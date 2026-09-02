require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const DRY_RUN    = process.argv.includes('--dry-run');
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const DOCS = [
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\0_introduction\\2_géodésie_cartographie.pdf",
    dest_name: "topo-geodesie-cartographie.pdf",
    slug:      "topographie-geodesie-cartographie-cours",
    title:     "Géodésie et Cartographie — Cours de Topographie",
    description: "Cours thématique sur la géodésie et la cartographie appliquées à la topographie. Couvre les systèmes de référence terrestres, les projections cartographiques (Lambert, UTM), la représentation du relief, la lecture et l'utilisation des cartes topographiques, ainsi que les liens entre géodésie et topographie locale. Essentiel pour les étudiants en génie civil, géomètre-expert et travaux publics.",
    level:     "intermediaire",
    thumb_color: "#1565C0",
    thumb_icon: "🌐",
  },
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\10_technologie moderne\\7_technologie moderne.pdf",
    dest_name: "topo-technologie-moderne.pdf",
    slug:      "topographie-technologie-moderne-cours",
    title:     "Technologie Moderne en Topographie",
    description: "Cours thématique sur les technologies modernes utilisées en topographie : station totale robotisée, GPS/GNSS différentiel, scanner laser 3D, drones et photogrammétrie aérienne, systèmes d'information géographique (SIG). Présente les principes de fonctionnement, les performances et les domaines d'application de chaque technologie dans les chantiers de génie civil et travaux publics.",
    level:     "avance",
    thumb_color: "#00695C",
    thumb_icon: "🛰️",
  },
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\6_implantation\\9_technique d'implantation.pdf",
    dest_name: "topo-technique-implantation.pdf",
    slug:      "topographie-technique-implantation-cours",
    title:     "Techniques d'Implantation en Topographie",
    description: "Cours thématique dédié aux techniques d'implantation topographique sur chantier. Aborde l'implantation de points isolés, d'axes de route, de bâtiments et d'ouvrages d'art. Méthodes par coordonnées polaires, rayonnement, intersection, alignement et nivellement. Exemples pratiques d'implantation de semelles, murs, poteaux et tracés de voirie.",
    level:     "intermediaire",
    thumb_color: "#E65100",
    thumb_icon: "🏗️",
  },
];

function makeSVG(doc) {
  function wrapText(text, maxChars) {
    const words = text.split(' '); const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur.trim()); cur = w; }
      else { cur = (cur + ' ' + w).trim(); }
      if (lines.length >= 3) { lines[2] = lines[2].slice(0, maxChars-2) + '…'; break; }
    }
    if (cur && lines.length < 3) lines.push(cur.trim());
    return lines.slice(0, 3);
  }
  function escXML(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const c1 = doc.thumb_color;
  const h = c1.replace(/^#/,'');
  const r = Math.max(0,parseInt(h.slice(0,2),16)-50).toString(16).padStart(2,'0');
  const g = Math.max(0,parseInt(h.slice(2,4),16)-50).toString(16).padStart(2,'0');
  const b = Math.max(0,parseInt(h.slice(4,6),16)-50).toString(16).padStart(2,'0');
  const bg2 = `#${r}${g}${b}`;
  const lines = wrapText(doc.title, 22);
  const titleY = lines.length === 1 ? 176 : lines.length === 2 ? 168 : 158;
  const titleLines = lines.map((l,i) =>
    `<text x="200" y="${titleY+i*26}" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="-0.3">${escXML(l)}</text>`
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
  <rect x="14" y="14" width="68" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">COURS TOPO</text>
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${titleLines}
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Topographie — Génie Civil</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='topographie' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'topographie' introuvable");
  const catId = catRes.rows[0].id;

  console.log(`\n📚 Import cours thématiques topo — ${DOCS.length} fichiers${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  let inserted = 0, skipped = 0, errors = 0;
  for (const doc of DOCS) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }
      if (!fs.existsSync(doc.src)) { console.log(`  ❌ MANQUANT — ${doc.src}`); errors++; continue; }

      const destPath   = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl    = `/uploads/products/${doc.dest_name}`;
      const thumbName  = `thumb-topo-${doc.slug}.svg`;
      const thumbPath  = path.join(THUMB_DIR, thumbName);
      const thumbUrl   = `/uploads/images/thumbs/${thumbName}`;
      const fileSize   = fs.statSync(doc.src).size;
      const fileSizeMb = parseFloat((fileSize/1024/1024).toFixed(2));

      if (!DRY_RUN) {
        fs.copyFileSync(doc.src, destPath);
        fs.writeFileSync(thumbPath, makeSVG(doc), 'utf8');
        await query(`
          INSERT INTO products (title, slug, description, type, category_id,
            file_url, file_size_mb, thumbnail_url, is_free, price, is_active, language, study_level, created_at)
          VALUES ($1,$2,$3,'ouvrage',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,NOW())
        `, [doc.title, doc.slug, doc.description, catId, fileUrl, fileSizeMb, thumbUrl, doc.level]);
      }

      console.log(`  ✅ ${fileSizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
