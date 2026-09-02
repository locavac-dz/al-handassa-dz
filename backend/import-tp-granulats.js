require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Granulats\\TP.zip";

const CATALOG = [
  {
    entryName: 'TP/CERIB 196-Masse volumique abs ciment.pdf',
    dest_name: 'labo-granulats-cerib196-masse-volumique-ciment.pdf',
    slug:      'labo-granulats-cerib196-masse-volumique-ciment',
    title:     'TP Granulats — Masse Volumique Absolue du Ciment (CERIB 196)',
    description: 'Fiche de TP CERIB n°196 sur la détermination de la masse volumique absolue du ciment au voluménomètre de Le Chatelier. Protocole normalisé, mode opératoire étape par étape et tableau de résultats. Essai indispensable pour le calcul de la composition des bétons par la méthode des volumes absolus.',
    level: 'debutant', thumb_color: '#2E7D32', thumb_icon: '⚗️',
  },
  {
    entryName: 'TP/CERIB 932-Echantillonage des granulats.pdf',
    dest_name: 'labo-granulats-cerib932-echantillonnage.pdf',
    slug:      'labo-granulats-cerib932-echantillonnage',
    title:     'TP Granulats — Échantillonnage des Granulats (CERIB 932)',
    description: 'Fiche de TP CERIB n°932 sur les méthodes d\'échantillonnage des granulats en laboratoire. Présente les techniques de quartering et de diviseur à riffles pour obtenir des échantillons représentatifs. Prérequis fondamental à tous les essais sur granulats selon les normes NF EN 932.',
    level: 'debutant', thumb_color: '#2E7D32', thumb_icon: '🪨',
  },
  {
    entryName: 'TP/CERIB 933-Bleu sur granulats.pdf',
    dest_name: 'labo-granulats-cerib933-valeur-bleu.pdf',
    slug:      'labo-granulats-cerib933-valeur-bleu',
    title:     'TP Granulats — Valeur au Bleu de Méthylène (CERIB 933)',
    description: 'Fiche de TP CERIB n°933 sur la détermination de la valeur au bleu de méthylène (VBS) des granulats et des fines. Évalue la propreté et la teneur en argile des sables et graviers. Mode opératoire par taches sur papier filtre, calcul de la VBS et classification selon la norme NF EN 933-9.',
    level: 'intermediaire', thumb_color: '#1B5E20', thumb_icon: '🧪',
  },
  {
    entryName: 'TP/CERIB 933-Coefficient d\'aplatissement.pdf',
    dest_name: 'labo-granulats-cerib933-coefficient-aplatissement.pdf',
    slug:      'labo-granulats-cerib933-coefficient-aplatissement',
    title:     'TP Granulats — Coefficient d\'Aplatissement (CERIB 933)',
    description: 'Fiche de TP CERIB n°933 sur la détermination du coefficient d\'aplatissement des gravillons. Tamisage sur tamis à fentes et tamis carrés, calcul du coefficient A par fraction granulaire. Évalue la forme des granulats et leur aptitude à être employés en béton ou en couche de chaussée selon NF EN 933-3.',
    level: 'intermediaire', thumb_color: '#2E7D32', thumb_icon: '🪨',
  },
  {
    entryName: 'TP/NF P 94 056 Tamisage lavage.pdf',
    dest_name: 'labo-granulats-nfp94056-tamisage-lavage.pdf',
    slug:      'labo-granulats-nfp94056-tamisage-lavage',
    title:     'TP Granulats — Tamisage par Lavage (NF P 94-056)',
    description: 'TP sur l\'analyse granulométrique par tamisage après lavage selon la norme NF P 94-056. Permet de déterminer la distribution granulométrique des sols et des granulats fins en éliminant les fines par lavage avant tamisage. Protocole complet, calcul des refus cumulés et tracé de la courbe granulométrique.',
    level: 'intermediaire', thumb_color: '#33691E', thumb_icon: '🌍',
  },
  {
    entryName: 'TP/TP 00- Teneur en eau d\'un granulats.pdf',
    dest_name: 'labo-granulats-tp00-teneur-eau.pdf',
    slug:      'labo-granulats-tp00-teneur-eau',
    title:     'TP Granulats — Teneur en Eau',
    description: 'TP sur la détermination de la teneur en eau des granulats par étuvage à 105°C. Protocole de prélèvement, pesée avant et après séchage, calcul de la teneur en eau pondérale. Paramètre essentiel pour corriger les dosages en eau lors de la formulation du béton. Niveau BTS Génie Civil.',
    level: 'debutant', thumb_color: '#2E7D32', thumb_icon: '💧',
  },
  {
    entryName: 'TP/TP 02- Granulats (Mv, ES...).pdf',
    dest_name: 'labo-granulats-tp02-mv-es.pdf',
    slug:      'labo-granulats-tp02-mv-es',
    title:     'TP Granulats — Masse Volumique et Équivalent de Sable',
    description: 'TP sur la détermination de la masse volumique apparente et absolue des granulats, et de l\'équivalent de sable (ES) des sables 0/4. Protocoles des essais au pycnomètre et au bac normalisé, calcul des masses volumiques, essai d\'équivalent de sable visuel et au piston. Classification de la propreté du sable.',
    level: 'debutant', thumb_color: '#2E7D32', thumb_icon: '🪨',
  },
  {
    entryName: 'TP/TP 05- Foisonnement d\'un sable, Rapport GS....pdf',
    dest_name: 'labo-granulats-tp05-foisonnement-sable.pdf',
    slug:      'labo-granulats-tp05-foisonnement-sable',
    title:     'TP Granulats — Foisonnement d\'un Sable et Rapport GS',
    description: 'TP sur la détermination du coefficient de foisonnement d\'un sable et du rapport GS (granulats sur sable). Protocole de mesure du volume foisonné et du volume tassé, calcul du foisonnement et correction du dosage volumétrique en béton. Paramètre important pour les bétons dosés au volume sur chantier.',
    level: 'intermediaire', thumb_color: '#33691E', thumb_icon: '🪨',
  },
  {
    entryName: 'TP/TP 1-Granulats.pdf',
    dest_name: 'labo-granulats-tp1-granulats-general.pdf',
    slug:      'labo-granulats-tp1-granulats-general',
    title:     'TP Granulats — Étude Générale des Granulats',
    description: 'TP d\'introduction à l\'étude des granulats en laboratoire. Présente les principaux essais d\'identification et de caractérisation : granulométrie, module de finesse, masses volumiques, équivalent de sable, teneur en eau et coefficient d\'aplatissement. Support pédagogique complet pour les formations en génie civil.',
    level: 'debutant', thumb_color: '#2E7D32', thumb_icon: '🪨',
  },
  {
    entryName: 'TP/TP-03 Analyse Granulométrique, Mélange....pdf',
    dest_name: 'labo-granulats-tp03-analyse-granulometrique-melange.pdf',
    slug:      'labo-granulats-tp03-analyse-granulometrique-melange',
    title:     'TP Granulats — Analyse Granulométrique et Mélange',
    description: 'TP sur l\'analyse granulométrique par tamisage à sec et la composition de mélanges de granulats. Détermination des courbes granulométriques de chaque classe, calcul du module de finesse, composition d\'un mélange pour s\'approcher d\'une courbe de référence (Dreux-Gorisse). Application directe à la formulation du béton.',
    level: 'intermediaire', thumb_color: '#1B5E20', thumb_icon: '📊',
  },
  {
    entryName: 'TP/TP04-Foisonnement-Granulo.pdf',
    dest_name: 'labo-granulats-tp04-foisonnement-granulo.pdf',
    slug:      'labo-granulats-tp04-foisonnement-granulo',
    title:     'TP Granulats — Foisonnement et Granulométrie',
    description: 'TP combinant l\'essai de foisonnement du sable et l\'analyse granulométrique. Mesure du coefficient de foisonnement en fonction de la teneur en eau, tracé de la courbe de foisonnement et détermination du foisonnement maximum. Complété par l\'analyse granulométrique et le calcul du module de finesse du sable étudié.',
    level: 'intermediaire', thumb_color: '#33691E', thumb_icon: '🪨',
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
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — Granulats</text>
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

  console.log(`\n🪨  Import TP Laboratoire — Granulats (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      const entry = zip.getEntry(doc.entryName);
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE — ${doc.entryName}`); errors++; continue; }

      const destPath  = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-tp-granulats-${doc.slug}.svg`;
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const buf       = entry.getData();
      const sizeMb    = parseFloat((buf.length / 1024 / 1024).toFixed(2));

      fs.writeFileSync(destPath, buf);
      fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(doc), 'utf8');

      const tags = ['Granulats', 'Laboratoire'];
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
