const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getExercises, getSuggestedWorkout } = require('../controllers/exerciseController');

const router = express.Router();

// No premium gate — every user can preview any exercise.
router.get('/suggestion', protect, getSuggestedWorkout);
router.get('/', protect, getExercises);

module.exports = router;
