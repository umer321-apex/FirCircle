const express = require('express');
const protect = require('../middleware/authMiddleware');
const requirePremium = require('../middleware/premiumMiddleware');
const { getExercises } = require('../controllers/exerciseController');

const router = express.Router();

router.get('/', protect, requirePremium, getExercises);

module.exports = router;