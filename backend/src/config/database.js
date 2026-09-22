const fs = require('fs');
const { Pool } = require('pg');

// DB_SSL_CA accepte soit le certificat PEM directement (les plateformes 12-factor comme Railway autorisent des
// variables d'environnement multi-lignes), soit un CHEMIN vers un fichier .pem — pratique sur un VPS où le
// certificat est un fichier du disque. `pg` (comme le module tls de Node) attend le contenu, jamais un chemin : sans
// cette lecture, mettre un chemin dans DB_SSL_CA échouait en silence (le « certificat » était le chemin lui-même,
// texte invalide) et la connexion échouait avec une erreur TLS confuse, sans lien apparent avec la variable en cause.
function loadCa(value) {
  if (!value) return undefined;
  if (value.includes('BEGIN CERTIFICATE')) return value;
  if (fs.existsSync(value)) return fs.readFileSync(value, 'utf8');
  throw new Error(`DB_SSL_CA n'est ni un certificat PEM ni un fichier existant (« ${value.slice(0, 60)}${value.length > 60 ? '…' : ''} »).`);
}

// SSL : en production, connexion chiffrée SANS vérification du certificat (comportement historique, la plupart
// des bases hébergées présentent un certificat auto-signé). DB_SSL=strict vérifie le certificat (DB_SSL_CA pour
// une autorité privée) ; DB_SSL=false désactive SSL (base sur réseau privé). Hors production : pas de SSL.
// `env` par défaut process.env, paramétrable pour les tests (comme evaluateEnv() dans config/env.js).
function sslConfig(env = process.env) {
  const mode = env.DB_SSL;
  if (mode === 'false') return false;
  if (mode === 'strict') return { rejectUnauthorized: true, ...(env.DB_SSL_CA ? { ca: loadCa(env.DB_SSL_CA) } : {}) };
  return env.NODE_ENV === 'production' || mode === 'true' ? { rejectUnauthorized: false } : false;
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
  // Attente maximale d'une connexion (établissement SSL vers une base distante, ou file d'attente quand les 20 sont prises).
  // 2 s renvoyait des erreurs 500 dès qu'un pic ou une base lente dépassait ce délai ; DB_CONNECT_TIMEOUT_MS pour ajuster.
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 10000,
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

module.exports = { query, getClient, pool, testConnection, sslConfig };
