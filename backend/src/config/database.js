const { Pool } = require('pg');

// SSL : en production, connexion chiffrée SANS vérification du certificat (comportement historique, la plupart
// des bases hébergées présentent un certificat auto-signé). DB_SSL=strict vérifie le certificat (DB_SSL_CA pour
// une autorité privée) ; DB_SSL=false désactive SSL (base sur réseau privé). Hors production : pas de SSL.
function sslConfig() {
  const mode = process.env.DB_SSL;
  if (mode === 'false') return false;
  if (mode === 'strict') return { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}) };
  return process.env.NODE_ENV === 'production' || mode === 'true' ? { rejectUnauthorized: false } : false;
}

// Railway/Heroku fournissent DATABASE_URL ; sinon les variables DB_* historiques.
const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...connection,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${Date.now() - start}ms — ${text.slice(0, 80)}`);
  }
  return res;
}

async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  client.query = (...args) => originalQuery(...args);
  return client;
}

async function testConnection() {
  try {
    const res = await query('SELECT NOW()');
    console.log(`✅ PostgreSQL connecté — ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ Connexion PostgreSQL échouée:', err.message);
    return false;
  }
}

module.exports = { query, getClient, pool, testConnection };
