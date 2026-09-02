#!/usr/bin/env node
/**
 * add-article.js — Al Handassa.dz
 * Outil CLI pour ajouter UN article rapidement en base.
 * Lit un fichier JSON en argument, ou entre en mode interactif.
 *
 * Usage :
 *   node backend/add-article.js article.json          → insère le JSON
 *   node backend/add-article.js --list                → liste les articles publiés
 *   node backend/add-article.js --unpublish <slug>    → dépublier un article
 *   node backend/add-article.js --delete <slug>       → supprimer un article
 *
 * Format JSON minimal :
 * {
 *   "title": "Mon article",
 *   "excerpt": "Résumé court",
 *   "content": "<p>Corps HTML...</p>",
 *   "category": "beton",     // voir CATEGORIES ci-dessous
 *   "tags": ["béton", "structures"],
 *   "bibliography": ["Auteur (2020). Titre. Revue."],
 *   "doi": "10.xxxx/yyyy",   // optionnel
 *   "source_url": "https://...",  // optionnel, affiché dans le footer
 *   "read_time_min": 10      // optionnel, calculé auto si absent
 * }
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ──────────────────────────────────────────────────────────────────────────────
// Mapping catégories
// ──────────────────────────────────────────────────────────────────────────────
const CATEGORIES = {
  'beton':          { id: 1,  label: 'Béton Armé' },
  'beton-arme':     { id: 1,  label: 'Béton Armé' },
  'structures':     { id: 2,  label: 'Structures' },
  'geotechnique':   { id: 3,  label: 'Géotechnique & Fondations' },
  'hydraulique':    { id: 4,  label: 'Hydraulique' },
  'materiaux':      { id: 5,  label: 'Matériaux de Construction' },
  'topographie':    { id: 6,  label: 'Topographie & DAO' },
  'architecture':   { id: 7,  label: 'Architecture' },
  'parasismique':   { id: 8,  label: 'Parasismique & Normes DTR' },
  'routes':         { id: 9,  label: 'Routes & VRD' },
  'routes-vrd':     { id: 9,  label: 'Routes & VRD' },
  'logiciels':      { id: 10, label: 'Logiciels' },
  'pfe':            { id: 11, label: 'PFE & Mémoires' },
  'durable':        { id: 12, label: 'Développement Durable' },
  'developpement-durable': { id: 12, label: 'Développement Durable' },
  'gestion':        { id: 13, label: 'Gestion de Projet & Chantier' },
  'securite':       { id: 14, label: 'Sécurité & Prévention' },
};

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90);
}

// ──────────────────────────────────────────────────────────────────────────────
// Commandes
// ──────────────────────────────────────────────────────────────────────────────

async function listArticles() {
  const client = await pool.connect();
  const r = await client.query(
    `SELECT a.slug, a.title, c.name_fr as category, a.views_count, a.published_at
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE a.is_published = TRUE
     ORDER BY a.published_at DESC`
  );
  client.release();

  if (!r.rows.length) { console.log('  (aucun article publié)'); return; }
  console.log(`\n  ${r.rows.length} articles publiés :\n`);
  r.rows.forEach((row, i) => {
    const date = row.published_at ? new Date(row.published_at).toLocaleDateString('fr-FR') : '—';
    console.log(`  ${String(i+1).padStart(2)}. [${row.category || '—'}] ${row.title.substring(0, 55).padEnd(57)} | slug: ${row.slug} | ${row.views_count} vues | ${date}`);
  });
  console.log('');
}

async function unpublishArticle(slug) {
  const client = await pool.connect();
  const r = await client.query(
    'UPDATE articles SET is_published=FALSE, updated_at=NOW() WHERE slug=$1 RETURNING title',
    [slug]
  );
  client.release();
  if (r.rows.length) console.log(`  ✅ Article dépublié : "${r.rows[0].title}"`);
  else console.log(`  ❌ Slug introuvable : ${slug}`);
}

async function deleteArticle(slug) {
  const client = await pool.connect();
  const r = await client.query('DELETE FROM articles WHERE slug=$1 RETURNING title', [slug]);
  client.release();
  if (r.rows.length) console.log(`  🗑  Article supprimé : "${r.rows[0].title}"`);
  else console.log(`  ❌ Slug introuvable : ${slug}`);
}

async function insertArticle(data) {
  // Validation des champs obligatoires
  const required = ['title', 'excerpt', 'content', 'category'];
  for (const f of required) {
    if (!data[f]) { console.error(`  ❌ Champ obligatoire manquant : ${f}`); process.exit(1); }
  }

  // Résolution catégorie
  const catKey = String(data.category).toLowerCase().replace(/\s+/g, '-');
  const cat = CATEGORIES[catKey];
  if (!cat) {
    console.error(`  ❌ Catégorie inconnue : "${data.category}"`);
    console.error('  Catégories disponibles : ' + Object.keys(CATEGORIES).join(', '));
    process.exit(1);
  }

  const slug0 = slugify(data.title);
  const client = await pool.connect();

  // Unicité slug
  let slug = slug0;
  const sc = await client.query('SELECT id FROM articles WHERE slug=$1', [slug]);
  if (sc.rows.length) slug = slug + '-' + Date.now();

  // Vérification titre dupliqué
  const tc = await client.query('SELECT id FROM articles WHERE LOWER(title)=$1', [data.title.toLowerCase()]);
  if (tc.rows.length) {
    console.error(`  ⚠️  Un article avec ce titre existe déjà (id=${tc.rows[0].id}).`);
    client.release(); process.exit(1);
  }

  // Calcul temps de lecture
  const wordCount = (data.content || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = data.read_time_min || Math.max(5, Math.round(wordCount / 200));

  const r = await client.query(
    `INSERT INTO articles (
      title, slug, excerpt, content, category_id,
      thumbnail_url, read_time_min, is_free, price,
      language, tags, bibliography, doi,
      is_published, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,TRUE,0,
      $8,$9,$10,$11,
      TRUE,NOW()
    ) RETURNING id, slug`,
    [
      data.title, slug, data.excerpt, data.content, cat.id,
      data.thumbnail_url || null, readTime,
      data.language || 'fr',
      data.tags || [],
      data.bibliography || [],
      data.doi || null,
    ]
  );
  client.release();

  const inserted = r.rows[0];
  console.log(`\n  ✅ Article inséré avec succès !`);
  console.log(`     ID   : ${inserted.id}`);
  console.log(`     Slug : ${inserted.slug}`);
  console.log(`     URL  : /article.html?slug=${inserted.slug}`);
  console.log(`     Catégorie : ${cat.label}\n`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (!args.length || args[0] === '--help' || args[0] === '-h') {
    console.log(`
  add-article.js — Ajouter un article à Al Handassa.dz

  Usage :
    node backend/add-article.js <fichier.json>      → insérer un article
    node backend/add-article.js --list              → lister les articles
    node backend/add-article.js --unpublish <slug>  → dépublier un article
    node backend/add-article.js --delete <slug>     → supprimer un article

  Catégories disponibles :
${Object.entries(CATEGORIES).map(([k,v]) => `    ${k.padEnd(28)} → ${v.label}`).join('\n')}

  Format JSON minimal du fichier :
  {
    "title": "Titre de l'article",
    "excerpt": "Résumé en 2-3 phrases",
    "content": "<h2>Introduction</h2><p>Corps HTML...</p>",
    "category": "beton",
    "tags": ["béton armé", "calcul"],
    "bibliography": ["Auteur (2020). Titre. Revue."],
    "doi": "10.xxxx/yyyy",
    "read_time_min": 10
  }
    `);
    await pool.end(); return;
  }

  if (args[0] === '--list') {
    await listArticles();
    await pool.end(); return;
  }

  if (args[0] === '--unpublish') {
    if (!args[1]) { console.error('  ❌ Fournir le slug après --unpublish'); process.exit(1); }
    await unpublishArticle(args[1]);
    await pool.end(); return;
  }

  if (args[0] === '--delete') {
    if (!args[1]) { console.error('  ❌ Fournir le slug après --delete'); process.exit(1); }
    await deleteArticle(args[1]);
    await pool.end(); return;
  }

  // Insérer depuis fichier JSON
  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ Fichier introuvable : ${filePath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`  ❌ JSON invalide : ${e.message}`);
    process.exit(1);
  }

  await insertArticle(data);
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
