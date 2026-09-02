require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const THUMB_DIR  = path.join(__dirname, 'uploads', 'images', 'thumbs');

const COURS_ZIP = "C:\\Users\\33633\\Desktop\\Ressources Al Handassa\\Cours & TD\\Laboratoire\\Béton\\Cours.zip";
const TD_ZIP    = "C:\\Users\\33633\\Desktop\\Ressources Al Handassa\\Cours & TD\\Laboratoire\\Béton\\TD.zip";

// Catalogue des fichiers à importer avec leurs métadonnées
const CATALOG = [
  // ── COURS PDF ──────────────────────────────────────────────────────────────
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 1-Formulation de beton (Dreux-Gorrise, Bolomey, Faury).pdf',
    dest_name: 'labo-beton-cours1-formulation-dreux-gorrise-bolomey-faury.pdf',
    slug:  'labo-beton-cours1-formulation-dreux-gorrise-bolomey-faury',
    title: 'Formulation du Béton — Méthodes Dreux-Gorisse, Bolomey, Faury',
    description: 'Cours complet sur la formulation du béton présentant les trois grandes méthodes de composition : Dreux-Gorisse, Bolomey et Faury. Couvre le choix des constituants, le calcul des dosages en ciment, granulats et eau, la vérification de la maniabilité et la résistance mécanique. Référence incontournable pour les TP de laboratoire en génie civil.',
    type: 'cours_pdf', level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 2-Formulation de beton (Dreux).pdf',
    dest_name: 'labo-beton-cours2-formulation-dreux.pdf',
    slug:  'labo-beton-cours2-formulation-methode-dreux',
    title: 'Formulation du Béton — Méthode Dreux',
    description: 'Cours dédié à la méthode Dreux de formulation du béton. Présente le principe de la courbe granulométrique de référence, le calcul du rapport C/E, le dosage en ciment et la correction pour la maniabilité. Exercices d\'application inclus. Niveau BTS Génie Civil et Licence.',
    type: 'cours_pdf', level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 4-Fomulation de beton (Dreux-Gorrise).pdf',
    dest_name: 'labo-beton-cours4-formulation-dreux-gorrise.pdf',
    slug:  'labo-beton-cours4-formulation-dreux-gorrise',
    title: 'Formulation du Béton — Méthode Dreux-Gorisse',
    description: 'Cours approfondi sur la méthode Dreux-Gorisse de formulation du béton. Traite en détail le fuseau granulométrique, le module de finesse, le calcul du volume absolu des constituants et la vérification des propriétés du béton frais et durci.',
    type: 'cours_pdf', level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 5- Formulation (Tableaux).pdf',
    dest_name: 'labo-beton-cours5-formulation-tableaux.pdf',
    slug:  'labo-beton-cours5-formulation-tableaux-reference',
    title: 'Formulation du Béton — Tableaux de Référence',
    description: 'Document de référence rassemblant les tableaux utilisés dans la formulation du béton : tableaux de dosage en ciment selon la résistance visée, tables de la méthode Dreux-Gorisse, coefficients de correction selon la classe d\'exposition. Outil pratique pour les TP et les exercices de formulation.',
    type: 'cours_pdf', level: 'intermediaire',
    thumb_color: '#C62828', thumb_icon: '📊',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 6- Formulation (Doc Rep).pdf',
    dest_name: 'labo-beton-cours6-formulation-doc-rep.pdf',
    slug:  'labo-beton-cours6-formulation-document-reponse',
    title: 'Formulation du Béton — Document Réponse',
    description: 'Document réponse structuré pour les séances de formulation du béton en laboratoire. Fiches de calcul vierges à compléter lors des TP : relevé des données granulométriques, calcul de la composition, vérification des résultats. Support pédagogique pour l\'encadrement des travaux pratiques.',
    type: 'cours_pdf', level: 'debutant',
    thumb_color: '#C62828', thumb_icon: '📋',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 7-Formulation de beton( Barron-Olivier).pdf',
    dest_name: 'labo-beton-cours7-formulation-barron-olivier.pdf',
    slug:  'labo-beton-cours7-formulation-barron-olivier',
    title: 'Formulation du Béton — Méthode Barron-Olivier',
    description: 'Cours sur la méthode Barron-Olivier de formulation du béton. Présente une approche pratique et simplifiée pour la composition des bétons courants, particulièrement adaptée aux formations technologiques. Comparaison avec les méthodes Dreux-Gorisse et Bolomey.',
    type: 'cours_pdf', level: 'debutant',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  {
    zipFile: COURS_ZIP,
    entryName: 'Cours/Cours 8-Formulation de béton.pdf',
    dest_name: 'labo-beton-cours8-formulation-beton-general.pdf',
    slug:  'labo-beton-cours8-formulation-beton-general',
    title: 'Formulation du Béton — Cours Général',
    description: 'Cours général sur la formulation du béton couvrant les principes fondamentaux de la composition : rôle de chaque constituant (ciment, granulats, eau, adjuvants), les classes de résistance, la durabilité et les classes d\'exposition selon la norme NF EN 206. Support de cours complet pour les formations en génie civil.',
    type: 'cours_pdf', level: 'intermediaire',
    thumb_color: '#B71C1C', thumb_icon: '🧱',
  },
  // ── TD PDF ─────────────────────────────────────────────────────────────────
  {
    zipFile: TD_ZIP,
    entryName: 'TD/TD 1- Formulation simplifiée.pdf',
    dest_name: 'labo-beton-td1-formulation-simplifiee.pdf',
    slug:  'labo-beton-td1-formulation-simplifiee',
    title: 'TD Béton — Formulation Simplifiée',
    description: 'Travaux dirigés sur la formulation simplifiée du béton. Exercice guidé utilisant la méthode simplifiée : détermination de la classe de résistance, calcul du dosage en ciment, choix du rapport E/C et vérification de la maniabilité. Énoncé avec données complètes. Niveau BTS Génie Civil.',
    type: 'td_pdf', level: 'debutant',
    thumb_color: '#1565C0', thumb_icon: '📝',
    tags: ['Béton', 'Laboratoire', 'Formulation'],
  },
  {
    zipFile: TD_ZIP,
    entryName: 'TD/TD 2- Formulation Barron-olivier.pdf',
    dest_name: 'labo-beton-td2-formulation-barron-olivier.pdf',
    slug:  'labo-beton-td2-formulation-barron-olivier',
    title: 'TD Béton — Formulation Barron-Olivier',
    description: 'Travaux dirigés sur la formulation du béton par la méthode Barron-Olivier. Application de la méthode sur un béton courant avec calcul des proportions de chaque constituant, vérification de la composition et établissement de la fiche de formulation finale. Niveau BTS Génie Civil.',
    type: 'td_pdf', level: 'intermediaire',
    thumb_color: '#1565C0', thumb_icon: '📝',
    tags: ['Béton', 'Laboratoire', 'Formulation'],
  },
];

function makeSVG(doc, catName) {
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
  const badgeLabel = doc.type === 'td_pdf' ? 'TD PDF' : 'COURS PDF';
  const tl=lines.map((l,i)=>`<text x="200" y="${titleY+i*26}" text-anchor="middle" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="-0.3">${esc(l)}</text>`).join('\n    ');
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
  <rect x="14" y="14" width="76" height="24" rx="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="0.4">${esc(badgeLabel)}</text>
  <text x="200" y="130" text-anchor="middle" font-size="52">${doc.thumb_icon}</text>
  <line x1="80" y1="148" x2="320" y2="148" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  ${tl}
  <rect x="0" y="252" width="400" height="28" fill="rgba(0,0,0,0.28)"/>
  <text x="16" y="270" fill="rgba(255,255,255,0.7)" font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">Laboratoire — ${esc(catName)}</text>
  <text x="384" y="270" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="'Segoe UI',Arial,sans-serif" font-size="10">handassi.dz</text>
</svg>`;
}

(async () => {
  // Vérifier si adm-zip est disponible
  try { require.resolve('adm-zip'); } catch(e) {
    console.log('Installation de adm-zip...');
    require('child_process').execSync('npm install adm-zip', { cwd: __dirname, stdio: 'inherit' });
  }
  const AdmZip = require('adm-zip');

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(THUMB_DIR))  fs.mkdirSync(THUMB_DIR,  { recursive: true });

  // Catégorie béton
  const catRes = await query("SELECT id FROM categories WHERE slug='beton-arme' LIMIT 1");
  if (!catRes.rows.length) throw new Error("Catégorie 'beton-arme' introuvable");
  const catId = catRes.rows[0].id;

  // Ouvrir les ZIPs
  const zips = {};
  zips[COURS_ZIP] = new AdmZip(COURS_ZIP);
  zips[TD_ZIP]    = new AdmZip(TD_ZIP);

  console.log(`\n🧱 Import Laboratoire — Béton (${CATALOG.length} fichiers)\n`);
  let inserted=0, skipped=0, errors=0;

  for (const doc of CATALOG) {
    try {
      const exists = await query('SELECT id FROM products WHERE slug=$1', [doc.slug]);
      if (exists.rows.length) { console.log(`  ⏭️  SKIP — ${doc.title}`); skipped++; continue; }

      // Extraire le fichier du ZIP
      const zip   = zips[doc.zipFile];
      const entry = zip.getEntry(doc.entryName);
      if (!entry) { console.log(`  ❌ ENTRÉE MANQUANTE dans ZIP — ${doc.entryName}`); errors++; continue; }

      const destPath  = path.join(UPLOAD_DIR, doc.dest_name);
      const fileUrl   = `/uploads/products/${doc.dest_name}`;
      const thumbName = `thumb-beton-${doc.slug}.svg`;
      const thumbUrl  = `/uploads/images/thumbs/${thumbName}`;
      const sizeMb    = parseFloat((entry.header.size / 1024 / 1024).toFixed(2));

      // Écrire le PDF extrait
      zip.extractEntryTo(entry, UPLOAD_DIR, false, true);
      // Renommer si nécessaire
      const extractedPath = path.join(UPLOAD_DIR, entry.entryName);
      if (extractedPath !== destPath && fs.existsSync(extractedPath)) {
        fs.renameSync(extractedPath, destPath);
      }
      // Générer SVG
      fs.writeFileSync(path.join(THUMB_DIR, thumbName), makeSVG(doc, 'Béton'), 'utf8');

      const tags = doc.tags || ['Béton', 'Laboratoire'];
      await query(`INSERT INTO products (title,slug,description,type,category_id,file_url,file_size_mb,thumbnail_url,is_free,price,is_active,language,study_level,tags,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,0,TRUE,'fr',$9,$10,NOW())`,
        [doc.title, doc.slug, doc.description, doc.type, catId, fileUrl, sizeMb, thumbUrl, doc.level, tags]);

      const badge = doc.type === 'td_pdf' ? 'TD' : 'Cours';
      console.log(`  ✅ [${badge}] ${sizeMb} Mo — ${doc.title}`);
      inserted++;
    } catch(err) { console.error(`  ❌ ${doc.title}: ${err.message}`); errors++; }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Insérés: ${inserted}  ⏭️  Ignorés: ${skipped}  ❌ Erreurs: ${errors}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
