const User = require('../models/User');

const registerToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken || typeof expoPushToken !== 'string') {
      return res.status(400).json({ message: 'expoPushToken is required' });
    }

    // Basic sanity check — real Expo tokens look like ExponentPushToken[xxxxxxxx]
    if (!expoPushToken.startsWith('ExponentPushToken')) {
      return res.status(400).json({ message: 'expoPushToken does not look like a valid Expo token' });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { expoPushToken } });

    return res.status(200).json({ message: 'Push token registered' });
  } catch (error) {
    console.error(`[notificationController.registerToken] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error registering push token' });
  }
};

module.exports = { registerToken };