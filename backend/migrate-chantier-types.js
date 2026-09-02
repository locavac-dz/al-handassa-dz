require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add document_word to product_type enum (if not exists)
    try {
      await client.query("ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'document_word'");
      console.log("✅ Type 'document_word' ajouté");
    } catch(e) { console.log('ℹ️  Type déjà présent ou erreur:', e.message); }

    await client.query('COMMIT');

    // Categories (outside transaction for enum)
    await client.query('BEGIN');
    const cats = [
      { id: 13, slug: 'gestion-projet', title_fr: 'Gestion de Projet & Chantier', title_ar: 'إدارة المشاريع والأشغال' },
      { id: 14, slug: 'securite',       title_fr: 'Sécurité & Prévention',        title_ar: 'الأمن والوقاية' },
    ];
    for (const c of cats) {
      const ex = await client.query('SELECT id FROM categories WHERE slug=$1', [c.slug]);
      if (ex.rows.length) { console.log(`⏭️  Catégorie '${c.slug}' existe déjà (id=${ex.rows[0].id})`); continue; }
      await client.query(
        'INSERT INTO categories(slug, name_fr, name_ar, is_active) VALUES($1,$2,$3,true) ON CONFLICT DO NOTHING',
        [c.slug, c.title_fr, c.title_ar]
      );
      console.log(`✅ Catégorie '${c.slug}' créée`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Migration terminée');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
