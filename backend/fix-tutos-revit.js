require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  // Trouver le slug
  const find = await query("SELECT id, slug, type, title FROM products WHERE title ILIKE '%revit%' OR title ILIKE '%tuto%'");
  console.log('Trouvés:');
  find.rows.forEach(p => console.log(`  [${p.type}] ${p.slug} — ${p.title}`));

  // Mettre à jour
  const r = await query(`
    UPDATE products
    SET type = 'tuto_pdf',
        tags = CASE
          WHEN 'Revit' = ANY(COALESCE(tags, '{}')) THEN tags
          ELSE array_append(COALESCE(tags, '{}'), 'Revit')
        END
    WHERE (title ILIKE '%tutos vidéos revit%' OR title ILIKE '%tutos videos revit%')
    RETURNING slug, title, type, tags
  `);
  r.rows.forEach(p => console.log(`\n✅ [${p.type}] ${p.title}  tags: [${p.tags?.join(', ')}]`));
  if (!r.rows.length) console.log('\n❌ Aucun produit mis à jour');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
