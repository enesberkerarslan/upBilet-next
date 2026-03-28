const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  metaTitle: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    required: true
  },
  content: [{
    text: {
      type: String
    },
    imageUrl: {
      type: String
    }
  }]
  
}, {
  timestamps: true
});

// Slug oluşturma fonksiyonu (Türkçe karakter desteğiyle)
function slugify(text) {
  const turkishChars = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I', 'İ': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  return text
    .toString()
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (match) => turkishChars[match] || match)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Kaydetmeden önce slug oluştur
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title);
  }
  next();
});

// Indexes for faster queries
blogSchema.index({ title: 'text' });
blogSchema.index({ metaTitle: 'text' });
blogSchema.index({ metaDescription: 'text' });
blogSchema.index({ slug: 1 }, { unique: true });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 