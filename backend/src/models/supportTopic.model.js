const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileKey: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    kind: { type: String, enum: ['image', 'pdf'], required: true },
  },
  { _id: false }
);

/** Konu altında gömülü mesajlar (ayrı koleksiyon yok) */
const supportMessageSubSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20000,
    },
    fromRole: {
      type: String,
      enum: ['member', 'admin'],
      required: true,
    },
    fromMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator(arr) {
          return !arr || arr.length <= 5;
        },
        message: 'En fazla 5 ek dosya eklenebilir',
      },
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const supportTopicSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    unreadForAdmin: { type: Boolean, default: true },
    unreadForMember: { type: Boolean, default: false },
    referenceSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null,
    },
    messages: {
      type: [supportMessageSubSchema],
      default: [],
    },
  },
  { timestamps: true }
);

supportTopicSchema.index({ updatedAt: -1 });
supportTopicSchema.index({ memberId: 1, status: 1 });

module.exports = mongoose.model('SupportTopic', supportTopicSchema);
