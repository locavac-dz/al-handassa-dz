require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Sol\\TP.zip";

const CATALOG = [
  {
    entryName: 'TP/TP 01 Atterberg - Bleu de méthylène...pdf',
    dest_name: 'labo-sol-tp01-atterberg-bleu-methylene.pdf',
    slug:      'labo-sol-tp01-atterberg-bleu-methylene',
    title:     'TP Sol — Limites d\'Atterberg et Bleu de Méthylène',
    description: 'TP sur la détermination des limites de consistance d\'Atterberg (limite de liquidité WL et limite de plasticité WP) et de la valeur au bleu de méthylène (VBS) d\'un sol fin. Protocoles à la coupelle de Casagrande et au rouleau, calcul de l\'indice de plasticité IP et classification du sol selon le triangle des textures.',
    level: 'intermediaire', thumb_color: '#5D4037', thumb_icon: '🌍',
  },
  {
    entryName: 'TP/TP 01-Essai proctor.pdf',
    dest_name: 'labo-sol-tp01-essai-proctor.pdf',
    slug:      'labo-sol-tp01-essai-proctor',
    title:     'TP Sol — Essai Proctor',
    description: 'TP sur l\'essai de compactage Proctor normal et modifié. Détermination de la courbe de compactage (densité sèche en fonction de la teneur en eau), identification de la teneur en eau optimale (OPN) et de la densité sèche maximale (γd max). Application au contrôle du compactage sur chantier et à la vérification des objectifs de densification.',
    level: 'intermediaire', thumb_color: '#5D4037', thumb_icon: '🔨',
  },
  {
    entryName: 'TP/TP 01-Granulométrie sols.pdf',
    dest_name: 'labo-sol-tp01-granulometrie-sols.pdf',
    slug:      'labo-sol-tp01-granulometrie-sols',
    title:     'TP Sol — Analyse Granulométrique des Sols',
    description: 'TP sur l\'analyse granulométrique des sols par tamisage et par sédimentation (hydromètre ou densimètre). Détermination de la courbe granulométrique, calcul des paramètres D10, D30, D60, coefficient d\'uniformité Cu et coefficient de courbure Cc. Classification des sols selon les normes GTR et NF P 11-300.',
    level: 'debutant', thumb_color: '#6D4C41', thumb_icon: '📊',
  },
  {
    entryName: 'TP/TP 1-Sols.pdf',
    dest_name: 'labo-sol-tp1-sols-general.pdf',
    slug:      'labo-sol-tp1-sols-general',
    title:     'TP Sol — Étude Générale des Sols',
    description: 'TP d\'introduction à l\'étude des sols en laboratoire. Présente les principaux essais d\'identification géotechnique : teneur en eau naturelle, limites d\'Atterberg, granulométrie, densité des grains et compacité. Support pédagogique complet pour les formations en géotechnique et génie civil, niveau BTS et Licence.',
    level: 'debutant', thumb_color: '#5D4037', thumb_icon: '🌍',
  },
  {
    entryName: 'TP/TP 14 Cisaillement d\'un sol sableux.pdf',
    dest_name: 'labo-sol-tp14-cisaillement-sol-sableux.pdf',
    slug:      'labo-sol-tp14-cisaillement-sol-sableux',
    title:     'TP Sol — Cisaillement d\'un Sol Sableux',
    description: 'TP sur l\'essai de cisaillement rectiligne à la boîte de Casagrande d\'un sol sableux. Détermination de l\'angle de frottement interne φ par l\'enveloppe de Mohr-Coulomb. Protocole d\'essai sous différentes contraintes normales, tracé des cercles de Mohr et interprétation des paramètres de résistance au cisaillement.',
    level: 'avance', thumb_color: '#4E342E', thumb_icon: '🔬',
  },
  {
    entryName: 'TP/TP 14 Proctor - étude d\'un sol - compactage.pdf',
    dest_name: 'labo-sol-tp14-proctor-compactage.pdf',
    slug:      'labo-sol-tp14-proctor-compactage',
    title:     'TP Sol — Proctor : Étude de Compactage d\'un Sol',
    description: 'TP d\'étude complète du compactage d\'un sol par l\'essai Proctor. Détermine la courbe de compactage, la teneur en eau optimale Proctor (WOPN) et la densité sèche maximale. Inclut la comparaison Proctor normal / modifié et l\'application au contrôle qualité du compactage des remblais et des couches de forme.',
    level: 'intermediaire', thumb_color: '#5D4037', thumb_icon: '🔨',
  },
  {
    entryName: 'TP/TP 15 Pénétrométre.pdf',
    dest_name: 'labo-sol-tp15-penetrometre.pdf',
    slug:      'labo-sol-tp15-penetrometre',
    title:     'TP Sol — Essai au Pénétromètre',
    description: 'TP sur l\'essai pénétrométrique dynamique pour l\'identification in situ et en laboratoire des caractéristiques mécaniques des sols. Protocole d\'essai, mesure de la résistance de pointe qd, corrélation avec les paramètres géotechniques (φ, cu) et interprétation des résultats pour le dimensionnement des fondations.',
    level: 'avance', thumb_color: '#4E342E', thumb_icon: '📏',
  },
  {
    entryName: 'TP/TP 15-cisaillemnt à la boite de casagrande_labo.pdf',
    dest_name: 'labo-sol-tp15-cisaillement-casagrande.pdf',
    slug:      'labo-sol-tp15-cisaillement-casagrande',
    title:     'TP Sol — Cisaillement à la Boîte de Casagrande',
    description: 'TP de cisaillement direct à la boîte de Casagrande sur sol cohérent et frottant. Préparation de l\'éprouvette, consolidation sous charge normale, cisaillement lent drainé et mesure des efforts. Tracé de l\'enveloppe de rupture de Mohr-Coulomb, détermination des paramètres c et φ du sol testé.',
    level: 'avance', thumb_color: '#4E342E', thumb_icon: '🔬',
  },
  {
    entryName: 'TP/TP 16 Densitomètre à membrane.pdf',
    dest_name: 'labo-sol-tp16-densitometre-membrane.pdf',
    slug:      'labo-sol-tp16-densitometre-membrane',
    title:     'TP Sol — Densitomètre à Membrane',
    description: 'TP sur le contrôle du compactage in situ par densitomètre à membrane (gammadensimètre à eau). Mesure de la densité sèche et de la teneur en eau du sol en place après compactage. Comparaison avec les valeurs Proctor de référence et calcul du degré de compactage pour la réception des travaux.',
    level: 'intermediaire', thumb_color: '#5D4037', thumb_icon: '💧',
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
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Sols</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='geotechnique' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'geotechnique' introuvable");
  const catId = catRes.rows[0].id;

  const zip = new AdmZip(TP_ZIP);
  console.log(`\n🌍  Import TP Laboratoire — Sols (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      // Recherche souple pour gérer les apostrophes typographiques
      let entry = zip.getEntry(doc.entryName);
      if (!entry) {
        const keyword = doc.entryName.replace(/^TP\//, '').slice(0, 15);
        entry = zip.getEntries().find(e => e.entryName.includes(keyword.replace(/'/g, '’')) || e.entryName.includes(keyword));
      }
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE — ${doc.entryName}`); errors++; continue; }

      const buf = entry.getData();
      const sizeMb = parseFloat((buf.length / 1024 / 1024).toFixed(2));
      fs.writeFileSync(path.join(UPLOAD_DIR, doc.dest_name), buf);
      fs.writeFileSync(path.join(THUMB_DIR, `thumb-tp-sol-${doc.slug}.svg`), makeSVG(doc), 'utf8');

      await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
        VALUES ($1,$2,$3,'tp_pdf',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,$9,NOW())`,
        [doc.title, doc.slug, doc.description, catId,
         `/uploads/products/${doc.dest_name}`, sizeMb,
         `/uploads/images/thumbs/thumb-tp-sol-${doc.slug}.svg`,
         doc.level, ['Sols', 'Laboratoire']]);

      console.log(`  ✅ ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
