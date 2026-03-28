const Listing = require('../../models/listings.model');
const Member = require('../../models/member.model');
const ApiError = require('../../utils/api.error');

class MemberListingService {
  // Yeni ilan ekle
  async addListing(memberId, listingData) {
    // Validasyon kontrolleri
    const errors = [];
    if (!listingData.eventId) errors.push('Event ID is required');
    if (!listingData.price) errors.push('Price is required');
    if (!listingData.category) errors.push('Category is required');
    
    if (errors.length > 0) {
      return {
        success: false,
        error: errors
      };
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return {
        success: false,
        error: 'Üye bulunamadı.'
      };
    }
    
    const status = member.role === 'broker' ? 'active' : 'pending';
    const sellerAmount = listingData.price * 0.8;
    const listing = new Listing({
      ...listingData,
      memberId,
      sellerAmount,
      status
    });
    
    await listing.save();
   
    return {
      success: true,
      listing
    };
  }

  // Kullanıcının tüm ilanlarını getir (sayfalı)
  async getAllListings(memberId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [listings, total] = await Promise.all([
      Listing.find({ memberId })
        .populate({
          path: 'eventId',
          select: 'name date location'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments({ memberId })
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return { 
      status: 200, 
      body: { 
        success: true, 
        listings,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNextPage,
          hasPrevPage,
          itemsPerPage: limit
        }
      }
    };
  }

  // İlanı güncelle
  async updateListing(memberId, listingId, updateData) {
    try {
      const listing = await Listing.findOne({ _id: listingId, memberId });
      if (!listing) {
        return { status: 404, body: { success: false, error: 'İlan bulunamadı.' } };
      }

      // Reddedilmiş veya onay bekleyen ilanlar için güncelleme işlemini engelle
      if (listing.status === 'rejected' || listing.status === 'pending') {
        return { 
          status: 400, 
          body: { 
            success: false, 
            error: 'Reddedilmiş veya onay bekleyen ilanlar güncellenemez.' 
          } 
        };
      }

      // Güncelleme işlemi
      Object.assign(listing, updateData);
      await listing.save();

      return { status: 200, body: { success: true, listing } };
    } catch (error) {
      console.error('İlan güncellenirken hata:', error);
      return { status: 500, body: { success: false, error: 'İlan güncellenirken bir hata oluştu.' } };
    }
  }

  // Bir etkinlikteki üyenin tüm ilanlarını getir
  async getListingsByEvent(memberId, eventId) {
    const listings = await Listing.find({ memberId, eventId })
      .populate({ path: 'eventId', select: 'name date location' })
      .sort({ createdAt: -1 });
    return { status: 200, body: { success: true, listings } };
  }

  // Broker: bir etkinlikteki tüm ilanları toplu aktif/pasif yap
  async toggleAllListingsByEvent(memberId, eventId, targetStatus) {
    const member = await Member.findById(memberId);
    if (!member) return { status: 404, body: { success: false, error: 'Üye bulunamadı.' } };
    if (member.role !== 'broker') {
      return { status: 403, body: { success: false, error: 'Bu işlem sadece broker hesaplar için geçerlidir.' } };
    }

    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(targetStatus)) {
      return { status: 400, body: { success: false, error: 'Geçersiz durum. active veya inactive olmalıdır.' } };
    }

    const result = await Listing.updateMany(
      { memberId, eventId, status: { $in: ['active', 'inactive'] } },
      { status: targetStatus }
    );

    return {
      status: 200,
      body: { success: true, message: `${result.modifiedCount} ilan güncellendi.`, modifiedCount: result.modifiedCount }
    };
  }

  // İlanı sil
  async deleteListing(memberId, listingId) {
    const listing = await Listing.findOne({ _id: listingId, memberId });
    if (!listing) {
      return { status: 404, body: { success: false, error: 'İlan bulunamadı.' } };
    }
    if (listing.soldQuantity > 0) {
      return { status: 400, body: { success: false, error: 'Satışı olan ilan silinemez.' } };
    }
    await listing.deleteOne();
    return { status: 200, body: { success: true, message: 'İlan silindi.' } };
  }

  // İlanı aktif/pasif yap
  async toggleListingStatus(memberId, listingId) {
    const listing = await Listing.findOne({ _id: listingId, memberId });
    if (!listing) {
      return { status: 404, body: { success: false, error: 'İlan bulunamadı.' } };
    }

    // Reddedilmiş veya onay bekleyen ilanlar için işlem yapılmasını engelle
    if (listing.status === 'rejected' || listing.status === 'pending') {
      return { 
        status: 400, 
        body: { 
          success: false, 
          error: 'Reddedilmiş veya onay bekleyen ilanların durumu değiştirilemez.' 
        } 
      };
    }

    listing.status = listing.status === 'active' ? 'inactive' : 'active';
    await listing.save();
    return { status: 200, body: { success: true, listing } };
  }
}

module.exports = new MemberListingService(); 