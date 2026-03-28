const crypto = require('crypto');

/** I, O, 0, 1 karışmasın diye çıkarıldı */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(len = 8) {
  const buf = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += ALPHABET[buf[i] % ALPHABET.length];
  }
  return s;
}

/**
 * @param {import('mongoose').Model} Model
 * @param {string} prefix
 */
async function assignUniqueReferenceCode(Model, prefix) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const code = `${prefix}-${randomSegment(8)}`;
    const exists = await Model.exists({ referenceCode: code });
    if (!exists) return code;
  }
  throw new Error('Benzersiz referans kodu üretilemedi');
}

async function assignUniqueListingCode(ListingModel) {
  return assignUniqueReferenceCode(ListingModel, 'ILN');
}

async function assignUniqueSaleCode(SaleModel) {
  return assignUniqueReferenceCode(SaleModel, 'SAT');
}

/**
 * referenceCode boşsa ilgili şema pre-save hook’u ile doldurulur (Listing / Sale).
 * @param {import('mongoose').Document|null|undefined} doc
 */
async function ensureReferenceCodeIfMissing(doc) {
  if (!doc || typeof doc.save !== 'function') return doc;
  if (String(doc.referenceCode || '').trim()) return doc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await doc.save();
      return doc;
    } catch (err) {
      if (err?.code === 11000 && attempt < 2) {
        doc.set('referenceCode', undefined);
        continue;
      }
      throw err;
    }
  }
  return doc;
}

/**
 * @param {import('mongoose').Document[]|null|undefined} docs
 */
async function ensureReferenceCodesIfMissing(docs) {
  if (!docs?.length) return docs;
  for (const doc of docs) {
    await ensureReferenceCodeIfMissing(doc);
  }
  return docs;
}

module.exports = {
  assignUniqueReferenceCode,
  assignUniqueListingCode,
  assignUniqueSaleCode,
  ensureReferenceCodeIfMissing,
  ensureReferenceCodesIfMissing,
};
