const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ALLOWED = {
  products: ['pdf', 'epub', 'zip', 'docx'],
  videos:   ['mp4', 'webm', 'mkv'],
  images:   ['jpg', 'jpeg', 'png', 'webp'],
};

function makeStorage(dest) {
  const dir = path.join(__dirname, '../../uploads', dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      cb(null, `${uuidv4()}.${ext}`);
    },
  });
}

function fileFilter(allowed) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!allowed.includes(ext)) {
      const err = new Error(`Type non autorisé. Acceptés: ${allowed.join(', ')}`);
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  };
}

const maxMB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);

const uploadProduct = multer({
  storage: makeStorage('products'),
  limits: { fileSize: maxMB * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED.products),
});

const uploadVideo = multer({
  storage: makeStorage('videos'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB pour vidéos
  fileFilter: fileFilter(ALLOWED.videos),
});

const uploadImage = multer({
  storage: makeStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter(ALLOWED.images),
});

// ── Multer unifié pour POST /products/:id/upload ──────────────────────────────
// Route le fichier vers /uploads/products ou /uploads/images selon le fieldname.
const uploadProductFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subdir = 'products';   // PDF et miniatures dans le même dossier
      const dir = path.join(__dirname, '../../uploads', subdir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      cb(null, `${uuidv4()}.${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '200', 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const allowed = file.fieldname === 'thumbnail' ? ALLOWED.images : ALLOWED.products;
    if (!allowed.includes(ext)) {
      return cb(new Error(`Type non autorisé pour "${file.fieldname}". Acceptés : ${allowed.join(', ')}`), false);
    }
    cb(null, true);
  },
});

module.exports = { uploadProduct, uploadVideo, uploadImage, uploadProductFiles };
