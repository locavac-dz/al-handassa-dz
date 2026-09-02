require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  const r = await query('SELECT COUNT(*) as total, COUNT(thumbnail_url) as with_thumb FROM products WHERE is_active=TRUE');
  console.log(`Actifs: ${r.rows[0].total} total | ${r.rows[0].with_thumb} avec thumbnail`);

  const r2 = await query(`SELECT p.id, p.title, p.type, c.slug as category_slug, p.thumbnail_url FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active=TRUE ORDER BY p.title`);

  let missing = [], small = [], ok = 0;
  for (const p of r2.rows) {
    if (!p.thumbnail_url) {
      missing.push(p);
    } else {
      const filePath = path.join(__dirname, p.thumbnail_url);
      if (!fs.existsSync(filePath)) {
        small.push({ ...p, reason: 'fichier_absent' });
      } else {
        const stat = fs.statSync(filePath);
        const isSVG = filePath.endsWith('.svg');
        if (!isSVG && stat.size < 5000) {
          small.push({ ...p, reason: `trop_petit_${Math.round(stat.size/1024)}Ko` });
        } else {
          ok++;
        }
      }
    }
  }

  console.log(`\n✅ OK: ${ok}`);
  console.log(`\n❌ Sans thumbnail_url (${missing.length}):`);
  missing.forEach(p => console.log(`  [${p.type}] ${p.title.substring(0,70)}`));
  console.log(`\n⚠️  Fichiers absents ou trop petits (${small.length}):`);
  small.forEach(p => console.log(`  [${p.reason}] [${p.type}] ${p.title.substring(0,60)}\n    → ${p.thumbnail_url}`));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
