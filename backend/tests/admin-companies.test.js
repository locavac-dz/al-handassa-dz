// PATCH /api/companies/admin/:id : wilaya_siege et founded_year (colonnes INTEGER) arrivent en req.body comme
// des chaînes (FormData depuis admin/index.html) — un champ laissé vide dans le formulaire d'édition faisait
// échouer toute la requête avec une erreur PostgreSQL (?? ne traite pas la chaîne vide comme "absent").
// Reproduit avant correctif, voir CLAUDE.md.
const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tcow';

describe('admin : entreprises — wilaya_siege/founded_year (champs numériques optionnels du FormData)', () => {
  let ctx, admin;
  before(async () => {
    ctx = await h.start();
    await h.purge(PFX);
    await h.query(`DELETE FROM companies WHERE slug LIKE $1`, [`${PFX}-%`]);
    admin = await h.registerUser(ctx, PFX, 'admin', { role: 'admin' });
  });
  after(async () => {
    await h.purge(PFX);
    await h.query(`DELETE FROM companies WHERE slug LIKE $1`, [`${PFX}-%`]);
    await ctx.stop();
  });

  // Création "rapide" comme le fait le panneau admin : seul le nom est renseigné
  const createBare = async (name) => {
    const r = await ctx.call('POST', '/api/companies/admin', { token: admin.token, body: { name } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    return r.json.data;
  };

  it('la création sans wilaya ni année : NULL, pas d\'erreur (route POST déjà correcte)', async () => {
    const c = await createBare(`${PFX}-bare`);
    assert.equal(c.wilaya_siege, null);
    assert.equal(c.founded_year, null);
  });

  it('éditer sans wilaya ni année (chaînes vides, comme le formulaire admin) réussit — c\'est le bug corrigé', async () => {
    const c = await createBare(`${PFX}-empty-edit`);
    const r = await ctx.call('PATCH', `/api/companies/admin/${c.id}`, {
      token: admin.token,
      body: { name: `${PFX}-empty-edit modifiée`, wilaya_siege: '', founded_year: '' },
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.wilaya_siege, null);
    assert.equal(r.json.data.founded_year, null);
  });

  it('éditer avec des valeurs explicites les enregistre correctement', async () => {
    const c = await createBare(`${PFX}-explicit`);
    const r = await ctx.call('PATCH', `/api/companies/admin/${c.id}`, {
      token: admin.token,
      body: { name: `${PFX}-explicit`, wilaya_siege: '16', founded_year: '2015' },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.wilaya_siege, 16);
    assert.equal(r.json.data.founded_year, 2015);
  });

  it('éditer sans envoyer le champ du tout (absent, pas vide) conserve la valeur existante', async () => {
    const c = await createBare(`${PFX}-preserve`);
    await ctx.call('PATCH', `/api/companies/admin/${c.id}`, { token: admin.token, body: { name: c.name, wilaya_siege: '16', founded_year: '2015' } });
    const r = await ctx.call('PATCH', `/api/companies/admin/${c.id}`, { token: admin.token, body: { name: `${PFX}-preserve modifiée` } });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.wilaya_siege, 16, 'wilaya_siege conservée alors qu\'elle n\'était pas dans ce corps');
    assert.equal(r.json.data.founded_year, 2015);
  });

  it('size_range (texte) garde son comportement inchangé : une chaîne vide reste une chaîne vide, pas convertie en NULL', async () => {
    const c = await createBare(`${PFX}-size`);
    const r = await ctx.call('PATCH', `/api/companies/admin/${c.id}`, {
      token: admin.token, body: { name: c.name, size_range: '11-50' },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.size_range, '11-50');
  });
});
