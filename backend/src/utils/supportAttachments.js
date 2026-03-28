const fs = require('fs').promises;
const path = require('path');
const { uploadToS3, getPublicCloudFrontUrl } = require('./s3.utils');

/**
 * Multer disk dosyalarını S3'e yükler, yerel dosyayı siler.
 * @param {Express.Multer.File[]} files
 * @param {string} [s3Folder='support-attachments'] S3 anahtar öneki
 * @returns {Promise<Array<{ url: string, fileKey: string, originalName: string, mimeType: string, kind: 'image'|'pdf' }>>}
 */
async function persistSupportAttachments(files, s3Folder = 'support-attachments') {
  if (!files?.length) return [];
  const folder = String(s3Folder || 'support-attachments').replace(/^\/+|\/+$/g, '');
  const out = [];
  for (const file of files) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const key = `${folder}/${safe}`;
    await uploadToS3(file.path, key);
    const url = await getPublicCloudFrontUrl(key);
    const mimeType = file.mimetype || 'application/octet-stream';
    const kind = mimeType === 'application/pdf' ? 'pdf' : 'image';
    out.push({
      url,
      fileKey: key,
      originalName: file.originalname || safe,
      mimeType,
      kind,
    });
    try {
      await fs.unlink(file.path);
    } catch {
      // geçici dosya yoksa yut
    }
  }
  return out;
}

module.exports = { persistSupportAttachments };
