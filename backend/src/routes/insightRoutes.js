const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const premiumMiddleware = require('../middleware/premiumMiddleware');
const insightController = require('../controllers/insightController');

router.use(authMiddleware);
router.use(premiumMiddleware); // FR-9.3: fully Premium-gated

router.get('/weekly', insightController.getWeeklyInsight);

module.exports = router;