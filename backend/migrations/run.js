require('dotenv').config();
const fs = require('fs');
const path = require('path');
// Même connexion que l'application (DATABASE_URL ou DB_*, options SSL de config/database.js) : l'ancien Pool
// local ignorait DATABASE_URL et SSL, donc ne pouvait pas migrer une base hébergée (Railway).
const { pool } = require('../src/config/database');

async function migrate() {
  try {
    // schema.sql n'est pas idempotent (CREATE TYPE/CREATE TABLE sans IF NOT
    // EXISTS) — c'est un bootstrap à usage unique pour une base neuve, pas une
    // migration à ré-appliquer. On ne l'exécute que si la base est vraiment
    // vierge (table "users" absente), pour que ce script reste sûr à relancer
    // à chaque déploiement sans casser une base déjà initialisée.
    const bootstrapped = await pool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'"
    );
    if (!bootstrapped.rows.length) {
      const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      console.log('🔄 Application du schéma PostgreSQL...');
      await pool.query(sql);
      console.log('✅ Schéma appliqué avec succès !');
    } else {
      console.log('ℹ️  Base déjà initialisée — schema.sql ignoré.');
    }

    // Migrations incrémentales numérotées (020_xxx.sql, 021_xxx.sql, ...).
    // Toutes écrites en idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING),
    // donc sûres à ré-appliquer à chaque déploiement.
    const incremental = fs.readdirSync(__dirname)
      .filter(f => /^\d+_.*\.sql$/.test(f))
      .sort((a, b) => parseInt(a) - parseInt(b));

    for (const file of incremental) {
      console.log(`🔄 Application de ${file}...`);
      await pool.query(fs.readFileSync(path.join(__dirname, file), 'utf8'));
      console.log(`✅ ${file} appliqué.`);
    }

    console.log('🎉 Toutes les migrations sont appliquées.');
  } catch (err) {
    console.error('❌ Erreur de migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
