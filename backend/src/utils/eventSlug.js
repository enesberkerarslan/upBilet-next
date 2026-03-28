/**
 * Etkinlik adından URL slug üretir (örn. "Galatasaray - Fenerbahçe", "Manifest 15 Mayıs WW Arena").
 * Tag modeli ile aynı Türkçe → Latin dönüşümü kullanılır.
 */

const TURKISH_TO_LATIN = {
  ç: 'c',
  Ç: 'C',
  ğ: 'g',
  Ğ: 'G',
  ı: 'i',
  I: 'I',
  İ: 'I',
  i: 'i',
  ö: 'o',
  Ö: 'O',
  ş: 's',
  Ş: 'S',
  ü: 'u',
  Ü: 'U',
};

function slugifyEventName(name) {
  if (name == null || typeof name !== 'string') {
    return 'etkinlik';
  }

  let s = name.trim();
  if (!s) {
    return 'etkinlik';
  }

  Object.keys(TURKISH_TO_LATIN).forEach((ch) => {
    s = s.split(ch).join(TURKISH_TO_LATIN[ch]);
  });

  s = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return s || 'etkinlik';
}

/**
 * Aynı slug varsa -2, -3 ... ekleyerek benzersiz slug döner.
 * @param {import('mongoose').Model} EventModel
 * @param {string} baseSlug
 * @param {import('mongoose').Types.ObjectId} [excludeId] güncellenen dokümanın _id'si
 */
async function ensureUniqueEventSlug(EventModel, baseSlug, excludeId) {
  let candidate = baseSlug;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await EventModel.findOne(query).select('_id').lean();
    if (!exists) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;

    if (counter > 500) {
      throw new Error('Benzersiz slug üretilemedi');
    }
  }
}

/**
 * Servis katmanı için: isim veya isteğe bağlı özel metinden slug üretir, benzersiz yapar.
 * Model require'u fonksiyon içinde (döngüsel bağımlılık yok).
 * @param {{ name?: string, slug?: string | null }} input
 * @param {import('mongoose').Types.ObjectId | null | undefined} excludeId güncellemede mevcut etkinlik _id
 */
async function assignEventSlug(input, excludeId) {
  const EventModel = require('../models/event.model');
  const slug = input?.slug;
  const useCustom = slug != null && String(slug).trim() !== '';
  const raw = useCustom ? String(slug).trim() : String(input?.name ?? '');
  const base = slugifyEventName(raw);
  return ensureUniqueEventSlug(EventModel, base, excludeId || undefined);
}

module.exports = {
  slugifyEventName,
  ensureUniqueEventSlug,
  assignEventSlug,
};
