const eventService = require('../../services/admin/event.service');
const publicEventService = require('../../services/public/publicEvent.service');
const { logger } = require('../../utils/logger');

class EventController {
  // Tüm etkinlikleri getir
  async getAllEvents(req, res) {
    try {
      

      // Query parametrelerini kontrol et
      const { status, search } = req.query;
      if (status && !['active', 'inactive'].includes(status)) {
        logger.warn('Geçersiz status parametresi', { status });
        return res.status(400).json({ 
          message: 'Geçersiz status parametresi. Status "active" veya "inactive" olmalıdır.' 
        });
      }

      const events = await eventService.getAllEvents(req.query);
      
      // Boş array dönüyorsa 200 OK ile dön
      res.status(200).json(events);
    } catch (error) {
      logger.error('EventController: Etkinlikler getirilirken hata oluştu', {
        error: error.message,
        stack: error.stack,
        query: req.query,
        userId: req.user?._id,
        errorName: error.name
      });
      
      // Hata tipine göre status code belirle
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      
      res.status(statusCode).json({ 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack
        } : undefined
      });
    }
  }

  // ID'ye göre etkinlik getir
  async getEventById(req, res) {
    try {
      const event = await eventService.getEventById(req.params.id);
      res.json(event);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Slug'a göre etkinlik getir
  async getEventBySlug(req, res) {
    try {
      const event = await eventService.getEventBySlug(req.params.slug);
      res.json(event);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Yeni etkinlik oluştur
  async createEvent(req, res) {
    try {
      const event = await eventService.createEvent(req.body, req.user._id);
      
      // Yeni event oluşturulduğunda cache'i temizle
      await publicEventService.clearEventCache();
      
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Etkinlik güncelle
  async updateEvent(req, res) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body);
      
      // Event güncellendiğinde belirli event'in cache'ini temizle
      await publicEventService.clearEventCacheById(req.params.id);
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Etkinlik sil
  async deleteEvent(req, res) {
    try {
      await eventService.deleteEvent(req.params.id);
      
      // Event silindiğinde belirli event'in cache'ini temizle
      await publicEventService.clearEventCacheById(req.params.id);
      
      res.status(204).send();
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('bulunamadı')) {
        return res.status(404).json({ message: msg });
      }
      return res.status(400).json({ message: msg });
    }
  }

  // Etkinlik durumunu güncelle
  async updateEventStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Geçersiz durum değeri' });
      }

      const event = await eventService.updateEventStatus(req.params.id, status);
      
      // Event durumu güncellendiğinde belirli event'in cache'ini temizle
      await publicEventService.clearEventCacheById(req.params.id);
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Etkinlik istatistiklerini güncelle
  async updateEventStats(req, res) {
    try {
      const { listingCount, salesCount } = req.body;
      const event = await eventService.updateEventStats(req.params.id, {
        listingCount,
        salesCount
      });
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Etiket bazlı etkinlikleri getir
  async getEventsByTag(req, res) {
    try {
      const { tag } = req.params;
      const { limit, status, sort } = req.query;
      
      const events = await eventService.getEventsByTag(tag, {
        limit: limit ? parseInt(limit) : undefined,
        status,
        sort
      });
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Cache temizleme endpoint'leri
  async clearEventCache(req, res) {
    try {
      await publicEventService.clearEventCache();
      res.json({ success: true, message: 'Event cache temizlendi' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async clearSearchCache(req, res) {
    try {
      await publicEventService.clearSearchCache();
      res.json({ success: true, message: 'Arama cache temizlendi' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new EventController(); 