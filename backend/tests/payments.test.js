const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tpay';

describe('paiements : retour SATIM, validation admin, livraison unique', () => {
  let ctx, user, admin, seq = 0;

  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    user = await h.registerUser(ctx, PFX, 'user');
    admin = await h.registerUser(ctx, PFX, 'admin', { role: 'admin' });
  });
  after(async () => { await h.purge(PFX); await ctx.stop(); });

  // Commande de 3 lignes : un ouvrage payant, un logiciel (→ licence), une vidéo payante
  async function makeOrder(status, items) {
    if (!items) {
      const k = ++seq;
      const P = (await h.one(`INSERT INTO products (title, slug, type, price, is_active, file_url) VALUES ('P',$1,'ouvrage',500,TRUE,'/uploads/x.pdf') RETURNING id`, [`${PFX}-p${k}`])).id;
      const L = (await h.one(`INSERT INTO products (title, slug, type, price, is_active, metadata) VALUES ('L',$1,'logiciels',500,TRUE,'{"app_slug":"test-app","license_plan":"pro","duration_months":12}') RETURNING id`, [`${PFX}-l${k}`])).id;
      const V = (await h.one(`INSERT INTO videos (title, slug, video_url, price, is_free, is_active) VALUES ('V',$1,'https://youtu.be/x',500,FALSE,TRUE) RETURNING id`, [`${PFX}-v${k}`])).id;
      items = [{ type: 'product', product_id: P }, { type: 'product', product_id: L }, { type: 'video', video_id: V }];
    }
    const total = items.reduce((s, it) => s + (it.price || 500), 0);
    const o = await h.one(`INSERT INTO orders (user_id, status, subtotal, total_amount) VALUES ($1,$2::order_status,$3,$3) RETURNING id`, [user.id, status, total]);
    for (const it of items) {
      await h.query(`INSERT INTO order_items (order_id, product_id, video_id, item_type, title, unit_price, quantity, subtotal)
                     VALUES ($1,$2,$3,$4,$6,$5,1,$5)`, [o.id, it.product_id || null, it.video_id || null, it.type, it.price || 500, it.title || 'x']);
    }
    return o.id;
  }
  const makePayment = async (orderId, method, status = 'pending', satimId = null, amount = 1500) =>
    (await h.one(`INSERT INTO payments (order_id, user_id, method, status, amount, satim_order_id)
                  VALUES ($1,$2,$3::payment_method,$4::payment_status,$5,$6) RETURNING id`, [orderId, user.id, method, status, amount, satimId])).id;

  const callback = (paymentId, { orderId, respCode = '00', signed = true } = {}) => {
    const params = { payment_id: paymentId, orderId, respCode };
    const qs = new URLSearchParams(params);
    if (signed) qs.set('signature', h.satimSign(params));
    return ctx.call('GET', `/api/payment/satim/callback?${qs}`, { redirect: 'manual' });
  };
  const adminCall = (method, path, body) => ctx.call(method, path, { token: admin.token, body: body || {} });

  const state = async (orderId, paymentId) => ({
    order: (await h.one(`SELECT status FROM orders WHERE id=$1`, [orderId])).status,
    payment: (await h.one(`SELECT status FROM payments WHERE id=$1`, [paymentId])).status,
    licenses: await h.count(`SELECT COUNT(*) c FROM software_licenses WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [orderId]),
    downloads: await h.count(`SELECT COUNT(*) c FROM user_downloads WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=$1)`, [orderId]),
    videos: await h.count(`SELECT COUNT(*) c FROM user_video_access WHERE order_id=$1`, [orderId]),
  });
  const delivered = { licenses: 1, downloads: 2, videos: 1 };   // le contenu de makeOrder()

  it('SATIM : un retour signé valide livre la commande une seule fois, même rejoué en parallèle', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-1');

    const r = await callback(pid, { orderId: 'SATIM-1' });
    assert.equal(r.status, 302);
    assert.match(r.location, /\/payment\/success/);
    assert.deepEqual(await state(oid, pid), { order: 'paid', payment: 'completed', ...delivered });

    const replays = await Promise.all(Array.from({ length: 6 }, () => callback(pid, { orderId: 'SATIM-1' })));
    assert.ok(replays.every((x) => x.status === 302 && /\/payment\/success/.test(x.location)));
    assert.deepEqual(await state(oid, pid), { order: 'paid', payment: 'completed', ...delivered }, 'aucun doublon après rejeu');
  });

  it('SATIM : un retour d\'échec non signé ne peut pas annuler un paiement déjà complété', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-1b');
    await callback(pid, { orderId: 'SATIM-1b' });
    await callback(pid, { orderId: 'SATIM-1b', respCode: '05', signed: false });
    const s = await state(oid, pid);
    assert.equal(s.order, 'paid');
    assert.equal(s.payment, 'completed');
  });

  it('SATIM : un retour NON signé annonçant un succès ne livre rien', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-2');
    const r = await callback(pid, { orderId: 'SATIM-2', respCode: '00', signed: false });
    assert.match(r.location, /\/payment\/fail/);
    const s = await state(oid, pid);
    assert.equal(s.licenses, 0);
    assert.equal(s.downloads, 0);
    assert.notEqual(s.order, 'paid');
  });

  it('SATIM : une signature FAUSSE (falsifiée, tronquée, réutilisée d\'un autre retour) ne livre rien', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-2b');
    const raw = (qs) => ctx.call('GET', `/api/payment/satim/callback?${qs}`, { redirect: 'manual' });
    const good = { payment_id: pid, orderId: 'SATIM-2b', respCode: '00' };
    // signature valide pour un échec (05), rejouée sur un retour annonçant un succès (00)
    const sigOfFailure = h.satimSign({ ...good, respCode: '05' });
    for (const signature of ['deadbeef', '', h.satimSign(good).slice(0, 20), sigOfFailure, h.satimSign(good).toUpperCase() + 'x']) {
      const r = await raw(new URLSearchParams({ ...good, signature }));
      assert.match(r.location, /\/payment\/fail/, `signature « ${signature.slice(0, 12)} » acceptée`);
    }
    const s = await state(oid, pid);
    assert.equal(s.licenses, 0);
    assert.equal(s.downloads, 0);
    assert.notEqual(s.order, 'paid');
  });

  it('SATIM : un succès signé tardif après un échec est livré une fois', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-3');
    await callback(pid, { orderId: 'SATIM-3', respCode: '05', signed: false });
    assert.equal((await state(oid, pid)).payment, 'failed');
    await callback(pid, { orderId: 'SATIM-3' });
    assert.deepEqual(await state(oid, pid), { order: 'paid', payment: 'completed', ...delivered });
  });

  it('SATIM : signature valide mais orderId différent du satim_order_id → échec, rien livré', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-4');
    const r = await callback(pid, { orderId: 'AUTRE-ID' });
    assert.match(r.location, /\/payment\/fail/);
    const s = await state(oid, pid);
    assert.equal(s.payment, 'failed');
    assert.equal(s.licenses, 0);
  });

  it('SATIM : un second paiement sur une commande déjà payée ne livre pas deux fois', async () => {
    const oid = await makeOrder('pending');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-5');
    await callback(pid, { orderId: 'SATIM-5' });
    const pid2 = await makePayment(oid, 'cib', 'pending', 'SATIM-5b');
    await callback(pid2, { orderId: 'SATIM-5b' });
    const s = await state(oid, pid);
    assert.deepEqual({ licenses: s.licenses, downloads: s.downloads, order: s.order }, { licenses: 1, downloads: 2, order: 'paid' });
    assert.equal((await h.one(`SELECT status FROM payments WHERE id=$1`, [pid2])).status, 'completed');
  });

  it('SATIM : un paiement sur une commande annulée ne la ressuscite pas', async () => {
    const oid = await makeOrder('cancelled');
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-6');
    await callback(pid, { orderId: 'SATIM-6' });
    const s = await state(oid, pid);
    assert.equal(s.order, 'cancelled');
    assert.equal(s.licenses, 0);
    assert.equal(s.downloads, 0);
  });

  it('SATIM : payment_id qui n\'est pas un UUID → 404 (pas 500)', async () => {
    const r = await callback('pas-un-uuid');
    assert.equal(r.status, 404);
  });

  it('SATIM : un abonnement payé par carte est activé (12 mois, une seule ligne)', async () => {
    const oid = await makeOrder('pending', [{ type: 'subscription', price: 22500, title: 'Abonnement pro (annual)' }]);
    await h.query(`INSERT INTO subscriptions (user_id, plan, billing_cycle, status, amount) VALUES ($1,'pro','annual','pending',22500)`, [user.id]);
    const pid = await makePayment(oid, 'cib', 'pending', 'SATIM-7', 22500);
    const r = await callback(pid, { orderId: 'SATIM-7' });
    await callback(pid, { orderId: 'SATIM-7' });
    assert.match(r.location, /\/success/);
    const usr = await h.one(`SELECT subscription_plan, subscription_expires_at FROM users WHERE id=$1`, [user.id]);
    const subs = (await h.query(`SELECT status, payment_id FROM subscriptions WHERE user_id=$1`, [user.id])).rows;
    const months = (new Date(usr.subscription_expires_at) - Date.now()) / (30 * 864e5);
    assert.equal(usr.subscription_plan, 'pro');
    assert.ok(months > 11 && months < 13, `durée ${months.toFixed(1)} mois`);
    assert.equal(subs.length, 1);
    assert.equal(subs[0].status, 'active');
    assert.equal(subs[0].payment_id, pid);
    await h.query(`UPDATE users SET subscription_plan='free', subscription_expires_at=NULL WHERE id=$1`, [user.id]);
    await h.query(`DELETE FROM subscriptions WHERE user_id=$1`, [user.id]);
  });

  it('validation admin : deux validations simultanées → un 200 et un 409, livraison unique', async () => {
    const oid = await makeOrder('processing');
    const pid = await makePayment(oid, 'ccp_virement');
    const res = await Promise.all([
      adminCall('PATCH', `/api/admin/payments/${pid}/validate`, { notes: 'ok' }),
      adminCall('PATCH', `/api/admin/payments/${pid}/validate`, { notes: 'ok' }),
    ]);
    assert.deepEqual(res.map((x) => x.status).sort(), [200, 409]);
    assert.deepEqual(await state(oid, pid), { order: 'paid', payment: 'completed', ...delivered });
  });

  it('validation admin : re-validation ou rejet d\'un paiement déjà validé → 409, la commande reste payée', async () => {
    const oid = await makeOrder('processing');
    const pid = await makePayment(oid, 'ccp_virement');
    assert.equal((await adminCall('PATCH', `/api/admin/payments/${pid}/validate`)).status, 200);
    assert.equal((await adminCall('PATCH', `/api/admin/payments/${pid}/validate`)).status, 409);
    assert.equal((await adminCall('PATCH', `/api/admin/payments/${pid}/reject`, { notes: 'x' })).status, 409);
    const s = await state(oid, pid);
    assert.equal(s.order, 'paid');
    assert.equal(s.payment, 'completed');

    // un 2e paiement sur la même commande déjà payée ne peut pas être validé (pas de doublon)
    const pid2 = await makePayment(oid, 'ccp_virement');
    assert.equal((await adminCall('PATCH', `/api/admin/payments/${pid2}/validate`)).status, 409);
    assert.equal((await h.one(`SELECT status FROM payments WHERE id=$1`, [pid2])).status, 'pending');
    assert.equal((await state(oid, pid)).licenses, 1);
  });

  it('validation admin : le rejet d\'un paiement en attente le marque échoué et ne livre rien', async () => {
    const oid = await makeOrder('processing');
    const pid = await makePayment(oid, 'ccp_virement');
    const r = await adminCall('PATCH', `/api/admin/payments/${pid}/reject`, { notes: 'reçu illisible' });
    assert.equal(r.status, 200);
    const s = await state(oid, pid);
    assert.equal(s.payment, 'failed');
    assert.equal(s.order, 'failed');
    assert.equal(s.licenses, 0);
  });

  it('validation admin : identifiants invalides → 404', async () => {
    assert.equal((await adminCall('PATCH', '/api/admin/payments/abc/validate')).status, 404);
    assert.equal((await adminCall('PATCH', '/api/admin/payments/00000000-0000-4000-8000-000000000000/validate')).status, 404);
  });

  it('validation admin : un abonnement payé par virement est activé', async () => {
    const oid = await makeOrder('processing', [{ type: 'subscription', price: 990, title: 'Abonnement standard (monthly)' }]);
    await h.query(`INSERT INTO subscriptions (user_id, plan, billing_cycle, status, amount) VALUES ($1,'standard','monthly','pending',990)`, [user.id]);
    const pid = await makePayment(oid, 'ccp_virement', 'pending', null, 990);
    assert.equal((await adminCall('PATCH', `/api/admin/payments/${pid}/validate`)).status, 200);
    const usr = await h.one(`SELECT subscription_plan FROM users WHERE id=$1`, [user.id]);
    const sub = await h.one(`SELECT status, payment_id FROM subscriptions WHERE user_id=$1`, [user.id]);
    assert.equal(usr.subscription_plan, 'standard');
    assert.equal(sub.status, 'active');
    assert.equal(sub.payment_id, pid);
  });

  it('la validation est réservée à un administrateur', async () => {
    const oid = await makeOrder('processing');
    const pid = await makePayment(oid, 'ccp_virement');
    assert.equal((await ctx.call('PATCH', `/api/admin/payments/${pid}/validate`, { token: user.token, body: {} })).status, 403);
    assert.equal((await ctx.call('PATCH', `/api/admin/payments/${pid}/validate`, { body: {} })).status, 401);
    assert.equal((await state(oid, pid)).payment, 'pending');
  });
});
