const Event = require('../../models/event.model');
const Listing = require('../../models/listings.model');
const { logger } = require('../../utils/logger');
const { assignEventSlug } = require('../../utils/eventSlug');

class EventService {
  // Tüm etkinlikleri getir
  async getAllEvents(query = {}) {
    //console.log('getAllEvents fonksiyonu çağrıldı');
    try {
      const { status, search, sort = 'date' } = query;
      
      //logger.info('EventService: Etkinlikler getiriliyor', {
      //  filters: { status, search, sort },
      //  query: query
      //});
      
      const totalCount = await Event.countDocuments();

      // Filtreleme
      const filter = {};
      
      // Status filtresi
      if (status) {
        filter.status = status;
        //logger.debug('Status filtresi eklendi:', { status });
      }
      
      // Arama filtresi
      if (search) {
        // Text search yerine regex kullan
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
        logger.debug('Arama filtresi eklendi:', { search });
      }
      
      //logger.debug('EventService: MongoDB sorgusu', {
      //  filter,
      //  sort,
      //  collection: 'events'
      //});
      
      // Etkinlikleri getir
      const events = await Event.find(filter)
        .sort(sort)
        .populate({
          path: 'tags',
          select: 'name',
          model: 'Tag'
        })
        .populate({
          path: 'createdBy',
          select: 'name email',
          model: 'User'
        })
        .lean();
      
      //logger.info('EventService: Etkinlikler başarıyla getirildi', {
      //  totalCount,
      //  filteredCount: events.length,
      //  filter: Object.keys(filter),
      //  allEvents: events.length > 0 ? events : null
      //});
      
      if (events.length === 0) {
        logger.warn('Hiç etkinlik bulunamadı', {
          filter,
          totalCount
        });
      }
      return events;
    } catch (error) {
      console.log('getAllEvents fonksiyonu hatası:', error);
      logger.error('EventService: Etkinlikler getirilirken hata oluştu', {
        error: error.message,
        stack: error.stack,
        query,
        errorName: error.name
      });
      
      throw new Error(`Etkinlikler getirilirken bir hata oluştu: ${error.message}`);
    }
  }

  // ID'ye göre etkinlik getir
  async getEventById(id) {
    try {
      const event = await Event.findById(id)
        .populate('tags', 'name tag slug')
        .populate('createdBy', 'name email')
        .lean();
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }
      return event;
    } catch (error) {
      throw new Error('Etkinlik getirilirken bir hata oluştu: ' + error.message);
    }
  }

  // Slug'a göre etkinlik getir
  async getEventBySlug(slug) {
    try {
      const event = await Event.findOne({ slug })
        .populate('tags', 'name tag slug')
        .populate('createdBy', 'name email')
        .lean();
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }
      
      return event;
    } catch (error) {
      throw new Error('Etkinlik getirilirken bir hata oluştu: ' + error.message);
    }
  }

  // Yeni etkinlik oluştur
  async createEvent(eventData, userId) {
    try {
      const slug = await assignEventSlug(
        { name: eventData.name, slug: eventData.slug },
        null
      );
      const event = new Event({
        ...eventData,
        slug,
        createdBy: userId,
      });

      await event.save();
      
      // Yeni event oluşturulduğunda cache'leri temizle
      await this.clearEventCaches();
      
      return this.getEventById(event._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu isimde bir etkinlik zaten mevcut');
      }
      throw new Error('Etkinlik oluşturulurken bir hata oluştu: ' + error.message);
    }
  }

  // Etkinlik güncelle
  async updateEvent(id, updateData) {
    try {
      const event = await Event.findById(id);
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }

      const nextName =
        updateData.name !== undefined ? updateData.name : event.name;
      let slugToSet;

      if (Object.prototype.hasOwnProperty.call(updateData, 'slug')) {
        slugToSet = await assignEventSlug(
          {
            name: nextName,
            slug:
              updateData.slug != null && String(updateData.slug).trim() !== ''
                ? updateData.slug
                : nextName,
          },
          id
        );
      } else if (
        updateData.name !== undefined &&
        updateData.name !== event.name
      ) {
        slugToSet = await assignEventSlug({ name: nextName, slug: null }, id);
      }

      Object.keys(updateData).forEach((key) => {
        if (key === 'createdBy' || key === '_id') return;
        if (key === 'slug') return;
        event[key] = updateData[key];
      });
      if (slugToSet !== undefined) {
        event.slug = slugToSet;
      }

      await event.save();
      
      // Event güncellendiğinde cache'leri temizle
      await this.clearEventCaches();
      
      return this.getEventById(event._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu isimde bir etkinlik zaten mevcut');
      }
      throw new Error('Etkinlik güncellenirken bir hata oluştu: ' + error.message);
    }
  }

  // Etkinlik sil
  async deleteEvent(id) {
    try {
      const event = await Event.findById(id);
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }

      const listingCount = await Listing.countDocuments({ eventId: id });
      if (listingCount > 0) {
        throw new Error(
          `Bu etkinliğe ait ${listingCount} ilan var. Etkinliği silmek için önce bu ilanları silin.`
        );
      }

      await event.deleteOne();
      
      // Event silindiğinde cache'leri temizle
      await this.clearEventCaches();
      
      return { message: 'Etkinlik başarıyla silindi' };
    } catch (error) {
      if (
        error.message === 'Etkinlik bulunamadı' ||
        (typeof error.message === 'string' && error.message.includes('önce bu ilanları silin'))
      ) {
        throw error;
      }
      throw new Error('Etkinlik silinirken bir hata oluştu: ' + error.message);
    }
  }

  // Etkinlik durumunu güncelle
  async updateEventStatus(id, status) {
    try {
      const event = await Event.findById(id);
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }
      
      event.status = status;
      await event.save();
      
      // Event durumu güncellendiğinde cache'leri temizle
      await this.clearEventCaches();
      
      return this.getEventById(event._id);
    } catch (error) {
      throw new Error('Etkinlik durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  }

  // Etkinlik istatistiklerini güncelle
  async updateEventStats(id, { listingCount, salesCount }) {
    try {
      const event = await Event.findById(id);
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }
      
      if (listingCount !== undefined) {
        event.listingCount = listingCount;
      }
      
      if (salesCount !== undefined) {
        event.salesCount = salesCount;
      }
      
      await event.save();
      
      // Event istatistikleri güncellendiğinde cache'leri temizle
      await this.clearEventCaches();
      
      return this.getEventById(event._id);
    } catch (error) {
      throw new Error('Etkinlik istatistikleri güncellenirken bir hata oluştu: ' + error.message);
    }
  }

  // Etiket bazlı etkinlikleri getir
  async getEventsByTag(tag, options = {}) {
    try {
      const { limit = 4, status = 'active', sort = '-createdAt' } = options;
      
      const events = await Event.find({
        status,
        tags: { $in: [tag] }
      })
      .populate('tags', 'name')
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(limit)
      .lean();

      return events;
    } catch (error) {
      throw new Error(`${tag} etkinlikleri getirilirken bir hata oluştu: ${error.message}`);
    }
  }

  async clearEventCaches() {}

  
}

module.exports = new EventService(); 