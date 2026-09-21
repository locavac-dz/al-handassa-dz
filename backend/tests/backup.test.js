const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../src/config/database');
const { loadConfig, runBackup, verifyBackup, stamp } = require('../backup');

const PFX = 'tbak';

// Ces tests ont besoin des outils du client PostgreSQL (pg_dump, pg_restore). En local, ils sont ignorés s'ils sont
// absents ; en CI leur absence est une ERREUR (sinon la sauvegarde ne serait plus jamais testée sans que personne le voie).
const pgTools = spawnSync(process.env.PG_BIN ? path.join(process.env.PG_BIN, process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump') : 'pg_dump', ['--version']);
const hasPg = !pgTools.error && pgTools.status === 0;
if (!hasPg && process.env.CI) throw new Error('pg_dump introuvable en CI : installer postgresql-client.');

const write = (file, content, mtime) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  if (mtime) fs.utimesSync(file, mtime, mtime);
};
const minutes = (base, n) => new Date(base.getTime() + n * 60000);
const ls = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []);

describe('sauvegarde : base + uploads, rétention, restauration de contrôle', { skip: !hasPg && 'client PostgreSQL absent (définir PG_BIN)' }, () => {
  let tmp, up, bk, cfg, T0;

  const config = (extra = {}) => loadConfig({ ...process.env, BACKUP_DIR: bk, UPLOADS_DIR: up, ...extra });
  // Seules les bases temporaires créées par CE processus (le nom contient son pid) : une vérification réelle en cours ailleurs ne compte pas
  const scratchDbs = async () => (await h.query(`SELECT datname FROM pg_database WHERE datname LIKE $1`, [`restore_check_%_${process.pid}`])).rows.length;

  before(async () => {
    await h.purge(PFX);
    await h.query(`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,'x','A','B')`, [`${PFX}-u1@example.com`]);
    await h.query(`INSERT INTO products (title, slug, type, price, is_active) VALUES ('P',$1,'ouvrage',100,TRUE)`, [`${PFX}-p1`]);
    T0 = new Date();
  });
  after(async () => { await h.purge(PFX); await pool.end(); });

  // Chaque test repart d'un dossier de sauvegarde et d'uploads neufs
  const fresh = () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hds-backup-'));
    up = path.join(tmp, 'uploads');
    bk = path.join(tmp, 'sauvegardes');
    const old = new Date(Date.now() - 3600000);
    write(path.join(up, 'pdfs', 'cours.pdf'), '%PDF cours', old);
    write(path.join(up, 'pdfs', 'td.pdf'), '%PDF td', old);
    write(path.join(up, 'images', 'a.jpg'), 'JPG-A', old);
    write(path.join(up, 'racine.txt'), 'racine', old);
    cfg = config();
  };

  it('sauvegarde la base et les uploads, puis la restauration de contrôle est identique (mode strict)', async () => {
    fresh();
    const s = await runBackup(cfg, T0);
    assert.match(s.dump, /db-\d{8}-\d{6}\.dump$/);
    assert.ok(s.dumpBytes > 1000);
    assert.equal(s.files, 4);
    assert.equal(s.copied, 4);
    assert.deepEqual(ls(path.join(bk, 'uploads', stamp(T0))), ['images', 'pdfs', 'racine.txt']);
    assert.equal(fs.readFileSync(path.join(bk, 'uploads', stamp(T0), 'pdfs', 'cours.pdf'), 'utf8'), '%PDF cours');
    assert.equal(ls(path.join(bk, 'db', 'monthly')).length, 1, 'copie mensuelle');
    assert.ok(fs.existsSync(path.join(bk, 'last-success.json')));
    assert.ok(!fs.existsSync(path.join(bk, '.lock')), 'verrou libéré');

    const report = await verifyBackup(cfg, { strict: true });
    assert.deepEqual(report.problems, []);
    assert.ok(report.ok);
    const users = report.tables.find((t) => t.table === 'users');
    assert.ok(users.live >= 1 && users.live === users.restored);
    assert.equal(report.uploads.snapshotFiles, 4);
    assert.equal(report.uploads.sampleCompared, 4, 'contenu comparé par empreinte');
    assert.equal(await scratchDbs(), 0, 'la base temporaire est supprimée');
  });

  it('un second instantané ne recopie pas les fichiers inchangés (liens physiques) et garde les fichiers supprimés dans l\'ancien', async () => {
    fresh();
    await runBackup(cfg, T0);
    const T1 = minutes(T0, 60);
    write(path.join(up, 'pdfs', 'td.pdf'), '%PDF td MODIFIE, plus long', new Date());   // modifié
    write(path.join(up, 'images', 'b.jpg'), 'JPG-B', new Date());                         // ajouté
    fs.rmSync(path.join(up, 'racine.txt'));                                               // supprimé « par erreur »
    const s = await runBackup(cfg, T1);

    assert.deepEqual([s.files, s.linked, s.copied], [4, 2, 2], 'cours.pdf et a.jpg liés ; td.pdf et b.jpg copiés');
    const s0 = path.join(bk, 'uploads', stamp(T0));
    const s1 = path.join(bk, 'uploads', stamp(T1));
    assert.ok(fs.statSync(path.join(s1, 'pdfs', 'cours.pdf')).nlink >= 2, 'fichier inchangé = lien physique');
    assert.equal(fs.statSync(path.join(s1, 'pdfs', 'cours.pdf')).ino, fs.statSync(path.join(s0, 'pdfs', 'cours.pdf')).ino);
    assert.equal(fs.readFileSync(path.join(s0, 'pdfs', 'td.pdf'), 'utf8'), '%PDF td', 'ancien contenu conservé dans l\'ancien instantané');
    assert.equal(fs.readFileSync(path.join(s1, 'pdfs', 'td.pdf'), 'utf8'), '%PDF td MODIFIE, plus long');
    assert.ok(fs.existsSync(path.join(s0, 'racine.txt')), 'fichier supprimé récupérable dans l\'ancien instantané');
    assert.ok(!fs.existsSync(path.join(s1, 'racine.txt')));
    assert.deepEqual((await verifyBackup(cfg, { strict: true })).problems, []);
  });

  it('la rétention supprime l\'ancien mais jamais la sauvegarde récente, ni ce qui n\'est pas une sauvegarde', async () => {
    fresh();
    const dbDir = path.join(bk, 'db');
    const monthly = path.join(dbDir, 'monthly');
    for (const n of ['db-20200101-000000.dump', 'db-20200102-000000.dump']) write(path.join(dbDir, n), 'vieux');
    for (const n of ['db-202001.dump', 'db-202002.dump', 'db-202003.dump']) write(path.join(monthly, n), 'mensuel');
    for (const n of ['20200101-000000', '20200102-000000', '20200103-000000']) write(path.join(bk, 'uploads', n, 'f.txt'), 'x');
    write(path.join(dbDir, 'notes.txt'), 'à ne pas toucher');
    write(path.join(dbDir, 'db-abc.dump'), 'nom non conforme');
    write(path.join(bk, 'uploads', 'divers', 'f.txt'), 'dossier étranger');

    const c = config({ BACKUP_KEEP_DAYS: '14', BACKUP_KEEP_MONTHLY: '2', BACKUP_KEEP_SNAPSHOTS: '2' });
    const s = await runBackup(c, T0);

    const dumps = ls(dbDir).filter((n) => /^db-\d{8}-\d{6}\.dump$/.test(n));
    assert.deepEqual(dumps, [`db-${stamp(T0)}.dump`], 'dumps de 2020 supprimés, le récent conservé');
    assert.deepEqual(ls(monthly), ['db-202003.dump', `db-${stamp(T0).slice(0, 6)}.dump`], '2 mensuelles conservées : la plus récente ancienne + celle du mois courant');
    assert.deepEqual(ls(path.join(bk, 'uploads')).filter((n) => /^\d{8}-\d{6}$/.test(n)), ['20200103-000000', stamp(T0)], '2 instantanés conservés');
    assert.ok(fs.existsSync(path.join(dbDir, 'notes.txt')) && fs.existsSync(path.join(dbDir, 'db-abc.dump')), 'fichiers étrangers intacts');
    assert.ok(fs.existsSync(path.join(bk, 'uploads', 'divers', 'f.txt')), 'dossier étranger intact');
    assert.equal(s.removed.dumps, 2);
  });

  it('refuse les configurations dangereuses', () => {
    fresh();
    const bad = (extra, re) => assert.throws(() => config(extra), re);
    bad({ BACKUP_DIR: '' }, /BACKUP_DIR manquant/);
    bad({ BACKUP_DIR: 'sauvegardes' }, /chemin absolu/);
    bad({ BACKUP_DIR: path.join(up, 'sauvegardes') }, /imbriqués/);                 // dans uploads/ : serait publié
    bad({ BACKUP_DIR: tmp }, /imbriqués/);                                          // contient uploads/ : se sauvegarderait lui-même
    bad({ BACKUP_DIR: path.parse(tmp).root }, /racine|imbriqués/);
    bad({ BACKUP_KEEP_DAYS: '0' }, /BACKUP_KEEP_DAYS/);
    bad({ BACKUP_KEEP_SNAPSHOTS: 'abc' }, /BACKUP_KEEP_SNAPSHOTS/);
    bad({ DATABASE_URL: '', DB_HOST: '', DB_NAME: '' }, /Base non configurée/);
  });

  it('le mot de passe n\'est jamais dans l\'URL passée aux outils PostgreSQL', () => {
    fresh();
    const c = config({ DATABASE_URL: 'postgres://alice:s3cr%40t@db.example:5432/ma_base' });
    assert.equal(c.password, 's3cr@t');
    assert.ok(!c.dbUrl.includes('s3cr'));
    assert.equal(c.dbName, 'ma_base');
    const c2 = config({ DATABASE_URL: '', DB_HOST: 'h', DB_PORT: '5433', DB_NAME: 'n', DB_USER: 'u', DB_PASSWORD: 'p w' });
    assert.equal(c2.password, 'p w');
    assert.match(c2.dbUrl, /^postgres:\/\/u@h:5433\/n/);
  });

  it('un verrou récent bloque la sauvegarde, un verrou périmé est nettoyé, et le verrou est toujours libéré', async () => {
    fresh();
    fs.mkdirSync(path.join(bk, '.lock'), { recursive: true });
    await assert.rejects(runBackup(cfg, T0), /déjà en cours/);
    assert.deepEqual(ls(path.join(bk, 'db')), [], 'rien n\'a été écrit');
    assert.ok(fs.existsSync(path.join(bk, '.lock')), 'le verrou d\'une autre exécution n\'est pas supprimé');

    const stale = new Date(Date.now() - 13 * 3600 * 1000);
    fs.utimesSync(path.join(bk, '.lock'), stale, stale);
    await runBackup(cfg, T0);
    assert.ok(!fs.existsSync(path.join(bk, '.lock')));
  });

  it('une base injoignable fait échouer la sauvegarde sans laisser de dump partiel ni de verrou', async () => {
    fresh();
    const c = config({ DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:1/inexistante' });
    await assert.rejects(runBackup(c, T0), /Sauvegarde de la base impossible/);
    assert.deepEqual(ls(path.join(bk, 'db')), [], 'aucun fichier (ni .tmp) laissé');
    assert.ok(!fs.existsSync(path.join(bk, '.lock')));
    assert.ok(!fs.existsSync(path.join(bk, 'last-success.json')), 'pas de faux « dernière réussite »');
  });

  it('UPLOADS_DIR introuvable est une erreur explicite, sauf BACKUP_UPLOADS=false', async () => {
    fresh();
    fs.rmSync(up, { recursive: true });
    await assert.rejects(runBackup(cfg, T0), /UPLOADS_DIR introuvable/);
    const s = await runBackup(config({ BACKUP_UPLOADS: 'false' }), minutes(T0, 1));
    assert.equal(s.snapshot, undefined);
  });

  describe('la vérification détecte une sauvegarde défectueuse', () => {
    it('dump corrompu → échec, et la base temporaire est quand même supprimée', async () => {
      fresh();
      await runBackup(cfg, T0);
      write(path.join(bk, 'db', `db-${stamp(minutes(T0, 5))}.dump`), 'ceci n\'est pas un dump PostgreSQL');
      const r = await verifyBackup(cfg);
      assert.equal(r.ok, false);
      assert.match(r.problems.join(' '), /restauration/);
      assert.equal(await scratchDbs(), 0);
    });

    it('données ajoutées après la sauvegarde : détectées en mode strict, tolérées sinon', async () => {
      fresh();
      await runBackup(cfg, T0);
      await h.query(`INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1,'x','A','B')`, [`${PFX}-u2@example.com`]);
      const strict = await verifyBackup(cfg, { strict: true });
      assert.match(strict.problems.join(' '), /users : \d+ ligne\(s\) en base, \d+ dans la sauvegarde/);
      assert.deepEqual((await verifyBackup(cfg)).problems, []);
      await h.query(`DELETE FROM users WHERE email=$1`, [`${PFX}-u2@example.com`]);
    });

    it('table vide dans la sauvegarde alors que la base contient des lignes → échec même hors mode strict', async () => {
      fresh();
      await h.query(`DELETE FROM companies WHERE slug LIKE '${PFX}-%'`);
      const before = (await h.query(`SELECT COUNT(*)::int c FROM companies`)).rows[0].c;
      await runBackup(cfg, T0);
      await h.query(`INSERT INTO companies (slug, name, is_active) VALUES ($1,'C',TRUE)`, [`${PFX}-co`]);
      const r = await verifyBackup(cfg);
      if (before === 0) assert.match(r.problems.join(' '), /companies : vide dans la sauvegarde alors que la base contient 1 ligne/);
      else assert.deepEqual(r.problems, []);
      await h.query(`DELETE FROM companies WHERE slug = $1`, [`${PFX}-co`]);
    });

    it('instantané des uploads altéré (même taille, même date) → détecté par l\'empreinte', async () => {
      fresh();
      await runBackup(cfg, T0);
      const f = path.join(bk, 'uploads', stamp(T0), 'pdfs', 'cours.pdf');
      const st = fs.statSync(f);
      fs.writeFileSync(f, '%PDF COURS'.slice(0, st.size).padEnd(st.size, 'X'));       // même taille, contenu différent
      fs.utimesSync(f, st.atime, st.mtime);
      const r = await verifyBackup(cfg);
      assert.match(r.problems.join(' '), /contenu différent pour pdfs[\\/]cours\.pdf/);
    });

    it('fichiers absents de l\'instantané → détectés en mode strict', async () => {
      fresh();
      await runBackup(cfg, T0);
      write(path.join(up, 'images', 'nouveau.jpg'), 'N', new Date());
      const r = await verifyBackup(cfg, { strict: true });
      assert.match(r.problems.join(' '), /uploads : 5 fichier\(s\) en ligne, 4 dans l'instantané \(1 manquant/);
    });

    it('aucune sauvegarde à vérifier → erreur explicite', async () => {
      fresh();
      await assert.rejects(verifyBackup(cfg), /Aucune sauvegarde de base à vérifier/);
    });
  });
});
