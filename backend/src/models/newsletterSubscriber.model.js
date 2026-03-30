const mongoose = require('mongoose');

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    /** hangi yüzeyden geldiği (örn. homepage) */
    source: { type: String, default: 'homepage', trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);
