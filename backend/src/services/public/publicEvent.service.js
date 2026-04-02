const Event = require('../../models/event.model');
const Listing = require('../../models/listings.model');
const mongoose = require('mongoose');
const Tag = require('../../models/tag.model');
const VenueStructure = require('../../models/venueStructure.model');
const redisClient = require('../../config/redis');
const { publicReadCacheTtlSec } = require('../../config/publicReadCacheTtl');
const { logger } = require('../../utils/logger');

function publicEventMainpageMainpageKey(tagName) {
  return `public:events:mp-main:${String(tagName || '').toLowerCase()}`;
}

function publicEventLatestKey(tagName) {
  return `public:events:latest:${String(tagName || '').toLowerCase()}`;
}

function publicEventSlugKey(slug) {
  return `public:events:slug:${String(slug || '').toLowerCase()}`;
}

function publicEventListingsKey(eventId) {
  return `public:events:listings:${String(eventId)}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class PublicEventService {
  async getAllEvents() {
    const events = await Event.find({ status: 'active' })
      .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
      .sort({ date: 1 })
      .populate('tags', 'name tag');

    return {
      status: 200,
      body: {
        success: true,
        events,
      },
    };
  }

  async getEventsByTag(tagId) {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Geçersiz tag ID formatı.',
        },
      };
    }

    const tagObjectId = new mongoose.Types.ObjectId(tagId);
    const events = await Event.find({
      tags: tagObjectId,
      status: 'active',
    })
      .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
      .sort({ date: 1 })
      .populate('tags', 'name tag');

    return {
      status: 200,
      body: {
        success: true,
        events,
      },
    };
  }

  async getMainPageEventsByTag(tagName) {
    try {
      const normalized = String(tagName || '').toLowerCase();
      const tag = await Tag.findOne({
        status: 'active',
        $or: [
          { slug: normalized },
          { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } },
        ],
      });

      if (!tag) {
        return {
          status: 404,
          body: {
            success: false,
            error: 'Tag bulunamadı.',
          },
        };
      }

      const events = await Event.find({
        tags: tag._id,
        status: 'active',
        isMainPage: false,
      })
        .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
        .sort({ date: 1 })
        .limit(4)
        .populate('tags', 'name tag');

      return {
        status: 200,
        body: {
          success: true,
          events,
          tag: {
            id: tag._id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            metaTitle: tag.metaTitle,
            metaDescription: tag.metaDescription,
            keywords: tag.keywords,
          },
        },
      };
    } catch (error) {
      console.error('Tag ile etkinlik getirme hatası:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlikler getirilirken bir hata oluştu.',
        },
      };
    }
  }

  /** Önbelleksiz: mainpage/tag/:tagName/mainpage */
  async _getMainPageEventsByTagMainPageCore(tagName) {
    try {
      const normalized = String(tagName || '').toLowerCase();
      const tag = await Tag.findOne({
        status: 'active',
        $or: [
          { slug: normalized },
          { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } },
        ],
      });

      if (!tag) {
        return {
          status: 404,
          body: {
            success: false,
            error: 'Tag bulunamadı.',
          },
        };
      }

      let events = await Event.find({
        tags: tag._id,
        status: 'active',
        isMainPage: true,
      })
        .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
        .sort({ date: 1 })
        .limit(4)
        .populate('tags', 'name tag');

      if (!events || events.length === 0) {
        events = await Event.find({
          tags: tag._id,
          status: 'active',
        })
          .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
          .sort({ date: 1 })
          .limit(20)
          .populate('tags', 'name tag');

        if (events && events.length > 0) {
          const shuffled = events.sort(() => 0.5 - Math.random());
          events = shuffled.slice(0, 4);
        }
      }

      return {
        status: 200,
        body: {
          success: true,
          events,
          tag: {
            id: tag._id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            metaTitle: tag.metaTitle,
            metaDescription: tag.metaDescription,
            keywords: tag.keywords,
          },
        },
      };
    } catch (error) {
      console.error('Tag ile main page etkinlik getirme hatası:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlikler getirilirken bir hata oluştu.',
        },
      };
    }
  }

  async getMainPageEventsByTagMainPage(tagName) {
    const ttl = publicReadCacheTtlSec();
    const key = publicEventMainpageMainpageKey(tagName);

    if (redisClient.isConnected) {
      try {
        const cached = await redisClient.get(key);
        if (
          cached &&
          typeof cached === 'object' &&
          'status' in cached &&
          'body' in cached
        ) {
          logger.info(
            'Public events mainpage/mainpage: Redis HIT (anahtar=%s)',
            key
          );
          return cached;
        }
        logger.info(
          'Public events mainpage/mainpage: Redis MISS (anahtar=%s)',
          key
        );
      } catch (e) {
        logger.warn(
          'Public events mainpage/mainpage: Redis okuma hatası — %s',
          e.message
        );
      }
    } else {
      logger.info(
        'Public events mainpage/mainpage: Redis bağlı değil (anahtar=%s)',
        key
      );
    }

    const result = await this._getMainPageEventsByTagMainPageCore(tagName);

    if (result.status === 200 && redisClient.isConnected && ttl > 0) {
      try {
        await redisClient.set(key, result, ttl);
        logger.info(
          'Public events mainpage/mainpage: Redis’e yazıldı (TTL=%ds, anahtar=%s)',
          ttl,
          key
        );
      } catch (e) {
        logger.warn(
          'Public events mainpage/mainpage: Redis yazma atlandı — %s',
          e.message
        );
      }
    }

    return result;
  }

  async getMainPageEvents() {
    const events = await Event.find({
      status: 'active',
      isMainPage: true,
    })
      .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
      .sort({ date: 1 })
      .populate('tags', 'name tag');

    return {
      status: 200,
      body: {
        success: true,
        events,
      },
    };
  }

  async searchEvents(searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
      return {
        status: 200,
        body: {
          success: true,
          events: [],
        },
      };
    }

    const q = searchQuery.toString().trim();
    const safe = escapeRegex(q);
    const baseFilter = {
      status: 'active',
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { location: { $regex: safe, $options: 'i' } },
      ],
    };

    const totalCount = await Event.countDocuments(baseFilter);
    const events = await Event.find(baseFilter)
      .select(
        '-listingCount -salesCount -createdBy -createdAt -updatedAt -commission -comissionCustomer -status -metaTitle -metaDescription -description'
      )
      .sort({ date: 1 })
      .populate('tags', 'name tag')
      .limit(10)
      .lean();

    return {
      status: 200,
      body: {
        success: true,
        events,
        totalCount,
        returnedCount: events.length,
      },
    };
  }

  async getVenueStructure(venueId) {
    try {
      const venueStructure = await VenueStructure.findOne({ venueId })
        .populate('venueId', 'name')
        .populate({
          path: 'categories',
          populate: {
            path: 'blocks',
            model: 'Block',
          },
        });

      if (!venueStructure) {
        return {
          success: false,
          message: 'Venue structure not found',
        };
      }

      return {
        success: true,
        venueStructure,
      };
    } catch (error) {
      throw error;
    }
  }

  async getByEventId(eventId) {
    try {
      const event = await Event.findById(eventId).populate('tags', 'name tag');

      if (!event) {
        throw new Error('Event bulunamadı');
      }

      return event;
    } catch (error) {
      console.error('Event getirilirken hata:', error);
      throw error;
    }
  }

  /** Önbelleksiz: slug/:slug */
  async _getEventBySlugCore(slug) {
    try {
      const event = await Event.findOne({
        slug,
        status: 'active',
      })
        .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
        .populate('tags', 'name tag slug');

      if (!event) {
        return {
          status: 404,
          body: {
            success: false,
            error: 'Etkinlik bulunamadı',
          },
        };
      }

      return {
        status: 200,
        body: {
          success: true,
          event,
        },
      };
    } catch (error) {
      console.error('Slug ile event getirilirken hata:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlik getirilirken bir hata oluştu',
        },
      };
    }
  }

  async getEventBySlug(slug) {
    const ttl = publicReadCacheTtlSec();
    const key = publicEventSlugKey(slug);

    if (redisClient.isConnected) {
      try {
        const cached = await redisClient.get(key);
        if (
          cached &&
          typeof cached === 'object' &&
          'status' in cached &&
          'body' in cached
        ) {
          logger.info('Public events slug: Redis HIT (anahtar=%s)', key);
          return cached;
        }
        logger.info('Public events slug: Redis MISS (anahtar=%s)', key);
      } catch (e) {
        logger.warn('Public events slug: Redis okuma hatası — %s', e.message);
      }
    } else {
      logger.info('Public events slug: Redis bağlı değil (anahtar=%s)', key);
    }

    const result = await this._getEventBySlugCore(slug);

    if (result.status === 200 && redisClient.isConnected && ttl > 0) {
      try {
        await redisClient.set(key, result, ttl);
        logger.info(
          'Public events slug: Redis’e yazıldı (TTL=%ds, anahtar=%s)',
          ttl,
          key
        );
      } catch (e) {
        logger.warn('Public events slug: Redis yazma atlandı — %s', e.message);
      }
    }

    return result;
  }

  /** Önbelleksiz: getListingByEventId/:eventId (valid ObjectId varsayılır) */
  async _getListingByEventIdCore(eventId) {
    const listings = await Listing.find({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'active',
    })
      .select('_id eventId price ticketType quantity category block row status')
      .sort({ price: 1 });

    if (!listings || listings.length === 0) {
      return {
        success: true,
        listing: [],
        message: 'Bu etkinlik için aktif ilan bulunamadı',
      };
    }

    return {
      success: true,
      listing: listings,
    };
  }

  async getListingByEventId(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Geçersiz event ID formatı');
    }

    const ttl = publicReadCacheTtlSec();
    const key = publicEventListingsKey(eventId);

    if (redisClient.isConnected) {
      try {
        const cached = await redisClient.get(key);
        if (
          cached &&
          typeof cached === 'object' &&
          cached.success === true &&
          Array.isArray(cached.listing)
        ) {
          logger.info('Public events listings: Redis HIT (anahtar=%s)', key);
          return cached;
        }
        logger.info('Public events listings: Redis MISS (anahtar=%s)', key);
      } catch (e) {
        logger.warn('Public events listings: Redis okuma hatası — %s', e.message);
      }
    } else {
      logger.info('Public events listings: Redis bağlı değil (anahtar=%s)', key);
    }

    try {
      const result = await this._getListingByEventIdCore(eventId);
      if (redisClient.isConnected && ttl > 0) {
        try {
          await redisClient.set(key, result, ttl);
          logger.info(
            'Public events listings: Redis’e yazıldı (TTL=%ds, anahtar=%s)',
            ttl,
            key
          );
        } catch (e) {
          logger.warn(
            'Public events listings: Redis yazma atlandı — %s',
            e.message
          );
        }
      }
      return result;
    } catch (error) {
      console.error('İlanlar getirilirken hata:', error);
      throw error;
    }
  }

  async getListingById(listingId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return {
          success: false,
          status: 400,
          message: 'Geçersiz listing ID formatı',
        };
      }
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return {
          success: false,
          status: 404,
          message: 'İlan bulunamadı',
        };
      }
      return {
        success: true,
        status: 200,
        listing,
      };
    } catch (error) {
      console.error('Listing getirilirken hata:', error);
      return {
        success: false,
        status: 500,
        message: 'İlan getirilirken bir hata oluştu',
      };
    }
  }

  /** Önbelleksiz: latest/:tagName */
  async _getLatestEventsCore(tagName) {
    try {
      let query = { status: 'active' };

      if (tagName) {
        const normalized = String(tagName || '').toLowerCase();
        const tag = await Tag.findOne({
          status: 'active',
          $or: [
            { slug: normalized },
            { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } },
          ],
        });

        if (!tag) {
          return {
            status: 404,
            body: {
              success: false,
              error: `'${tagName}' tag'i bulunamadı.`,
            },
          };
        }

        query.tags = tag._id;
      }

      const events = await Event.find(query)
        .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
        .sort({ date: 1 })
        .limit(6)
        .populate('tags', 'name tag');

      return {
        status: 200,
        body: {
          success: true,
          events,
        },
      };
    } catch (error) {
      console.error('Son etkinlikler getirilirken hata:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Son etkinlikler getirilirken bir hata oluştu.',
        },
      };
    }
  }

  async getLatestEvents(tagName) {
    const ttl = publicReadCacheTtlSec();
    const key = publicEventLatestKey(tagName);

    if (redisClient.isConnected) {
      try {
        const cached = await redisClient.get(key);
        if (
          cached &&
          typeof cached === 'object' &&
          'status' in cached &&
          'body' in cached
        ) {
          logger.info('Public events latest: Redis HIT (anahtar=%s)', key);
          return cached;
        }
        logger.info('Public events latest: Redis MISS (anahtar=%s)', key);
      } catch (e) {
        logger.warn('Public events latest: Redis okuma hatası — %s', e.message);
      }
    } else {
      logger.info('Public events latest: Redis bağlı değil (anahtar=%s)', key);
    }

    const result = await this._getLatestEventsCore(tagName);

    if (result.status === 200 && redisClient.isConnected && ttl > 0) {
      try {
        await redisClient.set(key, result, ttl);
        logger.info(
          'Public events latest: Redis’e yazıldı (TTL=%ds, anahtar=%s)',
          ttl,
          key
        );
      } catch (e) {
        logger.warn('Public events latest: Redis yazma atlandı — %s', e.message);
      }
    }

    return result;
  }

  async clearEventCache() {}

  async clearEventCacheById() {}

  async clearSearchCache() {}

  async clearTagCache() {}

  async clearListingCache() {}

  async clearLatestEventsCache() {}
}

module.exports = new PublicEventService();
