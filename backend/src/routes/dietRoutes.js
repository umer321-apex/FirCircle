const express = require('express');
const router = express.Router();
const { generatePlan, getTodayPlan, addCustomMeal } = require('../controllers/dietController');
const authMiddleware = require('../middleware/authMiddleware');
const premiumMiddleware = require('../middleware/premiumMiddleware');

// FR-6.9: full plan GENERATION is Premium-only.
router.post('/generate', authMiddleware, premiumMiddleware, generatePlan);

// Viewing today's plan and custom-logging meals stay available to Free users
// (Free gets manual/custom logging only, per FR-6.9).
router.get('/today', authMiddleware, getTodayPlan);
router.post('/custom-meal', authMiddleware, addCustomMeal);

module.exports = router;