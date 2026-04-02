const homepageService = require('../../services/public/homepage.service');

class PublicHomepageController {
  async getHomepage(req, res) {
    try {
      const { status, body } = await homepageService.getHomepage();
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHomepageBundle(req, res) {
    try {
      const { status, body } = await homepageService.getHomepageBundle();
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PublicHomepageController();


