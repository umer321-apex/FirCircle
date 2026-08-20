const express = require('express');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { addProgressEntry, getMyProgress } = require('../controllers/progressController');

const router = express.Router();

router.post('/', protect, upload.single('photo'), addProgressEntry);
router.get('/me', protect, getMyProgress);

module.exports = router;