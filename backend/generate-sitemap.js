/**
 * generate-sitemap.js
 * Écrit sitemap.xml à la racine du dépôt à partir de la base (même contenu que GET /sitemap.xml).
 * Utile uniquement si le front est servi en statique SANS le backend (le backend sert déjà un sitemap à jour).
 * Usage : node generate-sitemap.js   (SITE_URL=https://votre-domaine pour changer le domaine)
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const { buildSitemapXml, siteUrl } = require('./src/utils/sitemap');

(async () => {
  const { xml, counts } = await buildSitemapXml();
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml, 'utf8');
  console.log(`✅ sitemap.xml généré pour ${siteUrl()} — ${counts.total} URLs`);
  console.log(`   pages : ${counts.static} · produits : ${counts.products} · articles : ${counts.articles} · entreprises : ${counts.companies}`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
