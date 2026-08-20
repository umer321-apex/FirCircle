const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    goal: {
      type: String,
      enum: ['cutting', 'bulking', 'maintenance'],
    },
    homeGym: {
      name: String,
      address: String,
      lat: Number,
      lng: Number,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    country: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    ageBand: {
      type: String,
      enum: ['18-24', '25-34', '35-44', '45+'],
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    weightKg: Number,
    heightCm: Number,
    healthConditions: {
      type: [String],
      default: [],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expoPushToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    preferredCheckInHour: {
      type: Number, // 0-23, the hour of day the user usually works out
      min: 0,
      max: 23,
      default: 18, // sensible default: 6 PM
    },
  },
  { timestamps: true }
);

// Compound index used heavily by squadMatchService.js later (week + goal + ageBand)
userSchema.index({ goal: 1, ageBand: 1, createdAt: 1 });

module.exports = mongoose.model('User', userSchema);