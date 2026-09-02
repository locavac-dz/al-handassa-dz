/**
 * generate-thumbs.js — Al Handassa.dz
 * Génère des vignettes SVG professionnelles pour les produits sans thumbnail_url
 * Usage: node generate-thumbs.js [--all] [--dry-run]
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ALL     = process.argv.includes('--all'); // régénérer même ceux qui ont déjà un thumb

// ── Palettes par catégorie ────────────────────────────────────────────────────
const CAT_PALETTE = {
  beton:        { bg1: '#E65100', bg2: '#BF360C', accent: '#FF8A50', icon: '🏗️' },
  structures:   { bg1: '#1B3A6B', bg2: '#0D2240', accent: '#5B8FD4', icon: '🏛️' },
  geo:          { bg1: '#2E7D32', bg2: '#1B5E20', accent: '#66BB6A', icon: '⛏️' },
  hydraulique:  { bg1: '#0277BD', bg2: '#01579B', accent: '#4FC3F7', icon: '💧' },
  materiaux:    { bg1: '#5D4037', bg2: '#3E2723', accent: '#A1887F', icon: '🧱' },
  topographie:  { bg1: '#00695C', bg2: '#004D40', accent: '#4DB6AC', icon: '📐' },
  architecture: { bg1: '#6A1B9A', bg2: '#4A148C', accent: '#CE93D8', icon: '🏛️' },
  parasismique: { bg1: '#C62828', bg2: '#8E0000', accent: '#EF9A9A', icon: '📊' },
  routes:       { bg1: '#E65100', bg2: '#BF360C', accent: '#FFCC80', icon: '🛣️' },
  logiciels:    { bg1: '#0D47A1', bg2: '#01236B', accent: '#82B1FF', icon: '💻' },
  pfe:          { bg1: '#4527A0', bg2: '#311B92', accent: '#B39DDB', icon: '🎓' },
  durable:      { bg1: '#1B5E20', bg2: '#0A3D0A', accent: '#A5D6A7', icon: '♻️' },
  gestion:      { bg1: '#1565C0', bg2: '#003C8F', accent: '#90CAF9', icon: '📋' },
  securite:     { bg1: '#B71C1C', bg2: '#7F0000', accent: '#EF9A9A', icon: '⛑️' },
};

const TYPE_PALETTE = {
  cours_pdf:  { bg1: '#1B3A6B', bg2: '#0D2240', accent: '#5B8FD4', label: 'Cours PDF',       icon: '📚' },
  logiciels:  { bg1: '#0D47A1', bg2: '#01236B', accent: '#82B1FF', label: 'Logiciel',         icon: '💻' },
  exercices:  { bg1: '#2E7D32', bg2: '#1B5E20', accent: '#66BB6A', label: 'Exercices',        icon: '🎯' },
  normes:     { bg1: '#B71C1C', bg2: '#7F0000', accent: '#EF9A9A', label: 'Norme',            icon: '📋' },
  pack:       { bg1: '#E65100', bg2: '#BF360C', accent: '#FFCC80', label: 'Pack',             icon: '📦' },
  sujet:      { bg1: '#4527A0', bg2: '#311B92', accent: '#B39DDB', label: 'Sujet d\'examen',  icon: '🎓' },
  livre:      { bg1: '#00695C', bg2: '#004D40', accent: '#4DB6AC', label: 'Livre',            icon: '📖' },
  affiche:    { bg1: '#5D4037', bg2: '#3E2723', accent: '#A1887F', label: 'Affiche',          icon: '🖼️' },
};

const DEFAULT_PAL = { bg1: '#1B3A6B', bg2: '#0D2240', accent: '#5B8FD4', icon: '📄', label: 'Ressource' };

// ── Wrapping texte SVG ────────────────────────────────────────────────────────
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
    if (lines.length >= 3) { lines[2] = lines[2].slice(0, maxChars - 3) + '…'; break; }
  }
  if (cur && lines.length < 3) lines.push(cur.trim());
  return lines.slice(0, 3);
}

// ── Génération SVG ────────────────────────────────────────────────────────────
function makeSVG(p) {
  const pal  = (p.category_slug && CAT_PALETTE[p.category_slug])
             || (p.type          && TYPE_PALETTE[p.type])
             || DEFAULT_PAL;
  const typP = TYPE_PALETTE[p.type] || DEFAULT_PAL;
  const icon  = pal.icon || typP.icon || '📄';
  const label = typP.label || p.type || 'Ressource';
  const lines = wrapText(p.title, 22);

  const W = 400, H = 280;
  const titleY = lines.length === 1 ? 176 : lines.length === 2 ? 168 : 158;
  const lineH  = 26;

  // Motif de fond (grille subtile)
  const grid = Array.from({length: 6}, (_,i) => Array.from({length: 5}, (_,j) =>
    `<circle cx="${i*80+40}" cy="${j*70+35}" r="1.5" fill="white" opacity="0.08"/>`
  ).join('')).join('');

  const titleLines = lines.map((l, i) =>
    `<text x="200" y="${titleY + i * lineH}" text-anchor="middle" fill="white"
       font-family="'Segoe UI',Arial,sans-serif" font-size="18" font-weight="700"
       letter-spacing="-0.3">${escXML(l)}</text>`
  ).join('\n    ');

  // Barre décorative en bas
  const decorBars = [
    `<rect x="0" y="252" width="${W}" height="28" fill="rgba(0,0,0,0.25)"/>`,
    `<rect x="16" y="262" width="48" height="3" rx="1.5" fill="${pal.accent}" opacity="0.9"/>`,
    `<rect x="72" y="262" width="24" height="3" rx="1.5" fill="${pal.accent}" opacity="0.4"/>`,
  ].join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg1}"/>
      <stop offset="100%" stop-color="${pal.bg2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="white" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="${W}" height="${H}" rx="12"/>
    </clipPath>
  </defs>

  <!-- Fond -->
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#shine)" clip-path="url(#clip)"/>

  <!-- Motif points -->
  <g clip-path="url(#clip)">${grid}</g>

  <!-- Arc décoratif -->
  <circle cx="340" cy="-20" r="130" fill="white" opacity="0.05" clip-path="url(#clip)"/>

  <!-- Badge type (haut gauche) -->
  <rect x="14" y="14" width="${label.length * 8.5 + 20}" height="24" rx="12"
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="24" y="30" fill="white" font-family="'Segoe UI',Arial,sans-serif"
        font-size="11" font-weight="600" letter-spacing="0.5" opacity="0.95">${escXML(label.toUpperCase())}</text>

  <!-- Icône centrale -->
  <text x="200" y="130" text-anchor="middle" font-size="54">${icon}</text>

  <!-- Ligne séparatrice -->
  <line x1="80" y1="148" x2="320" y2="148" stroke="${pal.accent}" stroke-width="1.5" opacity="0.5"/>

  <!-- Titre -->
  ${titleLines}

  <!-- Barre bas -->
  ${decorBars}
  <text x="380" y="270" text-anchor="end" fill="white" opacity="0.55"
        font-family="'Segoe UI',Arial,sans-serif" font-size="10" font-weight="600">handassi.dz</text>
</svg>`;
}

function escXML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const thumbDir = path.join(__dirname, 'uploads', 'images', 'thumbs');
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const whereClause = ALL
    ? 'WHERE p.is_active = TRUE'
    : 'WHERE p.is_active = TRUE AND (p.thumbnail_url IS NULL OR p.thumbnail_url = \'\')';

  const res = await query(`
    SELECT p.id, p.title, p.type, p.slug, p.thumbnail_url,
           c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY p.title
  `);

  console.log(`\n🎨 ${res.rowCount} produit(s) à traiter${DRY_RUN ? ' [DRY-RUN]' : ''}\n`);

  let done = 0;
  for (const p of res.rows) {
    const slug = p.slug || p.id;
    const fname = `thumb-gen-${slug.substring(0, 60)}.svg`;
    const fpath = path.join(thumbDir, fname);
    const dbPath = `/uploads/images/thumbs/${fname}`;

    const svg = makeSVG(p);

    if (!DRY_RUN) {
      fs.writeFileSync(fpath, svg, 'utf8');
      await query('UPDATE products SET thumbnail_url=$1 WHERE id=$2', [dbPath, p.id]);
    }

    console.log(`  ✅ ${p.type.padEnd(12)} ${p.title.substring(0,55)}`);
    done++;
  }

  console.log(`\n🏁 ${done} vignette(s) générée(s)${DRY_RUN ? ' (dry-run, aucun fichier écrit)' : ''}\n`);
  process.exit(0);
})().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
