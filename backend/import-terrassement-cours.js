require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const AdmZip = require('adm-zip');
const path   = require('path');
const fs     = require('fs');
const { query } = require('./src/config/database');

const UPLOADS = path.join(__dirname, 'uploads/products');
fs.mkdirSync(UPLOADS, { recursive: true });

const CATEGORY_SLUG = 'terrassement';
const TAGS  = ['Terrassement'];
const PRICE = 150;
const ZIP_PATH = 'C:/Users/33633/Ressources Al Handassa/Cours & TD & TP/Terrassement/Cours.zip';

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function importZip() {
  const zip = new AdmZip(ZIP_PATH);
  const entries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.toLowerCase().endsWith('.pdf'));

  const catRes = await query('SELECT id, name_fr FROM categories WHERE slug=$1', [CATEGORY_SLUG]);
  if (!catRes.rows.length) throw new Error('Catégorie introuvable: ' + CATEGORY_SLUG);
  const catId = catRes.rows[0].id;
  console.log('Catégorie:', catRes.rows[0].name_fr);
  console.log('Fichiers trouvés:', entries.length);

  let ok = 0, skip = 0;
  for (const entry of entries) {
    const baseName = path.basename(entry.entryName);
    const title    = baseName.replace(/\.pdf$/i, '').trim();
    const fileName = `terrassement-cours-${Date.now()}-${Math.random().toString(36).slice(2,7)}.pdf`;
    const destPath = path.join(UPLOADS, fileName);

    const dup = await query('SELECT id FROM products WHERE title=$1 AND is_active=TRUE', [title]);
    if (dup.rows.length) { console.log('  SKIP (existe):', title); skip++; continue; }

    const buf = entry.getData();
    fs.writeFileSync(destPath, buf);

    const slug = slugify(title) + '-' + Date.now();
    await query(
      `INSERT INTO products (title, slug, type, category_id, is_free, price, language, tags, file_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)`,
      [title, slug, 'cours_pdf', catId, false, PRICE, 'fr', TAGS, `/uploads/products/${fileName}`]
    );
    console.log('  ✓', title);
    ok++;
    await new Promise(r => setTimeout(r, 50));
  }
  console.log(`\n✅ Terminé: ${ok} importés, ${skip} ignorés`);
}

importZip().catch(e => { console.error('❌', e.message); }).finally(() => process.exit(0));
