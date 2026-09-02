require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

async function main() {
  // Récupérer id de la catégorie securite
  const secRes = await pool.query("SELECT id FROM categories WHERE slug='securite'");
  const secId = secRes.rows[0].id;

  // Récupérer id de la catégorie gestion-projet
  const gpRes = await pool.query("SELECT id FROM categories WHERE slug='gestion-projet'");
  const gpId = gpRes.rows[0].id;

  // Déplacer les non-affiches vers gestion-projet
  const upd = await pool.query(
    "UPDATE products SET category_id=$1 WHERE category_id=$2 AND title NOT LIKE 'Affiche%' RETURNING title",
    [gpId, secId]
  );
  console.log(`${upd.rows.length} documents deplacés vers gestion-projet:`);
  upd.rows.forEach(r => console.log(' -', r.title));

  // Vérifier ce qui reste dans securite
  const remaining = await pool.query(
    "SELECT title FROM products WHERE category_id=$1 ORDER BY title",
    [secId]
  );
  console.log(`\n${remaining.rows.length} produits restants dans securite:`);
  remaining.rows.forEach(r => console.log(' -', r.title));

  await pool.end();
}
main().catch(e=>{console.error(e.message);process.exit(1);});
