// Réinitialise le mot de passe d'un compte administrateur existant.
//
// Usage (au choix, dans cet ordre de priorité) :
//   node backend/reset-admin-password.js <email> <mot_de_passe>
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node backend/reset-admin-password.js
//   printf '%s\n%s\n' "$EMAIL" "$MDP" | node backend/reset-admin-password.js     (utilisé par setup-production.sh)
//
// Aucun mot de passe n'est stocké dans ce fichier ni affiché : ce dépôt est public.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

const MIN_LENGTH = 12;

function readStdinLines() {
  if (process.stdin.isTTY) return Promise.resolve([]);
  return new Promise((resolve) => {
    const lines = [];
    const rl = readline.createInterface({ input: process.stdin });
    rl.on('line', (l) => lines.push(l.trim()));
    rl.on('close', () => resolve(lines));
  });
}

(async () => {
  let [email, password] = process.argv.slice(2);
  email = email || process.env.ADMIN_EMAIL;
  password = password || process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    const lines = await readStdinLines();
    email = email || lines[0];
    password = password || lines[1];
  }

  if (!email || !password) {
    console.error('Usage : node backend/reset-admin-password.js <email> <mot_de_passe>  (ou ADMIN_EMAIL / ADMIN_PASSWORD, ou stdin)');
    process.exit(1);
  }
  if (password.length < MIN_LENGTH) {
    console.error(`Mot de passe trop court : ${MIN_LENGTH} caractères minimum.`);
    process.exit(1);
  }

  const found = await query('SELECT id, role FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!found.rows.length) { console.error(`Aucun compte pour ${email}.`); process.exit(1); }
  if (found.rows[0].role !== 'admin') { console.error(`${email} n'est pas un compte administrateur : abandon.`); process.exit(1); }

  const hash = await bcrypt.hash(password, 12);
  // refresh_token remis à NULL : toute session ouverte avec l'ancien mot de passe est coupée au prochain refresh
  await query('UPDATE users SET password_hash = $1, refresh_token = NULL WHERE id = $2', [hash, found.rows[0].id]);
  console.log(`✅ Mot de passe de ${email} réinitialisé.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
