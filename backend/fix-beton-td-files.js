require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');
const TD_ZIP = "C:\\Users\\33633\\Desktop\\Ressources Al Handassa\\Cours & TD\\Laboratoire\\Béton\\TD.zip";

const TDS = [
  { entryName: 'TD/TD 1- Formulation simplifiée.pdf',   dest_name: 'labo-beton-td1-formulation-simplifiee.pdf',   slug: 'labo-beton-td1-formulation-simplifiee' },
  { entryName: 'TD/TD 2- Formulation Barron-olivier.pdf', dest_name: 'labo-beton-td2-formulation-barron-olivier.pdf', slug: 'labo-beton-td2-formulation-barron-olivier' },
];

(async () => {
  const zip = new AdmZip(TD_ZIP);

  for (const td of TDS) {
    const entry = zip.getEntry(td.entryName);
    if (!entry) { console.log(`❌ Entrée manquante: ${td.entryName}`); continue; }

    const destPath = path.join(UPLOAD_DIR, td.dest_name);
    // Extraire via getData() pour éviter tout problème de chemin
    const buf = entry.getData();
    fs.writeFileSync(destPath, buf);
    const sizeMb = parseFloat((buf.length / 1024 / 1024).toFixed(2));

    // Mettre à jour file_size_mb en base
    await query('UPDATE products SET file_size_mb=$1 WHERE slug=$2', [sizeMb, td.slug]);

    console.log(`✅ ${td.dest_name} (${sizeMb} Mo) — extrait et base mise à jour`);
  }

  // Vérifier les fichiers cours aussi
  console.log('\n--- Vérification fichiers cours ---');
  const coursList = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith('labo-beton-'));
  coursList.forEach(f => console.log(`  ${f}`));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
