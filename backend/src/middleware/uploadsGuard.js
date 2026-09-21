/**
 * Garde d'accès pour /uploads : le dossier contient à la fois du contenu public (miniatures,
 * aperçus) et des fichiers payants (produits, vidéos, originaux). Une URL n'est servie que si
 * elle est manifestement publique ; le reste passe par les routes authentifiées
 * (/api/products/:id/download, /api/videos/stream/:token).
 *
 * Est public :
 *  - une image (jpg, png, webp…) quel que soit son dossier (les miniatures vivent dans images/,
 *    thumbnails/ et parfois products/) ;
 *  - tout ce qui est sous previews/ et ecotec/ (aperçus générés, échantillon HTML gratuit) ;
 *  - un fichier référencé comme `preview_url` d'un produit ET jamais comme `file_url`
 *    (les aperçus filigranés vivent dans pdfs/ à côté d'originaux payants).
 */
const { query } = require('../config/database');

const PUBLIC_IMAGE = /\.(?:jpe?g|png|webp|gif|svg|ico)$/i;
const PUBLIC_PREFIXES = ['previews/', 'ecotec/'];

const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX = 5000;
const cache = new Map();   // "/uploads/x.pdf" -> { ok, exp }

async function isPublishedPreview(uploadUrl) {
  const hit = cache.get(uploadUrl);
  if (hit && hit.exp > Date.now()) return hit.ok;

  const forms = [uploadUrl, encodeURI(uploadUrl)];   // valeur stockée brute ou encodée
  const { rows } = await query(
    `SELECT EXISTS (SELECT 1 FROM products WHERE preview_url = ANY($1))
        AND NOT EXISTS (SELECT 1 FROM products WHERE file_url = ANY($1)) AS ok`,
    [forms]
  );
  const ok = rows[0].ok === true;
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(uploadUrl, { ok, exp: Date.now() + CACHE_TTL_MS });
  return ok;
}

function deny(res) {
  return res.status(404).json({ error: 'Fichier introuvable.' });
}

// À monter avec app.use('/uploads', uploadsGuard, express.static(...)) : req.path est relatif à /uploads.
async function uploadsGuard(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return deny(res);

  let rel;
  try { rel = decodeURIComponent(req.path).replace(/^\/+/, ''); } catch { return deny(res); }
  if (!rel || rel.includes('\0') || rel.includes('\\')) return deny(res);
  if (rel.split('/').some(s => s.startsWith('.'))) return deny(res);   // dotfiles et ".."

  if (PUBLIC_IMAGE.test(rel)) return next();
  if (PUBLIC_PREFIXES.some(p => rel.startsWith(p)) && !/\.py$/i.test(rel)) return next();   // _gen_preview.py n'a rien à faire en public

  try {
    if (await isPublishedPreview(`/uploads/${rel}`)) return next();
  } catch (err) {
    console.error('[uploadsGuard]', err.message);   // en cas de doute : refus
  }
  return deny(res);
}

module.exports = uploadsGuard;
