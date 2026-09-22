// Test unitaire pur (aucune base, aucun appel réseau réel — le SDK Sentry est simulé) : garantit que le suivi
// d'erreurs ne casse jamais rien quand SENTRY_DSN est absent, et qu'il transmet bien au SDK quand il est présent.
const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = require.resolve('../src/config/sentry');

// Recharge config/sentry.js avec SENTRY_DSN dans l'état voulu (son drapeau « enabled » est figé au chargement).
function freshSentry(dsn) {
  delete require.cache[MODULE_PATH];
  if (dsn === undefined) delete process.env.SENTRY_DSN; else process.env.SENTRY_DSN = dsn;
  return require('../src/config/sentry');
}

describe('config/sentry : suivi d\'erreurs optionnel', () => {
  afterEach(() => { delete process.env.SENTRY_DSN; delete require.cache[MODULE_PATH]; });

  it('sans SENTRY_DSN : désactivé, et init/captureError/flush n\'appellent jamais le SDK ni ne lèvent', async () => {
    const Sentry = require('@sentry/node');
    const orig = { init: Sentry.init, captureException: Sentry.captureException, flush: Sentry.flush };
    let called = false;
    Sentry.init = () => { called = true; };
    Sentry.captureException = () => { called = true; };
    Sentry.flush = async () => { called = true; };
    try {
      const s = freshSentry(undefined);
      assert.equal(s.enabled, false);
      assert.doesNotThrow(() => s.init());
      assert.doesNotThrow(() => s.captureError(new Error('x')));
      assert.doesNotThrow(() => s.captureError(new Error('x'), { path: '/api/x' }));
      await assert.doesNotReject(s.flush(50));
      assert.equal(called, false, 'le SDK Sentry ne doit jamais être appelé quand SENTRY_DSN est absent');
    } finally {
      Object.assign(Sentry, orig);
    }
  });

  it('avec SENTRY_DSN : activé, init() et captureError() appellent bien le SDK avec le bon contenu', () => {
    const Sentry = require('@sentry/node');
    const origInit = Sentry.init;
    const origCapture = Sentry.captureException;
    let initArgs, capturedErr, capturedCtx;
    Sentry.init = (opts) => { initArgs = opts; };
    Sentry.captureException = (err, ctx) => { capturedErr = err; capturedCtx = ctx; };
    try {
      const s = freshSentry('https://fake@fake.ingest.sentry.io/1');
      assert.equal(s.enabled, true);

      s.init();
      assert.equal(initArgs.dsn, 'https://fake@fake.ingest.sentry.io/1');
      assert.equal(initArgs.tracesSampleRate, 0, 'pas de traçage de performance, erreurs seulement');

      const err = new Error('boom');
      s.captureError(err, { method: 'GET', path: '/api/x' });
      assert.equal(capturedErr, err);
      assert.deepEqual(capturedCtx, { extra: { method: 'GET', path: '/api/x' } });
    } finally {
      Sentry.init = origInit;
      Sentry.captureException = origCapture;
    }
  });

  it('captureError sans contexte transmet undefined (pas un objet extra vide)', () => {
    const Sentry = require('@sentry/node');
    const origCapture = Sentry.captureException;
    let received = 'non appelé';
    Sentry.captureException = (err, ctx) => { received = ctx; };
    try {
      const s = freshSentry('https://fake@fake.ingest.sentry.io/1');
      s.captureError(new Error('x'));
      assert.equal(received, undefined);
    } finally {
      Sentry.captureException = origCapture;
    }
  });

  it('flush() désactivé se résout immédiatement sans appeler le SDK', async () => {
    const Sentry = require('@sentry/node');
    const origFlush = Sentry.flush;
    let called = false;
    Sentry.flush = async () => { called = true; };
    try {
      const s = freshSentry(undefined);
      await s.flush(50);
      assert.equal(called, false);
    } finally {
      Sentry.flush = origFlush;
    }
  });
});
