const mongoose = require('mongoose');

const workoutEntrySchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    exerciseName: {
      type: String,
      required: true, // denormalized so history still reads fine even if an exercise is later removed/renamed
    },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    volume: { type: Number, required: true }, // sets * reps * weightKg, computed server-side
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
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
    splitCategory: {
      type: String,
      required: true,
    },
    entries: {
      type: [workoutEntrySchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A workout must include at least one exercise entry',
      },
    },
    totalVolume: {
      type: Number,
      required: true, // sum of all entries' volume, for fast weekly-aggregation queries later
    },
  },
  { timestamps: true }
);

// Supports "workout history for user, most recent first" — the most common query pattern
workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);