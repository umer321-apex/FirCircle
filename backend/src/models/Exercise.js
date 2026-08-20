const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    sets: { type: Number, required: true },
    reps: { type: String, required: true }, // string to allow ranges like "10-12"
    restSeconds: { type: Number, required: true },
    explanation: { type: String, required: true },
    caloriesPerSet: { type: Number, required: true },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    splitCategory: {
      type: String,
      required: true,
      enum: ['Chest Day', 'Back Day', 'Leg Day', 'Shoulder Day', 'Arm Day'],
      index: true,
    },
    primaryMuscle: {
      type: String,
      required: true,
    },
    variants: {
      cutting: { type: variantSchema, required: true },
      bulking: { type: variantSchema, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', exerciseSchema);