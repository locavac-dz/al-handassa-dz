/**
 * Suivi d'erreurs (Sentry) — optionnel et inactif tant que SENTRY_DSN n'est pas défini : aucun compte externe n'est
 * requis pour faire tourner l'application, et rien n'est envoyé sans lui.
 *
 * Volontairement PAS d'intégration automatique Express (pas de middleware Sentry) : celle-ci capture les requêtes
 * entières (en-têtes, corps) et enverrait potentiellement des mots de passe, jetons ou numéros de carte. À la place,
 * seuls des appels manuels et ciblés, avec un contexte choisi à la main (jamais req.body ni req.headers) :
 *   - middleware/errorHandler.js : uniquement le cas 500 « Erreur interne du serveur » (les 4xx — validation,
 *     401/403/404, contraintes PostgreSQL… — sont des refus normaux, pas des anomalies à signaler) ;
 *   - app.js : uncaughtException, unhandledRejection.
 */
const Sentry = require('@sentry/node');

const enabled = !!process.env.SENTRY_DSN;

function init() {
  if (!enabled) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0,   // suivi d'erreurs seulement, pas de traçage de performance
  });
}

/** extra : contexte simple (méthode, chemin…) — jamais de données sensibles. */
function captureError(err, extra) {
  if (!enabled) return;
  Sentry.captureException(err, extra ? { extra } : undefined);
}

// À appeler avant de quitter le processus (uncaughtException) : Sentry envoie en arrière-plan, process.exit()
// couperait l'envoi. N'échoue jamais : le programme doit pouvoir quitter même si Sentry est injoignable.
async function flush(timeoutMs = 2000) {
  if (!enabled) return;
  try { await Sentry.flush(timeoutMs); } catch { /* on quitte de toute façon */ }
}

module.exports = { init, captureError, flush, enabled };
