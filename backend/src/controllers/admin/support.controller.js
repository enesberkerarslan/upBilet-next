const supportService = require('../../services/admin/support.service');

class SupportController {
  async listTopics(req, res) {
    try {
      const { status, page, limit } = req.query;
      const data = await supportService.listTopics({ status, page, limit });
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTopic(req, res) {
    try {
      const data = await supportService.getTopicDetail(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Konu bulunamadı' });
      }
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async patchTopic(req, res) {
    try {
      const { status } = req.body || {};
      if (!status) {
        return res.status(400).json({ success: false, message: 'status alanı gerekli' });
      }
      const topic = await supportService.setTopicStatus(req.params.id, status);
      res.status(200).json({ success: true, data: topic });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addMessage(req, res) {
    try {
      const { body } = req.body || {};
      const msg = await supportService.addAdminMessage(
        req.params.id,
        req.user._id,
        { body },
        req.files || []
      );
      res.status(201).json({ success: true, data: msg });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Üyeye yeni destek konusu (ilk mesaj admin) */
  async createTopic(req, res) {
    try {
      const { memberId, subject, body, referenceSaleId } = req.body || {};
      const data = await supportService.createTopicForMember(
        req.user._id,
        { memberId, subject, body, referenceSaleId },
        req.files || []
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SupportController();
