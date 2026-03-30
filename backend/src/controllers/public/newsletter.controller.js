const newsletterService = require('../../services/public/newsletter.service');

class PublicNewsletterController {
  async subscribe(req, res) {
    try {
      const { email, source } = req.body || {};
      const { status, body } = await newsletterService.subscribe(email, source);
      res.status(status).json(body);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PublicNewsletterController();
