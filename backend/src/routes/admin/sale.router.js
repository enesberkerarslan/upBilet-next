const express = require('express');
const router = express.Router();
const saleController = require('../../controllers/admin/sale.controller');
const { uploadSupportFiles } = require('../../utils/supportUpload.multer');

// Tüm satışları listele
router.get('/', saleController.getAllSales);

// Status ile satışları listele — /:id'den önce olmalı
router.get('/filter/status', saleController.getSalesByStatus);

// Etkinliğe göre satışlar — /:id'den önce olmalı
router.get('/filter/event', saleController.getSalesByEvent);

// Üyeye göre satışlar (satıcı / alıcı ayrımı)
router.get('/filter/member', saleController.getSalesByMember);

// Admin: bilet satırına kanıt dosyası (multipart files[]) — /:id'den önce
router.post(
  '/:id/ticket-holders/:ticketIndex/seller-proof',
  uploadSupportFiles.array('files', 1),
  saleController.adminUploadTicketHolderSellerProof
);

// Tek satış getir
router.get('/:id', saleController.getSaleById);

// Genel teslimat durumunu güncelle
router.patch('/:id/delivery-status', saleController.updateDeliveryStatus);

// Tekil bilet teslimat durumunu güncelle
router.patch('/:id/ticket-holder-delivery', saleController.updateTicketHolderDeliveryStatus);

// Tekil bilet bilgisini güncelle
router.patch('/:id/ticket-holder-info', saleController.updateTicketHolderInfo);

// Tüm bilet sahiplerini güncelle
router.patch('/:id/ticket-holders', saleController.updateAllTicketHolders);

// Satış bilgilerini güncelle
router.patch('/:id', saleController.updateSale);

// Payment status güncelle
router.patch('/:id/payment-status', saleController.updatePaymentStatus);

// Tekil bilet onayla
router.patch('/:id/approve-ticket', saleController.approveTicket);

// Tüm biletleri onayla
router.patch('/:id/approve-all-tickets', saleController.approveAllTickets);

// Tekil bilet reddet
router.patch('/:id/reject-ticket', saleController.rejectTicket);

// Satış seviyesi işlemler
router.patch('/:id/approve', saleController.approveSale);
router.patch('/:id/cancel', saleController.cancelSale);
router.patch('/:id/refund', saleController.refundSale);

module.exports = router; 