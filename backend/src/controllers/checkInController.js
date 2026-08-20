const GymCheckIn = require('../models/GymCheckIn');
const User = require('../models/User');
const { getDistanceInMeters } = require('../services/geofenceService');

const AUTO_VERIFY_RADIUS_METERS = 150;

// Returns today's date as 'YYYY-MM-DD' in the server's local time.
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const updatePreferredCheckInHour = async (userId) => {
  try {
    const recentCheckIns = await GymCheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('createdAt')
      .lean();

    if (recentCheckIns.length < 3) return; // not enough data yet — keep the default

    const hourCounts = {};
    recentCheckIns.forEach((c) => {
      const hour = new Date(c.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostCommonHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];

    await User.findByIdAndUpdate(userId, {
      $set: { preferredCheckInHour: parseInt(mostCommonHour, 10) },
    });
  } catch (error) {
    console.error(`[checkInController.updatePreferredCheckInHour] Error: ${error.message}`);
  }
};

const createCheckIn = async (req, res) => {
  try {
    const { lat, lng, manual } = req.body;
    const isManual = manual === true;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng (numbers) are required' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'lat/lng values are out of range' });
    }

    // Fetch fresh — req.user from authMiddleware may be stale re: homeGym
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.homeGym || typeof user.homeGym.lat !== 'number') {
      return res.status(400).json({
        message: 'No home gym set — complete onboarding before checking in',
      });
    }

    const today = getTodayDateString();

    // FR-2.5: max one credited check-in per day — check first for a clean error message
    // (the unique index below is the real enforcement, this is just a friendlier response)
    const existing = await GymCheckIn.findOne({ userId: user._id, date: today }).lean();
    if (existing) {
      return res.status(200).json({
        checkIn: existing,
        withinRadius: existing.autoVerified,
        distanceMeters: existing.distanceMeters,
        message: 'Already checked in today',
      });
    }

    const distance = getDistanceInMeters(lat, lng, user.homeGym.lat, user.homeGym.lng);
    const withinRadius = distance <= AUTO_VERIFY_RADIUS_METERS;

    // Only ever create a record when the user is actually in range, OR they
    // explicitly asked for a manual (self-reported) check-in. Merely opening
    // the screen from far away must NOT silently log attendance.
    if (!withinRadius && !isManual) {
      return res.status(200).json({
        checkIn: null,
        withinRadius: false,
        distanceMeters: Math.round(distance),
        message: `You're ${Math.round(distance)}m from your home gym — too far to auto check-in.`,
      });
    }

    const checkIn = await GymCheckIn.create({
      userId: user._id,
      date: today,
      autoVerified: withinRadius,
      manual: isManual,
      gymNameUsed: user.homeGym.name,
      distanceMeters: Math.round(distance),
    });
    updatePreferredCheckInHour(user._id); // fire-and-forget, don't block the response
    return res.status(201).json({ checkIn, withinRadius, distanceMeters: Math.round(distance) });
  } catch (error) {
    // Race condition: two near-simultaneous requests both pass the "existing" check
    // above, then collide on the unique index — this catches that cleanly.
    if (error.code === 11000) {
      console.error(`[checkInController.createCheckIn] Duplicate check-in race: ${error.message}`);
      const today = getTodayDateString();
      const existing = await GymCheckIn.findOne({ userId: req.user._id, date: today }).lean();
      return res.status(200).json({
        checkIn: existing,
        withinRadius: existing?.autoVerified,
        distanceMeters: existing?.distanceMeters,
        message: 'Already checked in today',
      });
    }

    console.error(`[checkInController.createCheckIn] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error creating check-in' });
  }
};

const getMyCheckIns = async (req, res) => {
  try {
    // Sorted + capped — keeps this fast and predictable even after months of daily check-ins
    const checkIns = await GymCheckIn.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(90)
      .lean();

    return res.status(200).json({ checkIns });
  } catch (error) {
    console.error(`[checkInController.getMyCheckIns] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching check-ins' });
  }
};
// Learns the user's typical check-in hour from their last 30 check-ins.
// Called after every check-in to keep preferredCheckInHour up to date automatically.

module.exports = { createCheckIn, getMyCheckIns };