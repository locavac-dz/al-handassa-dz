/**
 * Liens signés à durée limitée pour les médias payants stockés dans /uploads/videos.
 * Le fichier n'est jamais servi en statique : l'API ne délivre un lien qu'après contrôle d'accès.
 * Jeton = base64url({ p: chemin relatif à uploads/, e: expiration epoch-secondes }) + "." + HMAC-SHA256.
 */
const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 4 * 60 * 60;   // 4 h : assez pour regarder une vidéo sans relancer

// Clé dédiée dérivée du secret JWT (ou MEDIA_SIGNING_SECRET si défini). Sans secret : aucun lien signé.
function getKey() {
  const base = process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!base) return null;
  return crypto.createHmac('sha256', base).update('media-token-v1').digest();
}

function sign(payloadB64, key) {
  return crypto.createHmac('sha256', key).update(payloadB64).digest('base64url');
}

// relPath : chemin relatif au dossier uploads, ex. "videos/abc.mp4"
function createMediaToken(relPath, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const key = getKey();
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify({
    p: relPath,
    e: Math.floor(Date.now() / 1000) + ttlSeconds,
  })).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

// Retourne le chemin relatif si le jeton est authentique et non expiré, sinon null.
function verifyMediaToken(token) {
  const key = getKey();
  if (!key || typeof token !== 'string') return null;
  const [payload, sig, ...rest] = token.split('.');
  if (!payload || !sig || rest.length) return null;

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  try {
    const { p, e } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof p !== 'string' || !Number.isFinite(e) || e < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

module.exports = { createMediaToken, verifyMediaToken };
