const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    // Either references a FoodItem (generated/suggested meal) or is a fully custom entry
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', default: null },
    customEntry: {
      name: { type: String },
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
    },
    servings: { type: Number, default: 1 },
    isCustom: { type: Boolean, default: false },
  },
  { _id: true }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // normalized to midnight UTC for the day it applies to
    targetCalories: { type: Number, required: true },
    targetMacros: {
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
    },
    // For generated plans: 3 options per slot, user hasn't necessarily "picked" one yet
    suggestedOptions: {
      breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
      lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
      dinner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
    },
    // What the user has actually logged toward today's totals (generated pick or custom)
    meals: [mealEntrySchema],
  },
  { timestamps: true }
);

mealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);