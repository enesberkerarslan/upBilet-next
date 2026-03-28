const memberBankAccountService = require('../../services/member/memberBankAccount.service');
const catchAsync = require('../../utils/catch.async');

const memberBankAccountController = {
  addBankAccount: catchAsync(async (req, res) => {
    const result = await memberBankAccountService.addBankAccount(req.member._id, req.body);
    res.status(result.status).json(result.body);
  }),
  updateBankAccount: catchAsync(async (req, res) => {
    const result = await memberBankAccountService.updateBankAccount(req.member._id, req.params.bankAccountId, req.body);
    res.status(result.status).json(result.body);
  }),
};

module.exports = memberBankAccountController; 