require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});
p.query("SELECT id, title, video_url, thumbnail_url, source FROM videos WHERE title ILIKE '%revit%' OR source ILIKE '%revit%' ORDER BY id DESC")
  .then(r => {
    console.log(`${r.rows.length} vidéos Revit trouvées:`);
    r.rows.forEach(v => console.log(`[${v.id}] ${v.title}\n    url: ${v.video_url}\n    thumb: ${v.thumbnail_url}\n    source: ${v.source}\n`));
    p.end();
  }).catch(e => { console.error(e.message); p.end(); });
