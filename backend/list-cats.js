require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name='categories' ORDER BY ordinal_position");
  console.log('Colonnes:', cols.rows.map(x=>x.column_name).join(', '));
  const r = await query('SELECT * FROM categories ORDER BY id');
  r.rows.forEach(x => console.log(JSON.stringify(x)));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
