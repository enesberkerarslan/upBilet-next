const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('./api.error');

/** Sadece fotoğraf (jpeg/png/webp) ve PDF */
const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const ALLOWED_TYPES = new Set(Object.values(EXT_TO_MIME));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path.basename(file.originalname || 'file', ext).replace(/[^\w.-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const fromExt = EXT_TO_MIME[ext];
  const mime =
    file.mimetype && file.mimetype !== 'application/octet-stream' ? file.mimetype : fromExt;
  if (mime && ALLOWED_TYPES.has(mime)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Yalnızca JPG, PNG, WEBP veya PDF yükleyebilirsiniz.'
      )
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter,
});

module.exports = {
  uploadSupportFiles: upload,
};
