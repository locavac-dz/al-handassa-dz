// companies.js et professionals.js écrivaient les logos/photos uploadés dans <racine du dépôt>/uploads/ au lieu
// de backend/uploads/ (un ../ de trop dans le calcul de uploadDir) : le fichier était bien reçu et redimensionné
// côté serveur, mais jamais accessible ensuite (le serveur statique sert backend/uploads/, voir CLAUDE.md).
// h.call() (tests/helpers.js) ne fait que du JSON : ces tests envoient une vraie requête multipart/form-data
// directement, comme le ferait le navigateur avec un <input type="file">.
const fs = require('fs');
const path = require('path');
const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tupl';

// JPEG 1x1 valide (nécessaire : sharp, utilisé côté serveur pour le redimensionnement, rejetterait un octet quelconque)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  'base64'
);

describe('admin : logos/photos uploadés sont écrits dans backend/uploads/ et servis (chemin corrigé)', () => {
  let ctx, admin;
  const uploadDir = path.join(__dirname, '..', 'uploads');
  // Le nom de fichier d'un logo d'entreprise est déterministe (logo-<slug>.jpg) : un fichier laissé par une
  // exécution précédente masquerait une vraie régression (le test trouverait "son" fichier même si LE CODE
  // ACTUEL ne l'a pas écrit). Chaque fichier créé est donc supprimé du disque à la fin.
  const writtenFiles = [];
  const cleanFiles = () => { writtenFiles.splice(0).forEach((f) => fs.rmSync(f, { force: true })); };

  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    await h.query(`DELETE FROM companies WHERE slug LIKE $1`, [`${PFX}-%`]);
    await h.query(`DELETE FROM professionals WHERE slug LIKE $1`, [`${PFX}-%`]);
    cleanFiles();
    admin = await h.registerUser(ctx, PFX, 'admin', { role: 'admin' });
  });
  after(async () => {
    await h.purge(PFX);
    await h.query(`DELETE FROM companies WHERE slug LIKE $1`, [`${PFX}-%`]);
    await h.query(`DELETE FROM professionals WHERE slug LIKE $1`, [`${PFX}-%`]);
    cleanFiles();
    await ctx.stop();
  });

  // Requête multipart directe (h.call() ne fait que du JSON) : reproduit exactement ce qu'envoie
  // apiUpload()/doUpload() côté admin (fetch avec un FormData, en-tête Authorization).
  const postForm = (uploadPath, fields) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      if (v instanceof Blob) fd.append(k, v, k === 'logo' || k === 'photo' ? `${k}.jpg` : k);
      else fd.append(k, v);
    }
    return fetch(ctx.base + uploadPath, { method: 'POST', headers: { Authorization: 'Bearer ' + admin.token }, body: fd })
      .then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));
  };

  it('un logo d\'entreprise uploadé se retrouve dans backend/uploads/companies/ (pas à la racine du dépôt) et se télécharge', async () => {
    const r = await postForm('/api/companies/admin', {
      name: `${PFX}-company-${Date.now()}`,   // slug (donc nom de fichier logo-<slug>.jpg) unique par exécution
      logo: new Blob([TINY_JPEG], { type: 'image/jpeg' }),
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const logoUrl = r.json.data.logo_url;
    assert.match(logoUrl, /^\/uploads\/companies\/logo-/);

    const filename = path.basename(logoUrl);
    const onDisk = path.join(uploadDir, 'companies', filename);
    writtenFiles.push(onDisk);
    assert.ok(fs.existsSync(onDisk), 'fichier absent de backend/uploads/companies/');
    assert.ok(
      !fs.existsSync(path.join(__dirname, '..', '..', 'uploads', 'companies', filename)),
      'fichier trouvé à la racine du dépôt (ancien emplacement fautif) : régression'
    );

    const dl = await fetch(ctx.base + logoUrl);
    assert.equal(dl.status, 200, 'le logo enregistré doit être servi, pas 404');
    assert.ok((await dl.arrayBuffer()).byteLength > 0, 'le fichier téléchargé ne doit pas être vide');
  });

  it('une photo de professionnel uploadée se retrouve dans backend/uploads/professionals/ et se télécharge', async () => {
    const r = await postForm('/api/professionals/admin', {
      first_name: PFX,
      last_name: 'photo',
      photo: new Blob([TINY_JPEG], { type: 'image/jpeg' }),
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const photoUrl = r.json.data.photo_url;
    assert.match(photoUrl, /^\/uploads\/professionals\/photo-/);

    const filename = path.basename(photoUrl);
    const onDisk = path.join(uploadDir, 'professionals', filename);
    writtenFiles.push(onDisk);
    assert.ok(fs.existsSync(onDisk), 'fichier absent de backend/uploads/professionals/');
    assert.ok(
      !fs.existsSync(path.join(__dirname, '..', '..', 'uploads', 'professionals', filename)),
      'fichier trouvé à la racine du dépôt (ancien emplacement fautif) : régression'
    );

    const dl = await fetch(ctx.base + photoUrl);
    assert.equal(dl.status, 200, 'la photo enregistrée doit être servie, pas 404');
  });
});
