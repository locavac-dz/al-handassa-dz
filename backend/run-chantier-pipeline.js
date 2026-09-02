/**
 * Pipeline complet Documents de Chantier :
 * 1. Vérifie que tous les PDFs sont convertis
 * 2. Ajoute le filigrane (pdf-lib)
 * 3. Seed la base de données
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pdfDir = path.join(__dirname, 'uploads', 'pdfs', 'chantier');
const docxDir = path.join(__dirname, 'uploads', 'docs', 'chantier');

const docxFiles = fs.readdirSync(docxDir).filter(f => f.endsWith('.docx'));
const pdfFiles  = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));

console.log(`📄 DOCX: ${docxFiles.length} | PDFs convertis: ${pdfFiles.length}`);

const missing = docxFiles
  .map(f => f.replace('.docx', '.pdf'))
  .filter(f => !pdfFiles.includes(f));

if (missing.length > 0) {
  console.log(`\n⚠️  PDFs manquants (${missing.length}):`);
  missing.forEach(f => console.log(`  - ${f}`));
  console.log('\nRelancez après la conversion complète.');
  process.exit(1);
}

console.log('\n✅ Tous les PDFs présents. Lancement du pipeline...\n');

// Étape 1 : Filigrane
console.log('🔒 Étape 1/2 — Ajout du filigrane...');
execSync('node add-watermark-chantier.js', { cwd: __dirname, stdio: 'inherit' });

// Étape 2 : Seed DB
console.log('\n💾 Étape 2/2 — Insertion en base de données...');
execSync('node seed-chantier.js', { cwd: __dirname, stdio: 'inherit' });

console.log('\n🎉 Pipeline terminé ! Les documents de chantier sont disponibles dans le catalogue.');
