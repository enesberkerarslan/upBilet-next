const express = require('express');
const router = express.Router();
const { memberProtect } = require('../../middleware/memberAuth.middleware');
const { uploadSupportFiles } = require('../../utils/supportUpload.multer');
const memberSupportController = require('../../controllers/member/memberSupport.controller');

router.use(memberProtect);

router.get('/topics', memberSupportController.listTopics);
router.post(
  '/topics',
  uploadSupportFiles.array('files', 5),
  memberSupportController.createTopic
);
router.get('/topics/:id', memberSupportController.getTopic);
router.post(
  '/topics/:id/messages',
  uploadSupportFiles.array('files', 5),
  memberSupportController.addMessage
);

module.exports = router;
