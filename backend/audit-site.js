require('dotenv').config();
const {Pool}=require('pg');
const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

async function main(){
  // Utilisateurs
  const users = await p.query('SELECT COUNT(*) as n FROM users');
  console.log('Utilisateurs inscrits:', users.rows[0].n);

  // Colonnes users
  const ucols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log('Colonnes users:', ucols.rows.map(r=>r.column_name).join(', '));

  // Produits payants sans fichier
  const nofile = await p.query("SELECT type, COUNT(*) as n FROM products WHERE file_url IS NULL AND is_free=false AND is_active=true GROUP BY type");
  console.log('\nProduits payants SANS fichier livrable:');
  nofile.rows.forEach(r=>console.log(' -', r.type+':', r.n));

  // Produits sans aperçu
  const noprev = await p.query("SELECT title, type FROM products WHERE preview_url IS NULL AND type IN ('ouvrage','document_word') AND is_active=true ORDER BY type");
  console.log('\nProduits ouvrage/word SANS aperçu:');
  noprev.rows.forEach(r=>console.log(' -', '['+r.type+']', r.title));

  // Paiement
  const payCols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
  console.log('\nColonnes orders:', payCols.rows.map(r=>r.column_name).join(', '));

  // Routes backend
  const fs = require('fs');
  const routes = fs.readdirSync('./src/routes').map(f=>f.replace('.js',''));
  console.log('\nRoutes backend:', routes.join(', '));

  await p.end();
}
main().catch(e=>{console.error(e.message);p.end();});
