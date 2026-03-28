const Member = require('../../models/member.model');

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
        status: 'active'
      });
    }
    const token = member.getSignedJwtToken();
    member.lastLogin = new Date();
    // Şifreyi sil
    const memberObj = member.toObject();
    delete memberObj.password;
    return { member: memberObj, token };
  }
}

module.exports = new SocialService(); 