const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/admin/member.controller');
const { protect } = require('../../middleware/auth.middleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

// Üye listeleme
router.get('/get-all-members', memberController.getAllMembers);

// ID'ye göre üye getirme
router.get('/get-member-by-id/:id', memberController.getMemberById);

// Yeni üye oluşturma
router.post('/create-member', memberController.createMember);

// Üye güncelleme
router.put('/update-member/:id', memberController.updateMember);

// Üye silme
router.delete('/delete-member/:id', memberController.deleteMember);

// Üye durumu güncelleme
router.patch('/update-member-status/:id', memberController.updateMemberStatus);


// Adres işlemleri
router.post('/addresses/:memberId', memberController.addAddress);
router.put('/addresses/:memberId/:addressId', memberController.updateAddress);
router.delete('/addresses/:memberId/:addressId', memberController.deleteAddress);
router.get('/addresses/:memberId', memberController.getAddresses);

// Banka hesabı işlemleri
router.post('/bank-accounts/:memberId', memberController.addBankAccount);
router.put('/bank-accounts/:memberId/:bankAccountId', memberController.updateBankAccount);
router.delete('/bank-accounts/:memberId/:bankAccountId', memberController.deleteBankAccount);
router.get('/bank-accounts/:memberId', memberController.getBankAccounts);

// Ödeme periyodu işlemleri
router.get('/payment-periods/:memberId', memberController.getPaymentPeriods);
router.post(
  '/payment-periods/:memberId/:periodId/add-sale',
  memberController.addSaleToPaymentPeriod
);
router.post('/payment-periods/:memberId', memberController.addPaymentPeriod);
router.patch('/payment-periods/:memberId/:periodId/pay', memberController.markPeriodAsPaid);
router.delete('/payment-periods/:memberId/:periodId', memberController.deletePaymentPeriod);

module.exports = router; 