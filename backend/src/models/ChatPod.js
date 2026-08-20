const mongoose = require('mongoose');

const chatPodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: {
      type: String,
      enum: ['cutting', 'bulking', 'maintenance', null],
      default: null,
    },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatPod', chatPodSchema);