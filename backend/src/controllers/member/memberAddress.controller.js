const memberAddressService = require('../../services/member/memberAddress.service');
const catchAsync = require('../../utils/catch.async');

const memberAddressController = {
  addAddress: catchAsync(async (req, res) => {
    const result = await memberAddressService.addAddress(req.member._id, req.body);
    res.status(result.status).json(result.body);
  }),
  updateAddress: catchAsync(async (req, res) => {
    const result = await memberAddressService.updateAddress(req.member._id, req.params.addressId, req.body);
    res.status(result.status).json(result.body);
  }),
};

module.exports = memberAddressController; 