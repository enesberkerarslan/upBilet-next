const publicEventService = require('../../services/public/publicEvent.service');

class PublicEventController {
  // Tüm etkinlikleri getir
  async getAllEvents(req, res) {
    try {
      const result = await publicEventService.getAllEvents();
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Tag'e göre etkinlikleri getir
  async getEventsByTag(req, res) {
    try {
      const { tagId } = req.params;
      const result = await publicEventService.getEventsByTag(tagId);
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Ana sayfa için tag'e göre main page etkinliklerini getir
  async getMainPageEventsByTag(req, res) {
    try {
      const { tagName } = req.params;
      const result = await publicEventService.getMainPageEventsByTag(tagName);
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Ana sayfa için tag'e göre main page etkinliklerini getir (sadece isMainPage: true)
  async getMainPageEventsByTagMainPage(req, res) {
    try {
      const { tagName } = req.params;
      const result = await publicEventService.getMainPageEventsByTagMainPage(tagName);
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Ana sayfa için tüm main page etkinliklerini getir
  async getMainPageEvents(req, res) {
    try {
      const result = await publicEventService.getMainPageEvents();
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Etkinlik arama
  async searchEvents(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Arama sorgusu gerekli.'
        });
      }
      const result = await publicEventService.searchEvents(q);
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Venue yapısını getir
  async getVenueStructure(req, res) {
    try {
      const { venueId } = req.params;
      const result = await publicEventService.getVenueStructure(venueId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Event ID'ye göre ilanı getir
  async getListingByEventId(req, res) {
    try {
      const { eventId } = req.params
      const listing = await publicEventService.getListingByEventId(eventId)
      res.json(listing)
    } catch (error) {
      console.error('Event ID\'ye göre ilan getirilirken hata:', error)
      res.status(500).json({
        success: false,
        message: 'İlan getirilirken bir hata oluştu'
      })
    }
  }

  // Event ID'ye göre event bilgilerini getir
  async getByEventId(req, res) {
    try {
      const { eventId } = req.params
      const event = await publicEventService.getByEventId(eventId)

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event bulunamadı'
        })
      }

      res.json({
        success: true,
        event
      })
    } catch (error) {
      console.error('Event getirilirken hata:', error)
      res.status(500).json({
        success: false,
        message: 'Event getirilirken bir hata oluştu'
      })
    }
  }

  // Listing ID'ye göre ilan getir
  async getListingById(req, res) {
    try {
      const { listingId } = req.params;
      const result = await publicEventService.getListingById(listingId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Listing ID\'ye göre ilan getirilirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'İlan getirilirken bir hata oluştu'
      });
    }
  }

  // Son 5 etkinliği getir
  async getLatestEvents(req, res) {
    try {
      const { tagName } = req.params;
      const result = await publicEventService.getLatestEvents(tagName);
      res.status(result.status).json(result.body);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Slug'a göre event bilgilerini getir
  async getEventBySlug(req, res) {
    try {
      const { slug } = req.params
      const result = await publicEventService.getEventBySlug(slug)
      res.status(result.status).json(result.body)
    } catch (error) {
      console.error('Slug ile event getirilirken hata:', error)
      res.status(500).json({
        success: false,
        message: 'Event getirilirken bir hata oluştu'
      })
    }
  }
}

module.exports = new PublicEventController(); 