// Test unitaire pur (aucune base ni serveur) : contrôle de la configuration au démarrage.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateEnv, checkEnv } = require('../src/config/env');

const good = {
  JWT_SECRET: 'x9Qw7LmZp3Rk8VtYb2NcJh5DfGs1AaEo6UiXy0KqWnMv4TrB',
  JWT_REFRESH_SECRET: 'p8Lk2Zx5Cv1Bn7Mq3Wd9Fh4Jg6Ts0Ra8YeUi5OoPl2NxQz1Ab',
  LICENSE_HMAC_SECRET: 'abc', SATIM_MERCHANT_KEY: 'k',
  DB_HOST: 'h', DB_NAME: 'n', DB_USER: 'u', NODE_ENV: 'production',
};

describe('config/env : contrôle des variables d\'environnement', () => {
  it('configuration complète : ni erreur ni alerte', () => {
    const r = evaluateEnv(good);
    assert.deepEqual([r.fatal, r.warnings], [[], []]);
  });
  it('JWT_SECRET absent → fatal', () => {
    assert.ok(evaluateEnv({ ...good, JWT_SECRET: undefined }).fatal.some((x) => /JWT_SECRET/.test(x)));
  });
  it('secret prévisible ou trop court → alerte', () => {
    assert.ok(evaluateEnv({ ...good, JWT_SECRET: 'handassi_dev_secret_local_only_1234567890abcdef' }).warnings.some((x) => /JWT_SECRET faible/.test(x)));
    assert.ok(evaluateEnv({ ...good, JWT_SECRET: 'court' }).warnings.some((x) => /faible/.test(x)));
  });
  it('refresh identique au JWT_SECRET → alerte', () => {
    assert.ok(evaluateEnv({ ...good, JWT_REFRESH_SECRET: good.JWT_SECRET }).warnings.some((x) => /identique/.test(x)));
  });
  it('refresh et licences absents → alertes seulement', () => {
    const r = evaluateEnv({ ...good, JWT_REFRESH_SECRET: undefined, LICENSE_HMAC_SECRET: undefined });
    assert.equal(r.fatal.length, 0);
    assert.equal(r.warnings.length, 2);
  });
  it('base non configurée → fatal ; DATABASE_URL suffit', () => {
    assert.ok(evaluateEnv({ ...good, DB_HOST: undefined }).fatal.some((x) => /Base de données/.test(x)));
    assert.equal(evaluateEnv({ ...good, DB_HOST: undefined, DATABASE_URL: 'postgres://u:p@h/db' }).fatal.length, 0);
  });
  it('checkEnv : arrêt (false) en production sur erreur fatale, jamais en développement', () => {
    const logs = { warn: () => {}, error: () => {} };
    assert.equal(checkEnv({ ...good, JWT_SECRET: undefined }, logs), false);
    assert.equal(checkEnv({ NODE_ENV: 'development' }, logs), true);
  });
});
