require('dotenv').config();
const {Pool}=require('pg');
const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
p.query("SELECT unnest(enum_range(NULL::product_type))::text as val").then(r=>{
  console.log('Types disponibles:');
  r.rows.forEach(x=>console.log(' -',x.val));
  p.end();
}).catch(e=>{
  // Fallback
  p.query("SELECT typname, enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE typname='product_type'").then(r=>{
    r.rows.forEach(x=>console.log(x.enumlabel));
    p.end();
  });
});
