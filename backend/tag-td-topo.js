require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const slugs = [
    'td-topographie-exercice-cheminement-polygonal',
    'td-topographie-corrige-cheminement-polygonal',
  ];
  for (const slug of slugs) {
    const r = await query(
      `UPDATE products SET tags = array_append(COALESCE(tags, '{}'), 'Topographie')
       WHERE slug=$1 AND NOT ('Topographie' = ANY(COALESCE(tags, '{}')))
       RETURNING title`,
      [slug]
    );
    if (r.rows.length) console.log('✅ Tag ajouté —', r.rows[0].title);
    else console.log('⏭️  Déjà taguée ou introuvable —', slug);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
