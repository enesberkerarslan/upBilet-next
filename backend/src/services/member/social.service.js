const Member = require('../../models/member.model');
const { logger } = require('../../utils/logger');
const { sendWelcomeEmail } = require('../../utils/resend-mail');

class SocialService {
  // Google profiliyle kullanıcıyı bul veya oluştur
  async findOrCreateGoogleUser(profile) {
    const email = profile.emails[0].value;
    let member = await Member.findOne({ email });

    if (!member) {
      member = await Member.create({
        name: profile.name.givenName || 'Kullanıcı',
        surname: profile.name.familyName || '',
        email: email,
        password: Math.random().toString(36).slice(-8), // rastgele şifre
        status: 'active',
        lastLogin: new Date()
      });
      const welcomeMail = await sendWelcomeEmail({
        to: member.email,
        name: member.name,
        surname: member.surname,
      });
      if (!welcomeMail.ok && !welcomeMail.skipped) {
        logger.error('Hoş geldin e-postası gönderilemedi (Google kayıt: %s)', member.email);
      }
    } else {
      member.lastLogin = new Date();
      await member.save();
    }
    const token = member.getSignedJwtToken();
    const memberObj = member.toObject();
    delete memberObj.password;
    return { member: memberObj, token };
  }
}

module.exports = new SocialService(); 