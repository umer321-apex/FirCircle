const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Exactly one of podId or recipientId is set — pod message vs direct message
    podId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatPod', default: null, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ podId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);