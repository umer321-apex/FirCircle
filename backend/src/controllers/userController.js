const User = require('../models/User');

const VALID_GOALS = ['cutting', 'bulking', 'maintenance'];
const VALID_VISIBILITY = ['public', 'private'];
const VALID_SEX = ['male', 'female', 'other'];

// Pure helper — easy to reuse in squadMatchService.js later if needed
const deriveAgeBand = (age) => {
  if (age >= 18 && age <= 24) return '18-24';
  if (age >= 25 && age <= 34) return '25-34';
  if (age >= 35 && age <= 44) return '35-44';
  if (age >= 45) return '45+';
  return null; // covers under-18 edge case, though age is validated to be >=13
};

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
    const { name, visibility, preferredCheckInHour } = req.body;

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

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'Provide at least name or visibility to update' });
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

module.exports = { getMe, updateOnboarding, updateProfile };

