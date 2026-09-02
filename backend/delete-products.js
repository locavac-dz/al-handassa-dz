require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const SLUGS = [
  'initiation-geologie-topographie-livre-complet',
];

(async () => {
  for (const slug of SLUGS) {
    const r = await query('SELECT id, title, file_url, thumbnail_url FROM products WHERE slug=$1', [slug]);
    if (!r.rows.length) { console.log('INTROUVABLE:', slug); continue; }
    const p = r.rows[0];

    // Supprimer fichiers sur disque
    for (const urlField of [p.file_url, p.thumbnail_url]) {
      if (!urlField) continue;
      const fp = path.join(__dirname, urlField);
      if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log('  fichier supprimé:', urlField); }
    }

    await query('DELETE FROM products WHERE id=$1', [p.id]);
    console.log(`✅ SUPPRIMÉ [id=${p.id}] ${p.title}`);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
