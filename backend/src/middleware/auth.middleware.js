const jwt = require('jsonwebtoken');
const ApiError = require('../utils/api.error');
const User = require('../models/user.model');

/**
 * Kullanıcı kimlik doğrulama middleware'i
 * Token'ı kontrol eder ve kullanıcıyı request nesnesine ekler
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa hata döndür
    if (!token) {
      throw new ApiError(401, 'Bu işlem için giriş yapmanız gerekiyor');
    }

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı bul
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        throw new ApiError(401, 'Bu token ile ilişkili kullanıcı bulunamadı');
      }

      // Kullanıcıyı request nesnesine ekle
      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, 'Geçersiz token');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect
}; 