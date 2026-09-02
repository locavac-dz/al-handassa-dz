require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
async function main() {
  const total = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE");
  const cps = await p.query("SELECT COUNT(*) n FROM videos WHERE source='C''est pas sorcier'");
  const noThumb = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE AND (thumbnail_url IS NULL OR thumbnail_url='')");
  console.log('Total videos actives   :', total.rows[0].n);
  console.log("C'est pas sorcier      :", cps.rows[0].n);
  console.log('Sans miniature         :', noThumb.rows[0].n);
  await p.end();
}
main().catch(e => { console.error(e.message); p.end(); });
