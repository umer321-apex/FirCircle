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
    // Drives cardio (and future strength) suggestion logic — duration/intensity scale with this.
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    // Drives the TDEE activity multiplier in bmrTdeeService.js — previously hardcoded
    // to "moderate" for every user regardless of actual activity.
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'veryActive'],
      default: 'moderate',
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
    // Snapshot band derived from weightKg whenever it's set/updated — same
    // "computed once, not live-recalculated" convention as ageBand. Used by
    // squadMatchService.js to group users of similar bodyweight.
    weightBand: {
      type: String,
      enum: ['<60kg', '60-69kg', '70-79kg', '80-89kg', '90-99kg', '100kg+'],
    },
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
    // User-defined gym time slots — replaces preferredCheckInHour-based guessing
    // with an explicit schedule when the user sets one up.
    gymSchedule: {
      type: [
        {
          label: { type: String, trim: true, default: '' }, // e.g. "Morning", "Leg Day"
          hour: { type: Number, min: 0, max: 23, required: true },
          minute: { type: Number, min: 0, max: 59, required: true },
          durationMinutes: { type: Number, min: 5, max: 300, default: 60 },
          daysOfWeek: {
            // 0 = Sunday ... 6 = Saturday
            type: [Number],
            default: [0, 1, 2, 3, 4, 5, 6],
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index used heavily by squadMatchService.js later (week + goal + ageBand)
userSchema.index({ goal: 1, ageBand: 1, createdAt: 1 });
// Supports the weight-band matching stage in squadMatchService.js
userSchema.index({ goal: 1, ageBand: 1, weightBand: 1 });

module.exports = mongoose.model('User', userSchema);