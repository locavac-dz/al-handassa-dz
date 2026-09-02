require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Béton\\TP.zip";

const CATALOG = [
  {
    entryName: 'TP/TP 00-Abrams_controlab.pdf',
    dest_name: 'labo-beton-tp00-essai-affaissement-abrams.pdf',
    slug:      'labo-beton-tp00-essai-affaissement-abrams',
    title:     'TP Béton — Essai d\'Affaissement au Cône d\'Abrams',
    description: 'Travaux pratiques sur l\'essai d\'affaissement au cône d\'Abrams (slump test). Protocole complet : préparation du béton frais, mise en œuvre de l\'essai, mesure de l\'affaissement et interprétation des résultats selon les classes de consistance. Fiche de TP avec tableaux de relevé. Niveau BTS Génie Civil.',
    level: 'debutant',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    entryName: 'TP/TP 01-Beton.pdf',
    dest_name: 'labo-beton-tp01-beton-general.pdf',
    slug:      'labo-beton-tp01-beton-general',
    title:     'TP Béton — Étude Générale du Béton',
    description: 'TP d\'introduction à l\'étude du béton en laboratoire. Présente les essais fondamentaux sur le béton frais et durci : composition, malaxage, mise en place, cure et contrôle de la qualité. Support pédagogique complet avec protocoles d\'essais et fiches de résultats. Niveau BTS Génie Civil.',
    level: 'debutant',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    entryName: 'TP/TP 04- Eprouvettes Bétons.pdf',
    dest_name: 'labo-beton-tp04-confection-eprouvettes.pdf',
    slug:      'labo-beton-tp04-confection-eprouvettes',
    title:     'TP Béton — Confection et Conservation des Éprouvettes',
    description: 'TP sur la confection et la conservation des éprouvettes de béton. Protocole de remplissage des moules (cylindriques et prismatiques), damage, surfaçage et conditions de cure. Préparation aux essais de résistance à la compression et à la traction. Niveau BTS Génie Civil.',
    level: 'debutant',
    thumb_color: '#C62828', thumb_icon: '🔬',
  },
  {
    entryName: 'TP/TP 05-Cone de marsh.pdf',
    dest_name: 'labo-beton-tp05-cone-marsh.pdf',
    slug:      'labo-beton-tp05-cone-marsh',
    title:     'TP Béton — Essai au Cône de Marsh',
    description: 'TP sur l\'essai au cône de Marsh pour la mesure de la fluidité des coulis et mortiers. Protocole d\'essai, détermination du temps d\'écoulement, influence du dosage en eau et des adjuvants sur la maniabilité. Interprétation des résultats et conclusions. Niveau BTS Génie Civil.',
    level: 'intermediaire',
    thumb_color: '#C62828', thumb_icon: '🔬',
  },
  {
    entryName: 'TP/TP 06-Etude des Bétons Durcis.pdf',
    dest_name: 'labo-beton-tp06-betons-durcis.pdf',
    slug:      'labo-beton-tp06-betons-durcis',
    title:     'TP Béton — Étude des Bétons Durcis',
    description: 'TP sur l\'étude des bétons à l\'état durci. Essais de résistance à la compression sur éprouvettes cylindriques, résistance à la traction par fendage (essai brésilien), essais de dureté et analyse des résultats. Corrélation entre formulation, conditions de cure et résistances mécaniques obtenues.',
    level: 'intermediaire',
    thumb_color: '#C62828', thumb_icon: '🔬',
  },
  {
    entryName: 'TP/TP 09- Composition de Béton.pdf',
    dest_name: 'labo-beton-tp09-composition-beton.pdf',
    slug:      'labo-beton-tp09-composition-beton',
    title:     'TP Béton — Composition et Formulation du Béton',
    description: 'TP complet sur la composition et la formulation du béton en laboratoire. Application pratique des méthodes de calcul (Dreux-Gorisse), essais sur granulats, détermination de la courbe granulométrique, calcul de la composition et vérification expérimentale par confection d\'éprouvettes. Niveau Licence Génie Civil.',
    level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    entryName: 'TP/TP 10- Etude des coulis.pdf',
    dest_name: 'labo-beton-tp10-etude-coulis.pdf',
    slug:      'labo-beton-tp10-etude-coulis',
    title:     'TP Béton — Étude des Coulis de Ciment',
    description: 'TP sur l\'étude des coulis de ciment : consistance normale, temps de prise, retrait et expansion. Essais à l\'appareil de Vicat, mesure de la chaleur d\'hydratation et vérification de la stabilité. Application aux injections de coulis en géotechnique et aux travaux de précontrainte.',
    level: 'intermediaire',
    thumb_color: '#E65100', thumb_icon: '⚗️',
  },
  {
    entryName: 'TP/TP14- Formulation_Baron Olivier.pdf',
    dest_name: 'labo-beton-tp14-formulation-baron-olivier.pdf',
    slug:      'labo-beton-tp14-formulation-baron-olivier',
    title:     'TP Béton — Formulation par la Méthode Baron-Olivier',
    description: 'TP de formulation du béton par la méthode Baron-Olivier. Application pratique : détermination des caractéristiques des granulats, calcul de la composition optimale, confection et essais sur le béton frais (affaissement) et durci (résistance à 28 jours). Fiche de résultats complète à renseigner.',
    level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
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
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Béton</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  const catRes = await query("SELECT id FROM categories WHERE slug='beton-arme' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'beton-arme' introuvable");
  const catId = catRes.rows[0].id;

  const zip = new AdmZip(TP_ZIP);

  console.log(`\n🔬 Import TP Laboratoire — Béton (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      const entry = zip.getEntry(doc.entryName);
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE — ${doc.entryName}`); errors++; continue; }

      const destPath  = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-tp-beton-${doc.slug}.svg`;
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const buf       = entry.getData();
      const sizeMb    = parseFloat((buf.length / 1024 / 1024).toFixed(2));

      fs.writeFileSync(destPath, buf);
      fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(doc), 'utf8');

      const tags = ['Béton', 'Laboratoire'];
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
