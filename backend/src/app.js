require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// ── Routes ──
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const videoRoutes = require('./routes/videos');
const articleRoutes = require('./routes/articles');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const newsletterRoutes = require('./routes/newsletter');
const adminRoutes = require('./routes/admin');
const contactRoutes  = require('./routes/contact');
const companyRoutes  = require('./routes/companies');
const jobRoutes      = require('./routes/jobs');
const tenderRoutes       = require('./routes/tenders');
const professionalRoutes = require('./routes/professionals');
const assistantRoutes    = require('./routes/assistant');
const analyticsRoutes    = require('./routes/analytics');
const paymentsFullRoutes = require('./routes/payments-full');
const affiliateRoutes    = require('./routes/affiliate');
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');
const referralRoutes     = require('./routes/referral');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ── CORS ──
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'null', // file:// protocol (développement local)
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqué: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,   // 1000 req / 15 min par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes.' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // pas de limite en local
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Input Sanitization ──
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Sanitized input on key: ${key}`);
  }
}));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static Files (Frontend) ──
// Serve all frontend files from project root
const frontendPath = process.cwd();
app.use(express.static(frontendPath, {
  maxAge: '1h',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
    } else if (filePath.match(/\.(js|css|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for assets
    }
  }
}));

// ── Static Files (uploads) ──
// Les miniatures sont cachées 7 jours, les autres uploads 1 heure
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1h',
  etag: true,
}));

// ── Root Route (Homepage) ──
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Al Handassa.dz - Plateforme E-commerce Génie Civil</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f7fa; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #1B3A6B 0%, #2d5a8c 100%); color: white; padding: 60px 20px; text-align: center; margin-bottom: 40px; border-radius: 8px; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.2em; opacity: 0.9; }
    .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0; }
    .product { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .product h3 { color: #1B3A6B; margin-bottom: 10px; }
    .product .price { font-size: 1.5em; color: #27ae60; font-weight: bold; margin: 10px 0; }
    .product .rating { color: #f39c12; }
    .btn { display: inline-block; background: #1B3A6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    .btn:hover { background: #152d52; }
    .loading { text-align: center; padding: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Al Handassa.dz</h1>
      <p>Plateforme E-commerce Ressources Génie Civil</p>
    </div>

    <div id="products" class="products">
      <div class="loading">Chargement des produits...</div>
    </div>
  </div>

  <script>
    // Load products from API
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const html = (data.data || []).slice(0, 6).map(p => \`
          <div class="product">
            <h3>\${p.title || 'Produit'}</h3>
            <p>\${p.description || ''}</p>
            <div class="price">\${p.price || 0} DA</div>
            <div class="rating">⭐ \${p.rating_avg || 'N/A'}</div>
            <a href="/product.html?id=\${p.id}" class="btn">Voir plus</a>
          </div>
        \`).join('');
        document.getElementById('products').innerHTML = html || '<p style="grid-column: 1/-1;">Aucun produit pour le moment.</p>';
      })
      .catch(e => {
        console.error('Erreur:', e);
        document.getElementById('products').innerHTML = '<p style="grid-column: 1/-1;">Erreur lors du chargement des produits.</p>';
      });
  </script>
</body>
</html>`;
  res.send(html);
});

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Al Handassa.dz API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── Sitemap dynamique ──
app.get('/api/sitemap', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(
      `SELECT slug, updated_at FROM products WHERE is_active = TRUE ORDER BY updated_at DESC`
    );
    const base = process.env.FRONTEND_URL || 'https://handassi.dz';
    const staticUrls = [
      { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${base}/index.html`, priority: '1.0', changefreq: 'daily' },
    ];
    const productUrls = result.rows.map(p => ({
      loc: `${base}/product.html?slug=${p.slug}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
      priority: '0.8',
      changefreq: 'weekly',
    }));
    const allUrls = [...staticUrls, ...productUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><urlset/>');
  }
});

// ── Sitemap principal (racine — c'est cette URL que robots.txt déclare) ──
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const BASE = process.env.FRONTEND_URL || 'https://handassi.dz';
    const today = new Date().toISOString().slice(0, 10);

    const [products, categories, articles] = await Promise.all([
      query(`SELECT slug, type, updated_at FROM products WHERE is_active=TRUE ORDER BY updated_at DESC`),
      query(`SELECT slug FROM categories WHERE is_active=TRUE ORDER BY sort_order`),
      query(`SELECT slug, published_at FROM articles WHERE is_published=TRUE ORDER BY published_at DESC`),
    ]);

    const staticPages = [
      { loc: `${BASE}/`,             priority: '1.0', changefreq: 'daily',   lastmod: today },
      { loc: `${BASE}/index.html`,   priority: '0.9', changefreq: 'daily',   lastmod: today },
      { loc: `${BASE}/about.html`,   priority: '0.7', changefreq: 'monthly', lastmod: today },
      { loc: `${BASE}/contact.html`, priority: '0.6', changefreq: 'monthly', lastmod: today },
      { loc: `${BASE}/logiciels.html`, priority: '0.8', changefreq: 'weekly', lastmod: today },
      { loc: `${BASE}/cgu.html`,     priority: '0.3', changefreq: 'yearly',  lastmod: today },
    ];

    const catPages = categories.rows.map(c => ({
      loc: `${BASE}/index.html?category=${c.slug}`,
      priority: '0.7', changefreq: 'weekly', lastmod: today,
    }));

    const productPages = products.rows.map(p => ({
      loc: `${BASE}/product.html?slug=${p.slug}`,
      priority: '0.8', changefreq: 'monthly',
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : today,
    }));

    const articlePages = articles.rows.map(a => ({
      loc: `${BASE}/article.html?slug=${a.slug}`,
      priority: '0.7', changefreq: 'monthly',
      lastmod: a.published_at ? new Date(a.published_at).toISOString().slice(0, 10) : today,
    }));

    const allUrls = [...staticPages, ...catPages, ...productPages, ...articlePages];
    const urlNodes = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlNodes}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><urlset/>');
  }
});

// ── API Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentsFullRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics-advanced', advancedAnalyticsRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs',     jobRoutes);
app.use('/api/tenders',       tenderRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/assistant',    assistantRoutes);

// ── Niveaux d'études (public) ──
app.get('/api/study-levels', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(
      'SELECT id, slug, label_fr, label_ar, icon, color, db_value, racine FROM study_levels WHERE is_active=TRUE ORDER BY sort_order'
    );
    res.json({ data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Sitemap XML dynamique ──
app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const BASE = process.env.FRONTEND_URL || 'https://handassi.dz';

    const products = await query(
      `SELECT slug, type, updated_at FROM products WHERE is_active=TRUE ORDER BY updated_at DESC`
    );
    const categories = await query(
      `SELECT slug FROM categories WHERE is_active=TRUE ORDER BY sort_order`
    );

    const staticPages = [
      { loc: `${BASE}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${BASE}/index.html`, priority: '0.9', changefreq: 'daily' },
      { loc: `${BASE}/td.html`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${BASE}/login.html`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${BASE}/register.html`, priority: '0.5', changefreq: 'monthly' },
    ];

    const catPages = categories.rows.map(c => ({
      loc: `${BASE}/index.html?category=${c.slug}`,
      priority: '0.7',
      changefreq: 'weekly',
    }));

    const productPages = products.rows.map(p => ({
      loc: `${BASE}/product.html?slug=${p.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
    }));

    const allUrls = [...staticPages, ...catPages, ...productPages];

    const urlNodes = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start ──
async function start() {
  const dbOk = await testConnection();
  if (!dbOk && process.env.NODE_ENV === 'production') {
    console.error('Arrêt: impossible de se connecter à PostgreSQL.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 Al Handassa.dz API démarrée`);
    console.log(`   Port    : ${PORT}`);
    console.log(`   Env     : ${process.env.NODE_ENV}`);
    console.log(`   Docs    : http://localhost:${PORT}/health\n`);
  });
}

start();

module.exports = app;
