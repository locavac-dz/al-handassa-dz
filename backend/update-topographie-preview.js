require('dotenv').config();
const {Pool}=require('pg');
const pool=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});

pool.query(`
  UPDATE products SET
    preview_url = '/uploads/pdfs/topographie-wm/topographie-milles-lagofun-apercu.pdf',
    updated_at  = NOW()
  WHERE slug = 'topographie-milles-lagofun-serie-complete'
  RETURNING title, preview_url
`).then(r=>{
  console.log('Mis à jour:', JSON.stringify(r.rows[0], null, 2));
  pool.end();
}).catch(e=>{console.error(e.message);pool.end();});
