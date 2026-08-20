const express = require('express');
const protect = require('../middleware/authMiddleware');
const { logWorkout, getMyWorkouts } = require('../controllers/workoutController');

const router = express.Router();

router.post('/', protect, logWorkout);
router.get('/me', protect, getMyWorkouts);

module.exports = router;