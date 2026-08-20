const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
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
    weightKg: {
      type: Number,
    },
    measurements: {
      chestCm: Number,
      waistCm: Number,
      hipsCm: Number,
      armsCm: Number,
      thighsCm: Number,
    },
    photoUrl: {
      type: String, // Cloudinary secure_url only — never store raw file data
    },
  },
  { timestamps: true }
);

progressEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('ProgressEntry', progressEntrySchema);