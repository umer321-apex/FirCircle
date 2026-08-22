const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  getCardioActivities,
  getCardioSuggestion,
  logCardio,
  getMyCardio,
} = require('../controllers/cardioController');

const router = express.Router();

router.get('/activities', protect, getCardioActivities);
router.get('/suggestion', protect, getCardioSuggestion);
router.post('/log', protect, logCardio);
router.get('/me', protect, getMyCardio);

module.exports = router;
