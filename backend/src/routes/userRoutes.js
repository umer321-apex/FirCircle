const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getMe, updateOnboarding, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.get('/me', protect, getMe);
router.patch('/me/onboarding', protect, updateOnboarding);
router.patch('/me', protect, updateProfile);

module.exports = router;