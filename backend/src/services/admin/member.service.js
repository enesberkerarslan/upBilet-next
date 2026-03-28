const mongoose = require('mongoose');
const Member = require('../../models/member.model');
const Sale = require('../../models/sale.model');
const ApiError = require('../../utils/api.error');

/** YYYY-MM-DD → yerel gün başlangıcı */
function parseLocalYmd(ymd) {
  const s = String(ymd).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 0, 0, 0, 0);
  }
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

class MemberService {
  
  //members işlemleri
  async getAllMembers(query = {}) {
    try {
      const { search, status } = query;
      const filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { surname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      const members = await Member.find(filter).select('-password');
      return members;
    } catch (error) {
      throw new ApiError(500, 'Üyeler getirilirken bir hata oluştu');
    }
  }

  async getMemberById(id) {
    try {
      const member = await Member.findById(id)
        .select('-password')
        .populate({ path: 'favorites.tags', select: 'name slug tag' });
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }
      return member;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Üye getirilirken bir hata oluştu');
    }
  }

  async createMember(memberData) {
    try {

      const existingMember = await Member.findOne({ 
        email: { $regex: new RegExp(`^${memberData.email}$`, 'i') }
      });
      
      if (existingMember) {
        console.log(existingMember);
        throw new ApiError(400, 'Bu e-posta adresi zaten kullanılıyor');
      }

      // Veri doğrulama
      if (!memberData.name || !memberData.surname) {
        throw new ApiError(400, 'Ad ve soyad alanları zorunludur');
      }

      if (!memberData.email) {
        throw new ApiError(400, 'E-posta alanı zorunludur');
      }

      if (!memberData.password || memberData.password.length < 6) {
        throw new ApiError(400, 'Şifre en az 6 karakter olmalıdır');
      }

      const member = await Member.create(memberData);
      return member;
    } catch (error) {
      // Mongoose validation hataları
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        throw new ApiError(400, `Doğrulama hatası: ${validationErrors.join(', ')}`);
      }

      // Duplicate key hatası
      if (error.code === 11000) {
        throw new ApiError(400, 'Bu e-posta adresi zaten kullanılıyor');
      }

      // API hataları
      if (error instanceof ApiError) {
        throw error;
      }

      // Diğer hatalar
      console.error('Üye oluşturma hatası:', error);
      throw new ApiError(500, 'Üye oluşturulurken beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  }

  async updateMember(id, memberData) {
    try {
      // E-posta değişiyorsa kontrol et
      if (memberData.email) {
        const existingMember = await Member.findOne({ 
          email: { $regex: new RegExp(`^${memberData.email}$`, 'i') },
          _id: { $ne: id }
        });
        if (existingMember) {
          throw new ApiError(400, 'Bu e-posta adresi zaten kullanılıyor');
        }
      }

      // Şifre güncelleniyorsa, önce mevcut üyeyi bul ve şifreyi hashle
      if (memberData.password) {
        const member = await Member.findById(id);
        if (!member) {
          throw new ApiError(404, 'Üye bulunamadı');
        }
        
        // Şifreyi güncelle (pre-save middleware otomatik olarak hashleyecek)
        member.password = memberData.password;
        
        // Diğer alanları da güncelle
        Object.keys(memberData).forEach(key => {
          if (key !== 'password') {
            member[key] = memberData[key];
          }
        });
        
        await member.save();
        // Password field is already excluded by default, so we don't need to select it out
        return member;
      } else {
        // Şifre güncellenmiyorsa normal update işlemi yap
        const member = await Member.findByIdAndUpdate(
          id,
          memberData,
          { 
            new: true,
            runValidators: true
          }
        ).select('-password');

        if (!member) {
          throw new ApiError(404, 'Üye bulunamadı');
        }

        return member;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'ValidationError') {
        throw new ApiError(400, Object.values(error.errors).map(err => err.message).join(', '));
      }
      throw new ApiError(500, 'Üye güncellenirken bir hata oluştu');
    }
  }

  async deleteMember(id) {
    try {
      const member = await Member.findByIdAndDelete(id);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }
      return { message: 'Üye başarıyla silindi' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Üye silinirken bir hata oluştu');
    }
  }

  async updateMemberStatus(id, status) {
    try {
      const member = await Member.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).select('-password');

      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      return member;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Üye durumu güncellenirken bir hata oluştu');
    }
  }


  //address işlemleri
  async addAddress(memberId, addressData) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      member.addresses.push(addressData);
      await member.save();
      return member.addresses[member.addresses.length - 1];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Adres eklenirken bir hata oluştu');
    }
  }

  async updateAddress(memberId, addressId, addressData) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      const addressIndex = member.addresses.findIndex(addr => addr._id.toString() === addressId);
      if (addressIndex === -1) {
        throw new ApiError(404, 'Adres bulunamadı');
      }

      // Mevcut adresin üzerine yeni verileri yazıyoruz
      Object.assign(member.addresses[addressIndex], addressData);

      await member.save();
      return member.addresses[addressIndex];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Adres güncellenirken bir hata oluştu');
    }
  }

  async deleteAddress(memberId, addressId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      const addressIndex = member.addresses.findIndex(addr => addr._id.toString() === addressId);
      if (addressIndex === -1) {
        throw new ApiError(404, 'Adres bulunamadı');
      }

      member.addresses.splice(addressIndex, 1);
      await member.save();
      

      
      return { message: 'Adres başarıyla silindi' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Adres silinirken bir hata oluştu');
    }
  }
  
  async getAddresses(memberId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }
      return member.addresses;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Adresler getirilirken bir hata oluştu');
    }
  }

  //bankAccount işlemleri
  async addBankAccount(memberId, bankData) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      member.bankAccounts.push(bankData);
      await member.save();
      

      
      return member.bankAccounts[member.bankAccounts.length - 1];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Banka hesabı eklenirken bir hata oluştu');
    }
  }

  async updateBankAccount(memberId, bankAccountId, bankData) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      const bankIndex = member.bankAccounts.findIndex(bank => bank._id.toString() === bankAccountId);
      if (bankIndex === -1) {
        throw new ApiError(404, 'Banka hesabı bulunamadı');
      }

      // Mevcut banka hesabının üzerine yeni verileri yazıyoruz
      Object.assign(member.bankAccounts[bankIndex], bankData);

      await member.save();
      

      
      return member.bankAccounts[bankIndex];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Banka hesabı güncellenirken bir hata oluştu');
    }
  }

  async deleteBankAccount(memberId, bankAccountId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }

      const bankIndex = member.bankAccounts.findIndex(bank => bank._id.toString() === bankAccountId);
      if (bankIndex === -1) {
        throw new ApiError(404, 'Banka hesabı bulunamadı');
      }

      member.bankAccounts.splice(bankIndex, 1);
      await member.save();
      

      
      return { message: 'Banka hesabı başarıyla silindi' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Banka hesabı silinirken bir hata oluştu');
    }
  }

  async getBankAccounts(memberId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) {
        throw new ApiError(404, 'Üye bulunamadı');
      }
      return member.bankAccounts;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Banka hesapları getirilirken bir hata oluştu');
    }
  }

  // Ödeme periyodu işlemleri
  async getPaymentPeriods(memberId) {
    try {
      const member = await Member.findById(memberId).select('paymentPeriods').populate('paymentPeriods.sales');
      if (!member) throw new ApiError(404, 'Üye bulunamadı');
      return member.paymentPeriods;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ödeme periyotları getirilirken bir hata oluştu');
    }
  }

  async addPaymentPeriod(memberId, periodData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new ApiError(400, 'Geçersiz üye kimliği');
      }
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(404, 'Üye bulunamadı');

      const {
        startDate,
        endDate,
        sales: clientSales = [],
        totalAmount: clientTotalRaw,
        autoAttachDeliveredSales = true,
      } = periodData;
      if (!startDate || !endDate) throw new ApiError(400, 'startDate ve endDate zorunludur');

      const startDay = parseLocalYmd(startDate);
      const endDay = parseLocalYmd(endDate);
      if (!startDay || !endDay) throw new ApiError(400, 'Geçersiz tarih');
      if (startDay > endDay) throw new ApiError(400, 'Başlangıç tarihi bitişten sonra olamaz');

      const rangeStart = startDay;
      const rangeEnd = endOfLocalDay(endDay);

      const assignedIds = new Set();
      for (const p of member.paymentPeriods || []) {
        for (const sid of p.sales || []) {
          assignedIds.add(sid.toString());
        }
      }
      const exclude = assignedIds.size > 0 ? [...assignedIds].map((id) => new mongoose.Types.ObjectId(id)) : [];

      let mergedIds = [];
      if (autoAttachDeliveredSales !== false) {
        const saleQuery = {
          seller: new mongoose.Types.ObjectId(memberId),
          deliveryStatus: 'delivered',
          paymentStatus: 'completed',
          $or: [
            { deliveredAt: { $gte: rangeStart, $lte: rangeEnd } },
            {
              $and: [
                { $or: [{ deliveredAt: null }, { deliveredAt: { $exists: false } }] },
                { updatedAt: { $gte: rangeStart, $lte: rangeEnd } },
              ],
            },
          ],
        };
        if (exclude.length) saleQuery._id = { $nin: exclude };

        const autoSales = await Sale.find(saleQuery).select('_id sellerTotalAmount');
        mergedIds = autoSales.map((s) => s._id.toString());
      }

      const extra = (Array.isArray(clientSales) ? clientSales : [])
        .map((x) => (x && typeof x === 'object' && x._id ? x._id : x))
        .filter(Boolean)
        .map((id) => id.toString());
      mergedIds = [...new Set([...mergedIds, ...extra])];

      let totalAmount = 0;
      if (mergedIds.length > 0) {
        const oidList = mergedIds.map((id) => new mongoose.Types.ObjectId(id));
        const rows = await Sale.find({ _id: { $in: oidList } }).select('sellerTotalAmount');
        totalAmount =
          Math.round(rows.reduce((acc, s) => acc + (Number(s.sellerTotalAmount) || 0), 0) * 100) / 100;
      } else {
        const t = Number(clientTotalRaw);
        if (Number.isNaN(t) || t < 0) {
          throw new ApiError(400, 'Satış yokken toplam tutar (₺) zorunludur');
        }
        totalAmount = t;
      }

      member.paymentPeriods.push({
        startDate: rangeStart,
        endDate: rangeEnd,
        sales: mergedIds.map((id) => new mongoose.Types.ObjectId(id)),
        totalAmount,
      });
      await member.save();
      const created = member.paymentPeriods[member.paymentPeriods.length - 1];
      return { period: created, linkedSalesCount: mergedIds.length };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ödeme periyodu eklenirken bir hata oluştu');
    }
  }

  /**
   * Seçilen bekleyen ödeme dönemine satışı ekler (satıcı bu üye olmalı).
   * Aynı satış başka bir dönemdeyse oradan çıkarılır; tüm etkilenen dönemlerin tutarı yeniden hesaplanır.
   */
  async addSaleToPaymentPeriod(memberId, periodId, saleId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(saleId)) {
        throw new ApiError(400, 'Geçersiz üye veya satış kimliği');
      }
      if (!periodId) throw new ApiError(400, 'Ödeme dönemi seçilmeli');

      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(404, 'Üye bulunamadı');

      const period = member.paymentPeriods.id(periodId);
      if (!period) throw new ApiError(404, 'Ödeme dönemi bulunamadı');
      if (period.status === 'paid') {
        throw new ApiError(400, 'Ödenmiş döneme satış eklenemez');
      }

      const sale = await Sale.findById(saleId).select('seller sellerTotalAmount');
      if (!sale) throw new ApiError(404, 'Satış bulunamadı');
      if (sale.seller.toString() !== memberId.toString()) {
        throw new ApiError(400, 'Bu satış bu üyenin satıcı satışı değil');
      }

      const sidStr = saleId.toString();
      const sidOid = new mongoose.Types.ObjectId(saleId);

      for (const p of member.paymentPeriods || []) {
        if (String(p._id) === String(period._id)) continue;
        p.sales = (p.sales || []).filter((x) => x.toString() !== sidStr);
      }

      const already = (period.sales || []).some((x) => x.toString() === sidStr);
      if (!already) period.sales.push(sidOid);

      for (const p of member.paymentPeriods || []) {
        const ids = (p.sales || []).map((x) => x);
        if (ids.length === 0) {
          p.totalAmount = 0;
        } else {
          const rows = await Sale.find({ _id: { $in: ids } }).select('sellerTotalAmount');
          p.totalAmount =
            Math.round(rows.reduce((acc, s) => acc + (Number(s.sellerTotalAmount) || 0), 0) * 100) / 100;
        }
      }

      member.markModified('paymentPeriods');
      await member.save();
      return period;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Satış döneme eklenirken bir hata oluştu');
    }
  }

  async markPeriodAsPaid(memberId, periodId, adminId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(404, 'Üye bulunamadı');

      const period = member.paymentPeriods.id(periodId);
      if (!period) throw new ApiError(404, 'Ödeme periyodu bulunamadı');
      if (period.status === 'paid') throw new ApiError(400, 'Bu periyot zaten ödenmiş');

      period.status = 'paid';
      period.paidAt = new Date();
      period.paidBy = adminId;

      await member.save();
      return period;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Periyot ödenirken bir hata oluştu');
    }
  }

  async deletePaymentPeriod(memberId, periodId) {
    try {
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(404, 'Üye bulunamadı');

      const period = member.paymentPeriods.id(periodId);
      if (!period) throw new ApiError(404, 'Ödeme periyodu bulunamadı');
      if (period.status === 'paid') throw new ApiError(400, 'Ödenmiş periyot silinemez');

      period.deleteOne();
      await member.save();
      return { message: 'Ödeme periyodu silindi' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ödeme periyodu silinirken bir hata oluştu');
    }
  }
}

module.exports = new MemberService(); 