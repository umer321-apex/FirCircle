const User = require('../models/User');

const MAX_SLOTS = 4; // keep reminder volume sane — more than this and it stops being useful

const isValidDaysOfWeek = (arr) =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
  new Set(arr).size === arr.length;

const validateSlot = (slot, index) => {
  const { label, hour, minute, durationMinutes, daysOfWeek } = slot || {};

  if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    return `Slot ${index + 1}: hour must be between 0 and 23`;
  }
  if (typeof minute !== 'number' || minute < 0 || minute > 59) {
    return `Slot ${index + 1}: minute must be between 0 and 59`;
  }
  if (durationMinutes !== undefined && (typeof durationMinutes !== 'number' || durationMinutes < 5 || durationMinutes > 300)) {
    return `Slot ${index + 1}: durationMinutes must be between 5 and 300`;
  }
  if (!isValidDaysOfWeek(daysOfWeek)) {
    return `Slot ${index + 1}: daysOfWeek must be a non-empty array of unique integers 0-6`;
  }
  if (label !== undefined && typeof label !== 'string') {
    return `Slot ${index + 1}: label must be a string`;
  }

  return null;
};

// GET /api/users/me/schedule
const getSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('gymSchedule').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ gymSchedule: user.gymSchedule || [] });
  } catch (error) {
    console.error(`[scheduleController.getSchedule] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching gym schedule' });
  }
};

// PUT /api/users/me/schedule
// Replaces the whole schedule array — simplest contract for a settings-style save.
const updateSchedule = async (req, res) => {
  try {
    const { gymSchedule } = req.body;

    if (!Array.isArray(gymSchedule)) {
      return res.status(400).json({ message: 'gymSchedule must be an array' });
    }
    if (gymSchedule.length > MAX_SLOTS) {
      return res.status(400).json({ message: `You can set up to ${MAX_SLOTS} gym times` });
    }

    for (let i = 0; i < gymSchedule.length; i += 1) {
      const validationError = validateSlot(gymSchedule[i], i);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    const normalizedSchedule = gymSchedule.map((slot) => ({
      label: (slot.label || '').trim(),
      hour: slot.hour,
      minute: slot.minute,
      durationMinutes: slot.durationMinutes ?? 60,
      daysOfWeek: [...slot.daysOfWeek].sort((a, b) => a - b),
    }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { gymSchedule: normalizedSchedule } },
      { new: true, runValidators: true }
    ).select('gymSchedule');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ gymSchedule: user.gymSchedule });
  } catch (error) {
    console.error(`[scheduleController.updateSchedule] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error updating gym schedule' });
  }
};

module.exports = { getSchedule, updateSchedule };