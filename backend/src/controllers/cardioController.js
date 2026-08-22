const CardioActivity = require('../models/CardioActivity');
const CardioLog = require('../models/CardioLog');
const User = require('../models/User');
const { suggestCardio } = require('../services/cardioSuggestionService');

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getDateStringDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Manual-pick mode: full catalog, same "premium sees more" pattern as exerciseController.
const getCardioActivities = async (req, res) => {
  try {
    const activities = await CardioActivity.find({}).lean();
    return res.status(200).json({ activities });
  } catch (error) {
    console.error(`[cardioController.getCardioActivities] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching cardio activities' });
  }
};

// Suggestion mode: bodyweight % + experience level -> one recommended activity.
const getCardioSuggestion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('weightKg experienceLevel').lean();

    if (!user?.weightKg) {
      return res.status(400).json({
        message: 'Set your bodyweight in your profile to get a cardio suggestion',
      });
    }

    const recentLogs = await CardioLog.find({
      userId: req.user._id,
      date: { $gte: getDateStringDaysAgo(2) },
    })
      .select('activityName')
      .lean();
    const recentActivityNames = new Set(recentLogs.map((l) => l.activityName));

    const suggestion = await suggestCardio(user, recentActivityNames);
    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error(`[cardioController.getCardioSuggestion] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error generating cardio suggestion' });
  }
};

const logCardio = async (req, res) => {
  try {
    const { activityName, durationMinutes, intensity } = req.body;

    if (!activityName || !durationMinutes || !intensity) {
      return res.status(400).json({
        message: 'activityName, durationMinutes, and intensity are required',
      });
    }

    const resolvedActivity = await CardioActivity.findOne({ name: activityName }).lean();

    if (!resolvedActivity) {
      return res.status(404).json({ message: 'Unknown cardio activity' });
    }

    const user = await User.findById(req.user._id).select('weightKg').lean();
    if (!user?.weightKg) {
      return res.status(400).json({ message: 'Set your bodyweight in your profile before logging cardio' });
    }

    // Computed server-side — never trust a client-sent calorie value.
    const caloriesBurned = Math.round(resolvedActivity.caloriesPerMinutePerKg * user.weightKg * durationMinutes);

    const log = await CardioLog.create({
      userId: req.user._id,
      date: getTodayDateString(),
      activityName: resolvedActivity.name,
      durationMinutes,
      intensity,
      caloriesBurned,
    });

    return res.status(201).json({ log });
  } catch (error) {
    console.error(`[cardioController.logCardio] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error logging cardio session' });
  }
};

const getMyCardio = async (req, res) => {
  try {
    const logs = await CardioLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ logs });
  } catch (error) {
    console.error(`[cardioController.getMyCardio] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error fetching cardio history' });
  }
};

module.exports = { getCardioActivities, getCardioSuggestion, logCardio, getMyCardio };
