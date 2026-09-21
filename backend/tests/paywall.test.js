const fs = require('fs');
const path = require('path');
const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createMediaToken } = require('../src/utils/mediaToken');

const PFX = 'tpw';
const UP = path.join(__dirname, '..', 'uploads');
const T = '_test_paywall';

describe('paywall : les fichiers et vidéos payants ne fuient pas', () => {
  let ctx, tokA, tokB, product, urlA;

  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    for (const d of ['pdfs', 'products', 'videos', 'previews']) fs.mkdirSync(path.join(UP, d), { recursive: true });
    fs.mkdirSync(path.join(UP, 'pdfs', T), { recursive: true });
    fs.writeFileSync(path.join(UP, 'pdfs', T, 'paid.pdf'), '%PDF-PAID-CONTENT');
    fs.writeFileSync(path.join(UP, 'pdfs', T, 'preview.pdf'), '%PDF-PREVIEW-CONTENT');
    fs.writeFileSync(path.join(UP, 'products', `${T}.jpg`), 'JPGDATA');
    fs.writeFileSync(path.join(UP, 'videos', `${T}.mp4`), Buffer.alloc(2000, 'X'));
    fs.writeFileSync(path.join(UP, 'previews', `${T}.py`), 'print(1)');

    product = await h.one(
      `INSERT INTO products (title, slug, type, price, is_free, is_active, file_url, preview_url, thumbnail_url)
       VALUES ('Paid',$1,'ouvrage',1000,FALSE,TRUE,$2,$3,$4) RETURNING id`,
      [`${PFX}-paid`, `/uploads/pdfs/${T}/paid.pdf`, `/uploads/pdfs/${T}/preview.pdf`, `/uploads/products/${T}.jpg`]);
    const vid = (slug, url, free) => h.query(
      `INSERT INTO videos (title, slug, video_url, price, is_free, is_active, published_at) VALUES ($1,$1,$2,$3,$4,TRUE,NOW())`,
      [`${PFX}-${slug}`, url, free ? 0 : 500, free]);
    await vid('v-paid-local', `/uploads/videos/${T}.mp4`, false);
    await vid('v-free-local', `/uploads/videos/${T}.mp4`, true);
    await vid('v-paid-yt', 'https://youtu.be/PAIDSECRET1', false);
    await vid('v-free-yt', 'https://youtu.be/FREEPUBLIC1', true);

    // A : abonnement pro actif ; B : aucun droit
    tokA = (await h.registerUser(ctx, PFX, 'a')).token;
    tokB = (await h.registerUser(ctx, PFX, 'b')).token;
    await h.query(`UPDATE users SET subscription_plan='pro', subscription_expires_at=NOW()+interval '30 days' WHERE email=$1`, [`${PFX}-a@example.com`]);
    urlA = (await ctx.call('GET', `/api/videos/${PFX}-v-paid-local`, { token: tokA })).json.data.video_url;
  });
  after(async () => {
    await h.purge(PFX);
    for (const p of [path.join(UP, 'pdfs', T), path.join(UP, 'products', `${T}.jpg`), path.join(UP, 'videos', `${T}.mp4`), path.join(UP, 'previews', `${T}.py`)]) {
      fs.rmSync(p, { recursive: true, force: true });
    }
    await ctx.stop();
  });

  const status = async (url, opts) => (await ctx.call(opts?.method || 'GET', url, opts)).status;

  describe('API produits', () => {
    it('la liste n\'expose jamais file_url, seulement has_file, et garde preview_url', async () => {
      const r = await ctx.call('GET', '/api/products?limit=100');
      assert.ok(!r.text.includes('"file_url"'));
      const p = r.json.data.find((x) => x.slug === `${PFX}-paid`);
      assert.equal(p.has_file, true);
      assert.equal(p.preview_url, `/uploads/pdfs/${T}/preview.pdf`);
    });

    it('le détail n\'expose ni file_url ni le chemin du fichier payant', async () => {
      const r = await ctx.call('GET', `/api/products/${PFX}-paid`);
      assert.ok(!r.text.includes('file_url') && !r.text.includes('paid.pdf'));
      assert.equal(r.json.data.has_file, true);
    });
  });

  describe('/uploads (visiteur anonyme)', () => {
    it('fichier payant → 404 ; aperçu et miniature → 200', async () => {
      assert.equal(await status(`/uploads/pdfs/${T}/paid.pdf`), 404);
      assert.equal(await status(`/uploads/pdfs/${T}/preview.pdf`), 200);
      assert.equal(await status(`/uploads/products/${T}.jpg`), 200);
    });
    it('vidéo locale et script dans previews/ → 404', async () => {
      assert.equal(await status(`/uploads/videos/${T}.mp4`), 404);
      assert.equal(await status(`/uploads/previews/${T}.py`), 404);
    });
    it('traversées de chemin, POST et chemin backend/uploads → 404', async () => {
      assert.equal(await status(`/uploads/pdfs/${T}/../../../package.json`), 404);
      assert.equal(await status('/uploads/pdfs/%2e%2e/%2e%2e/package.json'), 404);
      assert.equal(await status('/uploads/pdfs/nope.pdf'), 404);
      assert.equal(await status(`/uploads/pdfs/${T}/preview.pdf`, { method: 'POST' }), 404);
      assert.equal(await status(`/backend/uploads/pdfs/${T}/paid.pdf`), 404);
    });
  });

  describe('téléchargement authentifié', () => {
    it('sans droit → 403 ; anonyme → 401 ; abonné → 200 avec le bon contenu', async () => {
      assert.equal(await status(`/api/products/${product.id}/download`, { token: tokB }), 403);
      assert.equal(await status(`/api/products/${product.id}/download`), 401);
      const dl = await ctx.call('GET', `/api/products/${product.id}/download`, { token: tokA });
      assert.equal(dl.status, 200);
      assert.equal(dl.text, '%PDF-PAID-CONTENT');
    });
  });

  describe('vidéos', () => {
    const list = async () => (await ctx.call('GET', '/api/videos?limit=100')).json.data;
    const detail = async (slug, token) => (await ctx.call('GET', `/api/videos/${PFX}-${slug}`, { token })).json.data.video_url;

    it('la liste masque toute URL, sauf celle d\'une vidéo YouTube gratuite', async () => {
      const g = (s) => list().then((l) => l.find((x) => x.slug === `${PFX}-${s}`));
      assert.equal((await g('v-paid-local')).video_url, null);
      assert.equal((await g('v-free-local')).video_url, null);
      assert.equal((await g('v-paid-yt')).video_url, null);
      assert.equal((await g('v-free-yt')).video_url, 'https://youtu.be/FREEPUBLIC1');
    });

    it('détail d\'une vidéo payante : refusé sans droit, lien signé ou URL avec droit', async () => {
      assert.equal(await detail('v-paid-local'), null);
      assert.equal(await detail('v-paid-local', tokB), null);
      assert.match(urlA, /^\/api\/videos\/stream\//);
      assert.equal(await detail('v-paid-yt', tokB), null);
      assert.equal(await detail('v-paid-yt', tokA), 'https://youtu.be/PAIDSECRET1');
      assert.match(await detail('v-free-local'), /^\/api\/videos\/stream\//);
    });

    it('le flux signé répond en entier et en Range', async () => {
      const full = await fetch(ctx.base + urlA);
      assert.equal(full.status, 200);
      assert.equal((await full.arrayBuffer()).byteLength, 2000);
      const part = await fetch(ctx.base + urlA, { headers: { Range: 'bytes=0-99' } });
      assert.equal(part.status, 206);
      assert.equal((await part.arrayBuffer()).byteLength, 100);
    });

    it('les jetons falsifiés, expirés ou hors de videos/ sont refusés (403)', async () => {
      const tok = urlA.split('/').pop();
      const flipped = tok.replace(/^./, (c) => (c === 'A' ? 'B' : 'A'));
      for (const bad of [flipped, tok.slice(0, -2) + 'AA', 'abc.def',
        createMediaToken(`videos/${T}.mp4`, -10),
        createMediaToken('../../package.json'),
        createMediaToken('videos/../../package.json')]) {
        assert.equal(await status('/api/videos/stream/' + bad), 403, bad.slice(0, 30));
      }
      assert.equal(await status('/api/videos/stream/' + createMediaToken('videos/inexistant.mp4')), 404);
    });
  });
});
