/**
 * seed-betonlab-dg.js
 * Crée les produits "BétonLab DG" (licences logicielles) dans la catégorie logiciels.
 * Usage : node migrations/seed-betonlab-dg.js
 *
 * Prix = tarif mensuel documenté (voir CLAUDE.md de Formulation beton Dreux-Gorisse) x durée.
 * Ajustable ensuite via le panneau admin (PATCH /api/admin/products/:id).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const DUREE_MOIS = 12;

const PRODUCTS = [
  {
    title: 'BétonLab DG — Licence Pro (12 mois)',
    slug:  'betonlab-dg-licence-pro-12-mois',
    type:  'logiciels',
    category_slug: 'logiciels',
    study_level: 'tous',
    language: 'fr',
    price: 1500 * DUREE_MOIS,
    is_free: false,
    is_featured: true,
    tags: ['BétonLab DG', 'Dreux-Gorisse', 'formulation béton', 'logiciel', 'licence'],
    description: `Licence Pro de BétonLab DG (Formulation Dreux-Gorisse Pro), pour 1 poste, valable ${DUREE_MOIS} mois à compter de l'activation.

Formulation de béton par la méthode Dreux-Gorisse, corrections d'humidité, suivi de laboratoire, export PDF/CSV/JSON, sans limite de formulations enregistrées.

La clé de licence est envoyée par email après confirmation du paiement. L'application fonctionne hors-ligne après l'activation initiale (une connexion internet est nécessaire une seule fois, au moment d'activer la clé).`,
    metadata: {
      app_slug: 'betonlab-dg',
      license_plan: 'pro',
      duration_months: DUREE_MOIS,
    },
  },
  {
    title: 'BétonLab DG — Licence Bureau / Labo (12 mois)',
    slug:  'betonlab-dg-licence-bureau-labo-12-mois',
    type:  'logiciels',
    category_slug: 'logiciels',
    study_level: 'tous',
    language: 'fr',
    price: 8000 * DUREE_MOIS,
    is_free: false,
    is_featured: true,
    tags: ['BétonLab DG', 'Dreux-Gorisse', 'formulation béton', 'logiciel', 'licence', 'entreprise'],
    description: `Licence Bureau / Labo de BétonLab DG (Formulation Dreux-Gorisse Pro), pour usage en bureau d'études ou laboratoire, valable ${DUREE_MOIS} mois à compter de l'activation.

Toutes les fonctionnalités du plan Pro, adaptée à un usage multi-utilisateurs en structure (bureau d'études, laboratoire d'essais).

La clé de licence est envoyée par email après confirmation du paiement. L'application fonctionne hors-ligne après l'activation initiale (une connexion internet est nécessaire une seule fois, au moment d'activer la clé).`,
    metadata: {
      app_slug: 'betonlab-dg',
      license_plan: 'enterprise',
      duration_months: DUREE_MOIS,
    },
  },
];

async function upsertProduct(client, product) {
  const catRes = await client.query(`SELECT id FROM categories WHERE slug = $1`, [product.category_slug]);
  if (!catRes.rows.length) throw new Error(`Catégorie "${product.category_slug}" introuvable.`);
  const categoryId = catRes.rows[0].id;

  const existing = await client.query(`SELECT id FROM products WHERE slug = $1`, [product.slug]);

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE products SET
         title=$1, description=$2, price=$3, metadata=$4, tags=$5, is_featured=$6, updated_at=NOW()
       WHERE slug=$7`,
      [
        product.title,
        product.description,
        product.price,
        JSON.stringify(product.metadata),
        product.tags,
        product.is_featured,
        product.slug,
      ]
    );
    console.log('✅ Produit mis à jour :', product.title);
  } else {
    await client.query(
      `INSERT INTO products
         (title, slug, description, type, category_id, study_level,
          price, is_free, language, tags, metadata, is_featured, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE)`,
      [
        product.title,
        product.slug,
        product.description,
        product.type,
        categoryId,
        product.study_level,
        product.price,
        product.is_free,
        product.language,
        product.tags,
        JSON.stringify(product.metadata),
        product.is_featured,
      ]
    );
    console.log('✅ Produit créé :', product.title);
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    for (const product of PRODUCTS) {
      await upsertProduct(client, product);
    }
  } catch (err) {
    console.error('❌ Erreur de seed :', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
