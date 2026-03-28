const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/admin/event.controller');
const { protect } = require('../../middleware/auth.middleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

// Etkinlik listesi
router.get('/get-all-events', eventController.getAllEvents);

// ID'ye göre etkinlik getir
router.get('/get-event-by-id/:id', eventController.getEventById);

// Slug'a göre etkinlik getir
router.get('/get-event-by-slug/:slug', eventController.getEventBySlug);

// Yeni etkinlik oluştur
router.post('/create-event', eventController.createEvent);

// Etkinlik güncelle
router.put('/update-event/:id', eventController.updateEvent);

// Etkinlik sil
router.delete('/delete-event/:id', eventController.deleteEvent);

// Etkinlik durumunu güncelle
router.patch('/update-event-status/:id', eventController.updateEventStatus);

// Etkinlik istatistiklerini güncelle
router.patch('/update-event-stats/:id', eventController.updateEventStats);

// Cache temizleme endpoint'leri
router.delete('/cache/events', eventController.clearEventCache);
router.delete('/cache/search', eventController.clearSearchCache);

module.exports = router; 