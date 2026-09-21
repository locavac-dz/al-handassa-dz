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
// Les autres en-têtes Helmet (HSTS, nosniff, referrer-policy…) s'appliquent partout ; la CSP est posée séparément
// ci-dessous car elle diffère entre les pages du site et les réponses de l'API.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CSP des pages (HTML/CSS/JS du site, servis par ce même serveur) : les pages utilisent des scripts et des
// gestionnaires d'événements inline (onclick=…), Font Awesome et Chart.js depuis cdnjs, Google Fonts, et un
// <iframe> same-origin pour les aperçus PDF. L'ancienne politique (script-src-attr 'none', styles/polices 'self',
// frame-src 'none') cassait les boutons, les icônes et les aperçus dès que le front était servi par Express.
// Contrepartie assumée : 'unsafe-inline' (déjà présent pour les <script>) couvre désormais aussi les attributs
// onclick ; la protection repose sur l'échappement systématique des données (esc()), pas sur la CSP.
// Le retour vers script-src-attr 'none' passe par la migration des gestionnaires inline vers addEventListener.
const CDN = 'https://cdnjs.cloudflare.com';
const pageCsp = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", CDN],
    scriptSrcAttr: ["'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", CDN, 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", CDN, 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    mediaSrc: ["'self'", 'blob:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
  },
});
// Réponses de l'API (JSON, XML) : rien n'a à s'exécuter ni à être embarqué.
const apiCsp = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
});
app.use((req, res, next) => (req.path.startsWith('/api/') ? apiCsp(req, res, next) : pageCsp(req, res, next)));

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
const FRONT_ROOT_FILE = /^(?:[\w-]+\.html|[\w-]+\.(?:png|jpe?g|webp|gif|svg|ico)|manifest\.json|sw\.js|robots\.txt)$/i;

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
// Vérifie aussi la base : sans cela, Railway, le HEALTHCHECK Docker et un moniteur de disponibilité verraient « ok »
// alors que chaque requête échoue. 503 si la base ne répond pas (erreur ou délai HEALTH_DB_TIMEOUT_MS, défaut 3 s).
app.get('/health', async (req, res) => {
  const timeoutMs = parseInt(process.env.HEALTH_DB_TIMEOUT_MS, 10) || 3000;
  const started = Date.now();
  let timer;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`pas de réponse en ${timeoutMs} ms`)), timeoutMs); }),
    ]);
  } catch (err) {
    console.error('[health] base indisponible :', err.message);   // détail dans les journaux seulement, jamais dans la réponse
    return res.status(503).json({ status: 'error', service: 'Al Handassa.dz API', db: 'down', timestamp: new Date().toISOString() });
  } finally {
    clearTimeout(timer);
  }
  res.json({
    status: 'ok',
    service: 'Al Handassa.dz API',
    version: '1.0.0',
    db: 'ok',
    db_ms: Date.now() - started,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── Sitemap (toujours à jour, généré depuis la base — utils/sitemap.js) ──
// robots.txt déclare /sitemap.xml ; /api/sitemap.xml est conservé pour compatibilité.
async function serveSitemap(req, res, next) {
  try {
    const { xml } = await require('./utils/sitemap').buildSitemapXml();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) { next(err); }
}
app.get('/sitemap.xml', serveSitemap);
app.get('/api/sitemap.xml', serveSitemap);

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

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start (skipped on Vercel: serverless invokes the exported app directly) ──
async function start() {
  if (!require('./config/env').checkEnv()) {
    console.error("Arrêt : configuration d'environnement invalide (voir ci-dessus).");
    process.exit(1);
  }
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

// Les tests d'intégration importent l'application et l'écoutent eux-mêmes sur un port libre (tests/helpers.js).
// Pas de garde `require.main === module` : PM2 (mode cluster) charge le script via require.
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
