const User = require('../../models/user.model');
const ApiError = require('../../utils/api.error');
const catchAsync = require('../../utils/catch.async');
const { logger } = require('../../utils/logger');

const authController = {
  // Giriş yap
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;

    logger.debug('Login isteği alındı', { email });

    // E-posta ve şifre kontrolü
    if (!email || !password) {
      throw new ApiError(400, 'Lütfen e-posta ve şifre girin');
    }

    // Kullanıcıyı bul ve şifreyi seç
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    logger.debug('Kullanıcı arama sonucu', { 
      email,
      userFound: !!user,
      hasPassword: user ? !!user.password : false
    });

    if (!user) {
      throw new ApiError(401, 'Geçersiz e-posta veya şifre');
    }

    // Şifre kontrolü
    const isMatch = await user.comparePassword(password);
    
    logger.debug('Şifre kontrolü sonucu', { 
      email,
      isMatch
    });

    if (!isMatch) {
      throw new ApiError(401, 'Geçersiz e-posta veya şifre');
    }

    // Kullanıcı durumu kontrolü
    if (user.status !== 'active') {
      throw new ApiError(401, 'Hesabınız aktif değil');
    }

    // Son giriş tarihini güncelle
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Token oluştur
    const token = user.getSignedJwtToken();

    // Şifreyi response'dan çıkar
    user.password = undefined;

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  }),

  // Mevcut kullanıcı bilgilerini getir
  getMe: catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: req.user
    });
  })
};

module.exports = authController; 