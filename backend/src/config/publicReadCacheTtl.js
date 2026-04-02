/**
 * Anasayfa bundle + public etkinlik listesi endpoint’leri için ortak TTL (saniye).
 * .env: HOMEPAGE_BUNDLE_CACHE_TTL_SEC (örn. 300 = 5 dk)
 */
function publicReadCacheTtlSec() {
  const n = parseInt(process.env.HOMEPAGE_BUNDLE_CACHE_TTL_SEC ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

module.exports = { publicReadCacheTtlSec };
