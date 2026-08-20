const User = require('../models/User');

// Assumes authMiddleware (protect) already ran and set req.user
const requirePremium = async (req, res, next) => {
  try {
    // Fetch fresh — isPremium can change (webhook update) after the JWT was issued
    const user = await User.findById(req.user._id).select('isPremium').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.isPremiumUser = !!user.isPremium;
    next();
  } catch (error) {
    console.error(`[premiumMiddleware] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error checking subscription status' });
  }
};

module.exports = requirePremium;