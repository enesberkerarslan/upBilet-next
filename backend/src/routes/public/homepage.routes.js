const express = require('express');
const router = express.Router();
const homepageController = require('../../controllers/public/homepage.controller');

router.get('/bundle', homepageController.getHomepageBundle);
router.get('/', homepageController.getHomepage);

module.exports = router;


