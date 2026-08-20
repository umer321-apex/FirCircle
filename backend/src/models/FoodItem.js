const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: {
      type: String,
      required: true,
      // e.g. 'PK', 'US' — keep as an ISO-ish short code so we can extend easily
    },
    mealSlots: [
      {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true,
      },
    ],
    caloriesPer100g: { type: Number, required: true },
    protein: { type: Number, required: true }, // grams per 100g
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    glycemicIndex: { type: Number, min: 0, max: 110 }, // used for diabetes filtering
    saturatedFatHigh: { type: Boolean, default: false }, // used for cholesterol filtering
    servingSizeG: { type: Number, default: 100 }, // a "typical serving" for display purposes
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

foodItemSchema.index({ country: 1, mealSlots: 1 });

module.exports = mongoose.model('FoodItem', foodItemSchema);