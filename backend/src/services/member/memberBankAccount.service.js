const Member = require('../../models/member.model');
const cacheService = require('../../utils/cache');

class MemberBankAccountService {
  // Banka hesabı ekle
  async addBankAccount(memberId, bankAccountData) {
    const member = await Member.findById(memberId);
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    member.bankAccounts.push(bankAccountData);
    await member.save();
    
    // Banka hesabı eklendiğinde member profile cache'ini temizle
    await cacheService.clearMemberProfileCache(memberId);
    
    return { status: 201, body: { success: true, bankAccounts: member.bankAccounts } };
  }

  // Banka hesabı güncelle
  async updateBankAccount(memberId, bankAccountId, updateData) {
    const member = await Member.findById(memberId);
    if (!member) {
      return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    }
    const bankAccount = member.bankAccounts.id(bankAccountId);
    if (!bankAccount) {
      return { status: 404, body: { success: false, error: 'Banka hesabı bulunamadı.' } };
    }
    Object.assign(bankAccount, updateData);
    await member.save();
    
    // Banka hesabı güncellendiğinde member profile cache'ini temizle
    await cacheService.clearMemberProfileCache(memberId);
    
    return { status: 200, body: { success: true, bankAccount } };
  }
}

module.exports = new MemberBankAccountService(); 