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
  // Vérifier que les fichiers existent
  const htmlPath  = path.join(__dirname, 'uploads', 'ecotec', 'index.html');
  const zipPath   = path.join(__dirname, 'uploads', 'docs', 'ecotec', 'ecotec-tableaux-excel.zip');
  if (!fs.existsSync(htmlPath)) { console.error('HTML manquant:', htmlPath); process.exit(1); }
  if (!fs.existsSync(zipPath))  { console.error('ZIP manquant:', zipPath); process.exit(1); }

  // Catégorie : gestion-projet (méthode de calcul des prix = gestion)
  const catRes = await pool.query("SELECT id FROM categories WHERE slug='gestion-projet'");
  if (!catRes.rows.length) { console.error('Catégorie gestion-projet introuvable'); process.exit(1); }
  const catId = catRes.rows[0].id;

  const slug = 'methode-calcul-prix-travaux-batiment-ecotec';
  const exists = await pool.query("SELECT id FROM products WHERE slug=$1", [slug]);
  if (exists.rows.length) { console.log('Produit déjà existant, mise à jour...');
    await pool.query(`UPDATE products SET
      preview_url='/uploads/ecotec/index.html',
      file_url='/uploads/docs/ecotec/ecotec-tableaux-excel.zip',
      updated_at=NOW() WHERE slug=$1`, [slug]);
    console.log('Mis à jour.'); await pool.end(); return;
  }

  await pool.query(`
    INSERT INTO products
      (title, slug, description, type, category_id, price, discount_price,
       is_free, is_active, file_url, preview_url, tags, created_at, updated_at)
    VALUES ($1,$2,$3,'logiciels',$4,$5,NULL,false,true,$6,$7,$8,NOW(),NOW())
  `, [
    'Méthode de Calcul des Prix — Travaux de Bâtiment (Ecotec v3.0)',
    slug,
    `Méthode de calcul des prix pour les travaux de bâtiment, éditée par Ecotec.
Version 3.0 sur CD-ROM numérisé. Comprend la méthode complète en hypertexte consultable gratuitement en ligne,
ainsi que 17 tableaux Excel de calcul de prix (déboursé sec, coefficient de vente, frais généraux, etc.)
et des exemples complets. Indispensable pour les économistes de la construction, conducteurs de travaux et BET algériens.`,
    catId,
    1200,
    '/uploads/docs/ecotec/ecotec-tableaux-excel.zip',
    '/uploads/ecotec/index.html',
    ['ecotec','calcul-prix','devis','économie-construction','tableur','excel','chantier','bâtiment','gestion-projet'],
  ]);

  console.log('Produit Ecotec inséré avec succès.');
  await pool.end();
}
seed().catch(e => { console.error(e.message); process.exit(1); });
