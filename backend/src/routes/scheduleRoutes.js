const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getSchedule, updateSchedule } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', protect, getSchedule);
router.put('/', protect, updateSchedule);

module.exports = router;