require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
pool.query("SELECT id, title, slug, type, is_free, price, file_url, preview_url FROM products WHERE title ILIKE '%neufert%'")
.then(r=>{r.rows.forEach(x=>console.log(JSON.stringify(x,null,2)));pool.end();})
.catch(e=>{console.error(e.message);pool.end();});
