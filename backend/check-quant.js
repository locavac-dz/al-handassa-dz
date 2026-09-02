require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const r = await query("SELECT type, COUNT(*) as n FROM products WHERE tags @> ARRAY['Quantification']::text[] AND is_active=true GROUP BY type");
  console.log('Par type:'); r.rows.forEach(x => console.log(' ', x.type, ':', x.n));
  const all = await query("SELECT slug, type FROM products WHERE tags @> ARRAY['Quantification']::text[] AND is_active=true ORDER BY type, slug");
  console.log('\nDétail:'); all.rows.forEach(x => console.log(' ', x.type.padEnd(10), x.slug));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
