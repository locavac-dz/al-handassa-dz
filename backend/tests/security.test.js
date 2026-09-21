const h = require('./helpers');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const PFX = 'tsec';

describe('sécurité : limitation de débit, fichiers du dépôt, en-têtes', () => {
  let ctx;
  before(async () => { ctx = await h.start(); await h.purge(PFX); });
  after(async () => { await h.purge(PFX); await ctx.stop(); });

  const ip = (x) => ({ 'X-Forwarded-For': x });
  const repeat = async (n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(await fn(i)); return out; };
  const login = (ipAddr, email, password) => ctx.call('POST', '/api/auth/login', { headers: ip(ipAddr), body: { email, password } }).then((r) => r.status);

  describe('limitation de débit', () => {
    it('connexion : les connexions réussies ne sont jamais bloquées, les échecs le sont par IP puis par email', async () => {
      await h.registerUser(ctx, PFX, 'ok');
      const okLogins = await repeat(25, () => login('203.0.113.21', `${PFX}-ok@example.com`, 'Test1234!x'));
      assert.ok(okLogins.every((s) => s === 200), 'aucune connexion réussie ne doit être limitée');

      const fail = await repeat(21, (i) => login('203.0.113.22', `${PFX}-x${i}@example.com`, 'mauvais'));
      assert.ok(fail.slice(0, 20).every((s) => s === 401));
      assert.equal(fail[20], 429, 'le 21e échec depuis la même IP est bloqué');
      assert.equal(await login('203.0.113.23', `${PFX}-ok@example.com`, 'Test1234!x'), 200, 'une autre IP n\'est pas affectée');

      const perEmail = await repeat(11, (i) => login(`198.51.100.${i + 1}`, `${PFX}-target@example.com`, 'mauvais'));
      assert.ok(perEmail.slice(0, 10).every((s) => s === 401));
      assert.equal(perEmail[10], 429, 'le 11e échec sur le même email est bloqué même depuis une IP neuve');
    });

    it('/me n\'est pas concerné par le limiteur de connexion', async () => {
      const tok = (await ctx.call('POST', '/api/auth/login', { headers: ip('203.0.113.24'), body: { email: `${PFX}-ok@example.com`, password: 'Test1234!x' } })).json.access_token;
      const me = await repeat(60, () => ctx.call('GET', '/api/auth/me', { token: tok, headers: ip('203.0.113.25') }).then((r) => r.status));
      assert.ok(me.every((s) => s === 200));
    });

    it('inscription et mot de passe oublié : 429 au 16e appel depuis une même IP', async () => {
      const regs = await repeat(16, (i) => ctx.call('POST', '/api/auth/register', { headers: ip('203.0.113.30'), body: { email: 'pas-un-email' + i } }).then((r) => r.status));
      assert.ok(regs.slice(0, 15).every((s) => s === 422));
      assert.equal(regs[15], 429);
      const fp = await repeat(16, () => ctx.call('POST', '/api/auth/forgot-password', { headers: ip('203.0.113.31'), body: { email: 'pas-un-email' } }).then((r) => r.status));
      assert.notEqual(fp[14], 429);
      assert.equal(fp[15], 429);
    });

    it('paiements : codes prépayés limités à 10 essais, POST paiement à 30 ; le retour SATIM (GET) n\'est pas limité', async () => {
      const pp = await repeat(11, () => ctx.call('POST', '/api/payment/prepaid', { headers: ip('203.0.113.40'), body: { code: 'X' } }).then((r) => r.status));
      assert.ok(pp.slice(0, 10).every((s) => s === 401));
      assert.equal(pp[10], 429);
      const pm = await repeat(31, () => ctx.call('POST', '/api/payment/manual', { headers: ip('203.0.113.41'), body: {} }).then((r) => r.status));
      assert.ok(pm.slice(0, 30).every((s) => s === 401));
      assert.equal(pm[30], 429);
      const cb = await repeat(40, () => ctx.call('GET', '/api/payment/satim/callback', { headers: ip('203.0.113.42') }).then((r) => r.status));
      assert.ok(cb.every((s) => s !== 429));
    });
  });

  describe('fichiers servis par Express', () => {
    it('les pages publiques sont servies', async () => {
      assert.equal((await ctx.call('GET', '/index.html')).status, 200);
      assert.equal((await ctx.call('GET', '/robots.txt')).status, 200);
    });

    it('le code, la configuration et le dépôt Git ne sont jamais servis', async () => {
      for (const p of ['/.env', '/backend/.env', '/package.json', '/backend/package.json', '/backend/src/app.js', '/src/app.js',
        '/backend/reset-admin-password.js', '/reset-admin-password.js', '/ecosystem.config.js', '/.git/config', '/Dockerfile', '/CLAUDE.md']) {
        assert.equal((await ctx.call('GET', p)).status, 404, p);
      }
    });
  });

  describe('en-têtes', () => {
    it('l\'API applique une CSP stricte (default-src \'none\'), les pages une CSP adaptée au site', async () => {
      const api = await ctx.call('GET', '/api/study-levels');
      assert.match(api.headers.get('content-security-policy'), /default-src 'none'/);
      const page = await ctx.call('GET', '/index.html');
      const csp = page.headers.get('content-security-policy');
      assert.ok(csp && !/default-src 'none'/.test(csp));
      assert.match(csp, /script-src[^;]*'unsafe-inline'/);   // nécessaire aux pages actuelles (voir CLAUDE.md)
    });

    it('/health répond sans authentification', async () => {
      assert.equal((await ctx.call('GET', '/health')).status, 200);
    });
  });
});
