const fs   = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');

const RENAMES = [
  ['Cours 1-Formulation de beton (Dreux-Gorrise, Bolomey, Faury).pdf', 'labo-beton-cours1-formulation-dreux-gorrise-bolomey-faury.pdf'],
  ['Cours 2-Formulation de beton (Dreux).pdf',                          'labo-beton-cours2-formulation-methode-dreux.pdf'],
  ['Cours 4-Fomulation de beton (Dreux-Gorrise).pdf',                   'labo-beton-cours4-formulation-dreux-gorrise.pdf'],
  ['Cours 5- Formulation (Tableaux).pdf',                               'labo-beton-cours5-formulation-tableaux-reference.pdf'],
  ['Cours 6- Formulation (Doc Rep).pdf',                                'labo-beton-cours6-formulation-document-reponse.pdf'],
  ['Cours 7-Formulation de beton( Barron-Olivier).pdf',                 'labo-beton-cours7-formulation-barron-olivier.pdf'],
  ['Cours 8-Formulation de béton.pdf',                                  'labo-beton-cours8-formulation-beton-general.pdf'],
  ['TD 1- Formulation simplifiée.pdf',                                  null], // déjà corrigé
  ['TD 2- Formulation Barron-olivier.pdf',                              null], // déjà corrigé
];

for (const [orig, dest] of RENAMES) {
  if (!dest) continue;
  const src = path.join(UPLOAD_DIR, orig);
  const dst = path.join(UPLOAD_DIR, dest);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
    console.log(`✅ Renommé → ${dest}`);
  } else if (fs.existsSync(dst)) {
    console.log(`⏭️  Déjà OK — ${dest}`);
  } else {
    console.log(`❌ Manquant — ${orig}`);
  }
}
console.log('\nDone.');
process.exit(0);
