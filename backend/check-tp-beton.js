const AdmZip = require('adm-zip');
const TP_ZIP = "C:\\Users\\33633\\Ressources Al Handassa\\Cours & TD & TP\\Laboratoire\\Béton\\TP.zip";
console.log('=== TP.zip entries ===');
new AdmZip(TP_ZIP).getEntries().forEach(e => {
  const mb = (e.header.size / 1024 / 1024).toFixed(2);
  console.log(`${JSON.stringify(e.entryName)}  (${mb} Mo)`);
});
process.exit(0);
