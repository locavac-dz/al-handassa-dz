require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  // Trouver la catégorie topographie
  const catRes = await pool.query(
    "SELECT id, slug, name_fr FROM categories WHERE slug ILIKE '%topo%' OR name_fr ILIKE '%topo%' LIMIT 5"
  );
  console.log('Catégories topographie trouvées:');
  catRes.rows.forEach(r => console.log(' -', r.slug, ':', r.name_fr));

  if (!catRes.rows.length) {
    console.error('Aucune catégorie topographie — utilisation de la première disponible');
    const all = await pool.query("SELECT id, slug, name_fr FROM categories LIMIT 10");
    all.rows.forEach(r => console.log(' -', r.slug, ':', r.name_fr));
    await pool.end(); return;
  }

  const catId = catRes.rows[0].id;
  const catSlug = catRes.rows[0].slug;
  console.log(`\nCatégorie choisie: ${catSlug} (id=${catId})`);

  const slug = 'topographie-milles-lagofun-serie-complete';
  const previewPath = '/uploads/pdfs/topographie-wm/Milles Lagofun 1.pdf';
  const filePath    = '/uploads/docs/topographie/topographie-milles-lagofun-complet.zip';

  const exists = await pool.query("SELECT id FROM products WHERE slug=$1", [slug]);
  if (exists.rows.length) {
    await pool.query(
      "UPDATE products SET preview_url=$1, file_url=$2, updated_at=NOW() WHERE slug=$3",
      [previewPath, filePath, slug]
    );
    console.log('Produit mis à jour.'); await pool.end(); return;
  }

  await pool.query(`
    INSERT INTO products
      (title, slug, description, type, category_id, price, discount_price,
       is_free, is_active, file_url, preview_url, tags, created_at, updated_at)
    VALUES ($1,$2,$3,'ouvrage',$4,$5,NULL,false,true,$6,$7,$8,NOW(),NOW())
  `, [
    'Topographie — Série Complète Milles Lagofun (10 volumes)',
    slug,
    `Série complète de 10 volumes de topographie par Milles Lagofun.
Couvre l'ensemble des notions fondamentales et avancées de la topographie :
levés topographiques, altimétrie, planimétrie, triangulation, nivellement,
instruments de mesure, calculs topographiques, et applications pratiques
pour le génie civil et l'aménagement du territoire en Algérie.
Aperçu gratuit du tome 1 — téléchargement de la série complète après achat.`,
    catId,
    1500,
    filePath,
    previewPath,
    ['topographie', 'levé', 'altimétrie', 'planimétrie', 'nivellement', 'milles-lagofun', 'génie-civil', 'ouvrage'],
  ]);

  console.log('Produit inséré avec succès.');
  await pool.end();
}

seed().catch(e => { console.error(e.message); process.exit(1); });
