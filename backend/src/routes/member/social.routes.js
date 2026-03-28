const express = require('express');
const router = express.Router();
const passport = require('passport');
const socialController = require('../../controllers/member/social.controller');

// Google ile giriş başlat
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback - failureRedirect kaldırıldı
router.get('/google/callback', passport.authenticate('google', { session: false }), socialController.googleCallback);

module.exports = router; 