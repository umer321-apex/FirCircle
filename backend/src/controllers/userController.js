const User = require('../models/User');
const { deriveAgeBand, deriveWeightBand } = require('../utils/bands');

const VALID_GOALS = ['cutting', 'bulking', 'maintenance'];
const VALID_VISIBILITY = ['public', 'private'];
const VALID_SEX = ['male', 'female', 'other'];
const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];

const getMe = async (req, res) => {
  try {
    // req.user was already fetched (lean) in authMiddleware, but we refetch
    // here in case fields changed since token was issued — negligible cost,
    // single indexed lookup by _id.
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error(`[userController.getMe] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching user' });
  }
};

const updateOnboarding = async (req, res) => {
  try {
    const { goal, homeGym, visibility, age, sex } = req.body;

    // --- Validation ---
    if (!goal || !VALID_GOALS.includes(goal)) {
      return res.status(400).json({
        message: `goal is required and must be one of: ${VALID_GOALS.join(', ')}`,
      });
    }

    if (!visibility || !VALID_VISIBILITY.includes(visibility)) {
      return res.status(400).json({
        message: `visibility is required and must be one of: ${VALID_VISIBILITY.join(', ')}`,
      });
    }

    if (age === undefined || age === null || typeof age !== 'number') {
      return res.status(400).json({ message: 'age is required and must be a number' });
    }

    if (age < 13 || age > 100) {
      return res.status(400).json({ message: 'age must be between 13 and 100' });
    }

    if (sex !== undefined && sex !== null && !VALID_SEX.includes(sex)) {
      return res.status(400).json({
        message: `sex is optional, but if provided must be one of: ${VALID_SEX.join(', ')}`,
      });
    }

    if (!homeGym || typeof homeGym !== 'object') {
      return res.status(400).json({ message: 'homeGym is required' });
    }

    const { name, address, lat, lng } = homeGym;

    if (!name || !address || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        message: 'homeGym must include name, address, lat (number), and lng (number)',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'homeGym lat/lng values are out of range' });
    }

    // --- Derive ageBand server-side (never trust a client-sent ageBand) ---
    const ageBand = deriveAgeBand(age);

    // --- Build update object ---
    const updateFields = {
      goal,
      visibility,
      age,
      ageBand,
      homeGym: { name, address, lat, lng },
    };

    // sex stays untouched (not overwritten with null) if the client omits it entirely,
    // but is explicitly settable if provided
    if (sex !== undefined) {
      updateFields.sex = sex;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error(`[userController.updateOnboarding] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error updating onboarding' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, visibility, preferredCheckInHour, experienceLevel, activityLevel, weightKg } = req.body;

    const updateFields = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'name must be a non-empty string' });
      }
      updateFields.name = name.trim();
    }

    if (visibility !== undefined) {
      if (!VALID_VISIBILITY.includes(visibility)) {
        return res.status(400).json({
          message: `visibility must be one of: ${VALID_VISIBILITY.join(', ')}`,
        });
      }
      updateFields.visibility = visibility;
    }
    if (preferredCheckInHour !== undefined) {
      const hour = parseInt(preferredCheckInHour, 10);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return res.status(400).json({ message: 'preferredCheckInHour must be between 0 and 23' });
      }
      updateFields.preferredCheckInHour = hour;
    }

    if (experienceLevel !== undefined) {
      if (!VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
        return res.status(400).json({
          message: `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`,
        });
      }
      updateFields.experienceLevel = experienceLevel;
    }

    if (activityLevel !== undefined) {
      if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) {
        return res.status(400).json({
          message: `activityLevel must be one of: ${VALID_ACTIVITY_LEVELS.join(', ')}`,
        });
      }
      updateFields.activityLevel = activityLevel;
    }

    if (weightKg !== undefined) {
      const parsedWeight = Number(weightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        return res.status(400).json({ message: 'weightKg must be a positive number' });
      }
      updateFields.weightKg = parsedWeight;
      // Snapshot the band alongside it — squadMatchService.js groups by this,
      // not by live weightKg, same convention as ageBand.
      updateFields.weightBand = deriveWeightBand(parsedWeight);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'Provide at least one field to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error(`[userController.updateProfile] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
};
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ users: [] });
    }

    const searchTerm = q.trim();

    // Only surface public users, or private users the requester is already friends with —
    // respects FR-1.5 visibility rules instead of exposing everyone to a cold search.
    const users = await User.find({
      _id: { $ne: req.user._id }, // exclude yourself
      name: { $regex: searchTerm, $options: 'i' },
      $or: [
        { visibility: 'public' },
        { _id: { $in: req.user.friends || [] } },
      ],
    })
      .select('name email visibility')
      .limit(20)
      .lean();

    return res.status(200).json({ users });
  } catch (error) {
    console.error(`[userController.searchUsers] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error searching users' });
  }
};

module.exports = { getMe, updateOnboarding, updateProfile, searchUsers };



