/**
 * limit-existing-previews.js — applique la politique d'aperçu (voir src/utils/generatePreview.js) aux aperçus DÉJÀ
 * générés : pour chaque produit PAYANT dont l'aperçu est un preview_<slug>.pdf complet dans uploads/previews/,
 * tronque le PDF aux N premières pages, supprime les images des pages suivantes et met à jour preview_pages.
 *
 * Usage :
 *   node limit-existing-previews.js                       simulation (ne modifie rien)
 *   node limit-existing-previews.js --max 5               nombre de pages conservées (défaut : PREVIEW_MAX_PAGES ou 5)
 *   node limit-existing-previews.js --apply --backup-dir D:/sauvegarde-previews
 *                                                          applique ; les originaux sont copiés dans D (obligatoire,
 *                                                          dossier HORS de uploads/ : previews/ est public)
 *   --dir <dossier>                                        dossier des aperçus (défaut : backend/uploads/previews)
 *
 * Les aperçus filigranés fournis à la main (uploads/pdfs/…-wm/…) ne sont jamais touchés.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { query, pool } = require('./src/config/database');
const { defaultMaxPages } = require('./src/utils/generatePreview');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const apply = flag('--apply');
const maxPages = opt('--max') !== undefined ? parseInt(opt('--max'), 10) : defaultMaxPages();
const previewsDir = path.resolve(opt('--dir') || path.join(__dirname, 'uploads', 'previews'));
const backupDir = opt('--backup-dir') ? path.resolve(opt('--backup-dir')) : null;

async function main() {
  if (!Number.isInteger(maxPages) || maxPages < 1) throw new Error('--max doit être un entier ≥ 1.');
  if (apply) {
    if (!backupDir) throw new Error('--apply exige --backup-dir <dossier> (sauvegarde des originaux, hors de uploads/).');
    if (backupDir.startsWith(path.resolve(__dirname, 'uploads'))) throw new Error('--backup-dir ne doit pas être dans uploads/ (dossier public).');
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const { rows } = await query(
    `SELECT id, title, slug, preview_url, preview_pages
       FROM products
      WHERE is_free = FALSE AND preview_url LIKE '/uploads/previews/preview\\_%.pdf'
      ORDER BY title`);
  console.log(`${apply ? 'APPLICATION' : 'SIMULATION'} — ${rows.length} produit(s) payant(s) avec aperçu généré, limite ${maxPages} page(s).\n`);

  const stats = { truncated: 0, alreadyOk: 0, missing: 0, failed: 0 };
  for (const p of rows) {
    const file = path.join(previewsDir, path.basename(p.preview_url));
    const slugBase = path.basename(p.preview_url, '.pdf').replace(/^preview_/, '');
    if (!fs.existsSync(file)) { stats.missing++; console.log(`  ⚠️  fichier absent : ${path.basename(file)} (${p.title})`); continue; }

    let doc;
    try { doc = await PDFDocument.load(fs.readFileSync(file), { ignoreEncryption: false }); }
    catch (e) { stats.failed++; console.log(`  ❌ illisible (${e.message.slice(0, 50)}) : ${path.basename(file)}`); continue; }

    const total = doc.getPageCount();
    const images = fs.readdirSync(previewsDir).filter((f) => f.startsWith(slugBase + '_p') && /_p(\d+)\.jpg$/.test(f))
      .filter((f) => parseInt(f.match(/_p(\d+)\.jpg$/)[1], 10) > maxPages);

    if (total <= maxPages && !images.length) { stats.alreadyOk++; continue; }
    console.log(`  ${p.title} : ${total} → ${Math.min(total, maxPages)} page(s), ${images.length} image(s) à supprimer`);
    if (!apply) { stats.truncated++; continue; }

    try {
      // Sauvegarde des originaux (PDF + images) avant toute modification
      fs.copyFileSync(file, path.join(backupDir, path.basename(file)));
      images.forEach((f) => fs.copyFileSync(path.join(previewsDir, f), path.join(backupDir, f)));

      for (let i = total - 1; i >= maxPages; i--) doc.removePage(i);
      fs.writeFileSync(file, await doc.save());
      images.forEach((f) => fs.rmSync(path.join(previewsDir, f), { force: true }));
      await query('UPDATE products SET preview_pages = $1 WHERE id = $2', [Math.min(total, maxPages), p.id]);
      stats.truncated++;
    } catch (e) { stats.failed++; console.log(`  ❌ échec sur ${p.title} : ${e.message}`); }
  }

  console.log(`\nRésultat : ${stats.truncated} ${apply ? 'tronqué(s)' : 'à tronquer'}, ${stats.alreadyOk} déjà conforme(s), ${stats.missing} fichier(s) absent(s), ${stats.failed} échec(s).`);
  if (!apply && stats.truncated) console.log('Aucune modification effectuée. Relancer avec --apply --backup-dir <dossier> pour appliquer.');
}

main().then(() => pool.end()).catch(async (e) => { console.error('❌', e.message); await pool.end().catch(() => {}); process.exit(1); });
