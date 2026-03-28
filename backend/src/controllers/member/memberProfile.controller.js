const memberProfileService = require('../../services/member/memberProfile.service');
const catchAsync = require('../../utils/catch.async');

const memberProfileController = {
  getProfile: catchAsync(async (req, res) => {
    const result = await memberProfileService.getProfile(req.member._id);
    res.status(result.status).json(result.body);
  }),
  updateProfile: catchAsync(async (req, res) => {
    const result = await memberProfileService.updateProfile(req.member._id, req.body);
    res.status(result.status).json(result.body);
  }),
  changePassword: catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const result = await memberProfileService.changePassword(req.member._id, oldPassword, newPassword);
    res.status(result.status).json(result.body);
  }),
  changePhone: catchAsync(async (req, res) => {
    const { phone } = req.body;
    const result = await memberProfileService.changePhone(req.member._id, phone);
    res.status(result.status).json(result.body);
  }),
  getFavorites: catchAsync(async (req, res) => {
    const result = await memberProfileService.getFavorites(req.member._id);
    res.status(result.status).json(result.body);
  }),
  toggleFavoriteEvent: catchAsync(async (req, res) => {
    const result = await memberProfileService.toggleFavoriteEvent(req.member._id, req.params.eventId);
    res.status(result.status).json(result.body);
  }),
  toggleFavoriteTag: catchAsync(async (req, res) => {
    const result = await memberProfileService.toggleFavoriteTag(req.member._id, req.params.tagId);
    res.status(result.status).json(result.body);
  }),
};

module.exports = memberProfileController; 