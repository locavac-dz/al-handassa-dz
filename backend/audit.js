require('dotenv').config();
const {Pool}=require('pg');
const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
Promise.all([
  p.query('SELECT COUNT(*) FROM products WHERE price=0'),
  p.query('SELECT type, COUNT(*) as nb FROM products GROUP BY type ORDER BY nb DESC'),
  p.query('SELECT source, COUNT(*) as nb FROM videos GROUP BY source ORDER BY nb DESC LIMIT 15'),
  p.query('SELECT COUNT(*) FROM orders'),
  p.query('SELECT COUNT(*) FROM newsletter_subscribers'),
  p.query('SELECT COUNT(*) FROM videos WHERE thumbnail_url IS NULL AND video_url NOT ILIKE \'%youtube%\''),
  p.query('SELECT COUNT(*) FROM products WHERE thumbnail_url IS NULL OR thumbnail_url=\'\''),
]).then(([pf,pt,vs,o,nl,vnt,pnt])=>{
  console.log('=== AUDIT SITE AL HANDASSA.DZ ===');
  console.log('\nProduits gratuits (price=0):', pf.rows[0].count);
  console.log('\nTypes de produits:');
  pt.rows.forEach(r=>console.log(' -', r.type, ':', r.nb));
  console.log('\nSources vidéos:');
  vs.rows.forEach(r=>console.log(' -', r.source || '(sans source)', ':', r.nb));
  console.log('\nCommandes passées:', o.rows[0].count);
  console.log('Abonnés newsletter:', nl.rows[0].count);
  console.log('Vidéos sans miniature (non-YouTube):', vnt.rows[0].count);
  console.log('Produits sans image:', pnt.rows[0].count);
  p.end();
}).catch(e=>{console.error(e.message);p.end();});
