const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/member/member.controller');

// Public routes
router.post('/register', memberController.register);
router.post('/forgot-password', memberController.forgotPassword);
router.post('/login', memberController.login);
router.post('/reset-password/:token', memberController.resetPassword);



module.exports = router; 