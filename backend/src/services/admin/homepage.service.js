const HomePage = require('../../models/homepage.model');
const publicHomepageService = require('../public/homepage.service');

class AdminHomepageService {
  async upsertHomepage(payload) {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await HomePage.findOneAndUpdate({}, payload, options);

    await publicHomepageService.clearCache();

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


