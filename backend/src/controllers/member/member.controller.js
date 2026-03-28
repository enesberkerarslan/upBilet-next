const memberService = require('../../services/member/member.service');
const catchAsync = require('../../utils/catch.async');

const memberController = {
  register: catchAsync(async (req, res) => {
    const result = await memberService.register(req.body);
    res.status(result.status).json(result.body);
  }),

  forgotPassword: catchAsync(async (req, res) => {
    const result = await memberService.forgotPassword(req.body.email);
    res.status(result.status).json(result.body);
  }),

  login: catchAsync(async (req, res) => {
    const result = await memberService.login(req.body.email, req.body.password);
    res.status(200).json({ success: true, data: result });
  }),

  resetPassword: catchAsync(async (req, res) => {
    const result = await memberService.resetPassword(req.params.token, req.body.password);
    res.status(result.status).json(result.body);
  }),

};

module.exports = memberController; 