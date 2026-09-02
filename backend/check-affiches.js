require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
pool.query("SELECT p.title, c.slug as cat FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE c.slug='securite' ORDER BY p.title").then(r=>{
  console.log(r.rows.length + ' affiches:');
  r.rows.forEach(x=>console.log(' -', x.title));
  pool.end();
}).catch(e=>{console.error(e.message);pool.end();});
