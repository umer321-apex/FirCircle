const mongoose = require('mongoose');

// Logged cardio session — mirrors Workout.js's shape/conventions for the strength side.
const cardioLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    activityName: {
      type: String,
      required: true, // denormalized, same reasoning as Workout.entries.exerciseName
    },
    durationMinutes: { type: Number, required: true },
    intensity: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true,
    },
    caloriesBurned: {
      type: Number,
      required: true, // computed server-side, never trust a client-sent value
    },
  },
  { timestamps: true }
);

cardioLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CardioLog', cardioLogSchema);
