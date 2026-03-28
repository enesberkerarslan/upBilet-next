const listingService = require('../../services/admin/listings.service');
const publicEventService = require('../../services/public/publicEvent.service');
const { logger } = require('../../utils/logger');

class ListingController {
  // Tüm ilanları getir
  async getAllListings(req, res) {
    try {
      const { status, eventId, category, memberId } = req.query;

      const filter = {};
      if (status) {
        if (!['active', 'inactive'].includes(status)) {
          logger.warn('Geçersiz status parametresi', { status });
          return res.status(400).json({
            message: 'Geçersiz status parametresi. Status "active" veya "inactive" olmalıdır.',
          });
        }
        filter.status = status;
      }
      if (eventId) filter.eventId = eventId;
      if (category) filter.category = category;
      if (memberId) filter.memberId = memberId;

      const listings = await listingService.getAllListings(filter);
      res.status(200).json(listings);
    } catch (error) {
      logger.error('ListingController: İlanlar getirilirken hata oluştu', {
        error: error.message,
        stack: error.stack,
        query: req.query,
        userId: req.user?._id
      });
      
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

  // ID'ye göre ilan getir
  async getListingById(req, res) {
    try {
      const listing = await listingService.getListingById(req.params.id);
      res.json(listing);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Event ID'ye göre ilanları getir
  async getListingsByEventId(req, res) {
    try {
      const listings = await listingService.getListingsByEventId(req.params.eventId);
      res.json(listings);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Yeni ilan oluştur (sadece admin — backoffice)
  async createListing(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekir' });
      }
      const listing = await listingService.createAdminListing(req.body);
      if (listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      res.status(201).json(listing);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // İlan güncelle
  async updateListing(req, res) {
    try {
      const listing = await listingService.updateListing(req.params.id, req.body);
      
      // İlan güncellendiğinde event'in ilan cache'ini temizle
      if (listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // İlan sil
  async deleteListing(req, res) {
    try {
      // Önce ilanı al (eventId için)
      const listing = await listingService.getListingById(req.params.id);
      
      await listingService.deleteListing(req.params.id);
      
      // İlan silindiğinde event'in ilan cache'ini temizle
      if (listing && listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      
      res.status(204).send();
    } catch (error) {
      const msg = error.message || '';
      if (msg === 'Listing not found') {
        return res.status(404).json({ message: msg });
      }
      if (msg.includes('satılmış bilet') || msg.includes('silinemez')) {
        return res.status(400).json({ message: msg });
      }
      return res.status(400).json({ message: msg });
    }
  }

  // Satılan bilet sayısını güncelle
  async updateSoldTickets(req, res) {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Geçerli bir bilet miktarı belirtilmelidir' });
      }

      const listing = await listingService.updateSoldTickets(req.params.id, quantity);
      
      // Bilet satışı güncellendiğinde event'in ilan cache'ini temizle
      if (listing && listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // İlan durumunu güncelle
  async updateListingStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Geçersiz durum değeri' });
      }

      const listing = await listingService.updateListing(req.params.id, { status });
      
      // İlan durumu güncellendiğinde event'in ilan cache'ini temizle
      if (listing && listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // İlan ara
  async searchListings(req, res) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: 'Arama sorgusu gereklidir' });
      }

      const listings = await listingService.searchListings(query);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // İlan durumunu değiştir
  async toggleListingStatus(req, res) {
    try {
      const listing = await listingService.toggleListingStatus(req.params.id);
      
      // İlan durumu değiştirildiğinde event'in ilan cache'ini temizle
      if (listing && listing.eventId) {
        await publicEventService.clearListingCache(listing.eventId);
      }
      
      res.json(listing);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /** Body: { memberId, eventId, status: 'active' | 'inactive' } */
  async toggleAllMemberEventListings(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekir' });
      }
      const { memberId, eventId, status } = req.body || {};
      if (!memberId || !eventId || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          message: 'memberId, eventId ve status (active veya inactive) zorunludur',
        });
      }
      const out = await listingService.toggleAllListingsByMemberEvent(memberId, eventId, status);
      await publicEventService.clearListingCache(eventId);
      res.json({ success: true, modifiedCount: out.modifiedCount });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ListingController(); 