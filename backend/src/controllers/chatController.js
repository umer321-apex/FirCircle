const ChatPod = require('../models/ChatPod');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../sockets');

const FREE_POD_LIMIT = 1;

// POST /api/chat/pods
exports.createPod = async (req, res) => {
  try {
    const { name, goal, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Pod name is required.' });

    const user = await User.findById(req.user.id);

    // FR-8.3: Free plan limited to 1 pod
    if (!user.isPremium) {
      const existingPodCount = await ChatPod.countDocuments({ memberIds: user._id });
      if (existingPodCount >= FREE_POD_LIMIT) {
        return res.status(403).json({
          message: `Free plan is limited to ${FREE_POD_LIMIT} pod. Upgrade to Premium for unlimited pods.`,
          upgradeRequired: true,
        });
      }
    }

    const uniqueMemberIds = Array.from(new Set([user._id.toString(), ...memberIds.map(String)]));

    const pod = await ChatPod.create({
      name,
      goal: goal || null,
      memberIds: uniqueMemberIds,
      createdBy: user._id,
    });

    res.status(201).json(pod);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create pod.', error: err.message });
  }
};

// GET /api/chat/pods
exports.getMyPods = async (req, res) => {
  try {
    const pods = await ChatPod.find({ memberIds: req.user.id })
      .populate('memberIds', 'name')
      .sort({ updatedAt: -1 });
    res.json(pods);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pods.', error: err.message });
  }
};

// POST /api/chat/pods/:podId/messages
exports.sendPodMessage = async (req, res) => {
  try {
    const { podId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required.' });

    const pod = await ChatPod.findById(podId);
    if (!pod) return res.status(404).json({ message: 'Pod not found.' });
    if (!pod.memberIds.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this pod.' });
    }

    const message = await Message.create({
      podId,
      senderId: req.user.id,
      text: text.trim(),
    });

    const populated = await message.populate('senderId', 'name');

    // Real-time delivery
    getIO().to(`pod:${podId}`).emit('newMessage', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.', error: err.message });
  }
};

// GET /api/chat/pods/:podId/messages
exports.getPodMessages = async (req, res) => {
  try {
    const { podId } = req.params;
    const pod = await ChatPod.findById(podId);
    if (!pod) return res.status(404).json({ message: 'Pod not found.' });
    if (!pod.memberIds.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this pod.' });
    }

    const messages = await Message.find({ podId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pod messages.', error: err.message });
  }
};

// POST /api/chat/direct/:recipientId
exports.sendDirectMessage = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required.' });
    if (recipientId === req.user.id) return res.status(400).json({ message: "You can't message yourself." });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found.' });

    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      text: text.trim(),
    });

    const populated = await message.populate('senderId', 'name');

    getIO().to(`user:${recipientId}`).emit('newMessage', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.', error: err.message });
  }
};

// GET /api/chat/direct/:otherUserId
exports.getDirectMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const meId = req.user.id;

    const messages = await Message.find({
      podId: null,
      $or: [
        { senderId: meId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: meId },
      ],
    })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages.', error: err.message });
  }
};

// GET /api/chat/conversations — list of direct-message threads for ChatListScreen
exports.getConversations = async (req, res) => {
  try {
    const meId = req.user.id;
    const mongoose = require('mongoose');
    const meObjectId = new mongoose.Types.ObjectId(meId);

    const threads = await Message.aggregate([
      { $match: { podId: null, $or: [{ senderId: meObjectId }, { recipientId: meObjectId }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ['$senderId', meObjectId] }, '$recipientId', '$senderId'],
          },
        },
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const populatedThreads = await User.populate(threads, { path: '_id', select: 'name' });

    res.json(
      populatedThreads.map((t) => ({
        user: t._id,
        lastMessage: t.lastMessage,
        lastMessageAt: t.lastMessageAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations.', error: err.message });
  }
};