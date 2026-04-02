const HomePage = require('../../models/homepage.model');
const publicEventService = require('./publicEvent.service');
const redisClient = require('../../config/redis');
const { publicReadCacheTtlSec } = require('../../config/publicReadCacheTtl');
const { logger } = require('../../utils/logger');

const HOMEPAGE_BUNDLE_CACHE_KEY = 'public:homepage:bundle';

class PublicHomepageService {
  async getHomepage() {
    // Önce yayında olan; yoksa tekil anasayfa belgesi (panelde yayın kapalı unutulunca null dönmesin)
    let doc = await HomePage.findOne({ isPublished: true })
      .sort({ updatedAt: -1 })
      .lean();
    if (!doc) {
      doc = await HomePage.findOne({}).sort({ updatedAt: -1 }).lean();
    }

    return {
      status: 200,
      body: {
        success: true,
        homepage: doc || null,
      },
    };
  }

  /** Bundle gövdesini üretir (önbellek yok). */
  async buildHomepageBundleBody() {
    const homepageResult = await this.getHomepage();
    const hp = homepageResult.body?.homepage ?? null;

    const [fbMain, conc, fbResp] = await Promise.all([
      publicEventService.getMainPageEventsByTagMainPage('Futbol'),
      publicEventService.getMainPageEventsByTagMainPage('Konser'),
      publicEventService.getMainPageEventsByTag('Futbol'),
    ]);

    const pickEventsBlock = (r) =>
      r.status === 200 && r.body && r.body.success ? r.body : null;

    const football = pickEventsBlock(fbMain);
    const concert = pickEventsBlock(conc);
    const footballResponse = pickEventsBlock(fbResp);

    const anyBlock = hp || football || concert || footballResponse;

    return {
      success: Boolean(anyBlock),
      homepage: hp,
      football,
      concert,
      footballResponse,
    };
  }

  /** Tek HTTP yanıtında anasayfa hero + etkinlik blokları (SSR için); Redis ile önbellekli. */
  async getHomepageBundle() {
    const ttl = publicReadCacheTtlSec();

    if (redisClient.isConnected) {
      try {
        const cached = await redisClient.get(HOMEPAGE_BUNDLE_CACHE_KEY);
        if (cached) {
          logger.info(
            'Anasayfa bundle: Redis HIT (anahtar=%s)',
            HOMEPAGE_BUNDLE_CACHE_KEY
          );
          return { status: 200, body: cached };
        }
        logger.info(
          'Anasayfa bundle: Redis MISS (anahtar yok veya boş), DB’den üretiliyor'
        );
      } catch (e) {
        logger.warn(
          'Anasayfa bundle: Redis okuma hatası, DB’den üretilecek — %s',
          e.message
        );
      }
    } else {
      logger.info(
        'Anasayfa bundle: Redis bağlı değil, yanıt doğrudan DB’den üretiliyor'
      );
    }

    const body = await this.buildHomepageBundleBody();

    if (redisClient.isConnected && ttl > 0) {
      try {
        await redisClient.set(HOMEPAGE_BUNDLE_CACHE_KEY, body, ttl);
        logger.info(
          'Anasayfa bundle: Redis’e yazıldı (TTL=%ds, anahtar=%s)',
          ttl,
          HOMEPAGE_BUNDLE_CACHE_KEY
        );
      } catch (e) {
        logger.warn('Anasayfa bundle Redis yazma atlandı: %s', e.message);
      }
    }

    return { status: 200, body };
  }

  async clearCache() {
    if (!redisClient.isConnected) return;
    try {
      await redisClient.del(HOMEPAGE_BUNDLE_CACHE_KEY);
    } catch (e) {
      logger.warn('Anasayfa bundle Redis silme atlandı: %s', e.message);
    }
  }
}

module.exports = new PublicHomepageService();


