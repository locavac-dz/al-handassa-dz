const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tacc';

describe('règles d\'accès : avis, codes prépayés', () => {
  let ctx;
  before(async () => { ctx = await h.start(); await h.purge(PFX); });
  after(async () => { await h.purge(PFX); await ctx.stop(); });

  describe('avis produit', () => {
    let a, b, productId;
    before(async () => {
      a = await h.registerUser(ctx, PFX, 'rv-a');
      b = await h.registerUser(ctx, PFX, 'rv-b');
      productId = (await h.one(`INSERT INTO products (title, slug, type, price, is_active) VALUES ('P',$1,'ouvrage',100,TRUE) RETURNING id`, [`${PFX}-rv-p`])).id;
    });
    const review = (user, body, id = productId) => ctx.call('POST', `/api/products/${id}/reviews`, { token: user.token, body });

    it('sans achat ni téléchargement → 403, aucun avis créé', async () => {
      const r = await review(a, { rating: 1, comment: 'nul' });
      assert.equal(r.status, 403);
      assert.match(r.json.error, /acheté ou téléchargé/);
      assert.equal(await h.count(`SELECT COUNT(*) c FROM reviews WHERE product_id=$1`, [productId]), 0);
    });

    it('après achat/téléchargement → 201, un second avis → 409, un autre client sans achat reste refusé', async () => {
      await h.query(`INSERT INTO user_downloads (user_id, product_id) VALUES ($1,$2)`, [a.id, productId]);
      assert.equal((await review(a, { rating: 5, comment: 'super' })).status, 201);
      assert.equal((await review(a, { rating: 4 })).status, 409);
      assert.equal((await review(b, { rating: 1 })).status, 403);
      const p = await h.one(`SELECT rating_avg, rating_count FROM products WHERE id=$1`, [productId]);
      assert.equal(Number(p.rating_avg), 5);
      assert.equal(Number(p.rating_count), 1);
    });

    it('produit inexistant → 403 (pas 500)', async () => {
      assert.equal((await review(a, { rating: 5 }, '00000000-0000-4000-8000-000000000000')).status, 403);
    });
  });

  describe('codes prépayés', () => {
    it('12 comptes utilisant le même code en même temps : un seul gagne (pas de double crédit)', async () => {
      await h.query(`INSERT INTO prepaid_codes (code, amount_dzd, plan) VALUES ('TACC-ONE', 990, 'standard')`);
      // Inscriptions en série (bcrypt + pool de connexions) : seule la validation du code doit être concurrente
      const users = [];
      for (let i = 0; i < 12; i++) users.push(await h.registerUser(ctx, PFX, `pp${i}`));
      const res = await Promise.all(users.map((u, i) => ctx.call('POST', '/api/payment/prepaid', {
        token: u.token, body: { code: i % 2 ? 'tacc-one' : 'TACC-ONE' },   // casse indifférente
      }).then((r) => r.status)));
      assert.equal(res.filter((s) => s === 200).length, 1, `statuts : ${res.join(',')}`);
      const subs = await h.count(`SELECT COUNT(*) c FROM subscriptions WHERE payment_method='code_prepaye' AND user_id = ANY($1)`, [users.map((u) => u.id)]);
      const standard = await h.count(`SELECT COUNT(*) c FROM users WHERE subscription_plan='standard' AND id = ANY($1)`, [users.map((u) => u.id)]);
      assert.equal(subs, 1);
      assert.equal(standard, 1);
    });

    it('code expiré ou inconnu → 400', async () => {
      await h.query(`INSERT INTO prepaid_codes (code, amount_dzd, plan, expires_at) VALUES ('TACC-EXP', 990, 'standard', NOW() - interval '1 day')`);
      const u = await h.registerUser(ctx, PFX, 'pp-x');
      assert.equal((await ctx.call('POST', '/api/payment/prepaid', { token: u.token, body: { code: 'TACC-EXP' } })).status, 400);
      assert.equal((await ctx.call('POST', '/api/payment/prepaid', { token: u.token, body: { code: 'INCONNU' } })).status, 400);
    });
  });
});
