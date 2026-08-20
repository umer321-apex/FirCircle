const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['workout', 'progressPhoto', 'mealPlan'],
      required: true,
    },
    // Points at the actual Workout / ProgressEntry / MealPlan document being shared.
    // refPath lets Mongoose resolve the correct model dynamically based on contentRefModel.
    contentRefId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'contentRefModel',
    },
    contentRefModel: {
      type: String,
      required: true,
      enum: ['Workout', 'ProgressEntry', 'MealPlan'],
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentCount: {
      type: Number,
      default: 0, // denormalized counter so the feed list doesn't need a separate count query per post
    },
  },
  { timestamps: true }
);

// Feed is always sorted by recency per author — this index supports both patterns
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);