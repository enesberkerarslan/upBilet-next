const memberListingService = require('../../services/member/memberListing.service');
const publicEventService = require('../../services/public/publicEvent.service');
const catchAsync = require('../../utils/catch.async');

const memberListingController = {
  addListing: async (req, res) => {
    try {
      const result = await memberListingService.addListing(req.member._id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Yeni ilan oluşturulduğunda event'in ilan cache'ini temizle
      if (result.listing && result.listing.eventId) {
        await publicEventService.clearListingCache(result.listing.eventId);
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'İlan oluşturulurken bir hata oluştu'
      });
    }
  },
  getAllListings: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await memberListingService.getAllListings(req.member._id, page, limit);
    res.status(result.status).json(result.body);
  }),
  updateListing: catchAsync(async (req, res) => {
    const result = await memberListingService.updateListing(req.member._id, req.params.listingId, req.body);
    
    // Debug log
    
    // İlan güncellendiğinde event'in ilan cache'ini temizle
    if (result.body && result.body.listing && result.body.listing.eventId) {
      console.log('Clearing cache for eventId:', result.body.listing.eventId);
      await publicEventService.clearListingCache(result.body.listing.eventId);
    } else {
      console.log('No eventId found in result:', result.body);
    }
    
    res.status(result.status).json(result.body);
  }),
  getListingsByEvent: catchAsync(async (req, res) => {
    const result = await memberListingService.getListingsByEvent(req.member._id, req.params.eventId);
    res.status(result.status).json(result.body);
  }),

  toggleAllListingsByEvent: catchAsync(async (req, res) => {
    const result = await memberListingService.toggleAllListingsByEvent(
      req.member._id,
      req.params.eventId,
      req.body.status
    );
    res.status(result.status).json(result.body);
  }),

  deleteListing: catchAsync(async (req, res) => {
    const result = await memberListingService.deleteListing(req.member._id, req.params.listingId);
    res.status(result.status).json(result.body);
  }),

  toggleListingStatus: catchAsync(async (req, res) => {
    const result = await memberListingService.toggleListingStatus(req.member._id, req.params.listingId);
    
    // İlan durumu değiştirildiğinde event'in ilan cache'ini temizle
    if (result.body && result.body.listing && result.body.listing.eventId) {
      await publicEventService.clearListingCache(result.body.listing.eventId);
    }
    
    res.status(result.status).json(result.body);
  }),
};

module.exports = memberListingController; 