const express = require('express');
const protect = require('../middleware/authMiddleware');
const { registerToken } = require('../controllers/notificationController');

const router = express.Router();

router.post('/register-token', protect, registerToken);

module.exports = router;