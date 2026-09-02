require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

pool.query(`
  UPDATE products SET
    is_free    = true,
    file_url   = '/uploads/pdfs/ouvrages/neufert-7.pdf',
    preview_url = NULL,
    updated_at = NOW()
  WHERE slug = 'neufert-7-1779196356909'
  RETURNING title, is_free, file_url
`).then(r=>{
  console.log('Mis à jour:', JSON.stringify(r.rows[0], null, 2));
  pool.end();
}).catch(e=>{console.error(e.message);pool.end();});
