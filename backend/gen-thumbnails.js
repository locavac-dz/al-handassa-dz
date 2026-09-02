/**
 * gen-thumbnails.js
 * Génère les miniatures manquantes pour tous les produits du catalogue.
 * Utilise PyMuPDF (via gen_thumb.py) pour extraire la 1ère page des PDFs.
 *
 * Usage : node gen-thumbnails.js [--dry-run] [--force] [--limit N]
 *   --dry-run  : affiche ce qui serait fait sans rien créer
 *   --force    : régénère même les miniatures existantes
 *   --limit N  : traite seulement les N premiers produits
 */

require('dotenv').config();
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE   = process.argv.includes('--force');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT   = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1]) : 999;

const UPLOADS  = path.join(__dirname, 'uploads');
const THUMB_DIR = path.join(UPLOADS, 'images', 'thumbs');
const PY_SCRIPT = path.join(__dirname, 'src', 'utils', 'gen_thumb.py');

// Créer le dossier thumbs s'il n'existe pas
if (!DRY_RUN) fs.mkdirSync(THUMB_DIR, { recursive: true });

function generateThumb(pdfPath, outPath) {
  return new Promise((resolve, reject) => {
    execFile('python', [PY_SCRIPT, pdfPath, outPath], { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.trim() || err.message));
      resolve();
    });
  });
}

function slugToFilename(slug, id) {
  return `thumb-${slug || id}.jpg`;
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Génération des miniatures — Al Handassa.dz');
  console.log(`  Mode : ${DRY_RUN ? 'DRY RUN (aucune écriture)' : FORCE ? 'FORCE (régénération totale)' : 'Normal (manquantes seulement)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Récupérer les produits avec un fichier PDF local
  const res = await pool.query(`
    SELECT id, slug, title, type, file_url, preview_url, thumbnail_url
    FROM products
    WHERE is_active = TRUE
      AND (
        (file_url IS NOT NULL AND file_url LIKE '%.pdf')
        OR (preview_url IS NOT NULL AND preview_url LIKE '%.pdf')
      )
    ORDER BY created_at DESC
    LIMIT $1
  `, [LIMIT]);

  const products = res.rows;
  console.log(`  ${products.length} produits avec PDF trouvés\n`);

  let done = 0, skipped = 0, failed = 0, updated = 0;

  for (const p of products) {
    const filename = slugToFilename(p.slug, p.id);
    const thumbPath = path.join(THUMB_DIR, filename);
    const thumbUrl  = `/uploads/images/thumbs/${filename}`;

    // Sauter si miniature déjà existante et pas en mode force
    const thumbExists = fs.existsSync(thumbPath);
    if (thumbExists && !FORCE) {
      // Vérifier que l'URL est bien en base
      if (p.thumbnail_url !== thumbUrl) {
        if (!DRY_RUN) {
          await pool.query('UPDATE products SET thumbnail_url=$1 WHERE id=$2', [thumbUrl, p.id]);
          updated++;
          console.log(`  ↻  [DB seulement] ${p.title.substring(0,45)}`);
        }
      } else {
        skipped++;
      }
      continue;
    }

    // Trouver le PDF source (préférer preview_url allégé si dispo)
    const pdfRel = p.preview_url?.endsWith('.pdf') ? p.preview_url : p.file_url;
    if (!pdfRel) { skipped++; continue; }

    const pdfPath = path.join(UPLOADS, pdfRel.replace('/uploads/', '').replace(/^\//, ''));
    if (!fs.existsSync(pdfPath)) {
      console.log(`  ⚠  Fichier introuvable : ${pdfRel}`);
      skipped++;
      continue;
    }

    const sizeMB = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1);
    process.stdout.write(`  ⏳ [${sizeMB} MB] ${p.title.substring(0,45).padEnd(46)} `);

    if (DRY_RUN) {
      console.log('→ (dry-run)');
      done++;
      continue;
    }

    try {
      await generateThumb(pdfPath, thumbPath);
      const thumbSize = (fs.statSync(thumbPath).size / 1024).toFixed(0);
      console.log(`→ ✅ ${thumbSize} KB`);
      await pool.query(
        'UPDATE products SET thumbnail_url=$1, updated_at=NOW() WHERE id=$2',
        [thumbUrl, p.id]
      );
      done++;
      updated++;
    } catch (err) {
      console.log(`→ ❌ ${err.message.split('\n')[0]}`);
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ Générées  : ${done}`);
  console.log(`  🔄 DB maj    : ${updated}`);
  console.log(`  ⏭  Ignorées  : ${skipped}`);
  console.log(`  ❌ Échecs    : ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(e => { console.error('Erreur :', e.message); pool.end(); process.exit(1); });
