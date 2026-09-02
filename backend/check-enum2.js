require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
(async () => {
  const r = await query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='product_type' ORDER BY enumsortorder");
  console.log('Types:', r.rows.map(x => x.enumlabel).join(', '));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
