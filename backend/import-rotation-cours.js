require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const AdmZip = require('adm-zip');
const path   = require('path');
const fs     = require('fs');
const { query } = require('./src/config/database');

const UPLOADS = path.join(__dirname, 'uploads/products');
fs.mkdirSync(UPLOADS, { recursive: true });

const CATEGORY_SLUG = 'gestion-projet';
const TAGS = ['Rotation de camion'];
const PRICE = 150;

const COURS_ZIP = 'C:/Users/33633/Ressources Al Handassa/Cours & TD & TP/Rotation de camion/Cours.zip';

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function importZip(zipPath, productType) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.toLowerCase().endsWith('.pdf'));

  const catRes = await query('SELECT id, name_fr FROM categories WHERE slug=$1', [CATEGORY_SLUG]);
  if (!catRes.rows.length) throw new Error('Catégorie introuvable: ' + CATEGORY_SLUG);
  const catId = catRes.rows[0].id;
  console.log('Catégorie:', catRes.rows[0].name_fr);

  let ok = 0, skip = 0;
  for (const entry of entries) {
    const baseName = path.basename(entry.entryName);
    const title    = baseName.replace(/\.pdf$/i, '').trim();
    const fileName = `rotation-cours-${Date.now()}-${Math.random().toString(36).slice(2,7)}.pdf`;
    const destPath = path.join(UPLOADS, fileName);

    const dup = await query('SELECT id FROM products WHERE title=$1 AND is_active=TRUE', [title]);
    if (dup.rows.length) { console.log('  SKIP (existe):', title); skip++; continue; }

    const buf = entry.getData();
    fs.writeFileSync(destPath, buf);

    const slug = slugify(title) + '-' + Date.now();
    await query(
      `INSERT INTO products (title, slug, type, category_id, is_free, price, language, tags, file_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)`,
      [title, slug, productType, catId, false, PRICE, 'fr', TAGS, `/uploads/products/${fileName}`]
    );
    console.log('  ✓', title);
    ok++;
    await new Promise(r => setTimeout(r, 50));
  }
  return { ok, skip };
}

(async () => {
  try {
    console.log('\n--- Cours Rotation de camion (cours_pdf) ---');
    const r = await importZip(COURS_ZIP, 'cours_pdf');
    console.log(`\n✅ Terminé: ${r.ok} importés, ${r.skip} ignorés`);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  } finally {
    process.exit(0);
  }
})();
