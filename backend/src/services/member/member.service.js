const crypto = require('crypto');
const Member = require('../../models/member.model');
const ApiError = require('../../utils/api.error');
class MemberService {


  // Klasik kayıt olma
  async register({ name, surname, email, password, phone }) {
    const existing = await Member.findOne({ email });
    if (existing) {
      return { status: 400, body: { success: false, error: 'Bu e-posta ile zaten bir hesap var.' } };
    }
    const member = await Member.create({ name, surname, email, password, phone, status: 'active' });
    
    const token = member.getSignedJwtToken();
    const memberObj = member.toObject();
    delete memberObj.password;

    return { status: 201, body: { success: true, token, member: memberObj } };
  }

  // Şifremi unuttum - token üret ve mail gönder
  async forgotPassword(email) {
    const member = await Member.findOne({ email });
    if (!member) {
      return { status: 404, body: { success: false, error: 'Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.' } };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    member.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    member.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 dakika
    await member.save({ validateBeforeSave: false });

    return { status: 200, body: { success: true, message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.', resetToken } };
  }

  // Şifre sıfırlama
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const member = await Member.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!member) {
      return { status: 400, body: { success: false, error: 'Geçersiz veya süresi dolmuş token.' } };
    }

    member.password = newPassword;
    member.resetPasswordToken = undefined;
    member.resetPasswordExpire = undefined;
    await member.save();

    const jwtToken = member.getSignedJwtToken();
    return { status: 200, body: { success: true, token: jwtToken } };
  }



  // Login işlemi
  async login(email, password) {
    console.log(email, password);
    try {
      // Email ile üyeyi bul ve password alanını da seç
      const member = await Member.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }).select('+password');

      if (!member) {
        throw new ApiError(401, 'Geçersiz email veya şifre');
      }

      // Şifreyi kontrol et
      const isPasswordValid = await member.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Geçersiz email veya şifre');
      }

      // Üye aktif mi kontrol et
      if (member.status !== 'active') {
        throw new ApiError(401, 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.');
      }

      // JWT token oluştur
      const token = member.getSignedJwtToken();
      member.lastLogin = new Date();
      // Hassas bilgileri çıkar
      const memberData = member.toObject();
      delete memberData.password;

      return {
        token,
        member: memberData
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Giriş yapılırken bir hata oluştu');
    }
  }

}

module.exports = new MemberService(); 