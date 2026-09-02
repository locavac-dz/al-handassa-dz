require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const pdfDir = path.join(__dirname, 'uploads', 'pdfs', 'affiches');
const outDir = path.join(__dirname, 'uploads', 'pdfs', 'affiches-wm');
fs.mkdirSync(outDir, { recursive: true });

async function addWatermark(inputPath, outputPath) {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(inputPath));
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
  const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
  console.log(`${files.length} PDFs a traiter...`);
  let ok = 0, err = 0;
  for (const f of files) {
    try {
      await addWatermark(path.join(pdfDir, f), path.join(outDir, f));
      console.log(`OK ${f}`); ok++;
    } catch(e) { console.log(`ERR ${f}: ${e.message}`); err++; }
  }
  console.log(`\n${ok} filigranes OK | ${err} erreurs`);
}
main();
