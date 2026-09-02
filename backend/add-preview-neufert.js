require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const INPUT  = path.join(__dirname, 'uploads', 'pdfs', 'ouvrages', 'neufert-7.pdf');
const OUTPUT = path.join(__dirname, 'uploads', 'pdfs', 'ouvrages', 'neufert-7-apercu.pdf');
const MAX_PAGES = 15;

async function main() {
  console.log('Chargement de Neufert 7 (282 Mo)...');
  const src = await PDFDocument.load(fs.readFileSync(INPUT), { ignoreEncryption: true });
  const total = src.getPageCount();
  console.log(`${total} pages — extraction des ${MAX_PAGES} premières...`);

  const preview = await PDFDocument.create();
  const pages = await preview.copyPages(src, [...Array(Math.min(MAX_PAGES, total)).keys()]);

  for (const page of pages) {
    preview.addPage(page);
    const { width, height } = page.getSize();
    page.drawText('AL HANDASSA.DZ', {
      x: width * 0.08, y: height * 0.45, size: 52,
      color: rgb(0.75, 0.75, 0.75), opacity: 0.15, rotate: degrees(45),
    });
    page.drawText('Al Handassa.dz — Apercu gratuit — Telechargez la version complete', {
      x: 30, y: 10, size: 7, color: rgb(0.5, 0.5, 0.5), opacity: 0.6,
    });
  }

  fs.writeFileSync(OUTPUT, await preview.save());
  const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
  console.log(`Aperçu créé : ${MAX_PAGES} pages — ${sizeMB} MB`);

  // Mettre à jour en base
  await pool.query(
    "UPDATE products SET preview_url=$1, updated_at=NOW() WHERE slug='neufert-7-1779196356909' RETURNING title",
    ['/uploads/pdfs/ouvrages/neufert-7-apercu.pdf']
  );
  console.log('Base mise à jour — preview_url ajouté.');
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
