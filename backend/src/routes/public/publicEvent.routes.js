const express = require('express');
const router = express.Router();
const publicEventController = require('../../controllers/public/publicEvent.controller');

// Ana sayfa için tag'e göre main page etkinliklerini getir (daha spesifik route önce)
router.get('/mainpage/tag/:tagName', publicEventController.getMainPageEventsByTag);

// Ana sayfa için tag'e göre main page etkinliklerini getir (sadece isMainPage: true)
router.get('/mainpage/tag/:tagName/mainpage', publicEventController.getMainPageEventsByTagMainPage);

// Ana sayfa için tüm main page etkinliklerini getir
router.get('/mainpage', publicEventController.getMainPageEvents);

// Son 5 etkinliği getir
router.get('/latest/:tagName', publicEventController.getLatestEvents);

// Tüm etkinlikleri getir
router.get('/', publicEventController.getAllEvents);

// Tag'e göre etkinlikleri getir
router.get('/tag/:tagId', publicEventController.getEventsByTag);

// Etkinlik arama
router.get('/search', publicEventController.searchEvents);

router.get('/venue-structure/:venueId', publicEventController.getVenueStructure);

router.get('/getListingByEventId/:eventId', publicEventController.getListingByEventId);

router.get('/getListingById/:listingId', publicEventController.getListingById);

// Slug'a göre event bilgilerini getir (en son, çünkü /:eventId genel bir pattern)
router.get('/slug/:slug', publicEventController.getEventBySlug);

// Event ID'ye göre event bilgilerini getir (en son, çünkü /:eventId genel bir pattern)
router.get('/:eventId', publicEventController.getByEventId);

module.exports = router; 