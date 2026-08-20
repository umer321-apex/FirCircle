const User = require('../models/User');
const Subscription = require('../models/Subscription');

// GET /api/subscription/me
const getMySubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    res.status(200).json({
      isPremium: req.user.isPremium,
      subscription: sub || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription', error: error.message });
  }
};

// POST /api/subscription/webhook  (RevenueCat webhook, called by RevenueCat's servers)
// RevenueCat sends: { event: { type, app_user_id, product_id, expiration_at_ms, ... } }
const handleRevenueCatWebhook = async (req, res) => {
  try {
    const event = req.body?.event;

    if (!event) {
      return res.status(400).json({ message: 'Missing event payload' });
    }

    const { app_user_id: appUserId, type, expiration_at_ms: expirationAtMs } = event;

    if (!appUserId) {
      return res.status(400).json({ message: 'Missing app_user_id' });
    }

    // app_user_id is expected to be set (on the client) to our MongoDB User _id
    const user = await User.findById(appUserId);
    if (!user) {
      // Acknowledge with 200 anyway — RevenueCat retries on non-2xx
      return res.status(200).json({ message: 'User not found, ignoring event' });
    }

    const activeEventTypes = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'];
    const inactiveEventTypes = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

    let status = 'none';
    let isPremium = user.isPremium;

    if (activeEventTypes.includes(type)) {
      status = 'active';
      isPremium = true;
    } else if (inactiveEventTypes.includes(type)) {
      status = type === 'CANCELLATION' ? 'cancelled' : 'expired';
      isPremium = false;
    }

    user.isPremium = isPremium;
    await user.save();

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        revenueCatCustomerId: appUserId,
        plan: isPremium ? 'premium' : 'free',
        status,
        renewsAt: expirationAtMs ? new Date(expirationAtMs) : null,
        lastEventType: type,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('RevenueCat webhook error:', error.message);
    // Still return 200 to avoid RevenueCat retry storms while you're testing;
    // switch to 500 once you're in production and want RevenueCat to retry on real failures.
    res.status(200).json({ message: 'Webhook received with errors', error: error.message });
  }
};

// PATCH /api/subscription/dev-toggle  (dev-only, no RevenueCat needed — for local testing)
const devTogglePremium = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Dev toggle disabled in production' });
    }

    const user = await User.findById(req.user._id);
    user.isPremium = !user.isPremium;
    await user.save();

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        plan: user.isPremium ? 'premium' : 'free',
        status: user.isPremium ? 'active' : 'none',
        lastEventType: 'DEV_TOGGLE',
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle premium', error: error.message });
  }
};

module.exports = { getMySubscription, handleRevenueCatWebhook, devTogglePremium };