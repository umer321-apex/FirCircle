const express = require('express');
const router = express.Router();
const { getMySquad } = require('../controllers/squadController');
const authMiddleware = require('../middleware/authMiddleware');

// Note: full vs summary response is decided INSIDE the controller
// (based on req.user.isPremium), not via premiumMiddleware blocking the
// route entirely — Free users still get a valid summary response per FR-5.5.
router.get('/me', authMiddleware, getMySquad);

module.exports = router;