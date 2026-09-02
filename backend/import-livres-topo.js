/**
 * import-livres-topo.js — Al Handassa.dz
 * Importe les livres & manuels de topographie comme produits (type: livre)
 * Usage: node import-livres-topo.js [--dry-run]
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// ── Répertoires de destination ────────────────────────────────────────────────
const UPLOAD_DIR  = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR   = path.join(__dirname, 'uploads', 'images', 'thumbs');

// ── Catalogue des livres à importer ──────────────────────────────────────────
const LIVRES = [
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\Topographie Tomes 1 et 2\\nouvelle ed\\Tome 1\\Tome1.pdf",
    slug:       'topographie-topometrie-modernes-tome-1-eyrolles',
    title:      'Topographie et Topométrie Modernes — Tome 1',
    excerpt:    'Manuel de référence Eyrolles couvrant les fondamentaux de la topographie : mesures, instruments, nivellement et calculs topométriques.',
    description:'Ouvrage de référence aux éditions Eyrolles, Tome 1 de la série "Topographie et Topométrie Modernes". Couvre les bases de la topographie : mesure des angles et distances, nivellement direct et indirect, cheminements polygonaux. Idéal pour étudiants en BTS, IUT et écoles d\'ingénieurs.',
    language:   'fr',
    level:      'intermediaire',
    price:      0,
    is_free:    true,
    thumb_color:'#0D47A1',
    thumb_icon: '📐',
    dest_name:  'topographie-topometrie-modernes-tome1-eyrolles.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\Topographie Tomes 1 et 2\\nouvelle ed\\Tome2\\Tome2.pdf",
    slug:       'topographie-topometrie-modernes-tome-2-eyrolles',
    title:      'Topographie et Topométrie Modernes — Tome 2',
    excerpt:    'Manuel Eyrolles Tome 2 : implantation, levé de détails, GPS, station totale et travaux pratiques avancés.',
    description:'Suite du Tome 1 aux éditions Eyrolles. Approfondit les méthodes de levé topographique : levé de détails, report de plans, implantation d\'ouvrages, utilisation du GPS et des stations totales. Indispensable pour les travaux publics et le génie civil.',
    language:   'fr',
    level:      'avance',
    price:      0,
    is_free:    true,
    thumb_color:'#0D47A1',
    thumb_icon: '📐',
    dest_name:  'topographie-topometrie-modernes-tome2-eyrolles.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\ENTP\\Topographie_entp.pdf",
    slug:       'topographie-cours-entp-algerie',
    title:      'Topographie — Cours ENTP (École Nationale des Travaux Publics)',
    excerpt:    'Cours institutionnel de topographie de l\'ENTP Algérie. Référence académique couvrant l\'ensemble du programme national.',
    description:'Polycopié de cours officiel de topographie de l\'École Nationale des Travaux Publics (ENTP) d\'Algérie. Document de référence pour les étudiants en génie civil et travaux publics. Couvre le programme national : instruments, nivellement, planimétrie, implantation et calculs topométriques.',
    language:   'fr',
    level:      'intermediaire',
    price:      0,
    is_free:    true,
    thumb_color:'#1B3A6B',
    thumb_icon: '🏛️',
    dest_name:  'topographie-cours-entp-algerie.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\initiation_géologie_topographie\\Initiation Géologie Topographie_livre.pdf",
    slug:       'initiation-geologie-topographie-livre-complet',
    title:      'Initiation à la Géologie et à la Topographie — Livre Complet',
    excerpt:    'Ouvrage complet d\'initiation combinant géologie et topographie. Idéal pour acquérir les bases des sciences du terrain.',
    description:'Livre complet d\'initiation couvrant deux disciplines complémentaires : la géologie (roches, structures, cartographie géologique) et la topographie (levés, mesures, instruments). Ouvrage pédagogique richement illustré, adapté aux étudiants en génie civil, géologie appliquée et travaux publics.',
    language:   'fr',
    level:      'debutant',
    price:      0,
    is_free:    true,
    thumb_color:'#2E7D32',
    thumb_icon: '🌍',
    dest_name:  'initiation-geologie-topographie-livre-complet.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\initiation_géologie_topographie\\Topographie_livre.pdf",
    slug:       'topographie-livre-general-complet',
    title:      'Topographie — Livre Général',
    excerpt:    'Manuel général de topographie structuré pour l\'enseignement supérieur. Couvre tous les aspects théoriques et pratiques.',
    description:'Manuel général de topographie destiné à l\'enseignement supérieur en génie civil et travaux publics. Traite de manière exhaustive les principes fondamentaux : systèmes de coordonnées, instruments de mesure, nivellement, triangulation, implantation et cartographie.',
    language:   'fr',
    level:      'intermediaire',
    price:      0,
    is_free:    true,
    thumb_color:'#00695C',
    thumb_icon: '📏',
    dest_name:  'topographie-livre-general-complet.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\PDF\\chehilidjamel\\topo_arabe_932p.pdf",
    slug:       'topographie-arabe-chehili-djamel-932-pages',
    title:      'الطبوغرافيا — كتاب شامل (932 صفحة)',
    excerpt:    'مرجع شامل في الطبوغرافيا باللغة العربية — 932 صفحة. يغطي جميع موضوعات المسح الطبوغرافي من الأسس إلى التطبيقات المتقدمة.',
    description:'كتاب مرجعي شامل في علم الطبوغرافيا باللغة العربية من تأليف شهيلي جمال. يتضمن 932 صفحة تغطي: القياسات الميدانية، الاستوائية، التسوية، الرفع الطبوغرافي، حساب المساحات، الإسقاط والتوقيع. مرجع أساسي لطلاب الهندسة المدنية وأعمال البناء.',
    language:   'ar',
    level:      'intermediaire',
    price:      0,
    is_free:    true,
    thumb_color:'#1B3A6B',
    thumb_icon: '📖',
    dest_name:  'topographie-arabe-chehili-djamel-932p.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\chehilidjamel\\chehilidjamel2.pdf",
    slug:       'topographie-chehili-djamel-volume-2',
    title:      'Topographie — Chehili Djamel (Volume 2)',
    excerpt:    'Deuxième volume du cours de topographie de Chehili Djamel. Auteur algérien de référence, largement utilisé dans les universités algériennes.',
    description:'Deuxième volume du cours de topographie de l\'auteur algérien Chehili Djamel, référence incontournable dans les universités algériennes. Traite des méthodes avancées de planimétrie, de calculs topométriques et des applications en travaux publics.',
    language:   'fr',
    level:      'intermediaire',
    price:      0,
    is_free:    true,
    thumb_color:'#4527A0',
    thumb_icon: '📚',
    dest_name:  'topographie-chehili-djamel-volume-2.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\chehilidjamel\\chehilidjamel4.pdf",
    slug:       'topographie-chehili-djamel-volume-4',
    title:      'Topographie — Chehili Djamel (Volume 4)',
    excerpt:    'Quatrième volume de la série Chehili Djamel. Couvre les techniques avancées d\'implantation, de nivellement de précision et de station totale.',
    description:'Quatrième volume de la série de topographie de Chehili Djamel. Aborde les techniques avancées : station totale, nivellement de précision, implantation de grands ouvrages, GPS différentiel et traitement des données topographiques. Référence utilisée dans les écoles d\'ingénieurs algériennes.',
    language:   'fr',
    level:      'avance',
    price:      0,
    is_free:    true,
    thumb_color:'#4527A0',
    thumb_icon: '📚',
    dest_name:  'topographie-chehili-djamel-volume-4.pdf',
  },
  {
    src: "D:\\Mezaoui\\2_topo\\topo_pdf\\11_générale\\MAROC\\Travaux pratiques en topographie ElEmentaire  initiatio_maroc.pdf",
    slug:       'travaux-pratiques-topographie-elementaire-initiation',
    title:      'Travaux Pratiques de Topographie Élémentaire — Initiation',
    excerpt:    'Recueil de travaux pratiques pour l\'initiation à la topographie. Exercices guidés avec protocoles de mesure et tableaux de relevés terrain.',
    description:'Manuel de travaux pratiques destiné à l\'initiation à la topographie élémentaire. Comprend des protocoles de TP complets : mise en station du niveau, lecture sur mire, cheminement de nivellement, levé au théodolite et implantation simple. Idéal pour les formations BTS et licences professionnelles en génie civil.',
    language:   'fr',
    level:      'debutant',
    price:      0,
    is_free:    true,
    thumb_color:'#00695C',
    thumb_icon: '🎯',
    dest_name:  'travaux-pratiques-topographie-elementaire-initiation.pdf',
  },
];

// ── Génération SVG thumbnail ──────────────────────────────────────────────────
function makeSVG(livre) {
  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        if (cur) lines.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
      if (lines.length >= 3) { lines[2] = lines[2].slice(0, maxChars - 2) + '…'; break; }
    }
    if (cur && lines.length < 3) lines.push(cur.trim());
    return lines.slice(0, 3);
  }
  function escXML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const c1 = livre.thumb_color;
  // Darken by mixing with black
  const c2 = c1.replace(/^#/, '');
  const r = Math.max(0, parseInt(c2.slice(0,2),16)-40).toString(16).padStart(2,'0');
  const g = Math.max(0, parseInt(c2.slice(2,4),16)-40).toString(16).padStart(2,'0');
  const b = Math.max(0, parseInt(c2.slice(4,6),16)-40).toString(16).padStart(2,'0');
  const bg2 = `#${r}${g}${b}`;

  const lines = wrapText(livre.title, 24);
  const titleY = lines.length === 1 ? 176 : lines.length === 2 ? 168 : 158;
  const titleLines = lines.map((l, i) =>
    `<text x="200" y="${titleY + i * 26}" text-anchor="middle" fill="white"
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
  <rect width="400" height="280" rx="12" fill="white" opacity="0.07"/>
  <circle cx="340" cy="-20" r="130" fill="white" opacity="0.05" clip-path="url(#clip)"/>
  <!-- Badge Livre -->
  <rect x="14" y="14" width="62" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">OUVRAGE</text>
  <!-- Langue badge -->
  <rect x="362" y="14" width="24" height="24" rx="12" fill="rgba(255,255,255,0.15)"/>
  <text x="374" y="30" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="700">${escXML(livre.language.toUpperCase())}</text>
  <!-- Icône -->
  <text x="200" y="130" text-anchor="middle" font-size="52">${livre.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${titleLines}
  <!-- Barre bas -->
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.25)"/>
  <rect x="16" y="262" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.6)"/>
  <rect x="72" y="262" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
  <text x="384" y="270" text-anchor="end" fill="white" opacity="0.55"
        font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">handassi.dz</text>
</svg>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  // Récupérer l'ID de la catégorie topographie
  const catRes = await query("SELECT id FROM categories WHERE slug='topographie' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'topographie' introuvable en base");
  const catId = catRes.rows[0].id;

  console.log(`\n📚 Import de ${LIVRES.length} livres de topographie${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);
  console.log(`   Catégorie topographie: id=${catId}\n`);

  let inserted = 0, skipped = 0, errors = 0;

  for (const livre of LIVRES) {
    try {
      // Vérifier doublon
      const exists = await query('SELECT id FROM products WHERE slug=$1', [livre.slug]);
      if (exists.rows.length) {
        console.log(`  ⏭️  SKIP (déjà en base) — ${livre.title.substring(0,60)}`);
        skipped++;
        continue;
      }

      if (!fs.existsSync(livre.src)) {
        console.log(`  ❌ FICHIER MANQUANT — ${livre.src}`);
        errors++;
        continue;
      }

      const destPath = path.join(UPLOAD_DIR, livre.dest_name);
      const fileUrl  = `/uploads/products/${livre.dest_name}`;
      const thumbName = `thumb-livre-topo-${livre.slug.substring(0,50)}.svg`;
      const thumbPath = path.join(THUMB_DIR, thumbName);
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const fileSize  = fs.statSync(livre.src).size;

      if (!DRY_RUN) {
        // Copier le PDF
        fs.copyFileSync(livre.src, destPath);
        // Générer la vignette SVG
        fs.writeFileSync(thumbPath, makeSVG(livre), 'utf8');

        // Insérer en base
        const fileSizeMb = parseFloat((fileSize / 1024 / 1024).toFixed(2));
        await query(`
          INSERT INTO products
            (title, slug, description, type, category_id,
             file_url, file_size_mb, thumbnail_url,
             is_free, price, is_active, language, study_level, created_at)
          VALUES ($1,$2,$3,'ouvrage',$4,$5,$6,$7,$8,$9,TRUE,$10,$11,NOW())
        `, [
          livre.title,
          livre.slug,
          livre.description,
          catId,
          fileUrl,
          fileSizeMb,
          thumbUrl,
          livre.is_free,
          livre.price,
          livre.language,
          livre.level,
        ]);
      }

      const mo = (fileSize / 1024 / 1024).toFixed(1);
      console.log(`  ✅ [${livre.language.toUpperCase()}] ${mo} Mo — ${livre.title.substring(0,65)}`);
      inserted++;

    } catch (err) {
      console.error(`  ❌ ERREUR — ${livre.title}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés : ${inserted}  |  ⏭️  Ignorés : ${skipped}  |  ❌ Erreurs : ${errors}`);
  if (DRY_RUN) console.log('  ℹ️  Mode dry-run — aucun fichier copié, aucune insertion en base');
  console.log();
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
