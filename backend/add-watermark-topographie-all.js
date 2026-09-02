require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

const pdfDir = path.join(__dirname, 'uploads', 'pdfs', 'topographie');
const outDir = path.join(__dirname, 'uploads', 'pdfs', 'topographie-wm');
fs.mkdirSync(outDir, { recursive: true });

const PAGES_PER_VOLUME = 3;

const VOLUMES = [
  { file: 'Milles Lagofun 1.pdf', label: 'Volume 1 — Introduction & Généralités' },
  { file: 'ML2.pdf',  label: 'Volume 2 — Instruments de Mesure' },
  { file: 'ML3.pdf',  label: 'Volume 3 — Levés Topographiques' },
  { file: 'ML4.pdf',  label: 'Volume 4 — Planimétrie' },
  { file: 'ML5.pdf',  label: 'Volume 5 — Altimétrie & Nivellement' },
  { file: 'ML6.pdf',  label: 'Volume 6 — Triangulation' },
  { file: 'ML7.pdf',  label: 'Volume 7 — Calculs Topographiques' },
  { file: 'ML8.pdf',  label: 'Volume 8 — Topographie Appliquée' },
  { file: 'ML9.pdf',  label: 'Volume 9 — Routes & Terrassements' },
  { file: 'ML10.pdf', label: 'Volume 10 — Applications & Exercices' },
];

async function buildSommairePage(doc, volumeInfos) {
  const font      = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg   = await doc.embedFont(StandardFonts.Helvetica);
  const page      = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Fond header bleu
  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: rgb(0.106, 0.227, 0.420) });

  // Titre principal
  page.drawText('TOPOGRAPHIE', {
    x: 40, y: height - 52, size: 28, font, color: rgb(1, 1, 1),
  });
  page.drawText('Série Complète — Milles Lagofun', {
    x: 40, y: height - 80, size: 13, font: fontReg, color: rgb(0.8, 0.88, 1),
  });

  // Badge "Aperçu"
  page.drawRectangle({ x: width - 130, y: height - 72, width: 90, height: 28, color: rgb(0.98, 0.60, 0.1) });
  page.drawText('APERCU', { x: width - 115, y: height - 55, size: 11, font, color: rgb(1,1,1) });

  // Sous-titre sommaire
  page.drawText('SOMMAIRE DE LA COLLECTION', {
    x: 40, y: height - 130, size: 11, font, color: rgb(0.106, 0.227, 0.420),
  });
  page.drawLine({ start: {x:40, y:height-136}, end: {x:width-40, y:height-136}, thickness:1.5, color: rgb(0.106,0.227,0.420) });

  let y = height - 165;
  for (let i = 0; i < volumeInfos.length; i++) {
    const v = volumeInfos[i];
    const even = i % 2 === 0;

    // Fond alterné
    if (even) page.drawRectangle({ x: 35, y: y - 6, width: width - 70, height: 30, color: rgb(0.95, 0.97, 1) });

    // Numéro cercle
    page.drawCircle({ x: 60, y: y + 10, size: 11, color: rgb(0.106, 0.227, 0.420) });
    page.drawText(String(i + 1), {
      x: i < 9 ? 55 : 52, y: y + 5, size: 10, font, color: rgb(1, 1, 1),
    });

    // Label volume
    page.drawText(v.label, { x: 80, y: y + 5, size: 11, font: fontReg, color: rgb(0.1, 0.1, 0.1) });

    // Pages
    const pagesText = `${v.totalPages} pages`;
    const tw = fontReg.widthOfTextAtSize(pagesText, 10);
    page.drawText(pagesText, { x: width - 50 - tw, y: y + 5, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5) });

    // Ligne pointillée
    page.drawLine({
      start: { x: 80 + fontReg.widthOfTextAtSize(v.label, 11) + 6, y: y + 9 },
      end:   { x: width - 55 - tw, y: y + 9 },
      thickness: 0.4, color: rgb(0.8, 0.8, 0.8), dashArray: [2, 3],
    });

    y -= 34;
  }

  // Note bas de page
  const totalPages = volumeInfos.reduce((s, v) => s + v.totalPages, 0);
  page.drawLine({ start:{x:40,y:110}, end:{x:width-40,y:110}, thickness:0.5, color:rgb(0.8,0.8,0.8) });
  page.drawText(`Collection complète : ${volumeInfos.length} volumes — ${totalPages} pages au total`, {
    x: 40, y: 92, size: 10, font, color: rgb(0.106, 0.227, 0.420),
  });
  page.drawText('Cet aperçu contient 3 pages par volume. Téléchargez la collection complète sur Al Handassa.dz', {
    x: 40, y: 72, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5),
  });

  // Filigrane léger
  page.drawText('AL HANDASSA.DZ', {
    x: width * 0.08, y: height * 0.45, size: 52,
    color: rgb(0.75, 0.75, 0.75), opacity: 0.08, rotate: degrees(45),
  });

  return page;
}

async function watermarkPage(page, volLabel, pageNum, totalVol) {
  const { width, height } = page.getSize();
  page.drawText('AL HANDASSA.DZ', {
    x: width * 0.08, y: height * 0.45, size: 52,
    color: rgb(0.75, 0.75, 0.75), opacity: 0.22, rotate: degrees(45),
  });
  page.drawText('DOCUMENT PROTEGE', {
    x: width * 0.05, y: height * 0.28, size: 30,
    color: rgb(0.75, 0.75, 0.75), opacity: 0.22, rotate: degrees(45),
  });
  page.drawText(`Al Handassa.dz — ${volLabel} — Page ${pageNum}/${totalVol} — Telechargement complet apres achat`, {
    x: 30, y: 10, size: 7, color: rgb(0.5, 0.5, 0.5), opacity: 0.7,
  });
}

async function main() {
  const merged = await PDFDocument.create();

  // 1. Collecter les infos de chaque volume
  const volumeInfos = [];
  for (const v of VOLUMES) {
    const filePath = path.join(pdfDir, v.file);
    if (!fs.existsSync(filePath)) { volumeInfos.push({ ...v, totalPages: 0, exists: false }); continue; }
    const srcDoc = await PDFDocument.load(fs.readFileSync(filePath), { ignoreEncryption: true });
    volumeInfos.push({ ...v, totalPages: srcDoc.getPageCount(), exists: true });
  }

  // 2. Page de sommaire (en premier)
  await buildSommairePage(merged, volumeInfos.filter(v => v.exists));

  // 3. Pages de chaque volume
  for (let i = 0; i < VOLUMES.length; i++) {
    const v = volumeInfos[i];
    if (!v.exists) { console.log(`SKIP: ${v.file}`); continue; }

    const filePath = path.join(pdfDir, v.file);
    const srcDoc = await PDFDocument.load(fs.readFileSync(filePath), { ignoreEncryption: true });
    const pagesToCopy = Math.min(PAGES_PER_VOLUME, v.totalPages);
    const copied = await merged.copyPages(srcDoc, [...Array(pagesToCopy).keys()]);

    for (let j = 0; j < copied.length; j++) {
      const page = merged.addPage(copied[j]);
      await watermarkPage(page, v.label, j + 1, v.totalPages);
    }
    console.log(`OK ${v.label} (${pagesToCopy}/${v.totalPages} pages)`);
  }

  const outPath = path.join(outDir, 'topographie-milles-lagofun-apercu.pdf');
  fs.writeFileSync(outPath, await merged.save());
  const total = merged.getPageCount();
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`\nApercu : ${total} pages (1 sommaire + 30 contenu) — ${sizeMB} MB`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
