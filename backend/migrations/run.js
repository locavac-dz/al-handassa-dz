require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('🔄 Application du schéma PostgreSQL...');
    await pool.query(sql);
    console.log('✅ Schéma appliqué avec succès !');
    console.log('📋 Tables créées : users, products, videos, articles, orders, payments, subscriptions, ...');
  } catch (err) {
    console.error('❌ Erreur de migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
