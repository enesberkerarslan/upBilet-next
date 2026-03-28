const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/auth.controller');
const { protect } = require('../../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router; 