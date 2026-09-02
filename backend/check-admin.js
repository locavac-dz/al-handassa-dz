require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const r = await query("SELECT id, email, role, created_at FROM users WHERE role='admin'");
  console.log('Comptes admin:');
  r.rows.forEach(x => console.log(' ', x.email, '| id:', x.id));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
