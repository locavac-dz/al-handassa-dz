require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const NEW_PASSWORD = 'Admin2024!';

(async () => {
  // Vérifier le nom exact de la colonne mot de passe
  const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log('Colonnes users:', cols.rows.map(c => c.column_name).join(', '));

  const passCol = cols.rows.find(c => c.column_name.toLowerCase().includes('pass') || c.column_name.toLowerCase().includes('hash'));
  if (!passCol) { console.log('❌ Colonne mot de passe introuvable'); process.exit(1); }

  console.log('Colonne utilisée:', passCol.column_name);
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  await query(`UPDATE users SET ${passCol.column_name}=$1 WHERE email='admin@handassi.dz'`, [hash]);
  console.log('✅ Mot de passe réinitialisé');
  console.log('   Email    : admin@handassi.dz');
  console.log('   Password : ' + NEW_PASSWORD);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
