const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tord';

describe('commandes : paiement manuel (CCP) et changement de statut admin', () => {
  let ctx, user, other, admin, seq = 0;

  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    user = await h.registerUser(ctx, PFX, 'user');
    other = await h.registerUser(ctx, PFX, 'other');
    admin = await h.registerUser(ctx, PFX, 'admin', { role: 'admin' });
  });
  after(async () => { await h.purge(PFX); await ctx.stop(); });

  // Commande d'un ouvrage + un logiciel (licence) + une vidéo, retourne l'id de commande
  async function makeOrder(status) {
    const k = ++seq;
    const P = (await h.one(`INSERT INTO products (title, slug, type, price, is_active, file_url) VALUES ('P',$1,'ouvrage',500,TRUE,'/uploads/x.pdf') RETURNING id`, [`${PFX}-p${k}`])).id;
    const L = (await h.one(`INSERT INTO products (title, slug, type, price, is_active, metadata) VALUES ('L',$1,'logiciels',500,TRUE,'{"app_slug":"test-app","license_plan":"pro","duration_months":12}') RETURNING id`, [`${PFX}-l${k}`])).id;
    const V = (await h.one(`INSERT INTO videos (title, slug, video_url, price, is_free, is_active) VALUES ('V',$1,'https://youtu.be/x',500,FALSE,TRUE) RETURNING id`, [`${PFX}-v${k}`])).id;
    const o = (await h.one(`INSERT INTO orders (user_id, status, subtotal, total_amount) VALUES ($1,$2::order_status,1500,1500) RETURNING id`, [user.id, status])).id;
    for (const [type, p, v] of [['product', P, null], ['product', L, null], ['video', null, V]]) {
      await h.query(`INSERT INTO order_items (order_id, product_id, video_id, item_type, title, unit_price, quantity, subtotal) VALUES ($1,$2,$3,$4,'x',500,1,500)`, [o, p, v, type]);
    }
    return o;
  }
  const state = async (o) => ({
    order: (await h.one(`SELECT status FROM orders WHERE id=$1`, [o])).status,
    licenses: await h.count(`SELECT COUNT(*) c FROM software_licenses WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [o]),
    activeLicenses: await h.count(`SELECT COUNT(*) c FROM software_licenses WHERE status='active' AND order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [o]),
    downloads: await h.count(`SELECT COUNT(*) c FROM user_downloads WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [o]),
    videos: await h.count(`SELECT COUNT(*) c FROM user_video_access WHERE order_id=$1`, [o]),
  });
  const patch = (orderId, status) => ctx.call('PATCH', `/api/orders/admin/${orderId}/status`, { token: admin.token, body: { status } });

  describe('paiement manuel (déclaré par le client)', () => {
    it('ne débloque rien : commande « processing », paiement « pending », aucune livraison', async () => {
      const o = await makeOrder('pending');
      const r = await ctx.call('POST', '/api/payment/manual', { token: user.token, body: { order_id: o, method: 'ccp_virement', reference: 'CCP-123' } });
      assert.equal(r.status, 200);
      assert.equal(r.json.auto_validated, false);
      const pay = await h.one(`SELECT status FROM payments WHERE order_id=$1`, [o]);
      assert.equal(pay.status, 'pending');
      const s = await state(o);
      assert.equal(s.order, 'processing');
      assert.deepEqual([s.licenses, s.downloads, s.videos], [0, 0, 0]);
    });

    it('une seconde déclaration sur la même commande est refusée', async () => {
      const o = await makeOrder('pending');
      const body = { order_id: o, method: 'ccp_virement' };
      assert.equal((await ctx.call('POST', '/api/payment/manual', { token: user.token, body })).status, 200);
      assert.equal((await ctx.call('POST', '/api/payment/manual', { token: user.token, body })).status, 400);
      assert.equal(await h.count(`SELECT COUNT(*) c FROM payments WHERE order_id=$1`, [o]), 1);
    });

    it('on ne peut pas déclarer un paiement sur la commande d\'un autre client', async () => {
      const o = await makeOrder('pending');
      const r = await ctx.call('POST', '/api/payment/manual', { token: other.token, body: { order_id: o, method: 'ccp_virement' } });
      assert.equal(r.status, 404);
      assert.equal((await state(o)).order, 'pending');
    });

    it('seule la validation admin livre la commande', async () => {
      const o = await makeOrder('pending');
      await ctx.call('POST', '/api/payment/manual', { token: user.token, body: { order_id: o, method: 'ccp_virement' } });
      const pay = await h.one(`SELECT id FROM payments WHERE order_id=$1`, [o]);
      assert.equal((await ctx.call('PATCH', `/api/admin/payments/${pay.id}/validate`, { token: admin.token, body: {} })).status, 200);
      const s = await state(o);
      assert.deepEqual([s.order, s.licenses, s.downloads, s.videos], ['paid', 1, 2, 1]);
    });
  });

  describe('PATCH /api/orders/admin/:id/status', () => {
    it('processing → paid livre, et trois « paid » simultanés ne créent aucun doublon', async () => {
      const o = await makeOrder('processing');
      const first = await patch(o, 'paid');
      assert.equal(first.status, 200);
      const many = await Promise.all([patch(o, 'paid'), patch(o, 'paid'), patch(o, 'paid')]);
      assert.ok(many.every((x) => x.status === 200));
      const s = await state(o);
      assert.deepEqual([s.order, s.licenses, s.downloads, s.videos], ['paid', 1, 2, 1]);
    });

    it('paid → refunded révoque la licence et l\'accès vidéo ; refunded → paid est refusé (409)', async () => {
      const o = await makeOrder('processing');
      await patch(o, 'paid');
      assert.equal((await patch(o, 'refunded')).status, 200);
      let s = await state(o);
      assert.deepEqual([s.order, s.licenses, s.activeLicenses, s.videos], ['refunded', 1, 0, 0]);
      assert.equal((await patch(o, 'paid')).status, 409);
      s = await state(o);
      assert.deepEqual([s.order, s.activeLicenses, s.videos], ['refunded', 0, 0]);
    });

    it('pending → cancelled ne livre rien ; cancelled → paid est refusé (409)', async () => {
      const o = await makeOrder('pending');
      assert.equal((await patch(o, 'cancelled')).status, 200);
      const s = await state(o);
      assert.deepEqual([s.order, s.licenses, s.downloads], ['cancelled', 0, 0]);
      assert.equal((await patch(o, 'paid')).status, 409);
    });

    it('validations : statut inconnu → 400/422, commande inconnue → 404, non-admin → 403', async () => {
      const o = await makeOrder('pending');
      assert.ok([400, 422].includes((await patch(o, 'nimporte')).status));
      assert.equal((await patch('00000000-0000-4000-8000-000000000000', 'paid')).status, 404);
      const r = await ctx.call('PATCH', `/api/orders/admin/${o}/status`, { token: user.token, body: { status: 'paid' } });
      assert.equal(r.status, 403);
      assert.equal((await state(o)).order, 'pending');
    });
  });
});
