const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileKey: {
    type: String,
    required: true,
    unique: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailKey: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
});

module.exports = mongoose.model('Media', mediaSchema); 