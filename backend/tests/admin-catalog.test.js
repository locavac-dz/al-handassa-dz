// PUT /api/admin/categories/:id et /api/admin/study-levels/:id : une mise à jour partielle (utilisée par les
// bascules actif/inactif du panneau admin, admin/index.html toggleCat()/toggleLvl()) ne doit écraser QUE les
// champs réellement envoyés — jamais les autres avec NULL/valeur par défaut. Régression trouvée en testant
// admin/index.html : une bascule renommait silencieusement une catégorie en "_keep_" (contournement côté
// front, corrigé en même temps que la route) et faisait toujours échouer la bascule d'un niveau de formation
// (violation de la contrainte NOT NULL sur study_levels.db_value).
const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tadm';

describe('admin : mise à jour partielle des catégories et niveaux de formation (COALESCE)', () => {
  let ctx, admin, user;
  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    await h.query(`DELETE FROM categories WHERE slug LIKE $1`, [`${PFX}-%`]);
    await h.query(`DELETE FROM study_levels WHERE db_value LIKE $1`, [`${PFX}_%`]);
    admin = await h.registerUser(ctx, PFX, 'admin', { role: 'admin' });
    user = await h.registerUser(ctx, PFX, 'user');
  });
  after(async () => {
    await h.purge(PFX);
    await h.query(`DELETE FROM categories WHERE slug LIKE $1`, [`${PFX}-%`]);
    await h.query(`DELETE FROM study_levels WHERE db_value LIKE $1`, [`${PFX}_%`]);
    await ctx.stop();
  });

  describe('catégories', () => {
    const fresh = async (overrides = {}) => (await h.one(
      `INSERT INTO categories (slug, name_fr, name_ar, icon, description, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [`${PFX}-cat-${Date.now()}-${Math.random().toString(36).slice(2)}`, 'Nom initial', 'اسم', '📁', 'description initiale', 3,
       overrides.is_active ?? true]));

    it('une bascule (is_active seul) ne touche à rien d\'autre — c\'est le bug corrigé', async () => {
      const cat = await fresh();
      const r = await ctx.call('PUT', `/api/admin/categories/${cat.id}`, { token: admin.token, body: { is_active: false } });
      assert.equal(r.status, 200);
      assert.deepEqual(
        { name_fr: r.json.data.name_fr, name_ar: r.json.data.name_ar, icon: r.json.data.icon, description: r.json.data.description, sort_order: r.json.data.sort_order, is_active: r.json.data.is_active },
        { name_fr: 'Nom initial', name_ar: 'اسم', icon: '📁', description: 'description initiale', sort_order: 3, is_active: false }
      );
    });

    it('une édition complète sans is_active préserve l\'état actif/inactif existant (ne réactive plus silencieusement)', async () => {
      const cat = await fresh({ is_active: false });
      const r = await ctx.call('PUT', `/api/admin/categories/${cat.id}`, {
        token: admin.token,
        body: { name_fr: 'Nouveau nom', name_ar: 'اسم جديد', icon: '📦', description: 'nouvelle description', sort_order: 9 },
      });
      assert.equal(r.status, 200);
      assert.equal(r.json.data.name_fr, 'Nouveau nom');
      assert.equal(r.json.data.sort_order, 9);
      assert.equal(r.json.data.is_active, false, 'toujours inactive : is_active n\'était pas dans le corps');
    });

    it('is_active reste modifiable explicitement lors d\'une édition complète', async () => {
      const cat = await fresh({ is_active: false });
      const r = await ctx.call('PUT', `/api/admin/categories/${cat.id}`, {
        token: admin.token,
        body: { name_fr: 'X', name_ar: 'Y', icon: '📦', description: '', sort_order: 1, is_active: true },
      });
      assert.equal(r.status, 200);
      assert.equal(r.json.data.is_active, true);
    });

    it('catégorie inconnue -> 404 ; non-admin -> 403 ; anonyme -> 401', async () => {
      const cat = await fresh();
      assert.equal((await ctx.call('PUT', '/api/admin/categories/999999999', { token: admin.token, body: { is_active: false } })).status, 404);
      assert.equal((await ctx.call('PUT', `/api/admin/categories/${cat.id}`, { token: user.token, body: { is_active: false } })).status, 403);
      assert.equal((await ctx.call('PUT', `/api/admin/categories/${cat.id}`, { body: { is_active: false } })).status, 401);
    });
  });

  describe('niveaux de formation', () => {
    const fresh = async (overrides = {}) => (await h.one(
      `INSERT INTO study_levels (slug, label_fr, label_ar, icon, color, db_value, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [`${PFX}-lvl-${Date.now()}-${Math.random().toString(36).slice(2)}`, 'Libellé initial', 'مستوى', '🎓', '#abcdef',
       `${PFX}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, 5, overrides.is_active ?? true]));

    it('une bascule (label_fr + is_active, comme toggleLvl) ne touche à rien d\'autre — c\'est le bug corrigé', async () => {
      const lvl = await fresh();
      const r = await ctx.call('PUT', `/api/admin/study-levels/${lvl.id}`, {
        token: admin.token, body: { label_fr: lvl.label_fr, is_active: false },
      });
      assert.equal(r.status, 200, JSON.stringify(r.json));
      assert.deepEqual(
        { label_ar: r.json.data.label_ar, icon: r.json.data.icon, color: r.json.data.color, db_value: r.json.data.db_value, sort_order: r.json.data.sort_order, is_active: r.json.data.is_active },
        { label_ar: 'مستوى', icon: '🎓', color: '#abcdef', db_value: lvl.db_value, sort_order: 5, is_active: false }
      );
    });

    it('une édition complète sans is_active préserve l\'état actif/inactif existant', async () => {
      const lvl = await fresh({ is_active: false });
      const r = await ctx.call('PUT', `/api/admin/study-levels/${lvl.id}`, {
        token: admin.token,
        body: { label_fr: 'Après', label_ar: 'بعد', icon: '🏆', color: '#222222', db_value: lvl.db_value, sort_order: 8 },
      });
      assert.equal(r.status, 200);
      assert.equal(r.json.data.label_fr, 'Après');
      assert.equal(r.json.data.is_active, false);
    });

    it('label_fr reste obligatoire (même sur un appel partiel)', async () => {
      const lvl = await fresh();
      const r = await ctx.call('PUT', `/api/admin/study-levels/${lvl.id}`, { token: admin.token, body: { is_active: false } });
      assert.equal(r.status, 400);
    });

    it('niveau inconnu -> 404 ; non-admin -> 403', async () => {
      const lvl = await fresh();
      assert.equal((await ctx.call('PUT', '/api/admin/study-levels/999999999', { token: admin.token, body: { label_fr: 'x', is_active: false } })).status, 404);
      assert.equal((await ctx.call('PUT', `/api/admin/study-levels/${lvl.id}`, { token: user.token, body: { label_fr: 'x', is_active: false } })).status, 403);
    });
  });
});
