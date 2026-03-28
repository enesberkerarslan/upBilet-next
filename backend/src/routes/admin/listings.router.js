const express = require('express');
const router = express.Router();
const listingController = require('../../controllers/admin/listing.controller');
const { protect } = require('../../middleware/auth.middleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

// Tüm ilanları getir
router.get('/get-all-listings', listingController.getAllListings);

// ID'ye göre ilan getir
router.get('/get-listing-by-id/:id', listingController.getListingById);

// Event ID'ye göre ilanları getir
router.get('/get-listings-by-event/:eventId', listingController.getListingsByEventId);

// Yeni ilan oluştur
router.post('/create-listing', listingController.createListing);

// İlan güncelle
router.put('/update-listing/:id', listingController.updateListing);

// İlan sil
router.delete('/delete-listing/:id', listingController.deleteListing);

// İlan ara
router.get('/search-listings', listingController.searchListings);

// İlan durumunu değiştir (active ↔ inactive)
router.patch('/status-change/:id', listingController.toggleListingStatus);

// Üye + etkinlik için toplu yayınla / durdur (admin)
router.patch('/toggle-all-member-event', listingController.toggleAllMemberEventListings);

module.exports = router; 