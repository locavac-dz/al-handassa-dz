require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
async function main() {
  const cats = await pool.query('SELECT id, slug, name_fr FROM categories ORDER BY id');
  console.log('Catégories:');
  cats.rows.forEach(r=>console.log(` ${r.id} | ${r.slug} | ${r.name_fr}`));

  // Vérifier si colonne chapters existe
  const col = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='videos' AND column_name='chapters'`);
  console.log('\nColonne chapters:', col.rows.length ? 'OUI' : 'NON');
  await pool.end();
}
main().catch(e=>{console.error(e.message);pool.end();});
