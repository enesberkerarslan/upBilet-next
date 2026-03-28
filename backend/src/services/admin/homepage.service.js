const HomePage = require('../../models/homepage.model');
const cacheService = require('../../utils/cache');

class AdminHomepageService {
  async upsertHomepage(payload) {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await HomePage.findOneAndUpdate({}, payload, options);
    
    // Homepage güncellendiğinde cache'i temizle
    await cacheService.clearHomepageCache();
    
    return {
      status: 200,
      body: { success: true, homepage: doc }
    };
  }

  async getHomepage() {
    const doc = await HomePage.findOne({}).lean();
    return { status: 200, body: { success: true, homepage: doc || null } };
  }
}

module.exports = new AdminHomepageService();


