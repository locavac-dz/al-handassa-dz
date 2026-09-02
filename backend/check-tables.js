require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  const t1 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='user_downloads' ORDER BY ordinal_position");
  console.log('user_downloads:', t1.rows.map(r => r.column_name).join(', '));
  const t2 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='order_items' ORDER BY ordinal_position");
  console.log('order_items:', t2.rows.map(r => r.column_name).join(', '));
  await p.end();
}
main().catch(e => { console.error(e.message); p.end(); });
