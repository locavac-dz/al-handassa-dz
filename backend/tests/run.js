// Lance les tests d'intégration un fichier après l'autre (ils partagent la même base de test).
// Liste explicite des *.test.js de ce dossier : `node --test` sans argument ramasserait aussi test-email.js (racine du
// backend, envoie un vrai email), et les motifs glob ne sont pris en charge qu'à partir de Node 21.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort().map((f) => path.join(__dirname, f));
const only = process.argv.slice(2);
const selected = only.length ? files.filter((f) => only.some((o) => path.basename(f).includes(o))) : files;
if (!selected.length) { console.error('Aucun fichier de test ne correspond à :', only.join(' ')); process.exit(1); }

const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...selected], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
