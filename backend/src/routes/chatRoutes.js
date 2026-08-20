const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.use(authMiddleware);

router.post('/pods', chatController.createPod);
router.get('/pods', chatController.getMyPods);
router.post('/pods/:podId/messages', chatController.sendPodMessage);
router.get('/pods/:podId/messages', chatController.getPodMessages);

router.get('/conversations', chatController.getConversations);
router.post('/direct/:recipientId', chatController.sendDirectMessage);
router.get('/direct/:otherUserId', chatController.getDirectMessages);

module.exports = router;