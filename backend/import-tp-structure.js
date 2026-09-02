require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Structure\\TP.zip";

const CATALOG = [
  {
    entryName: 'TP/TP 02- Flambement.pdf',
    dest_name: 'labo-structure-tp02-flambement.pdf',
    slug:      'labo-structure-tp02-flambement',
    title:     'TP Structure — Flambement des Barres',
    description: 'TP sur l\'étude expérimentale du flambement des barres élancées. Détermination de la charge critique d\'Euler en fonction de la longueur de flambement et des conditions d\'appui. Comparaison entre les valeurs expérimentales et théoriques, identification des modes de flambement et calcul du coefficient d\'élancement.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '🏗️',
  },
  {
    entryName: 'TP/TP 03- Flexion.pdf',
    dest_name: 'labo-structure-tp03-flexion.pdf',
    slug:      'labo-structure-tp03-flexion',
    title:     'TP Structure — Flexion des Poutres',
    description: 'TP sur l\'étude expérimentale de la flexion des poutres. Mesure des flèches sous charges statiques, tracé de la courbe charge-déflexion et vérification des lois de la résistance des matériaux. Comparaison avec les calculs théoriques par la méthode des moments fléchissants. Application aux poutres isostatiques.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '📐',
  },
  {
    entryName: 'TP/TP 05-Cinquième série d\'essais_bhp_structure.pdf',
    dest_name: 'labo-structure-tp05-bhp-structure.pdf',
    slug:      'labo-structure-tp05-bhp-structure',
    title:     'TP Structure — Béton Haute Performance (BHP)',
    description: 'TP sur la caractérisation structurale du béton haute performance (BHP). Cinquième série d\'essais couvrant les propriétés mécaniques : résistance à la compression, module d\'élasticité et comportement post-fissuration. Comparaison avec le béton ordinaire et analyse de l\'influence de la formulation sur les performances structurales.',
    level: 'avance', thumb_color: '#283593', thumb_icon: '🧱',
  },
  {
    entryName: 'TP/TP 08-Traction simple.pdf',
    dest_name: 'labo-structure-tp08-traction-simple.pdf',
    slug:      'labo-structure-tp08-traction-simple',
    title:     'TP Structure — Traction Simple',
    description: 'TP sur l\'essai de traction simple sur éprouvettes métalliques. Tracé de la courbe contrainte-déformation, identification des zones élastique et plastique, détermination de la limite élastique Re, de la résistance maximale Rm et de l\'allongement à rupture A%. Application à la caractérisation des aciers de construction.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '🔩',
  },
  {
    entryName: 'TP/TP MS- Portique.pdf',
    dest_name: 'labo-structure-tpms-portique.pdf',
    slug:      'labo-structure-tpms-portique',
    title:     'TP Structure — Étude d\'un Portique',
    description: 'TP de mécanique des structures sur l\'étude expérimentale d\'un portique plan. Mesure des déplacements et des réactions d\'appui sous charges statiques, tracé des diagrammes des efforts internes (N, T, M) et comparaison avec les résultats théoriques par la méthode des déplacements ou des forces.',
    level: 'avance', thumb_color: '#283593', thumb_icon: '🏗️',
  },
  {
    entryName: 'TP/TP MS3- Flexion Flèche.pdf',
    dest_name: 'labo-structure-tpms3-flexion-fleche.pdf',
    slug:      'labo-structure-tpms3-flexion-fleche',
    title:     'TP Structure — Flexion et Calcul de Flèche',
    description: 'TP de mécanique des structures sur la flexion des poutres et le calcul de flèche. Expérimentation sur poutres isostatiques et hyperstatiques, mesure des flèches aux différents points, vérification par la méthode de la double intégration et par les tables de flèches. Influence de la rigidité EI sur la déformée.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '📐',
  },
  {
    entryName: 'TP/TP MS3- Treillis.pdf',
    dest_name: 'labo-structure-tpms3-treillis.pdf',
    slug:      'labo-structure-tpms3-treillis',
    title:     'TP Structure — Étude d\'un Treillis',
    description: 'TP de mécanique des structures sur l\'analyse expérimentale d\'un treillis plan. Mesure des efforts dans les barres par jauges de déformation, calcul des efforts théoriques par la méthode des nœuds ou de Ritter, et comparaison des résultats. Vérification de l\'hypothèse des barres à deux forces.',
    level: 'avance', thumb_color: '#283593', thumb_icon: '🔧',
  },
  {
    entryName: 'TP/TP MS4- IPE 240.pdf',
    dest_name: 'labo-structure-tpms4-ipe240.pdf',
    slug:      'labo-structure-tpms4-ipe240',
    title:     'TP Structure — Profilé IPE 240 : Caractérisation',
    description: 'TP sur la caractérisation mécanique d\'un profilé métallique IPE 240. Essais de flexion simple, mesure des contraintes par jauges, vérification de la théorie de la flexion plane et des propriétés géométriques de la section (Ix, Wx). Comparaison avec les valeurs tabulées et analyse des résultats expérimentaux.',
    level: 'avance', thumb_color: '#283593', thumb_icon: '🔩',
  },
  {
    entryName: 'TP/TP MS5- Traction.pdf',
    dest_name: 'labo-structure-tpms5-traction.pdf',
    slug:      'labo-structure-tpms5-traction',
    title:     'TP Structure — Essai de Traction sur Acier',
    description: 'TP de mécanique des structures sur l\'essai de traction des aciers de construction. Détermination expérimentale des caractéristiques mécaniques (Re, Rm, E, A%) sur éprouvette normalisée, tracé du diagramme σ-ε et identification des différents stades de comportement : élasticité, palier plastique, écrouissage et striction.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '🔩',
  },
  {
    entryName: 'TP/TP11 Traction d\'aciers.pdf',
    dest_name: 'labo-structure-tp11-traction-aciers.pdf',
    slug:      'labo-structure-tp11-traction-aciers',
    title:     'TP Structure — Traction des Aciers de Béton Armé',
    description: 'TP sur l\'essai de traction des aciers utilisés en béton armé (HA et ronds lisses). Caractérisation de la nuance d\'acier : limite d\'élasticité garantie (fyk), résistance à la traction (ftk), allongement relatif sous charge maximale (Agt). Vérification de la conformité aux exigences de la norme EN 10080 et du règlement béton armé.',
    level: 'intermediaire', thumb_color: '#1A237E', thumb_icon: '🔩',
  },
  {
    entryName: 'TP/TP11-Flexion poutre.pdf',
    dest_name: 'labo-structure-tp11-flexion-poutre.pdf',
    slug:      'labo-structure-tp11-flexion-poutre',
    title:     'TP Structure — Flexion d\'une Poutre en Béton Armé',
    description: 'TP sur l\'essai de flexion d\'une poutre en béton armé jusqu\'à la rupture. Observation des phases de comportement (non fissuré, fissuré, plastique), mesure des flèches et des ouvertures de fissures, identification de la charge de fissuration et de la charge ultime. Comparaison avec les calculs théoriques selon l\'Eurocode 2.',
    level: 'avance', thumb_color: '#283593', thumb_icon: '🏗️',
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
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Structure</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='structures' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'structures' introuvable");
  const catId = catRes.rows[0].id;

  const zip = new AdmZip(TP_ZIP);
  console.log(`\n🏗️  Import TP Laboratoire — Structure (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      // Recherche souple pour les apostrophes typographiques
      let entry = zip.getEntry(doc.entryName);
      if (!entry) {
        const base = doc.entryName.replace(/^TP\//, '').slice(0, 15);
        entry = zip.getEntries().find(e => e.entryName.replace(/'/g,"'").includes(base.replace(/'/g,"'")));
      }
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE — ${doc.entryName}`); errors++; continue; }

      const buf = entry.getData();
      const sizeMb = parseFloat((buf.length / 1024 / 1024).toFixed(2));
      fs.writeFileSync(path.join(UPLOAD_DIR, doc.dest_name), buf);
      fs.writeFileSync(path.join(THUMB_DIR, `thumb-tp-struct-${doc.slug}.svg`), makeSVG(doc), 'utf8');

      await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
        VALUES ($1,$2,$3,'tp_pdf',$4,$5,$6,$7,TRUE,0,TRUE,'fr',$8,$9,NOW())`,
        [doc.title, doc.slug, doc.description, catId,
         `/uploads/products/${doc.dest_name}`, sizeMb,
         `/uploads/images/thumbs/thumb-tp-struct-${doc.slug}.svg`,
         doc.level, ['Structure', 'Laboratoire']]);

      console.log(`  ✅ ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
