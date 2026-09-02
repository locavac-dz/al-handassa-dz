require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const p = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  AUDIT AL HANDASSA.DZ — État du site');
  console.log('══════════════════════════════════════════════\n');

  // ── Produits
  const prods = await p.query("SELECT COUNT(*) n FROM products WHERE is_active=TRUE");
  const noThumb = await p.query("SELECT COUNT(*) n FROM products WHERE is_active=TRUE AND thumbnail_url IS NULL");
  const noFile = await p.query("SELECT type, COUNT(*) n FROM products WHERE is_active=TRUE AND file_url IS NULL AND is_free=FALSE GROUP BY type ORDER BY n DESC");
  const noPreview = await p.query("SELECT type, COUNT(*) n FROM products WHERE is_active=TRUE AND preview_url IS NULL AND is_free=FALSE AND type NOT IN ('logiciels','document_word') GROUP BY type");
  const freeNoFile = await p.query("SELECT title, type FROM products WHERE is_active=TRUE AND file_url IS NULL AND is_free=TRUE LIMIT 10");

  console.log('── PRODUITS ──────────────────────────────────');
  console.log(`  Total actifs      : ${prods.rows[0].n}`);
  console.log(`  Sans miniature    : ${noThumb.rows[0].n}`);
  if (noFile.rows.length) {
    console.log(`  Payants sans fichier livrable :`);
    noFile.rows.forEach(r => console.log(`    - ${r.type}: ${r.n}`));
  } else {
    console.log('  Payants sans fichier : aucun ✅');
  }
  if (noPreview.rows.length) {
    console.log(`  Sans aperçu PDF :`);
    noPreview.rows.forEach(r => console.log(`    - ${r.type}: ${r.n}`));
  }
  if (freeNoFile.rows.length) {
    console.log('  Gratuits sans fichier :');
    freeNoFile.rows.forEach(r => console.log(`    - [${r.type}] ${r.title}`));
  }

  // ── Vidéos
  const vids = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE");
  const vidsNoThumb = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE AND (thumbnail_url IS NULL OR thumbnail_url='')");
  const vidsYT = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE AND video_url LIKE '%youtube%'");
  const vidsFree = await p.query("SELECT COUNT(*) n FROM videos WHERE is_active=TRUE AND is_free=TRUE");
  console.log('\n── VIDÉOS ────────────────────────────────────');
  console.log(`  Total             : ${vids.rows[0].n}`);
  console.log(`  YouTube           : ${vidsYT.rows[0].n}`);
  console.log(`  Gratuites         : ${vidsFree.rows[0].n}`);
  console.log(`  Sans miniature    : ${vidsNoThumb.rows[0].n}`);

  // ── Articles
  const arts = await p.query("SELECT COUNT(*) n FROM articles");
  const artsPublished = await p.query("SELECT COUNT(*) n FROM articles WHERE is_published=TRUE");
  console.log('\n── ARTICLES ──────────────────────────────────');
  console.log(`  Total             : ${arts.rows[0].n}`);
  console.log(`  Publiés           : ${artsPublished.rows[0].n}`);

  // ── Utilisateurs
  const users = await p.query("SELECT COUNT(*) n FROM users");
  const verified = await p.query("SELECT COUNT(*) n FROM users WHERE is_email_verified=TRUE");
  const plans = await p.query("SELECT subscription_plan, COUNT(*) n FROM users GROUP BY subscription_plan ORDER BY n DESC");
  console.log('\n── UTILISATEURS ──────────────────────────────');
  console.log(`  Inscrits          : ${users.rows[0].n}`);
  console.log(`  Emails vérifiés   : ${verified.rows[0].n}`);
  plans.rows.forEach(r => console.log(`  Plan ${(r.subscription_plan||'free').padEnd(10)}: ${r.n}`));

  // ── Commandes / Paiements
  const orders = await p.query("SELECT status, COUNT(*) n FROM orders GROUP BY status ORDER BY n DESC");
  const revenue = await p.query("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE status='paid'");
  console.log('\n── COMMANDES ─────────────────────────────────');
  orders.rows.forEach(r => console.log(`  ${r.status.padEnd(12)}: ${r.n}`));
  console.log(`  CA total          : ${Number(revenue.rows[0].total).toLocaleString('fr-DZ')} DZD`);

  // ── SMTP
  console.log('\n── EMAIL SMTP ────────────────────────────────');
  const smtpHost = process.env.SMTP_HOST || '—';
  const smtpUser = process.env.SMTP_USER || '—';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpOk = smtpPass && smtpPass !== 'VOTRE_MOT_DE_PASSE_APPLICATION_GMAIL_16_CHARS';
  console.log(`  Host              : ${smtpHost}`);
  console.log(`  User              : ${smtpUser}`);
  console.log(`  Mot de passe      : ${smtpOk ? '✅ configuré' : '❌ PLACEHOLDER non remplacé'}`);

  // ── Fichiers uploads
  const thumbDir = path.join(__dirname, 'uploads/images/thumbs');
  const thumbCount = fs.existsSync(thumbDir) ? fs.readdirSync(thumbDir).filter(f=>f.endsWith('.jpg')).length : 0;
  console.log('\n── FICHIERS ──────────────────────────────────');
  console.log(`  Miniatures        : ${thumbCount} fichiers JPG`);

  // ── Routes backend
  const routes = fs.readdirSync('./src/routes').map(f => f.replace('.js',''));
  console.log(`  Routes backend    : ${routes.join(', ')}`);

  // ── Frontend pages
  const htmlFiles = fs.readdirSync(path.join(__dirname,'..'))
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html',''));
  console.log(`  Pages HTML        : ${htmlFiles.join(', ')}`);

  // ── Résumé des manques critiques
  console.log('\n══════════════════════════════════════════════');
  console.log('  CE QUI RESTE À FAIRE');
  console.log('══════════════════════════════════════════════');

  const todos = [];

  if (!smtpOk) todos.push('🔴 SMTP : remplacer le placeholder Gmail (mot de passe app)');
  if (parseInt(artsPublished.rows[0].n) === 0) todos.push('🔴 Articles : 0 publiés — section vide sur le site');
  if (parseInt(noThumb.rows[0].n) > 0) todos.push(`🟡 Miniatures : ${noThumb.rows[0].n} produits sans thumbnail`);
  noFile.rows.forEach(r => todos.push(`🟡 Fichiers manquants : ${r.n} ${r.type} sans fichier livrable`));
  if (parseInt(vidsNoThumb.rows[0].n) > 0) todos.push(`🟡 Vidéos : ${vidsNoThumb.rows[0].n} sans miniature`);
  if (parseInt(vids.rows[0].n) < 5) todos.push(`🟡 Vidéos : seulement ${vids.rows[0].n} vidéo(s) — enrichir la vidéothèque`);
  todos.push('🟡 Page produit individuelle (product.html) — vérifier le rendu complet');
  todos.push('🟡 Admin dashboard — interface pour gérer commandes/paiements');
  todos.push('🟡 Politique RGPD / CGU / Mentions légales');
  todos.push('🟢 SEO : meta descriptions, sitemap.xml, robots.txt');
  todos.push('🟢 Domaine + HTTPS (actuellement localhost)');

  todos.forEach((t, i) => console.log(`  ${i+1}. ${t}`));
  console.log('');

  await p.end();
}

main().catch(e => { console.error(e.message); p.end(); });
