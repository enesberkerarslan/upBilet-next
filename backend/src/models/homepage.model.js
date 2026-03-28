const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    link: { type: String, default: '#' },
    label: { type: String, default: 'İncele' }
  },
  { _id: false }
);

const HomeHeroSchema = new mongoose.Schema(
  {
    backgroundImageUrl: { type: String, default: '' },
    homeTeamName: { type: String, default: '' },
    homeTeamLink: { type: String, default: '#' },
    awayTeamName: { type: String, default: '' },
    awayTeamLink: { type: String, default: '#' },
    dateText: { type: String, default: '' },
    timeText: { type: String, default: '' },
    venue: { type: String, default: '' },
    description: { type: String, default: '' },
    ticketLink: { type: String, default: '/payment' }
  },
  { _id: false }
);

const HomePageSchema = new mongoose.Schema(
  {
    hero: { type: HomeHeroSchema, default: () => ({}) },
    banners: { type: [BannerSchema], default: [] },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomePage', HomePageSchema);


