const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  blocks: [blockSchema]
}, { _id: true });

const venueStructureSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: true
  },
  categories: [categorySchema]
}, {
  timestamps: true
});

// Her etiket (mekan) için tek bir yapı tanımı
venueStructureSchema.index({ venueId: 1 }, { unique: true });

const VenueStructure = mongoose.model('VenueStructure', venueStructureSchema);

module.exports = VenueStructure; 