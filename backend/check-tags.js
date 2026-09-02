require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
pool.query("SELECT title, tags FROM products WHERE type='document_word' LIMIT 3").then(r=>{
  r.rows.forEach(row=>console.log(row.title,'\n  tags:',JSON.stringify(row.tags),'\n'));
  pool.end();
});
