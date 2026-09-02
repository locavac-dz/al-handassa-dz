require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const r = await query(`
    UPDATE products
    SET tags = array['BAC PRO', 'Organisation de chantier']
    WHERE title ILIKE '%TB Orgo%'
    RETURNING slug, title, type, tags
  `);
  r.rows.forEach(p => console.log(`✅ [${p.type}] ${p.title}  tags: [${p.tags?.join(', ')}]`));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
