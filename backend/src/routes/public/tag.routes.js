const express = require('express');
const router = express.Router();
const publicTagController = require('../../controllers/public/tag.controller');

// Get all tags (public)
router.get('/', publicTagController.getAllTags);

module.exports = router;
