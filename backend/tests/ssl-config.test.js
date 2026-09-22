// Test unitaire pur (aucune base, aucun réseau) : config/database.js exporte sslConfig(env) précisément pour ça —
// une erreur ici (vérification de certificat qui redevient silencieusement désactivée, DB_SSL_CA mal lu…) ne se
// verrait sinon qu'au moment où la production essaierait vraiment de se connecter avec un certificat compromis.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sslConfig } = require('../src/config/database');

const FAKE_PEM = '-----BEGIN CERTIFICATE-----\nMIIB...contenu-factice...\n-----END CERTIFICATE-----\n';

describe('config/database : sslConfig()', () => {
  it('DB_SSL=false désactive toujours SSL, y compris en production', () => {
    assert.equal(sslConfig({ DB_SSL: 'false', NODE_ENV: 'production' }), false);
    assert.equal(sslConfig({ DB_SSL: 'false', NODE_ENV: 'development' }), false);
  });

  it('DB_SSL=strict vérifie le certificat (rejectUnauthorized: true), sans DB_SSL_CA', () => {
    assert.deepEqual(sslConfig({ DB_SSL: 'strict' }), { rejectUnauthorized: true });
  });

  it('DB_SSL=strict + DB_SSL_CA fourni comme contenu PEM : utilisé tel quel', () => {
    assert.deepEqual(sslConfig({ DB_SSL: 'strict', DB_SSL_CA: FAKE_PEM }), { rejectUnauthorized: true, ca: FAKE_PEM });
  });

  it('DB_SSL=strict + DB_SSL_CA fourni comme CHEMIN de fichier : le contenu du fichier est lu', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hds-ca-')), 'ca.pem');
    fs.writeFileSync(file, FAKE_PEM);
    assert.deepEqual(sslConfig({ DB_SSL: 'strict', DB_SSL_CA: file }), { rejectUnauthorized: true, ca: FAKE_PEM });
  });

  it('DB_SSL=strict + DB_SSL_CA ni PEM ni fichier existant : refus explicite (pas un échec TLS silencieux)', () => {
    assert.throws(() => sslConfig({ DB_SSL: 'strict', DB_SSL_CA: '/chemin/qui/n/existe/pas.pem' }), /DB_SSL_CA/);
    assert.throws(() => sslConfig({ DB_SSL: 'strict', DB_SSL_CA: 'ceci-nest-pas-un-certificat' }), /DB_SSL_CA/);
  });

  it('production sans DB_SSL : chiffré mais SANS vérification (comportement historique documenté)', () => {
    assert.deepEqual(sslConfig({ NODE_ENV: 'production' }), { rejectUnauthorized: false });
  });

  it('DB_SSL=true hors production : chiffré sans vérification (opt-in explicite)', () => {
    assert.deepEqual(sslConfig({ DB_SSL: 'true', NODE_ENV: 'development' }), { rejectUnauthorized: false });
  });

  it('développement sans DB_SSL : pas de SSL du tout', () => {
    assert.equal(sslConfig({ NODE_ENV: 'development' }), false);
    assert.equal(sslConfig({}), false);
  });

  it('DB_SSL=strict reste prioritaire même en dehors de la production', () => {
    assert.deepEqual(sslConfig({ DB_SSL: 'strict', NODE_ENV: 'development' }), { rejectUnauthorized: true });
  });
});
