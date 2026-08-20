const express = require('express');
const router = express.Router();
const {
  getMySubscription,
  handleRevenueCatWebhook,
  devTogglePremium,
} = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// Public — called by RevenueCat's servers, not your app's users
router.post('/webhook', handleRevenueCatWebhook);

// Protected — used by the app itself
router.get('/me', authMiddleware, getMySubscription);
router.patch('/dev-toggle', authMiddleware, devTogglePremium);

module.exports = router;