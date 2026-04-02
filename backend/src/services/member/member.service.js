const crypto = require('crypto');
const Member = require('../../models/member.model');
const ApiError = require('../../utils/api.error');
const { logger } = require('../../utils/logger');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../../utils/resend-mail');
class MemberService {


  // Klasik kayıt olma
  async register({ name, surname, email, password, phone }) {
    const existing = await Member.findOne({ email });
    if (existing) {
      return { status: 400, body: { success: false, error: 'Bu e-posta ile zaten bir hesap var.' } };
    }
    const member = await Member.create({ name, surname, email, password, phone, status: 'active' });

    const welcomeMail = await sendWelcomeEmail({ to: member.email, name, surname });
    if (!welcomeMail.ok && !welcomeMail.skipped) {
      logger.error('Hoş geldin e-postası gönderilemedi (üye: %s)', member.email);
    }

    const token = member.getSignedJwtToken();
    const memberObj = member.toObject();
    delete memberObj.password;

    return { status: 201, body: { success: true, token, member: memberObj } };
  }

  // Şifremi unuttum - token üret ve mail gönder
  async forgotPassword(email) {
    const member = await Member.findOne({ email });
    if (!member) {
      // Kayıt yoksa da aynı yanıt: e-posta numaralandırmasını önle
      return {
        status: 200,
        body: {
          success: true,
          message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.',
        },
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    member.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    member.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 dakika
    await member.save({ validateBeforeSave: false });

    const mailResult = await sendPasswordResetEmail({ to: member.email, resetToken });
    if (!mailResult.ok && !mailResult.skipped) {
      logger.error('Şifre sıfırlama e-postası gönderilemedi (üye: %s)', member.email);
    }

    const body = {
      success: true,
      message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.',
    };
    if (process.env.NODE_ENV !== 'production') {
      body.resetToken = resetToken;
    }
    return { status: 200, body };
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

      member.lastLogin = new Date();
      await member.save();

      const token = member.getSignedJwtToken();
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