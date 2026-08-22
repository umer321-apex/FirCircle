const mongoose = require('mongoose');

const startDateSquadSchema = new mongoose.Schema(
  {
    cohortWeekStart: {
      type: Date,
      required: true,
      // Monday of the signup week this cohort represents
    },
    goal: {
      type: String,
      enum: ['cutting', 'bulking', 'maintenance'],
      required: true,
    },
    ageBand: {
      type: String,
      enum: ['18-24', '25-34', '35-44', '45+'],
      required: true,
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'other', null],
      default: null,
      // null = this squad is NOT filtered by sex (mixed)
    },
    weightBand: {
      type: String,
      enum: ['<60kg', '60-69kg', '70-79kg', '80-89kg', '90-99kg', '100kg+', null],
      default: null,
      // null = this squad is NOT filtered by bodyweight (mixed)
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate cohort documents for the same criteria
startDateSquadSchema.index(
  { cohortWeekStart: 1, goal: 1, ageBand: 1, sex: 1, weightBand: 1 },
  { unique: true }
);

module.exports = mongoose.model('StartDateSquad', startDateSquadSchema);