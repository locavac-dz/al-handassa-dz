/**
 * Add diagonal watermark "AL HANDASSA.DZ — DOCUMENT PROTÉGÉ" to chantier PDFs
 * Uses pdf-lib (pure JS, no external dependency needed beyond npm install pdf-lib)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const pdfDir = path.join(__dirname, 'uploads', 'pdfs', 'chantier');
const outDir = path.join(__dirname, 'uploads', 'pdfs', 'chantier-wm');
fs.mkdirSync(outDir, { recursive: true });

async function addWatermark(inputPath, outputPath) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    // Main diagonal watermark
    page.drawText('AL HANDASSA.DZ', {
      x: width * 0.08,
      y: height * 0.45,
      size: 52,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.25,
      rotate: degrees(45),
    });
    page.drawText('DOCUMENT PROTÉGÉ', {
      x: width * 0.05,
      y: height * 0.28,
      size: 30,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.25,
      rotate: degrees(45),
    });
    // Footer watermark
    page.drawText('© Al Handassa.dz — Téléchargement soumis à achat', {
      x: 40,
      y: 12,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.6,
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

async function main() {
  const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
  console.log(`📄 ${files.length} PDFs à traiter...`);
  let ok = 0, err = 0;
  for (const f of files) {
    try {
      await addWatermark(path.join(pdfDir, f), path.join(outDir, f));
      console.log(`✅ ${f}`);
      ok++;
    } catch (e) {
      console.log(`❌ ${f}: ${e.message}`);
      err++;
    }
  }
  console.log(`\n✅ ${ok} fichiers avec filigrane | ❌ ${err} erreurs`);
}

main();
