const homepageService = require('../../services/admin/homepage.service');
const publicHomepageService = require('../../services/public/homepage.service');

class AdminHomepageController {
  async get(req, res) {
    try {
      const { status, body } = await homepageService.getHomepage();
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async upsert(req, res) {
    try {
      const { status, body } = await homepageService.upsertHomepage(req.body);
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Cache temizleme endpoint'i
  async clearCache(req, res) {
    try {
      await publicHomepageService.clearCache();
      res.json({ success: true, message: 'Ana sayfa cache temizlendi' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AdminHomepageController();


