#!/usr/bin/env node
/**
 * backup.js — sauvegarde de la base PostgreSQL + des fichiers déposés (uploads/), et test de restauration.
 *
 *   node backup.js run                          sauvegarde (à planifier chaque nuit)
 *   node backup.js verify [--strict] [--dump f]  restaure la dernière sauvegarde dans une base TEMPORAIRE, compare avec
 *                                                la base réelle, vérifie l'instantané des uploads, puis supprime la base
 *                                                temporaire (à planifier chaque semaine : une sauvegarde jamais restaurée
 *                                                n'est pas une sauvegarde)
 *
 * Configuration (variables d'environnement, ou backend/.env) :
 *   BACKUP_DIR                 dossier des sauvegardes, chemin absolu, HORS de uploads/ (obligatoire)
 *   DATABASE_URL | DB_*        base à sauvegarder (mêmes variables que l'application)
 *   UPLOADS_DIR                fichiers à sauvegarder (défaut backend/uploads) ; BACKUP_UPLOADS=false pour les ignorer
 *   BACKUP_KEEP_DAYS           jours de sauvegardes de base conservés (défaut 14)
 *   BACKUP_KEEP_MONTHLY        sauvegardes mensuelles conservées (défaut 12)
 *   BACKUP_KEEP_SNAPSHOTS      instantanés d'uploads conservés (défaut 7)
 *   PG_BIN                     dossier de pg_dump / pg_restore si absents du PATH
 *   HEALTHCHECK_URL            (optionnel) URL pingée en cas de succès de « run », et <URL>/fail en cas d'échec
 *                              (healthchecks.io…) : détecte aussi le cas où la sauvegarde ne tourne plus du tout
 *   HEALTHCHECK_URL_VERIFY     idem pour « verify » (contrôle distinct : autre URL)
 *
 * Disposition de BACKUP_DIR :
 *   db/db-AAAAMMJJ-HHMMSS.dump    pg_dump au format custom (pg_restore), UTC
 *   db/monthly/db-AAAAMM.dump     première sauvegarde de chaque mois
 *   uploads/AAAAMMJJ-HHMMSS/      instantané complet des uploads ; les fichiers inchangés sont des liens physiques vers
 *                                 l'instantané précédent (pas de duplication), un fichier supprimé par erreur reste
 *                                 récupérable dans les instantanés antérieurs
 *   last-success.json             résumé de la dernière sauvegarde réussie
 *
 * Les sauvegardes contiennent des données personnelles (emails, hachages de mots de passe) : dossier en 0700, et toute
 * copie hors serveur doit être chiffrée (voir deploy/README.md).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const STAMP_RE = /^\d{8}-\d{6}$/;
const DUMP_RE = /^db-(\d{8}-\d{6})\.dump$/;
const MONTHLY_RE = /^db-(\d{6})\.dump$/;
const LOCK_STALE_MS = 12 * 3600 * 1000;
// Tables comparées entre la base réelle et la base restaurée
const KEY_TABLES = ['users', 'products', 'orders', 'order_items', 'payments', 'software_licenses', 'user_downloads', 'videos', 'articles', 'companies'];

const log = (...a) => console.log('[backup]', ...a);

function intEnv(env, name, def, min = 1) {
  if (env[name] === undefined || env[name] === '') return def;
  const n = parseInt(env[name], 10);
  if (!Number.isInteger(n) || n < min) throw new Error(`${name} doit être un entier ≥ ${min} (reçu « ${env[name]} »).`);
  return n;
}

const isInside = (child, parent) => {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

/** Lit et valide la configuration. Lève une erreur explicite au moindre doute : mieux vaut refuser que sauvegarder mal. */
function loadConfig(env = process.env) {
  if (!env.BACKUP_DIR) throw new Error('BACKUP_DIR manquant : dossier des sauvegardes (chemin absolu, hors de uploads/).');
  if (!path.isAbsolute(env.BACKUP_DIR)) throw new Error(`BACKUP_DIR doit être un chemin absolu (reçu « ${env.BACKUP_DIR} »).`);
  const backupDir = path.resolve(env.BACKUP_DIR);
  if (backupDir === path.parse(backupDir).root) throw new Error('BACKUP_DIR ne peut pas être la racine du disque.');

  const withUploads = env.BACKUP_UPLOADS !== 'false';
  const uploadsDir = path.resolve(env.UPLOADS_DIR || path.join(__dirname, 'uploads'));
  // uploads/ est servi par le site : y écrire les sauvegardes les publierait ; l'inverse les ferait se sauvegarder elles-mêmes
  if (isInside(backupDir, uploadsDir) || isInside(uploadsDir, backupDir)) {
    throw new Error('BACKUP_DIR et UPLOADS_DIR ne doivent pas être imbriqués (uploads/ est un dossier servi au public).');
  }

  // Base : DATABASE_URL, sinon DB_* (comme config/database.js). Le mot de passe passe par PGPASSWORD, jamais par la ligne de commande.
  let url;
  if (env.DATABASE_URL) {
    url = new URL(env.DATABASE_URL);
  } else if (env.DB_HOST && env.DB_NAME && env.DB_USER) {
    url = new URL('postgres://placeholder');
    url.hostname = env.DB_HOST;
    if (env.DB_PORT) url.port = env.DB_PORT;
    url.username = env.DB_USER;
    url.password = env.DB_PASSWORD || '';
    url.pathname = '/' + encodeURIComponent(env.DB_NAME);
  } else {
    throw new Error('Base non configurée : DATABASE_URL, ou DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.');
  }
  const password = decodeURIComponent(url.password);
  url.password = '';

  return {
    backupDir, uploadsDir, withUploads,
    dbUrl: url.toString(),
    dbName: decodeURIComponent(url.pathname.slice(1)),
    password,
    keepDays: intEnv(env, 'BACKUP_KEEP_DAYS', 14),
    keepMonthly: intEnv(env, 'BACKUP_KEEP_MONTHLY', 12),
    keepSnapshots: intEnv(env, 'BACKUP_KEEP_SNAPSHOTS', 7),
    pgBin: env.PG_BIN || '',
    healthcheckUrl: env.HEALTHCHECK_URL || '',
    healthcheckVerifyUrl: env.HEALTHCHECK_URL_VERIFY || '',
  };
}

const withDb = (cfg, dbName) => { const u = new URL(cfg.dbUrl); u.pathname = '/' + encodeURIComponent(dbName); return u.toString(); };

function pgTool(cfg, name) {
  const exe = process.platform === 'win32' ? name + '.exe' : name;
  return cfg.pgBin ? path.join(cfg.pgBin, exe) : exe;
}

function runPg(cfg, tool, args) {
  const r = spawnSync(pgTool(cfg, tool), args, {
    env: { ...process.env, ...(cfg.password ? { PGPASSWORD: cfg.password } : {}) },
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) {
    if (r.error.code === 'ENOENT') throw new Error(`${tool} introuvable : installer le client PostgreSQL ou définir PG_BIN (dossier contenant ${tool}).`);
    throw r.error;
  }
  if (r.status !== 0) throw new Error(`${tool} a échoué (code ${r.status}) : ${(r.stderr || '').trim().split('\n').slice(-5).join(' | ')}`);
  return r.stdout;
}

/** Date UTC au format AAAAMMJJ-HHMMSS (tri alphabétique = tri chronologique). */
function stamp(date = new Date()) {
  return date.toISOString().replace(/\.\d+Z$/, '').replace(/[-:]/g, '').replace('T', '-');
}
const stampToDate = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11), +s.slice(11, 13), +s.slice(13, 15)));

const listSorted = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => re.test(n)).sort() : []);

function acquireLock(cfg) {
  const lock = path.join(cfg.backupDir, '.lock');
  try {
    fs.mkdirSync(lock);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    const age = Date.now() - fs.statSync(lock).mtimeMs;
    if (age < LOCK_STALE_MS) throw new Error(`Une sauvegarde est déjà en cours (verrou ${lock}, ${Math.round(age / 60000)} min). Rien n'a été fait.`);
    log(`verrou périmé (${Math.round(age / 3600000)} h) : supprimé`);
    fs.rmSync(lock, { recursive: true, force: true });
    fs.mkdirSync(lock);
  }
  fs.writeFileSync(path.join(lock, 'pid'), String(process.pid));
  return () => fs.rmSync(lock, { recursive: true, force: true });
}

/** pg_dump → fichier temporaire → relu par pg_restore --list → renommé. Un dump illisible n'est jamais conservé. */
function dumpDatabase(cfg, when) {
  const dir = path.join(cfg.backupDir, 'db');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const final = path.join(dir, `db-${when}.dump`);
  const tmp = path.join(dir, `.tmp-${when}.dump`);
  try {
    runPg(cfg, 'pg_dump', ['--format=custom', '--compress=6', '--no-owner', '--no-privileges', `--file=${tmp}`, `--dbname=${cfg.dbUrl}`]);
    const toc = runPg(cfg, 'pg_restore', ['--list', tmp]);
    if (!/TABLE DATA public users\b/.test(toc)) throw new Error('le dump ne contient pas les données de la table users (base vide ou mauvaise base ?).');
    fs.renameSync(tmp, final);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw new Error(`Sauvegarde de la base impossible : ${e.message}`);
  }
  return final;
}

/** Instantané des uploads : fichier identique (taille + date) au dernier instantané → lien physique, sinon copie. */
function snapshotUploads(cfg, when) {
  const root = path.join(cfg.backupDir, 'uploads');
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(cfg.uploadsDir)) throw new Error(`UPLOADS_DIR introuvable : ${cfg.uploadsDir} (BACKUP_UPLOADS=false pour ne sauvegarder que la base).`);

  const previous = listSorted(root, STAMP_RE).pop();
  const prevDir = previous ? path.join(root, previous) : null;
  const tmp = path.join(root, `.tmp-${when}`);
  const final = path.join(root, when);
  fs.rmSync(tmp, { recursive: true, force: true });

  const stats = { files: 0, linked: 0, copied: 0, vanished: 0, bytes: 0 };
  const walk = (rel) => {
    fs.mkdirSync(path.join(tmp, rel), { recursive: true, mode: 0o700 });
    for (const entry of fs.readdirSync(path.join(cfg.uploadsDir, rel), { withFileTypes: true })) {
      const r = path.join(rel, entry.name);
      if (entry.isDirectory()) { walk(r); continue; }
      if (!entry.isFile()) continue;                     // liens symboliques et fichiers spéciaux ignorés
      const src = path.join(cfg.uploadsDir, r);
      const dest = path.join(tmp, r);
      try {
        const st = fs.statSync(src);
        let done = false;
        if (prevDir) {
          const old = path.join(prevDir, r);
          try {
            const os = fs.statSync(old);
            if (os.size === st.size && Math.abs(os.mtimeMs - st.mtimeMs) < 2) { fs.linkSync(old, dest); stats.linked++; done = true; }
          } catch { /* pas dans l'instantané précédent, ou lien impossible : copie */ }
        }
        if (!done) {
          fs.copyFileSync(src, dest);
          fs.utimesSync(dest, st.atime, st.mtime);
          stats.copied++;
        }
        stats.files++;
        stats.bytes += st.size;
      } catch (e) {
        if (e.code === 'ENOENT') { stats.vanished++; continue; }   // supprimé pendant la sauvegarde
        throw e;
      }
    }
  };
  try {
    walk('');
    fs.renameSync(tmp, final);
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw new Error(`Sauvegarde des uploads impossible : ${e.message}`);
  }
  return { dir: final, ...stats };
}

/** Rétention. Ne supprime que des noms qui respectent exactement le format des sauvegardes, et jamais la plus récente. */
function prune(cfg, now = new Date()) {
  const removed = { dumps: 0, monthly: 0, snapshots: 0 };
  const dbDir = path.join(cfg.backupDir, 'db');
  const monthlyDir = path.join(dbDir, 'monthly');

  const dumps = listSorted(dbDir, DUMP_RE);
  if (dumps.length) {
    // 1re sauvegarde du mois : copie mensuelle conservée bien plus longtemps
    const month = dumps[dumps.length - 1].match(DUMP_RE)[1].slice(0, 6);
    fs.mkdirSync(monthlyDir, { recursive: true, mode: 0o700 });
    const monthly = path.join(monthlyDir, `db-${month}.dump`);
    if (!fs.existsSync(monthly)) fs.copyFileSync(path.join(dbDir, dumps[dumps.length - 1]), monthly);
  }
  const limit = now.getTime() - cfg.keepDays * 86400000;
  for (const name of dumps.slice(0, -1)) {
    if (stampToDate(name.match(DUMP_RE)[1]).getTime() < limit) { fs.rmSync(path.join(dbDir, name)); removed.dumps++; }
  }
  const monthlies = listSorted(monthlyDir, MONTHLY_RE);
  for (const name of monthlies.slice(0, Math.max(0, monthlies.length - cfg.keepMonthly))) { fs.rmSync(path.join(monthlyDir, name)); removed.monthly++; }

  const uploadsRoot = path.join(cfg.backupDir, 'uploads');
  const snaps = listSorted(uploadsRoot, STAMP_RE);
  for (const name of snaps.slice(0, Math.max(0, snaps.length - cfg.keepSnapshots))) {
    fs.rmSync(path.join(uploadsRoot, name), { recursive: true, force: true });
    removed.snapshots++;
  }
  return removed;
}

async function ping(url, suffix = '') {
  if (!url) return;
  try { await fetch(url.replace(/\/$/, '') + suffix, { signal: AbortSignal.timeout(10000) }); }
  catch (e) { log(`ping ${suffix || 'succès'} impossible : ${e.message}`); }
}

/** Sauvegarde complète. Retourne le résumé écrit dans last-success.json ; lève une erreur en cas d'échec. */
async function runBackup(cfg, now = new Date()) {
  fs.mkdirSync(cfg.backupDir, { recursive: true, mode: 0o700 });
  const release = acquireLock(cfg);
  try {
    const when = stamp(now);
    const dump = dumpDatabase(cfg, when);
    const summary = { at: now.toISOString(), dump: path.relative(cfg.backupDir, dump), dumpBytes: fs.statSync(dump).size };
    log(`base sauvegardée : ${summary.dump} (${(summary.dumpBytes / 1048576).toFixed(1)} Mo)`);

    if (cfg.withUploads) {
      const snap = snapshotUploads(cfg, when);
      Object.assign(summary, { snapshot: path.relative(cfg.backupDir, snap.dir), files: snap.files, linked: snap.linked, copied: snap.copied, vanished: snap.vanished, uploadsBytes: snap.bytes });
      log(`uploads : ${snap.files} fichiers (${snap.linked} liés, ${snap.copied} copiés${snap.vanished ? `, ${snap.vanished} disparus pendant la copie` : ''})`);
    }
    summary.removed = prune(cfg, now);
    fs.writeFileSync(path.join(cfg.backupDir, 'last-success.json'), JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    release();
  }
}

// ─── Vérification par restauration ──────────────────────────────────────────────────────────────────────────────────

function walkFiles(root) {
  const out = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(r); else if (e.isFile()) out.push(r);
    }
  };
  walk('');
  return out;
}
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/**
 * Restaure la sauvegarde dans une base temporaire et la compare à la base réelle. Retourne { ok, problems, tables, uploads }.
 * strict : les effectifs doivent être identiques (à utiliser juste après une sauvegarde, sans écriture concurrente).
 */
async function verifyBackup(cfg, { strict = false, dumpFile } = {}) {
  const { Client } = require('pg');
  const problems = [];
  const dbDir = path.join(cfg.backupDir, 'db');
  const dump = dumpFile ? path.resolve(dumpFile) : (() => { const n = listSorted(dbDir, DUMP_RE).pop(); return n && path.join(dbDir, n); })();
  if (!dump || !fs.existsSync(dump)) throw new Error(`Aucune sauvegarde de base à vérifier dans ${dbDir}.`);

  // Connexion depuis ce processus (le mot de passe n'apparaît dans aucune ligne de commande) : URL complète
  const client = (dbName) => { const u = new URL(withDb(cfg, dbName)); u.password = cfg.password; return new Client({ connectionString: u.toString() }); };
  const scratch = `restore_check_${Date.now()}_${process.pid}`;
  const report = { dump: path.basename(dump), scratch, tables: [], uploads: null, problems };

  const admin = client(cfg.dbName);
  await admin.connect();
  try {
    try {
      await admin.query(`CREATE DATABASE "${scratch}"`);
    } catch (e) {
      if (e.code === '42501') throw new Error(`Le rôle de la base n'a pas le droit de créer la base temporaire de vérification (${e.message}). Lui donner ce droit : ALTER ROLE <role> CREATEDB;`);
      throw e;
    }
    try {
      runPg(cfg, 'pg_restore', ['--no-owner', '--no-privileges', `--dbname=${withDb(cfg, scratch)}`, dump]);
    } catch (e) {
      problems.push(`restauration : ${e.message}`);
    }

    if (!problems.length) {
      const restored = client(scratch);
      await restored.connect();
      try {
        for (const table of KEY_TABLES) {
          const live = await admin.query(`SELECT to_regclass('public.${table}') AS t`);
          if (!live.rows[0].t) continue;                       // table absente de la base réelle : rien à comparer
          const inRestored = await restored.query(`SELECT to_regclass('public.${table}') AS t`);
          if (!inRestored.rows[0].t) { problems.push(`table ${table} absente de la base restaurée`); continue; }
          const a = parseInt((await admin.query(`SELECT COUNT(*) c FROM public.${table}`)).rows[0].c, 10);
          const b = parseInt((await restored.query(`SELECT COUNT(*) c FROM public.${table}`)).rows[0].c, 10);
          report.tables.push({ table, live: a, restored: b });
          if (strict && a !== b) problems.push(`${table} : ${a} ligne(s) en base, ${b} dans la sauvegarde restaurée`);
          else if (!strict && b === 0 && a > 0) problems.push(`${table} : vide dans la sauvegarde alors que la base contient ${a} ligne(s)`);
        }
      } finally {
        await restored.end();
      }
    }
  } finally {
    // La base temporaire est toujours supprimée, même en cas d'échec
    try { await admin.query(`DROP DATABASE IF EXISTS "${scratch}" WITH (FORCE)`); }
    catch { try { await admin.query(`DROP DATABASE IF EXISTS "${scratch}"`); } catch (e) { problems.push(`base temporaire ${scratch} non supprimée : ${e.message} (à supprimer à la main)`); } }
    await admin.end();
  }

  if (cfg.withUploads) {
    const root = path.join(cfg.backupDir, 'uploads');
    const snapName = listSorted(root, STAMP_RE).pop();
    if (!snapName) problems.push('aucun instantané des uploads');
    else if (!fs.existsSync(cfg.uploadsDir)) problems.push(`UPLOADS_DIR introuvable : ${cfg.uploadsDir}`);
    else {
      const snapDir = path.join(root, snapName);
      const inSnap = new Set(walkFiles(snapDir));
      const live = walkFiles(cfg.uploadsDir);
      const missing = live.filter((f) => !inSnap.has(f));
      report.uploads = { snapshot: snapName, live: live.length, snapshotFiles: inSnap.size, missing: missing.length };
      if (strict && (missing.length || inSnap.size !== live.length)) problems.push(`uploads : ${live.length} fichier(s) en ligne, ${inSnap.size} dans l'instantané (${missing.length} manquant(s))`);
      else if (!strict && live.length && missing.length > live.length * 0.05) problems.push(`uploads : ${missing.length} fichier(s) sur ${live.length} absents de l'instantané (> 5 %)`);
      // Contenu : échantillon comparé octet pour octet (via SHA-256) aux fichiers en ligne non modifiés depuis
      const sample = live.filter((f) => inSnap.has(f)).sort(() => Math.random() - 0.5).slice(0, 20);
      let compared = 0;
      for (const f of sample) {
        const a = fs.statSync(path.join(cfg.uploadsDir, f));
        const b = fs.statSync(path.join(snapDir, f));
        if (a.size !== b.size || Math.abs(a.mtimeMs - b.mtimeMs) >= 2) continue;   // modifié depuis la sauvegarde
        compared++;
        if (sha256(path.join(cfg.uploadsDir, f)) !== sha256(path.join(snapDir, f))) problems.push(`uploads : contenu différent pour ${f}`);
      }
      report.uploads.sampleCompared = compared;
    }
  }
  report.ok = problems.length === 0;
  return report;
}

// ─── Ligne de commande ──────────────────────────────────────────────────────────────────────────────────────────────

async function main(argv) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  const [command, ...rest] = argv;
  if (!['run', 'verify'].includes(command)) {
    console.error('Usage : node backup.js run | node backup.js verify [--strict] [--dump <fichier>]');
    return 2;
  }
  let cfg;
  try { cfg = loadConfig(); } catch (e) { console.error('❌', e.message); return 2; }

  try {
    if (command === 'run') {
      const s = await runBackup(cfg);
      log('✅ terminée', JSON.stringify(s.removed));
      await ping(cfg.healthcheckUrl);
      return 0;
    }
    const i = rest.indexOf('--dump');
    const report = await verifyBackup(cfg, { strict: rest.includes('--strict'), dumpFile: i >= 0 ? rest[i + 1] : undefined });
    log(`restauration de ${report.dump} dans une base temporaire (supprimée) :`);
    for (const t of report.tables) log(`  ${t.table.padEnd(18)} base ${String(t.live).padStart(7)}   sauvegarde ${String(t.restored).padStart(7)}`);
    if (report.uploads) log(`  uploads : ${report.uploads.snapshotFiles}/${report.uploads.live} fichiers dans l'instantané ${report.uploads.snapshot}, ${report.uploads.sampleCompared} contrôlés par empreinte`);
    if (!report.ok) { report.problems.forEach((p) => console.error('❌', p)); await ping(cfg.healthcheckVerifyUrl, '/fail'); return 1; }
    log('✅ sauvegarde restaurable');
    await ping(cfg.healthcheckVerifyUrl);
    return 0;
  } catch (e) {
    console.error('❌', e.message);
    await ping(command === 'run' ? cfg.healthcheckUrl : cfg.healthcheckVerifyUrl, '/fail');
    return 1;
  }
}

module.exports = { loadConfig, runBackup, verifyBackup, prune, stamp, snapshotUploads, dumpDatabase };

if (require.main === module) main(process.argv.slice(2)).then((code) => process.exit(code));
