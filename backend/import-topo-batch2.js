require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const DRY_RUN    = process.argv.includes('--dry-run');
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const DOCS = [
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\13_lever de détails et report\\8_lever de détails et report.pdf",
    dest_name: "topo-lever-details-report.pdf",
    slug:      "topographie-lever-details-report-plan",
    title:     "Levé de Détails et Report de Plan",
    description: "Cours thématique sur les méthodes de levé de détails topographiques et le report de plan. Couvre les techniques de rayonnement, d'intersection et d'abscisses-ordonnées pour le levé de détails du terrain. Traite également le report sur plan : choix de l'échelle, représentation des détails planimétriques, altimétrie et dessin topographique. Indispensable pour les travaux de levé en génie civil.",
    level:     "intermediaire",
    thumb_color: "#2E7D32",
    thumb_icon: "🗺️",
  },
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\14_canevas\\1_densification de canevas.pdf",
    dest_name: "topo-densification-canevas.pdf",
    slug:      "topographie-densification-canevas-planimetre",
    title:     "Densification de Canevas Planimétrique",
    description: "Cours thématique sur la densification du canevas planimétrique en topographie. Aborde les méthodes de création et de densification des réseaux de points de référence : cheminement polygonal ouvert et fermé, intersection, recoupement et relèvement. Traite le calcul des coordonnées, la compensation des erreurs angulaires et linéaires. Base indispensable pour tout levé topographique de précision.",
    level:     "avance",
    thumb_color: "#4527A0",
    thumb_icon: "📍",
  },
  {
    src:       "D:\\Mezaoui\\2_topo\\topo_pdf\\1_nivellement\\ND\\COURS\\nivellement _direct.pdf",
    dest_name: "topo-nivellement-direct.pdf",
    slug:      "topographie-nivellement-direct-cours",
    title:     "Nivellement Direct — Cours de Topographie",
    description: "Cours complet sur le nivellement direct (nivellement géométrique) en topographie. Présente les principes fondamentaux, les instruments utilisés (niveau de chantier, niveau de précision), les méthodes de mesure (nivellement simple, cheminement aller-retour), le calcul des dénivelées et des altitudes, la compensation et la précision des levés. Applications pratiques pour les travaux publics et le génie civil.",
    level:     "debutant",
    thumb_color: "#00838F",
    thumb_icon: "📊",
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
  <rect x="14" y="14" width="68" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">COURS TOPO</text>
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

  console.log(`\n📚 Import batch 2 — ${DOCS.length} cours${DRY_RUN?' [DRY-RUN]':''}\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of DOCS) {
    try {
      if ((await query('SELECT id FROM products WHERE slug=$1',[doc.slug])).rows.length) {
        console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue;
      }
      if (!fs.existsSync(doc.src)) { console.log(`  ❌ MANQUANT — ${doc.src}`); errors++; continue; }

      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-topo-${doc.slug}.svg`;
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const fileSize  = fs.statSync(doc.src).size;
      const sizeMb    = parseFloat((fileSize/1024/1024).toFixed(2));

      if (!DRY_RUN) {
        fs.copyFileSync(doc.src, path.join(UPLOAD_DIR, doc.dest_name));
        fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(doc), 'utf8');
        await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,created_at)
          VALUES ($1,$2,$3,'ouvrage',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,NOW())`,
          [doc.title,doc.slug,doc.description,catId,fileUrl,sizeMb,thumbUrl,doc.level]);
      }
      console.log(`  ✅ ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
