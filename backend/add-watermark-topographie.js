require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const pdfDir = path.join(__dirname, 'uploads', 'pdfs', 'topographie');
const outDir = path.join(__dirname, 'uploads', 'pdfs', 'topographie-wm');
fs.mkdirSync(outDir, { recursive: true });

// Watermarker uniquement le tome 1 pour l'aperçu
const PREVIEW_FILE = 'Milles Lagofun 1.pdf';
const MAX_PREVIEW_PAGES = 5; // limiter à 5 pages pour l'aperçu

async function addWatermark(inputPath, outputPath, maxPages) {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(inputPath));
  const pages = pdfDoc.getPages();
  const limit = maxPages ? Math.min(maxPages, pages.length) : pages.length;

  // Supprimer les pages au-delà de la limite
  for (let i = pages.length - 1; i >= limit; i--) pdfDoc.removePage(i);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText('AL HANDASSA.DZ', {
      x: width * 0.08, y: height * 0.45, size: 52,
      color: rgb(0.75, 0.75, 0.75), opacity: 0.22, rotate: degrees(45),
    });
    page.drawText('DOCUMENT PROTEGE', {
      x: width * 0.05, y: height * 0.28, size: 30,
      color: rgb(0.75, 0.75, 0.75), opacity: 0.22, rotate: degrees(45),
    });
    page.drawText('Al Handassa.dz — Telechargement soumis a achat', {
      x: 40, y: 12, size: 8, color: rgb(0.5, 0.5, 0.5), opacity: 0.6,
    });
  }
  fs.writeFileSync(outputPath, await pdfDoc.save());
}

async function main() {
  const inputPath = path.join(pdfDir, PREVIEW_FILE);
  const outputPath = path.join(outDir, PREVIEW_FILE);
  if (!fs.existsSync(inputPath)) { console.log('Fichier non trouvé:', inputPath); return; }
  await addWatermark(inputPath, outputPath, MAX_PREVIEW_PAGES);
  console.log(`OK — aperçu filigrané (${MAX_PREVIEW_PAGES} pages): ${PREVIEW_FILE}`);
}
main().catch(e => console.error(e.message));
