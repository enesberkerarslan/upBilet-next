const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { uploadSupportFiles } = require('../../utils/supportUpload.multer');
const supportController = require('../../controllers/admin/support.controller');

router.use(protect);

router.get('/topics', supportController.listTopics);
router.post(
  '/topics',
  uploadSupportFiles.array('files', 5),
  supportController.createTopic
);
router.get('/topics/:id', supportController.getTopic);
router.patch('/topics/:id', supportController.patchTopic);
router.post(
  '/topics/:id/messages',
  uploadSupportFiles.array('files', 5),
  supportController.addMessage
);

module.exports = router;
