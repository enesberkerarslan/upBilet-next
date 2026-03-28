const express = require('express');
const router = express.Router();
const memberBankAccountController = require('../../controllers/member/memberBankAccount.controller');
const { memberProtect } = require('../../middleware/memberAuth.middleware');

// Tüm banka hesap işlemleri için auth zorunlu
router.use(memberProtect);

router.post('/', memberBankAccountController.addBankAccount); // /api/user/bank-accounts
router.put('/:bankAccountId', memberBankAccountController.updateBankAccount); // /api/user/bank-accounts/:bankAccountId

module.exports = router; 