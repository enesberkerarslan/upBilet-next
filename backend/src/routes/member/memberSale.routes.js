const express = require('express');
const router = express.Router();
const memberSaleController = require('../../controllers/member/memberSale.controller');
const { memberProtect } = require('../../middleware/memberAuth.middleware');
const { uploadSupportFiles } = require('../../utils/supportUpload.multer');

// Tüm rotalar için memberProtect middleware'ini kullan
router.use(memberProtect);

// Create a new sale

router.post('/', memberSaleController.createSale);

router.get('/', memberSaleController.getSalesByMemberId);

router.get('/my-sales', memberSaleController.getSalesBySellerId);

router.post(
  '/:id/ticket-holders/:ticketIndex/seller-proof',
  uploadSupportFiles.array('files', 1),
  memberSaleController.uploadSellerProof
);

router.get('/:id', memberSaleController.getSaleById);

router.patch('/:id/status', memberSaleController.updateSaleStatus);



module.exports = router; 