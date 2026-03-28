const mongoose = require('mongoose');
const VenueStructure = require('../../models/venueStructure.model');
const Tag = require('../../models/tag.model');

const ETKINLIK_ALANI = 'EtkinlikAlanı';

async function assertVenueIdIsEtkinlikAlani(venueId) {
  if (venueId == null || venueId === '') {
    throw new Error('Mekan (etiket) zorunludur');
  }
  if (!mongoose.Types.ObjectId.isValid(venueId)) {
    throw new Error('Geçersiz mekan etiketi');
  }
  const tag = await Tag.findById(venueId);
  if (!tag) {
    throw new Error('Etiket bulunamadı');
  }
  if (tag.tag !== ETKINLIK_ALANI) {
    throw new Error('Mekan yapısı için yalnızca "Etkinlik Alanı" tipindeki etiketler kullanılabilir');
  }
}

const DUPLICATE_VENUE_MSG = 'Bu etiket için zaten bir mekan yapısı tanımlı. Her mekana yalnızca bir yapı eklenebilir.';

class VenueStructureService {
  // Create a new venue structure
  async createVenueStructure(venueStructureData) {
    await assertVenueIdIsEtkinlikAlani(venueStructureData.venueId);
    const taken = await VenueStructure.findOne({ venueId: venueStructureData.venueId });
    if (taken) {
      throw new Error(DUPLICATE_VENUE_MSG);
    }
    const venueStructure = new VenueStructure(venueStructureData);
    try {
      return await venueStructure.save();
    } catch (err) {
      if (err && err.code === 11000) {
        throw new Error(DUPLICATE_VENUE_MSG);
      }
      throw err;
    }
  }

  // Get all venue structures
  async getAllVenueStructures() {
    const venueStructures = await VenueStructure.find()
      .populate('venueId')
      .sort({ createdAt: -1 });
    
    return venueStructures;
  }

  // Get venue structure by ID
  async getVenueStructureById(id) {
    const venueStructure = await VenueStructure.findById(id)
      .populate('venueId');
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }
    return venueStructure;
  }

  // Get venue structure by venue ID
  async getVenueStructureByVenueId(venueId) {
    const venueStructure = await VenueStructure.findOne({ venueId })
      .populate('venueId');
    if (!venueStructure) {
      throw new Error('Venue structure not found for this venue');
    }
    return venueStructure;
  }

  // Update venue structure
  async updateVenueStructure(id, updateData) {
    if (Object.prototype.hasOwnProperty.call(updateData, 'venueId')) {
      await assertVenueIdIsEtkinlikAlani(updateData.venueId);
      const clash = await VenueStructure.findOne({
        venueId: updateData.venueId,
        _id: { $ne: id },
      });
      if (clash) {
        throw new Error(DUPLICATE_VENUE_MSG);
      }
    }
    try {
      const venueStructure = await VenueStructure.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('venueId');

      if (!venueStructure) {
        throw new Error('Venue structure not found');
      }
      return venueStructure;
    } catch (err) {
      if (err && err.code === 11000) {
        throw new Error(DUPLICATE_VENUE_MSG);
      }
      throw err;
    }
  }

  // Delete venue structure
  async deleteVenueStructure(id) {
    const venueStructure = await VenueStructure.findByIdAndDelete(id);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }
    return venueStructure;
  }

  // Add category to venue structure
  async addCategory(venueStructureId, categoryData) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    venueStructure.categories.push(categoryData);
    return await venueStructure.save();
  }

  // Add block to category
  async addBlock(venueStructureId, categoryId, blockData) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    const category = venueStructure.categories.id(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    category.blocks.push(blockData);
    return await venueStructure.save();
  }

  // Update category in venue structure
  async updateCategory(venueStructureId, categoryId, categoryData) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    const category = venueStructure.categories.id(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Mevcut ID'yi koruyarak güncelleme yap
    Object.assign(category, categoryData);
    return await venueStructure.save();
  }

  // Update block in category
  async updateBlock(venueStructureId, categoryId, blockId, blockData) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    const category = venueStructure.categories.id(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const block = category.blocks.id(blockId);
    if (!block) {
      throw new Error('Block not found');
    }

    // Mevcut ID'yi koruyarak güncelleme yap
    Object.assign(block, blockData);
    return await venueStructure.save();
  }

  // Delete category from venue structure
  async deleteCategory(venueStructureId, categoryId) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    const category = venueStructure.categories.id(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Remove the category
    venueStructure.categories.pull(categoryId);
    return await venueStructure.save();
  }

  // Delete block from category
  async deleteBlock(venueStructureId, categoryId, blockId) {
    const venueStructure = await VenueStructure.findById(venueStructureId);
    if (!venueStructure) {
      throw new Error('Venue structure not found');
    }

    const category = venueStructure.categories.id(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const block = category.blocks.id(blockId);
    if (!block) {
      throw new Error('Block not found');
    }

    // Remove the block
    category.blocks.pull(blockId);
    return await venueStructure.save();
  }
}

module.exports = new VenueStructureService(); 