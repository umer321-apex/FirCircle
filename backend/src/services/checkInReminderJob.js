const User = require('../models/User');
const GymCheckIn = require('../models/GymCheckIn');
const { sendCheckInReminder } = require('./notificationService');

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Runs every hour. For each hour, finds users whose preferredCheckInHour matches
// the current hour, haven't checked in yet today, and have a push token registered.
const runCheckInReminderJob = async () => {
  try {
    const currentHour = new Date().getHours();
    const today = getTodayDateString();

    const candidateUsers = await User.find({
      preferredCheckInHour: currentHour,
      expoPushToken: { $exists: true, $ne: null },
      'gymSchedule.0': { $exists: false }, // users with an explicit schedule are handled by gymScheduleReminderJob instead
    })
      .select('_id expoPushToken')
      .lean();

    if (candidateUsers.length === 0) {
      return;
    }

    const candidateIds = candidateUsers.map((u) => u._id);

    // Single query for all today's check-ins among candidates, instead of one query per user
    const alreadyCheckedIn = await GymCheckIn.find({
      userId: { $in: candidateIds },
      date: today,
    })
      .select('userId')
      .lean();

    const checkedInSet = new Set(alreadyCheckedIn.map((c) => c.userId.toString()));

    const usersToNotify = candidateUsers.filter(
      (u) => !checkedInSet.has(u._id.toString())
    );

    for (const user of usersToNotify) {
      await sendCheckInReminder(user.expoPushToken);
    }

    if (usersToNotify.length > 0) {
      console.log(`[checkInReminderJob] Sent ${usersToNotify.length} check-in reminder(s) for hour ${currentHour}`);
    }
  } catch (error) {
    console.error(`[checkInReminderJob] Error: ${error.message}`);
  }
};

module.exports = { runCheckInReminderJob };