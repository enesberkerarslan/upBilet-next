const Member = require('../../models/member.model');
const bcrypt = require('bcryptjs');

class MemberProfileService {
  async getProfile(memberId) {
    const member = await Member.findById(memberId).select('-password');
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    return { status: 200, body: { success: true, member } };
  }

  // Profil bilgilerini güncelle
  async updateProfile(memberId, updateData) {
    const member = await Member.findByIdAndUpdate(
      memberId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }

    return { status: 200, body: { success: true, member } };
  }

  // Şifre değiştirme
  async changePassword(memberId, currentPassword, newPassword) {
    const member = await Member.findById(memberId).select('+password');
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    const isMatch = await bcrypt.compare(currentPassword, member.password);
    if (!isMatch) {
      return { status: 400, body: { success: false, error: 'Mevcut şifre yanlış.' } };
    }
    member.password = newPassword;
    await member.save();

    return { status: 200, body: { success: true, message: 'Şifre başarıyla değiştirildi.' } };
  }

  // Favorileri getir
  async getFavorites(memberId) {
    const member = await Member.findById(memberId)
      .populate({ path: 'favorites.events', select: 'name date location image slug status' })
      .populate({ path: 'favorites.tags', select: 'name tag slug' })
      .select('favorites');
    if (!member) return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    return { status: 200, body: { success: true, favorites: member.favorites } };
  }

  // Event favoriye ekle/çıkar (toggle)
  async toggleFavoriteEvent(memberId, eventId) {
    const member = await Member.findById(memberId);
    if (!member) return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };

    const index = member.favorites.events.findIndex(id => id.toString() === eventId);
    let action;
    if (index === -1) {
      member.favorites.events.push(eventId);
      action = 'added';
    } else {
      member.favorites.events.splice(index, 1);
      action = 'removed';
    }
    await member.save();
    return { status: 200, body: { success: true, action } };
  }

  // Tag favoriye ekle/çıkar (toggle)
  async toggleFavoriteTag(memberId, tagId) {
    const member = await Member.findById(memberId);
    if (!member) return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };

    const index = member.favorites.tags.findIndex(id => id.toString() === tagId);
    let action;
    if (index === -1) {
      member.favorites.tags.push(tagId);
      action = 'added';
    } else {
      member.favorites.tags.splice(index, 1);
      action = 'removed';
    }
    await member.save();
    return { status: 200, body: { success: true, action } };
  }

  // Telefon numarası değiştirme
  async changePhone(memberId, newPhone) {
    const member = await Member.findByIdAndUpdate(
      memberId,
      { phone: newPhone },
      { new: true, runValidators: true }
    ).select('-password');
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }

    return { status: 200, body: { success: true, member } };
  }
}

module.exports = new MemberProfileService(); 