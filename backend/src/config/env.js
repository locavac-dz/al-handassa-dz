/**
 * Contrôle des variables d'environnement au démarrage (production uniquement).
 * Sans JWT_SECRET, aucune authentification n'est possible : arrêt immédiat plutôt qu'une cascade d'erreurs 500.
 * Les autres manques (refresh token, licences, SATIM, secrets faibles) sont signalés bruyamment sans arrêter le
 * service, pour ne pas provoquer une panne à cause d'une variable non critique pour tous les usages.
 */
const WEAK = /handass|handassi|secret|change[_-]?me|password|example|votre|your|xxx|test|dev/i;

function evaluateEnv(env = process.env) {
  const fatal = [];
  const warnings = [];

  if (!env.JWT_SECRET) fatal.push('JWT_SECRET manquant : aucune connexion possible.');
  else if (env.JWT_SECRET.length < 32 || WEAK.test(env.JWT_SECRET)) warnings.push('JWT_SECRET faible ou prévisible (32 caractères aléatoires minimum) — voir ROTATION_SECRETS.md.');

  if (!env.JWT_REFRESH_SECRET) warnings.push('JWT_REFRESH_SECRET manquant : le renouvellement de session échouera.');
  else if (env.JWT_REFRESH_SECRET === env.JWT_SECRET) warnings.push('JWT_REFRESH_SECRET identique à JWT_SECRET : utiliser deux secrets distincts.');
  else if (env.JWT_REFRESH_SECRET.length < 32 || WEAK.test(env.JWT_REFRESH_SECRET)) warnings.push('JWT_REFRESH_SECRET faible ou prévisible.');

  if (!env.LICENSE_HMAC_SECRET) warnings.push("LICENSE_HMAC_SECRET manquant : l'émission de licences échouera après paiement.");
  if (!env.SATIM_MERCHANT_KEY) warnings.push('SATIM_MERCHANT_KEY manquant : tout retour de paiement par carte sera refusé (comportement voulu tant que SATIM n\'est pas branché).');
  if (!env.DATABASE_URL && !(env.DB_HOST && env.DB_NAME && env.DB_USER)) fatal.push('Base de données non configurée : DATABASE_URL, ou DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.');

  return { fatal, warnings };
}

// À appeler au démarrage. Hors production : avertissements seulement, jamais d'arrêt.
function checkEnv(env = process.env, log = console) {
  const { fatal, warnings } = evaluateEnv(env);
  const isProd = env.NODE_ENV === 'production';
  warnings.forEach((w) => log.warn(`[ENV] ⚠️  ${w}`));
  if (fatal.length) {
    fatal.forEach((f) => log.error(`[ENV] ❌ ${f}`));
    if (isProd) return false;
  }
  return true;
}

module.exports = { evaluateEnv, checkEnv };
