require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
pool.query("SELECT COUNT(*) FROM products WHERE type='document_word'").then(r=>{console.log('document_word dans DB:',r.rows[0].count);pool.end()});
