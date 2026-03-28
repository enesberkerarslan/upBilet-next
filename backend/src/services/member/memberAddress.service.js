const Member = require('../../models/member.model');
const cacheService = require('../../utils/cache');

class MemberAddressService {
  // Adres ekle
  async addAddress(memberId, addressData) {
    console.log(addressData);
    const member = await Member.findById(memberId);
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    member.addresses.push(addressData);
    await member.save();
    
    // Adres eklendiğinde member profile cache'ini temizle
    await cacheService.clearMemberProfileCache(memberId);
    
    return { status: 201, body: { success: true, addresses: member.addresses } };
  }

  // Adres güncelle
  async updateAddress(memberId, addressId, updateData) {
    const member = await Member.findById(memberId);
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    const address = member.addresses.id(addressId);
    if (!address) {
      return { status: 404, body: { success: false, error: 'Adres bulunamadı.' } };
    }
    Object.assign(address, updateData);
    await member.save();
    
    // Adres güncellendiğinde member profile cache'ini temizle
    await cacheService.clearMemberProfileCache(memberId);
    
    return { status: 200, body: { success: true, address } };
  }
}

module.exports = new MemberAddressService(); 