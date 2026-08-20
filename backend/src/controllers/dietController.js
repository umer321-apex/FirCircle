const MealPlan = require('../models/MealPlan');
const FoodItem = require('../models/FoodItem');
const bmrTdeeService = require('../services/bmrTdeeService');
const mealSuggestionService = require('../services/mealSuggestionService');

function todayMidnightUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// POST /api/diet/generate  (Premium only — gated by premiumMiddleware on the route)
exports.generatePlan = async (req, res, next) => {
  try {
    const user = req.user;
    const { weightKg, heightCm, age, country, healthConditions = [] } = req.body;

    if (!weightKg || !heightCm || !age || !country) {
      return res.status(400).json({
        message: 'weightKg, heightCm, age, and country are required to generate a plan.',
      });
    }

    const { targetCalories, targetMacros } = bmrTdeeService.generateTargets({
      weightKg,
      heightCm,
      age,
      sex: user.sex,
      goal: user.goal,
    });

    const suggestedOptions = await mealSuggestionService.buildDailySuggestions({
      country,
      healthConditions,
    });

    const date = todayMidnightUTC();

    const plan = await MealPlan.findOneAndUpdate(
      { userId: user._id, date },
      {
        userId: user._id,
        date,
        targetCalories,
        targetMacros,
        suggestedOptions: {
          breakfast: suggestedOptions.breakfast.map((f) => f._id),
          lunch: suggestedOptions.lunch.map((f) => f._id),
          dinner: suggestedOptions.dinner.map((f) => f._id),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await plan.populate([
      { path: 'suggestedOptions.breakfast' },
      { path: 'suggestedOptions.lunch' },
      { path: 'suggestedOptions.dinner' },
      { path: 'meals.foodItemId' },
    ]);

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// GET /api/diet/today  (available to all users — Free users just won't have
// a generated plan unless they've hit /generate as Premium; they can still
// log custom meals via POST /api/diet/custom-meal per FR-6.9 / FR-6.7)
exports.getTodayPlan = async (req, res, next) => {
  try {
    const date = todayMidnightUTC();
    const plan = await MealPlan.findOne({ userId: req.user._id, date }).populate([
      { path: 'suggestedOptions.breakfast' },
      { path: 'suggestedOptions.lunch' },
      { path: 'suggestedOptions.dinner' },
      { path: 'meals.foodItemId' },
    ]);

    if (!plan) {
      return res.json({ exists: false });
    }

    const totals = computeLoggedTotals(plan);
    res.json({ exists: true, plan, totals });
  } catch (err) {
    next(err);
  }
};

// POST /api/diet/custom-meal  (FR-6.7 — available to Free and Premium)
exports.addCustomMeal = async (req, res, next) => {
  try {
    const { slot, foodItemId, servings = 1, customEntry } = req.body;

    if (!slot) {
      return res.status(400).json({ message: 'slot is required.' });
    }
    if (!foodItemId && !customEntry) {
      return res.status(400).json({ message: 'Either foodItemId or customEntry is required.' });
    }

    const date = todayMidnightUTC();

    // Ensure a MealPlan document exists for today even if the user never
    // generated one (e.g. Free user going straight to custom logging).
    let plan = await MealPlan.findOne({ userId: req.user._id, date });
    if (!plan) {
      // Give a sensible default target so totals still make sense on screen;
      // Free users without a generated plan just won't see a "vs target" bar.
      plan = new MealPlan({
        userId: req.user._id,
        date,
        targetCalories: 0,
        targetMacros: { protein: 0, carbs: 0, fat: 0 },
      });
    }

    if (foodItemId) {
      const foodExists = await FoodItem.exists({ _id: foodItemId });
      if (!foodExists) {
        return res.status(404).json({ message: 'FoodItem not found.' });
      }
      plan.meals.push({ slot, foodItemId, servings, isCustom: false });
    } else {
      const { name, calories, protein, carbs, fat } = customEntry;
      if (!name || calories == null) {
        return res.status(400).json({ message: 'customEntry requires at least name and calories.' });
      }
      plan.meals.push({
        slot,
        isCustom: true,
        servings,
        customEntry: { name, calories, protein: protein || 0, carbs: carbs || 0, fat: fat || 0 },
      });
    }

    await plan.save();
    await plan.populate([{ path: 'meals.foodItemId' }]);

    const totals = computeLoggedTotals(plan);
    res.status(201).json({ plan, totals });
  } catch (err) {
    next(err);
  }
};

/**
 * Sums calories/macros actually logged today across meals[], whether from a
 * FoodItem reference or a custom entry — this is what counts toward the
 * user's daily totals per FR-6.7.
 */
function computeLoggedTotals(plan) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const meal of plan.meals) {
    const servings = meal.servings || 1;
    if (meal.isCustom && meal.customEntry) {
      totals.calories += meal.customEntry.calories * servings;
      totals.protein += meal.customEntry.protein * servings;
      totals.carbs += meal.customEntry.carbs * servings;
      totals.fat += meal.customEntry.fat * servings;
    } else if (meal.foodItemId) {
      const food = meal.foodItemId;
      const servingRatio = (food.servingSizeG || 100) / 100;
      totals.calories += food.caloriesPer100g * servingRatio * servings;
      totals.protein += food.protein * servingRatio * servings;
      totals.carbs += food.carbs * servingRatio * servings;
      totals.fat += food.fat * servingRatio * servings;
    }
  }

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}