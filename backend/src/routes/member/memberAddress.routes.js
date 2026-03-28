const express = require('express');
const router = express.Router();
const memberAddressController = require('../../controllers/member/memberAddress.controller');
const { memberProtect } = require('../../middleware/memberAuth.middleware');

// Tüm adres işlemleri için auth zorunlu
router.use(memberProtect);

router.post('/', memberAddressController.addAddress); // /api/user/addresses
router.put('/:addressId', memberAddressController.updateAddress); // /api/user/addresses/:addressId

module.exports = router; 