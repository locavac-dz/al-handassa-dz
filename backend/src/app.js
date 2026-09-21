require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { testConnection, pool } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const uploadsGuard = require('./middleware/uploadsGuard');

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
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');
const licenseRoutes      = require('./routes/licenses');

const app = express();
const PORT = process.env.PORT || 5000;

// Derrière un reverse proxy (Railway, Vercel, nginx) req.ip doit être l'IP du client et non celle du proxy,
// sinon tous les visiteurs partagent un même compteur de rate limiting. TRUST_PROXY = nombre de proxys de
// confiance devant l'app (1 par défaut en production ; ne jamais mettre `true` : X-Forwarded-For deviendrait falsifiable).
const trustProxyHops = process.env.TRUST_PROXY !== undefined
  ? parseInt(process.env.TRUST_PROXY, 10)
  : (process.env.NODE_ENV === 'production' ? 1 : 0);
if (trustProxyHops > 0) app.set('trust proxy', trustProxyHops);

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
  exposedHeaders: ['Content-Disposition'],   // nom du fichier lu par downloads.html quand front et API sont sur des origines différentes
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,   // 1000 req / 15 min par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes.' },
  // Pas de limite pour le développement local seulement : en production un proxy local ne doit pas tout exempter
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1'),
});
app.use('/api/', limiter);

// Connexion : on ne compte que les échecs (un utilisateur légitime n'est jamais bloqué par ses connexions réussies).
// Un compteur par IP ET un par adresse email (contre une attaque répartie sur plusieurs IP).
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});
const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `email:${String(req.body?.email || '').trim().toLowerCase().slice(0, 254) || req.ip}`,
  message: { error: 'Trop de tentatives pour ce compte, réessayez dans 15 minutes.' },
});
// Inscription, mots de passe, renvoi de vérification : déclenchent des emails et des écritures
const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes, réessayez dans 15 minutes.' },
});
// Paiements : créations de paiements (POST) ; le retour SATIM (GET) reste couvert par le limiteur général
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: (req) => req.method !== 'POST',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de paiement, réessayez dans quelques minutes.' },
});
// Codes prépayés : anti force brute
const prepaidLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de code, réessayez dans 15 minutes.' },
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
// Le front est servi depuis la racine du dépôt, mais UNIQUEMENT via une liste blanche :
// servir tout le dossier exposerait backend/ (code, scripts, uploads payants), .git, package.json…
const frontendPath = path.resolve(__dirname, '../..');
const FRONT_PUBLIC_DIRS = new Set(['css', 'js', 'img', 'assets', 'admin']);
const FRONT_ROOT_FILE = /^(?:[\w-]+\.html|[\w-]+\.(?:png|jpe?g|webp|gif|svg|ico)|manifest\.json|sw\.js|robots\.txt|sitemap[\w-]*\.xml)$/i;

function isPublicFrontPath(reqPath) {
  let p;
  try { p = decodeURIComponent(reqPath); } catch { return false; }
  if (p.includes('\0') || p.includes('\\')) return false;
  const parts = p.split('/').filter(Boolean);
  if (parts.some(s => s.startsWith('.'))) return false;   // dotfiles et segments ".."
  if (parts.length === 0) return true;                     // "/" → index.html
  if (parts.length === 1) return FRONT_ROOT_FILE.test(parts[0]) || FRONT_PUBLIC_DIRS.has(parts[0]);
  return FRONT_PUBLIC_DIRS.has(parts[0]);
}

const frontStatic = express.static(frontendPath, {
  maxAge: '1h',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
    } else if (filePath.match(/\.(js|css|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for assets
    }
  }
});
app.use((req, res, next) => (isPublicFrontPath(req.path) ? frontStatic(req, res, next) : next()));

// ── Static Files (uploads) ──
// Les miniatures sont cachées 7 jours, les autres uploads 1 heure
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));
// Les fichiers payants (produits, vidéos, originaux) ne sont jamais servis ici : voir middleware/uploadsGuard.js
app.use('/uploads', uploadsGuard, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1h',
  etag: true,
}));


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
app.use('/api/auth/login', loginIpLimiter, loginEmailLimiter);
app.use(['/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/resend-verification'], accountLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment/prepaid', prepaidLimiter);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics-advanced', advancedAnalyticsRoutes);
// /api/affiliate et /api/referral NON montés : leurs tables (affiliates, referral_codes, user_rewards,
// user_credits, affiliate_payouts…) n'existent dans aucune migration (les routes répondaient 500) et le code
// contient des failles de fraude (activation rejouable, points/montants négatifs, solde jamais débité,
// email des utilisateurs dans le classement public). À réécrire avant de les remonter.
app.use('/api/contact',   contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs',     jobRoutes);
app.use('/api/tenders',       tenderRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/assistant',    assistantRoutes);
app.use('/api/licenses',     licenseRoutes);

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

// ── Start (skipped on Vercel: serverless invokes the exported app directly) ──
async function start() {
  const dbOk = await testConnection();
  if (!dbOk && process.env.NODE_ENV === 'production') {
    console.error('Arrêt: impossible de se connecter à PostgreSQL.');
    process.exit(1);
  }
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Al Handassa.dz API démarrée`);
    console.log(`   Port    : ${PORT}`);
    console.log(`   Env     : ${process.env.NODE_ENV}`);
    console.log(`   Docs    : http://localhost:${PORT}/health\n`);
  });

  // Arrêt propre (Railway, pm2, Docker envoient SIGTERM) : finir les requêtes en cours, fermer le pool PostgreSQL
  const shutdown = (signal) => {
    console.log(`${signal} reçu — arrêt en cours…`);
    server.close(() => pool.end().catch(() => {}).finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();   // filet de sécurité si des connexions restent ouvertes
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Express 4 n'intercepte pas les rejets des handlers async : sans ce garde-fou, une seule promesse
// rejetée (ex. connexion PostgreSQL indisponible) arrête tout le service pour tous les utilisateurs.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.stack : reason);
});
// Exception synchrone non attrapée : l'état du processus est incertain → on journalise et on laisse
// le superviseur (pm2, Railway) relancer proprement.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack || err);
  process.exit(1);
});

if (!process.env.VERCEL) {
  start();
}

module.exports = app;
