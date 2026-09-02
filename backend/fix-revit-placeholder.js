require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
p.query("DELETE FROM articles WHERE title ILIKE '%carrefour%bois%'")
  .then(r => { console.log(`✅ ${r.rowCount} article(s) supprimé(s)`); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
