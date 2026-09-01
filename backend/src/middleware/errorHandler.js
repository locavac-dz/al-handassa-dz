function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Erreur de validation express-validator
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Données invalides.', details: err.errors });
  }

  // Contrainte PostgreSQL unique
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'champ';
    return res.status(409).json({ error: `${field} déjà utilisé.` });
  }

  // Clé étrangère inexistante
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide dans les données.' });
  }

  // CORS
  if (err.message?.startsWith('CORS bloqué')) {
    return res.status(403).json({ error: err.message });
  }

  // Erreur Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `Fichier trop volumineux (max ${process.env.MAX_FILE_SIZE_MB || 50} MB).` });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({ error: err.message });
  }

  // Erreur applicative connue
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (isDev) console.error(err.stack);

  res.status(500).json({
    error: 'Erreur interne du serveur.',
    ...(isDev && { details: err.message, stack: err.stack }),
  });
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
