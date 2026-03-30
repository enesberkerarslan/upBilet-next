const HomePage = require('../../models/homepage.model');

class PublicHomepageService {
  async getHomepage() {
    // Önce yayında olan; yoksa tekil anasayfa belgesi (panelde yayın kapalı unutulunca null dönmesin)
    let doc = await HomePage.findOne({ isPublished: true })
      .sort({ updatedAt: -1 })
      .lean();
    if (!doc) {
      doc = await HomePage.findOne({}).sort({ updatedAt: -1 }).lean();
    }

    return {
      status: 200,
      body: {
        success: true,
        homepage: doc || null,
      },
    };
  }

  async clearCache() {}
}

module.exports = new PublicHomepageService();


