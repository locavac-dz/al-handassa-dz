const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
