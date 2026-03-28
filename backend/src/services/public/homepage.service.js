const HomePage = require('../../models/homepage.model');

class PublicHomepageService {
  async getHomepage() {
    const doc = await HomePage.findOne({ isPublished: true })
      .sort({ updatedAt: -1 })
      .lean();

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


