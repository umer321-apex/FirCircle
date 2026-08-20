const express = require('express');
const protect = require('../middleware/authMiddleware');
const { createCheckIn, getMyCheckIns } = require('../controllers/checkInController');

const router = express.Router();

router.post('/', protect, createCheckIn);
router.get('/me', protect, getMyCheckIns);

module.exports = router;