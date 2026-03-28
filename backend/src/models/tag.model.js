const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Etiket adı zorunludur'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  keywords: {
    type: String,
    trim: true
  },
  tag: {
    type: String,
    enum: ['FutbolTakımı', 'BasketbolTakımı', 'Sanatçı', 'GenelTag', 'EtkinlikAlanı', 'AltTag'],
    required: [true, 'Tag tipi zorunludur']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
 //relatedTags: [{
 //  type: mongoose.Schema.Types.ObjectId,
 //  ref: 'Tag'
 //}]
}, {
  timestamps: true
});

// Slug oluşturma middleware (yalnızca save() ile çalışır; findByIdAndUpdate tetiklemez)
tagSchema.pre('save', function(next) {
  if (!this.name) return next();
  if (!this.isNew && !this.isModified('name')) return next();
  
  // Türkçe karakterleri Latin eşdeğerleriyle değiştir
  const turkishToLatin = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  
  let slug = this.name;
  
  // Türkçe karakterleri değiştir
  Object.keys(turkishToLatin).forEach(turkishChar => {
    const regex = new RegExp(turkishChar, 'g');
    slug = slug.replace(regex, turkishToLatin[turkishChar]);
  });
  
  // Slug formatına çevir
  this.slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  next();
});

// Arama için index oluştur
tagSchema.index({ name: 'text', description: 'text' });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag; 