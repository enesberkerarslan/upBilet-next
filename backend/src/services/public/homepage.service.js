const HomePage = require('../../models/homepage.model');
const cacheService = require('../../utils/cache');

class PublicHomepageService {
  async getHomepage() {
    const cacheKey = cacheService.getHomepageKey();
    
    return await cacheService.cacheWrapper(
      cacheKey,
      async () => {
        const doc = await HomePage.findOne({ isPublished: true })
          .sort({ updatedAt: -1 })
          .lean();

        return {
          status: 200,
          body: {
            success: true,
            homepage: doc || null
          }
        };
      },
      1800 // 30 dakika cache
    );
  }

  // Cache'i temizle (admin panelinden çağrılabilir)
  async clearCache() {
    await cacheService.clearHomepageCache();
  }
}

module.exports = new PublicHomepageService();


