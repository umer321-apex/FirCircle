const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priceUSD: { type: Number, required: true },
    commissionUSD: { type: Number, required: true },
    coachEarningsUSD: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const coachPlanSchema = new mongoose.Schema(
  {
    coachUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['workout', 'meal'],
      required: true,
    },
    priceUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    purchases: [purchaseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('CoachPlan', coachPlanSchema);