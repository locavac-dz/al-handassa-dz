require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  const r = await p.query("SELECT id, title, file_url, preview_url, thumbnail_url FROM products WHERE title ILIKE '%Technologie%Batiment%' OR title ILIKE '%Technologie du B%'");
  for (const row of r.rows) {
    console.log('Title:', row.title);
    console.log('file_url:', row.file_url);
    console.log('thumbnail_url:', row.thumbnail_url);
    if (row.file_url) {
      const fp = path.join(__dirname, 'uploads', row.file_url.replace('/uploads/', ''));
      const exists = fs.existsSync(fp);
      const size = exists ? fs.statSync(fp).size : 0;
      console.log('File exists:', exists, '— Size:', size, 'bytes');
    }
    console.log('---');
  }
  await p.end();
}
main().catch(e => { console.error(e.message); p.end(); });
