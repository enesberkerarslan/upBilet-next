const socialService = require('../../services/member/social.service');

const socialController = {
  // Google callback fonksiyonu
  googleCallback: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Google authentication başarısız'
        });
      }
      
      const profile = req.user;
      const member = await socialService.findOrCreateGoogleUser(profile);
      
      res.json({
        success: true,
        member
      });
    } catch (error) {
      console.error('Google callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası'
      });
    }
  }
};

module.exports = socialController; 