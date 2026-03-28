const memberSupportService = require('../../services/member/memberSupport.service');

class MemberSupportController {
  async listTopics(req, res) {
    try {
      const rows = await memberSupportService.listTopics(req.member._id);
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTopic(req, res) {
    try {
      const data = await memberSupportService.getTopicDetail(req.params.id, req.member._id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Konu bulunamadı' });
      }
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createTopic(req, res) {
    try {
      const { subject, body, referenceSaleId } = req.body || {};
      const result = await memberSupportService.createTopic(
        req.member._id,
        { subject, body, referenceSaleId },
        req.files || []
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addMessage(req, res) {
    try {
      const { body } = req.body || {};
      const msg = await memberSupportService.addMessage(
        req.params.id,
        req.member._id,
        { body },
        req.files || []
      );
      res.status(201).json({ success: true, data: msg });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MemberSupportController();
