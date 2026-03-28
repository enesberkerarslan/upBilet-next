const mongoose = require('mongoose');
const Tag = require('../../models/tag.model');
const Event = require('../../models/event.model');
const Member = require('../../models/member.model');
const VenueStructure = require('../../models/venueStructure.model');
const ApiError = require('../../utils/api.error');

class TagService {
  // Tüm tagleri getir
  async getAllTags(query = {}) {
    try {
      const { search, status, tag } = query;
      const filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (tag) {
        filter.tag = tag;
      }

      const tags = await Tag.find(filter);
      return tags;
    } catch (error) {
      throw new ApiError(500, 'Etiketler getirilirken bir hata oluştu');
    }
  }

  // ID'ye göre tag getir
  async getTagById(id) {
    try {
      const tag = await Tag.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Etiket bulunamadı');
      }
      return tag;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Etiket getirilirken bir hata oluştu');
    }
  }

  // Yeni tag oluştur
  async createTag(tagData) {
    try {
      // İsim kontrolü
      const existingTag = await Tag.findOne({ name: tagData.name });
      if (existingTag) {
        throw new ApiError(400, 'Bu etiket adı zaten kullanılıyor');
      }

      const tag = await Tag.create(tagData);
      return tag;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'ValidationError') {
        throw new ApiError(400, Object.values(error.errors).map(err => err.message).join(', '));
      }
      throw new ApiError(500, 'Etiket oluşturulurken bir hata oluştu');
    }
  }

  // Tag güncelle
  async updateTag(id, tagData) {
    try {
      const tag = await Tag.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Etiket bulunamadı');
      }

      if (tagData.name) {
        const existingTag = await Tag.findOne({
          name: tagData.name,
          _id: { $ne: id },
        });
        if (existingTag) {
          throw new ApiError(400, 'Bu etiket adı zaten kullanılıyor');
        }
      }

      // findByIdAndUpdate pre('save') tetiklemez; slug ad değişince pre-save ile üretilir.
      tag.set(tagData);
      await tag.save();

      return tag;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'ValidationError') {
        throw new ApiError(400, Object.values(error.errors).map((err) => err.message).join(', '));
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'alan';
        throw new ApiError(400, `Bu ${field} zaten kullanılıyor (slug veya ad çakışması)`);
      }
      throw new ApiError(500, 'Etiket güncellenirken bir hata oluştu');
    }
  }

  // Tag sil
  async deleteTag(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Geçersiz etiket ID');
      }
      const oid = new mongoose.Types.ObjectId(id);

      const tag = await Tag.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Etiket bulunamadı');
      }

      const [eventCount, memberFavCount, venueCount] = await Promise.all([
        Event.countDocuments({ tags: oid }),
        Member.countDocuments({ 'favorites.tags': oid }),
        VenueStructure.countDocuments({ venueId: oid }),
      ]);

      if (eventCount > 0 || memberFavCount > 0 || venueCount > 0) {
        const parts = [];
        if (eventCount > 0) parts.push(`${eventCount} etkinlik`);
        if (memberFavCount > 0) parts.push(`${memberFavCount} üye favorisi`);
        if (venueCount > 0) parts.push(`${venueCount} mekan yapısı`);
        throw new ApiError(
          400,
          `Bu etiket kullanımda (${parts.join(', ')}). Önce bağlantıları kaldırdıktan sonra silebilirsiniz.`
        );
      }

      await Tag.findByIdAndDelete(id);
      return { message: 'Etiket başarıyla silindi' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Etiket silinirken bir hata oluştu');
    }
  }
}

module.exports = new TagService(); 