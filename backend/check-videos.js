require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

async function main() {
  // Structure de la table videos
  const cols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='videos' ORDER BY ordinal_position`);
  console.log('Colonnes videos:');
  cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));

  // Exemple de vidéo existante
  const ex = await pool.query('SELECT * FROM videos LIMIT 1');
  if (ex.rows.length) {
    console.log('\nExemple:', JSON.stringify(ex.rows[0], null, 2));
  }

  // Catégories vidéos disponibles
  const cats = await pool.query('SELECT DISTINCT category FROM videos WHERE category IS NOT NULL LIMIT 20');
  console.log('\nCatégories existantes:', cats.rows.map(r=>r.category));

  await pool.end();
}
main().catch(e=>{console.error(e.message);pool.end();});
