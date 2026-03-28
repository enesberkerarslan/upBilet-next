const express = require('express');
const router = express.Router();
const tagController = require('../../controllers/admin/tag.controller');
const { protect } = require('../../middleware/auth.middleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

// Tag listeleme
router.get('/get-all-tags', tagController.getAllTags);

// ID'ye göre tag getirme
router.get('/get-tag-by-id/:id', tagController.getTagById);

// Yeni tag oluşturma
router.post('/create-tag', tagController.createTag);

// Tag güncelleme
router.put('/update-tag/:id', tagController.updateTag);

// Tag silme
router.delete('/delete-tag/:id', tagController.deleteTag);

module.exports = router; 