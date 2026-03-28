const jwt = require('jsonwebtoken');
const ApiError = require('../utils/api.error');
const Member = require('../models/member.model');

const memberProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Bu işlem için giriş yapmanız gerekiyor');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const member = await Member.findById(decoded.id).select('-password');
      if (!member) {
        throw new ApiError(401, 'Bu token ile ilişkili üye bulunamadı');
      }

      req.member = member;
      next();
    } catch (error) {
      throw new ApiError(401, 'Geçersiz token');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  memberProtect
};