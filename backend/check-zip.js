require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const AdmZip = require('adm-zip');
const COURS_ZIP = "C:\\Users\\33633\\Desktop\\Ressources Al Handassa\\Cours & TD\\Laboratoire\\Béton\\Cours.zip";
const TD_ZIP    = "C:\\Users\\33633\\Desktop\\Ressources Al Handassa\\Cours & TD\\Laboratoire\\Béton\\TD.zip";
console.log('=== Cours.zip entries ===');
new AdmZip(COURS_ZIP).getEntries().forEach(e => console.log(JSON.stringify(e.entryName)));
console.log('\n=== TD.zip entries ===');
new AdmZip(TD_ZIP).getEntries().forEach(e => console.log(JSON.stringify(e.entryName)));
process.exit(0);
