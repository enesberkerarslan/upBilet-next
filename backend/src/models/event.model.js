const mongoose = require('mongoose');
const { slugifyEventName, ensureUniqueEventSlug } = require('../utils/eventSlug');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Etkinlik adı zorunludur'],
    trim: true,
    minlength: [3, 'Etkinlik adı en az 3 karakter olmalıdır'],
    maxlength: [100, 'Etkinlik adı en fazla 100 karakter olabilir']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta başlık en fazla 60 karakter olabilir']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta açıklama en fazla 160 karakter olabilir']
  },
  keywords: {
    type: String,
    trim: true,
    maxlength: [500, 'Keywords en fazla 500 karakter olabilir']
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Etkinlik tarihi zorunludur']
  },
  location: {
    type: String,
    required: [true, 'Etkinlik konumu zorunludur'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  listingCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 20,
    min: [0, 'Komisyon oranı 0\'dan küçük olamaz'],
    max: [100, 'Komisyon oranı 100\'den büyük olamaz']
  },
  comissionCustomer: {
    type: Number,
    default: 20,
    min: [0, 'Müşteri komisyonu 0\'dan küçük olamaz'],
    max: [100, 'Müşteri komisyonu 100\'den büyük olamaz']
  },
  isMainPage: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Slug yoksa (ör. seed / doğrudan create) isimden üret; servis zaten slug atıyorsa dokunma
eventSchema.pre('save', async function () {
  if (this.slug != null && String(this.slug).trim() !== '') {
    return;
  }
  const base = slugifyEventName(this.name);
  this.slug = await ensureUniqueEventSlug(this.constructor, base, this._id);
});

// Arama için text index oluştur
eventSchema.index({ 
  name: 'text', 
  description: 'text',
  location: 'text'
});

module.exports = mongoose.model('Event', eventSchema); 