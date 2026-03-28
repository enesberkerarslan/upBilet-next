const Event = require('../../models/event.model');
const Listing = require('../../models/listings.model');
const mongoose = require('mongoose');
const Tag = require('../../models/tag.model');
const VenueStructure = require('../../models/venueStructure.model');
const cacheService = require('../../utils/cache');
const { logger } = require('../../utils/logger');

class PublicEventService {
  // Tüm etkinlikleri tarihe göre sıralı getir
  async getAllEvents() {
    const events = await Event.find({ status: 'active' })
      .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
      .sort({ date: 1 })
      .populate('tags', 'name tag');

    return {
      status: 200,
      body: {
        success: true,
        events
      }
    };
  }

  // Tag'e göre etkinlikleri getir
  async getEventsByTag(tagId) {
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Geçersiz tag ID formatı.'
        }
      };
    }
    
    const cacheKey = cacheService.getEventsByTagKey(tagId);
    
    return await cacheService.cacheWrapper(
      cacheKey,
      async () => {
        const tagObjectId = new mongoose.Types.ObjectId(tagId);
        const events = await Event.find({
          tags: tagObjectId,
          status: 'active'
        })
          .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
          .sort({ date: 1 })
          .populate('tags', 'name tag');

        return {
          status: 200,
          body: {
            success: true,
            events
          }
        };
      },
      1800 // 30 dakika cache
    );
  }

  // Ana sayfa için tag'e göre main page etkinliklerini getir
  async getMainPageEventsByTag(tagName) {
    try {
      const cacheKey = cacheService.getMainPageEventsKey(tagName);
      
      return await cacheService.cacheWrapper(
        cacheKey,
        async () => {
          // Önce tag'i name'e göre bul
          const normalized = String(tagName || '').toLowerCase();
          const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const tag = await Tag.findOne({
            status: 'active',
            $or: [
              { slug: normalized },
              { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } }
            ]
          });
          
          if (!tag) {
            return {
              status: 404,
              body: {
                success: false,
                error: 'Tag bulunamadı.'
              }
            };
          }
          
          // Tag ID'si ile etkinlikleri bul
          const events = await Event.find({
            tags: tag._id,
            status: 'active',
            isMainPage: false
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
                metaDescription: tag.metaDescription
              }
            }
          };
        },
        1800 // 30 dakika cache
      );
    } catch (error) {
      console.error('Tag ile etkinlik getirme hatası:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlikler getirilirken bir hata oluştu.'
        }
      };
    }
  }

  // Ana sayfa için tag'e göre main page etkinliklerini getir (sadece isMainPage: true)
  async getMainPageEventsByTagMainPage(tagName) {
    try {
      const cacheKey = cacheService.getMainPageEventsKey(tagName + '_mainpage');
      
      return await cacheService.cacheWrapper(
        cacheKey,
        async () => {
          // Önce tag'i name'e göre bul
          const normalized = String(tagName || '').toLowerCase();
          const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const tag = await Tag.findOne({
            status: 'active',
            $or: [
              { slug: normalized },
              { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } }
            ]
          });
          
          if (!tag) {
            return {
              status: 404,
              body: {
                success: false,
                error: 'Tag bulunamadı.'
              }
            };
          }
          
          // Tag ID'si ile etkinlikleri bul (sadece isMainPage: true olanlar)
          let events = await Event.find({
            tags: tag._id,
            status: 'active',
            isMainPage: true
          })
            .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
            .sort({ date: 1 })
            .limit(4)
            .populate('tags', 'name tag');

          // Eğer öne çıkan etkinlik yoksa, random 4 etkinlik getir
          if (!events || events.length === 0) {
            events = await Event.find({
              tags: tag._id,
              status: 'active'
            })
              .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
              .sort({ date: 1 })
              .limit(20) // Daha fazla etkinlik getir
              .populate('tags', 'name tag');

            // Random 4 tane seç
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
                metaDescription: tag.metaDescription
              }
            }
          };
        },
        1800 // 30 dakika cache
      );
    } catch (error) {
      console.error('Tag ile main page etkinlik getirme hatası:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlikler getirilirken bir hata oluştu.'
        }
      };
    }
  }

  // Ana sayfa için tüm main page etkinliklerini getir
  async getMainPageEvents() {
    const cacheKey = cacheService.getMainPageEventsKey();
    
    return await cacheService.cacheWrapper(
      cacheKey,
      async () => {
        const events = await Event.find({
          status: 'active',
          isMainPage: true
        })
          .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
          .sort({ date: 1 })
          .populate('tags', 'name tag');

        return {
          status: 200,
          body: {
            success: true,
            events
          }
        };
      },
      1800 // 30 dakika cache
    );
  }

  // Etkinlik arama
  async searchEvents(searchQuery) {
    // searchQuery kontrolü
    if (!searchQuery || searchQuery.trim() === '') {
      return {
        status: 200,
        body: {
          success: true,
          events: []
        }
      };
    }

    // Önce cache'den arama yap
    const cachedResult = await cacheService.searchEventsFromCache(searchQuery);
    if (cachedResult) {
      logger.info(`CACHE HIT: Arama sonucu cache'den alındı: ${searchQuery}`);
      return cachedResult;
    }

    // Cache'de yoksa DB'den tüm event'leri al ve cache'e kaydet
    logger.info(`CACHE MISS: Tüm event'ler DB'den alınıyor ve cache'e kaydediliyor`);
    
    const allEvents = await Event.find({ status: 'active' })
      .select('-listingCount -salesCount -createdBy -createdAt -updatedAt -commission -comissionCustomer -status -metaTitle -metaDescription -description')
      .sort({ date: 1 })
      .populate('tags', 'name tag');

    // Tüm event'leri cache'e kaydet
    await cacheService.setAllEvents(allEvents, 3600); // 1 saat

    // Şimdi cache'den arama yap
    const result = await cacheService.searchEventsFromCache(searchQuery);
    logger.info(`CACHE SAVED: Tüm event'ler cache'e kaydedildi, arama sonucu döndürülüyor`);
    
    return result;
  }

  async getVenueStructure(venueId) {
    try {
      const venueStructure = await VenueStructure.findOne({ venueId })
        .populate('venueId', 'name')
        .populate({
          path: 'categories',
          populate: {
            path: 'blocks',
            model: 'Block'
          }
        });

      if (!venueStructure) {
        return {
          success: false,
          message: 'Venue structure not found'
        };
      }

      return {
        success: true,
        venueStructure
      };
    } catch (error) {
      throw error;
    }
  }

  // Event ID'ye göre event bilgilerini getir
  async getByEventId(eventId) {
    try {
      const event = await Event.findById(eventId)
        .populate('tags', 'name tag')

      if (!event) {
        throw new Error('Event bulunamadı')
      }

      return event
    } catch (error) {
      console.error('Event getirilirken hata:', error)
      throw error
    }
  }

  // Slug'a göre event bilgilerini getir
  async getEventBySlug(slug) {
    try {
      const cacheKey = cacheService.getEventBySlugKey(slug);
      
      return await cacheService.cacheWrapper(
        cacheKey,
        async () => {
          const event = await Event.findOne({
            slug: slug,
            status: 'active'
          })
            .select('-listingCount -salesCount -createdBy -createdAt -updatedAt')
            .populate('tags', 'name tag')

          if (!event) {
            return {
              status: 404,
              body: {
                success: false,
                error: 'Etkinlik bulunamadı'
              }
            }
          }

          return {
            status: 200,
            body: {
              success: true,
              event
            }
          }
        },
        1800 // 30 dakika cache
      );
    } catch (error) {
      console.error('Slug ile event getirilirken hata:', error)
      return {
        status: 500,
        body: {
          success: false,
          error: 'Etkinlik getirilirken bir hata oluştu'
        }
      }
    }
  }

  // Event ID'ye göre ilanları getir
  async getListingByEventId(eventId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error('Geçersiz event ID formatı')
      }

      const cacheKey = cacheService.getListingsByEventIdKey(eventId);
      
      return await cacheService.cacheWrapper(
        cacheKey,
        async () => {
          const listings = await Listing.find({
            eventId: new mongoose.Types.ObjectId(eventId),
            status: 'active'
          })
            .select('_id eventId price ticketType quantity category block row status')
            .sort({ price: 1 });

          if (!listings || listings.length === 0) {
            return {
              success: true,
              listing: [],
              message: 'Bu etkinlik için aktif ilan bulunamadı'
            }
          }

          return {
            success: true,
            listing: listings
          }
        },
        900 // 15 dakika cache (ilanlar daha sık değişebilir)
      );
    } catch (error) {
      console.error('İlanlar getirilirken hata:', error)
      throw error
    }
  }

  // Listing ID'ye göre ilan getir
  async getListingById(listingId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return {
          success: false,
          status: 400,
          message: 'Geçersiz listing ID formatı'
        };
      }
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return {
          success: false,
          status: 404,
          message: 'İlan bulunamadı'
        };
      }
      return {
        success: true,
        status: 200,
        listing
      };
    } catch (error) {
      console.error('Listing getirilirken hata:', error);
      return {
        success: false,
        status: 500,
        message: 'İlan getirilirken bir hata oluştu'
      };
    }
  }

  // Son 5 etkinliği getir
  async getLatestEvents(tagName) {
    try {
      // Cache key oluştur
      const cacheKey = cacheService.generateKey('events:latest', { tag: tagName || 'all' });
      
      return await cacheService.cacheWrapper(
        cacheKey,
        async () => {
          let query = { status: 'active' };

          // Eğer tag adı verilmişse, o tag'e göre filtrele
          if (tagName) {
            // Önce tag'i name veya slug'a göre bul
            const normalized = String(tagName || '').toLowerCase();
            const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const tag = await Tag.findOne({
              status: 'active',
              $or: [
                { slug: normalized },
                { name: { $regex: `^${escapeRegex(String(tagName))}$`, $options: 'i' } }
              ]
            });

            if (!tag) {
              return {
                status: 404,
                body: {
                  success: false,
                  error: `'${tagName}' tag'i bulunamadı.`
                }
              };
            }

            // Tag ID'si ile filtrele
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
              events
            }
          };
        },
        900 // 15 dakika cache (latest events daha sık güncellenebilir)
      );
    } catch (error) {
      console.error('Son etkinlikler getirilirken hata:', error);
      return {
        status: 500,
        body: {
          success: false,
          error: 'Son etkinlikler getirilirken bir hata oluştu.'
        }
      };
    }
  }

  // Cache temizleme fonksiyonları
  async clearEventCache() {
    await cacheService.clearEventCache();
  }

  async clearEventCacheById(eventId) {
    await cacheService.clearEventCacheById(eventId);
  }

  async clearSearchCache() {
    // Arama cache'lerini temizle
    await cacheService.delPattern('event:search:*');
  }

  async clearTagCache(tagId = null) {
    if (tagId) {
      await cacheService.del(cacheService.getEventsByTagKey(tagId));
    } else {
      await cacheService.delPattern('events:tag:*');
    }
  }

  async clearListingCache(eventId = null) {
    await cacheService.clearListingCache(eventId);
  }

  async clearLatestEventsCache(tagName = null) {
    if (tagName) {
      // Belirli tag için latest events cache'ini temizle
      const cacheKey = cacheService.generateKey('events:latest', { tag: tagName });
      await cacheService.del(cacheKey);
    } else {
      // Tüm latest events cache'lerini temizle
      await cacheService.delPattern('events:latest:*');
    }
  }
}

module.exports = new PublicEventService(); 