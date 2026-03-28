const express = require('express');
const router = express.Router();
const memberListingController = require('../../controllers/member/memberListing.controller');
const { memberProtect } = require('../../middleware/memberAuth.middleware');

// Tüm ilan işlemleri için auth zorunlu
router.use(memberProtect);

router.post('/', memberListingController.addListing);
router.get('/', memberListingController.getAllListings);
router.get('/event/:eventId', memberListingController.getListingsByEvent);
router.patch('/event/:eventId/toggle-all', memberListingController.toggleAllListingsByEvent);
router.put('/:listingId', memberListingController.updateListing);
router.patch('/:listingId/toggle-status', memberListingController.toggleListingStatus);
router.delete('/:listingId', memberListingController.deleteListing);

module.exports = router; 