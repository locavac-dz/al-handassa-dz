require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  // 1. Changer type exercices → td_pdf + s'assurer du tag Topographie
  const r = await query(`
    UPDATE products
    SET type = 'td_pdf',
        tags = CASE
          WHEN 'Topographie' = ANY(COALESCE(tags, '{}')) THEN tags
          ELSE array_append(COALESCE(tags, '{}'), 'Topographie')
        END
    WHERE type = 'exercices'
      AND slug IN (
        'td-topographie-exercice-cheminement-polygonal',
        'td-topographie-corrige-cheminement-polygonal'
      )
    RETURNING title, type, tags
  `);
  r.rows.forEach(p => console.log(`✅ [${p.type}] ${p.title}  tags: [${p.tags?.join(', ')}]`));
  console.log(`\n${r.rowCount} produit(s) mis à jour.`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
