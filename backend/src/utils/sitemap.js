/**
 * Génération du sitemap à partir de la base — source unique pour la route GET /sitemap.xml (toujours à jour)
 * et pour backend/generate-sitemap.js (fichier statique destiné à un hébergement sans backend).
 */
const { query } = require('../config/database');

const MAX_URLS = 50000;   // limite du protocole sitemaps

// Pages statiques réellement présentes à la racine du site (les pages de compte/panier/paiement sont exclues)
const STATIC_PAGES = [
  { path: '/',                    priority: '1.0', changefreq: 'daily' },
  { path: '/td.html',             priority: '0.8', changefreq: 'weekly' },
  { path: '/logiciels.html',      priority: '0.8', changefreq: 'weekly' },
  { path: '/annuaire.html',       priority: '0.8', changefreq: 'weekly' },
  { path: '/entreprises.html',    priority: '0.8', changefreq: 'weekly' },
  { path: '/appels-offres.html',  priority: '0.8', changefreq: 'daily' },
  { path: '/recrutement.html',    priority: '0.8', changefreq: 'daily' },
  { path: '/about.html',          priority: '0.5', changefreq: 'monthly' },
  { path: '/contact.html',        priority: '0.5', changefreq: 'monthly' },
  { path: '/cgu.html',            priority: '0.3', changefreq: 'yearly' },
];

const xmlEsc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const day = (d) => (d ? new Date(d) : new Date()).toISOString().slice(0, 10);

function siteUrl() {
  // SITE_URL = domaine public du site ; jamais FRONTEND_URL (localhost en développement)
  return (process.env.SITE_URL || 'https://handassi.dz').replace(/\/$/, '');
}

async function buildSitemapXml(base = siteUrl()) {
  const [products, articles, companies] = await Promise.all([
    query(`SELECT slug, updated_at FROM products WHERE is_active = TRUE ORDER BY updated_at DESC`),
    query(`SELECT slug, COALESCE(updated_at, published_at) AS updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC`),
    query(`SELECT slug, updated_at FROM companies WHERE is_active = TRUE ORDER BY updated_at DESC`),
  ]);

  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: base + p.path, lastmod: day(), changefreq: p.changefreq, priority: p.priority })),
    ...products.rows.map((r) => ({ loc: `${base}/product.html?slug=${encodeURIComponent(r.slug)}`, lastmod: day(r.updated_at), changefreq: 'monthly', priority: '0.8' })),
    ...articles.rows.map((r) => ({ loc: `${base}/article.html?slug=${encodeURIComponent(r.slug)}`, lastmod: day(r.updated_at), changefreq: 'monthly', priority: '0.7' })),
    ...companies.rows.map((r) => ({ loc: `${base}/entreprise.html?slug=${encodeURIComponent(r.slug)}`, lastmod: day(r.updated_at), changefreq: 'monthly', priority: '0.6' })),
  ].slice(0, MAX_URLS);

  const nodes = urls.map((u) => `  <url>
    <loc>${xmlEsc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return {
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes}\n</urlset>\n`,
    counts: { static: STATIC_PAGES.length, products: products.rows.length, articles: articles.rows.length, companies: companies.rows.length, total: urls.length },
  };
}

module.exports = { buildSitemapXml, siteUrl, STATIC_PAGES };
