const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');
const mediaController = require('../../controllers/admin/media.controller');
const ApiError = require('../../utils/api.error');

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

const ALLOWED_TYPES = new Set(Object.values(EXT_TO_MIME));


// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Windows-1254 (Turkish) encoding'den UTF-8'e çevir
    const originalName = iconv.decode(Buffer.from(file.originalname, 'binary'), 'windows-1254');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

// Multer upload ayarları
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const fromExt = EXT_TO_MIME[ext];
    const mime = file.mimetype && file.mimetype !== 'application/octet-stream'
      ? file.mimetype
      : fromExt;
    if (mime && ALLOWED_TYPES.has(mime)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          fromExt
            ? `Desteklenmeyen dosya türü (${ext || file.mimetype || 'bilinmeyen'})`
            : `Desteklenmeyen dosya türü (${file.mimetype || ext || 'bilinmeyen'})`
        )
      );
    }
  },
});

// Routes
router.get('/', mediaController.getAllMedia); // Tüm medyaları getir
router.post('/upload', upload.single('file'), mediaController.uploadMedia);
router.get('/:id', mediaController.getMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router; 