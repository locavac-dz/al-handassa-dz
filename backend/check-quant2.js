require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  // Vérifier les tags exacts de chaque type
  const r = await query(`
    SELECT type, tags FROM products
    WHERE tags @> ARRAY['Quantification']::text[] AND is_active=true
    ORDER BY type, created_at
    LIMIT 5
  `);
  r.rows.forEach(x => console.log(x.type.padEnd(12), JSON.stringify(x.tags)));

  // Est-ce que des td_pdf apparaissent quand on filtre cours_pdf + tag Quantification ?
  const test = await query(`
    SELECT COUNT(*) as n, type FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active=TRUE AND p.type='cours_pdf' AND 'Quantification' = ANY(p.tags)
    GROUP BY type
  `);
  console.log('\nFiltrage cours_pdf+Quantification:', test.rows);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
