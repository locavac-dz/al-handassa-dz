/**
 * generate-sitemap.js
 * Génère sitemap.xml dans le dossier frontend à partir des produits actifs en base.
 * Usage : node generate-sitemap.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs   = require('fs');
const path = require('path');

const BASE         = 'https://handassi.dz';
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');

(async () => {
  const products   = await query(`SELECT slug, type, updated_at FROM products WHERE is_active=TRUE ORDER BY updated_at DESC`);
  const categories = await query(`SELECT slug FROM categories WHERE is_active=TRUE ORDER BY sort_order`);

  const fmt = d => d ? new Date(d).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);

  const staticPages = [
    { loc: `${BASE}/`,              priority: '1.0', changefreq: 'daily',   lastmod: fmt() },
    { loc: `${BASE}/index.html`,    priority: '0.9', changefreq: 'daily',   lastmod: fmt() },
    { loc: `${BASE}/td.html`,       priority: '0.8', changefreq: 'weekly',  lastmod: fmt() },
    { loc: `${BASE}/login.html`,    priority: '0.5', changefreq: 'monthly', lastmod: fmt() },
    { loc: `${BASE}/register.html`, priority: '0.5', changefreq: 'monthly', lastmod: fmt() },
  ];

  const catPages = categories.rows.map(c => ({
    loc: `${BASE}/index.html?category=${c.slug}`,
    priority: '0.7', changefreq: 'weekly', lastmod: fmt(),
  }));

  const productPages = products.rows.map(p => ({
    loc: `${BASE}/product.html?slug=${p.slug}`,
    priority: '0.8', changefreq: 'monthly', lastmod: fmt(p.updated_at),
  }));

  const allUrls = [...staticPages, ...catPages, ...productPages];

  const urlNodes = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Généré automatiquement le ${new Date().toLocaleString('fr-FR')} -->
  <!-- ${products.rows.length} produits · ${categories.rows.length} catégories · ${staticPages.length} pages statiques -->

${urlNodes}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');

  console.log(`✅ sitemap.xml généré — ${allUrls.length} URLs`);
  console.log(`   📄 Pages statiques : ${staticPages.length}`);
  console.log(`   📁 Catégories      : ${catPages.length}`);
  console.log(`   📦 Produits        : ${productPages.length}`);
  console.log(`   📍 Chemin          : ${SITEMAP_PATH}`);
  process.exit(0);
})().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
