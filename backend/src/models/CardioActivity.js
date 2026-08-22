const mongoose = require('mongoose');

// Per-intensity guidance for one activity — mirrors Exercise.variants' pattern
// of pre-written plain-English explanations rather than generating them at runtime.
const intensityGuidanceSchema = new mongoose.Schema(
  {
    minDurationMinutes: { type: Number, required: true },
    maxDurationMinutes: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const cardioActivitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    // Used to estimate calories burned: caloriesBurned = caloriesPerMinutePerKg * weightKg * durationMinutes
    caloriesPerMinutePerKg: {
      type: Number,
      required: true,
    },
    intensityLevels: {
      low: { type: intensityGuidanceSchema, required: true },
      moderate: { type: intensityGuidanceSchema, required: true },
      high: { type: intensityGuidanceSchema, required: true },
    },
    imageUrl: { type: String, trim: true, default: '' },
    videoUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CardioActivity', cardioActivitySchema);
