// Génère des secrets aléatoires pour .env / variables Railway. À lancer sur VOTRE machine :
//   node backend/generate-secrets.js
// Les valeurs s'affichent une seule fois dans votre terminal : ne les collez ni dans un chat, ni dans Git.
const crypto = require('crypto');
const secret = () => crypto.randomBytes(48).toString('base64url');   // 64 caractères

console.log('# Collez ces lignes dans les variables d\'environnement de production (Railway / .env), puis redéployez.');
console.log('# JWT_SECRET et JWT_REFRESH_SECRET : toutes les sessions en cours seront fermées.');
console.log('# LICENSE_HMAC_SECRET : les licences déjà émises restent valides (contrôlées en base).\n');
for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'LICENSE_HMAC_SECRET']) console.log(`${name}=${secret()}`);
