const express = require('express');
const router = express.Router();
const memberProfileController = require('../../controllers/member/memberProfile.controller');
const { memberProtect } = require('../../middleware/memberAuth.middleware');

// Tüm profil işlemleri için auth zorunlu
router.use(memberProtect);

router.get('/', memberProfileController.getProfile); // /api/user/profile
router.put('/', memberProfileController.updateProfile); // /api/user/profile
router.post('/change-password', memberProfileController.changePassword); // /api/user/profile/change-password
router.post('/change-phone', memberProfileController.changePhone); // /api/user/profile/change-phone

// Favoriler
router.get('/favorites', memberProfileController.getFavorites);
router.post('/favorites/events/:eventId', memberProfileController.toggleFavoriteEvent);
router.delete('/favorites/events/:eventId', memberProfileController.toggleFavoriteEvent);
router.post('/favorites/tags/:tagId', memberProfileController.toggleFavoriteTag);
router.delete('/favorites/tags/:tagId', memberProfileController.toggleFavoriteTag);

module.exports = router; 