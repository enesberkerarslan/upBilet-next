const memberService = require('../../services/admin/member.service');
const catchAsync = require('../../utils/catch.async');

const memberController = {

  getAllMembers: catchAsync(async (req, res) => {
    const members = await memberService.getAllMembers(req.query);
    res.json({
      success: true,
      data: members
    });
  }),

  getMemberById: catchAsync(async (req, res) => {
    const member = await memberService.getMemberById(req.params.id);
    res.json({
      success: true,
      data: member
    });
  }),

  createMember: catchAsync(async (req, res) => {
    const member = await memberService.createMember(req.body);
    res.status(201).json({
      success: true,
      data: member
    });
  }),

  updateMember: catchAsync(async (req, res) => {
    const member = await memberService.updateMember(req.params.id, req.body);
    res.json({
      success: true,
      data: member
    });
  }),

  deleteMember: catchAsync(async (req, res) => {
    await memberService.deleteMember(req.params.id);
    res.json({
      success: true,
      message: 'Üye başarıyla silindi'
    });
  }),

  updateMemberStatus: catchAsync(async (req, res) => {
    const member = await memberService.updateMemberStatus(req.params.id, req.body.status);
    res.json({
      success: true,
      data: member
    });
  }),

  // Adres işlemleri
  addAddress: catchAsync(async (req, res) => {
    const { memberId } = req.params;
    const addressData = req.body;

    const address = await memberService.addAddress(memberId, addressData);
    res.status(201).json({
      status: 'success',
      data: address
    });
  }),

  updateAddress: catchAsync(async (req, res) => {
    const { memberId, addressId } = req.params;
    const addressData = req.body;
    console.log("memberId", memberId);
    console.log("addressId", addressId);
    console.log("addressData", addressData);
    const address = await memberService.updateAddress(memberId, addressId, addressData);
    console.log("address", address);
    res.status(200).json({
      status: 'success',
      data: address
    });
  }),

  deleteAddress: catchAsync(async (req, res) => {
    const { memberId, addressId } = req.params;

    await memberService.deleteAddress(memberId, addressId);
    res.status(200).json({
      status: 'success',
      message: 'Adres başarıyla silindi'
    });
  }),

  getAddresses: catchAsync(async (req, res) => {
    const { memberId } = req.params;

    const addresses = await memberService.getAddresses(memberId);
    res.status(200).json({
      status: 'success',
      data: addresses
    });
  }),

  // Banka hesabı işlemleri
  addBankAccount: catchAsync(async (req, res) => {
    const { memberId } = req.params;
    const bankData = req.body;

    const bankAccount = await memberService.addBankAccount(memberId, bankData);
    res.status(201).json({
      status: 'success',
      data: bankAccount
    });
  }),

  updateBankAccount: catchAsync(async (req, res) => {
    const { memberId, bankAccountId } = req.params;
    const bankData = req.body;

    const bankAccount = await memberService.updateBankAccount(memberId, bankAccountId, bankData);
    res.status(200).json({
      status: 'success',
      data: bankAccount
    });
  }),

  deleteBankAccount: catchAsync(async (req, res) => {
    const { memberId, bankAccountId } = req.params;

    await memberService.deleteBankAccount(memberId, bankAccountId);
    res.status(200).json({
      status: 'success',
      message: 'Banka hesabı başarıyla silindi'
    });
  }),

  getBankAccounts: catchAsync(async (req, res) => {
    const { memberId } = req.params;

    const bankAccounts = await memberService.getBankAccounts(memberId);
    res.status(200).json({
      status: 'success',
      data: bankAccounts
    });
  }),

  // Ödeme periyodu işlemleri
  getPaymentPeriods: catchAsync(async (req, res) => {
    const periods = await memberService.getPaymentPeriods(req.params.memberId);
    res.status(200).json({ success: true, data: periods });
  }),

  addPaymentPeriod: catchAsync(async (req, res) => {
    const { period, linkedSalesCount } = await memberService.addPaymentPeriod(
      req.params.memberId,
      req.body
    );
    res.status(201).json({
      success: true,
      data: period,
      meta: { linkedSalesCount },
    });
  }),

  addSaleToPaymentPeriod: catchAsync(async (req, res) => {
    const { saleId } = req.body;
    if (!saleId) {
      return res.status(400).json({ success: false, message: 'saleId gerekli' });
    }
    const period = await memberService.addSaleToPaymentPeriod(
      req.params.memberId,
      req.params.periodId,
      saleId
    );
    res.status(200).json({ success: true, data: period });
  }),

  markPeriodAsPaid: catchAsync(async (req, res) => {
    const period = await memberService.markPeriodAsPaid(
      req.params.memberId,
      req.params.periodId,
      req.user._id
    );
    res.status(200).json({ success: true, data: period });
  }),

  deletePaymentPeriod: catchAsync(async (req, res) => {
    const result = await memberService.deletePaymentPeriod(req.params.memberId, req.params.periodId);
    res.status(200).json({ success: true, ...result });
  }),

};

module.exports = memberController; 