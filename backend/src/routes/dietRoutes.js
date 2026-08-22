const express = require('express');
const router = express.Router();
const {
  generatePlan,
  getTodayPlan,
  getHistory,
  addCustomMeal,
  deleteMeal,
  getFoodItem,
  searchFoodItems,
  getCountries,
} = require('../controllers/dietController');
const authMiddleware = require('../middleware/authMiddleware');
const premiumMiddleware = require('../middleware/premiumMiddleware');

// FR-6.9: full plan GENERATION is Premium-only.
router.post('/generate', authMiddleware, premiumMiddleware, generatePlan);

// Viewing today's plan and custom-logging meals stay available to Free users
// (Free gets manual/custom logging only, per FR-6.9).
router.get('/today', authMiddleware, getTodayPlan);
router.get('/history', authMiddleware, getHistory);
router.post('/custom-meal', authMiddleware, addCustomMeal);
router.delete('/meal/:mealEntryId', authMiddleware, deleteMeal);

// Food database — search/browse (backs custom-meal autocomplete) and single lookup
// (previously called by the frontend with no matching route at all).
router.get('/food-items/search', authMiddleware, searchFoodItems);
router.get('/food-items/:id', authMiddleware, getFoodItem);
router.get('/countries', authMiddleware, getCountries);

module.exports = router;
