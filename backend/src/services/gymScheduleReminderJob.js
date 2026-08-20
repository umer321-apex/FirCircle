const User = require('../models/User');
const GymCheckIn = require('../models/GymCheckIn');
const { sendGymTimeReminder } = require('./notificationService');

const REMINDER_LEAD_MINUTES = 5;

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// A slot "fires" when its time is exactly REMINDER_LEAD_MINUTES ahead of now
// (within the current 5-minute tick), on today's day of week.
const slotFiresNow = (slot, now, dayOfWeek) => {
  if (!slot.daysOfWeek.includes(dayOfWeek)) return false;

  const slotDate = new Date(now);
  slotDate.setHours(slot.hour, slot.minute, 0, 0);

  const diffMinutes = (slotDate.getTime() - now.getTime()) / 60000;

  // Fires once, in the 5-minute window ending at the lead time
  // (job runs every 5 min, so this window lines up with the cron tick).
  return diffMinutes > 0 && diffMinutes <= REMINDER_LEAD_MINUTES;
};

// Runs every 5 minutes. For each user with an explicit gym schedule, checks
// whether any slot is starting in ~5 minutes today, and reminds them if
// they haven't already checked in today.
const runGymScheduleReminderJob = async () => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const today = getTodayDateString();

    const candidateUsers = await User.find({
      'gymSchedule.0': { $exists: true },
      expoPushToken: { $exists: true, $ne: null },
    })
      .select('_id expoPushToken gymSchedule')
      .lean();

    if (candidateUsers.length === 0) return;

    const firingUsers = candidateUsers
      .map((user) => {
        const firingSlot = user.gymSchedule.find((slot) => slotFiresNow(slot, now, dayOfWeek));
        return firingSlot ? { user, firingSlot } : null;
      })
      .filter(Boolean);

    if (firingUsers.length === 0) return;

    const candidateIds = firingUsers.map(({ user }) => user._id);

    // Single query for all today's check-ins among candidates, instead of one per user
    const alreadyCheckedIn = await GymCheckIn.find({
      userId: { $in: candidateIds },
      date: today,
    })
      .select('userId')
      .lean();
    const checkedInSet = new Set(alreadyCheckedIn.map((c) => c.userId.toString()));

    let sentCount = 0;
    for (const { user, firingSlot } of firingUsers) {
      if (checkedInSet.has(user._id.toString())) continue;
      await sendGymTimeReminder(user.expoPushToken, firingSlot.label);
      sentCount += 1;
    }

    if (sentCount > 0) {
      console.log(`[gymScheduleReminderJob] Sent ${sentCount} scheduled gym-time reminder(s)`);
    }
  } catch (error) {
    console.error(`[gymScheduleReminderJob] Error: ${error.message}`);
  }
};

module.exports = { runGymScheduleReminderJob };