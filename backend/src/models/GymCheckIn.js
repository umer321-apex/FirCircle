const mongoose = require('mongoose');

const gymCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // stored as 'YYYY-MM-DD' for simple one-per-day lookups/uniqueness
      required: true,
    },
    autoVerified: {
      type: Boolean,
      default: false,
    },
    gymNameUsed: {
      type: String,
    },
    distanceMeters: {
      type: Number, // distance from home gym at time of check-in, useful for debugging/insights later
    },
  },
  { timestamps: true }
);

// Enforces FR-2.5 (max one credited check-in per calendar day) at the database level —
// faster and safer than only checking in application code.
gymCheckInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('GymCheckIn', gymCheckInSchema);