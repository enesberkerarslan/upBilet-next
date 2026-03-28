const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/homepage.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.get('/', controller.get);
router.post('/', controller.upsert);
router.put('/', controller.upsert);
router.delete('/cache', controller.clearCache);

module.exports = router;


