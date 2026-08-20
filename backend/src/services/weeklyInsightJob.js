const User = require('../models/User');
const GymCheckIn = require('../models/GymCheckIn');
const { sendWeeklyInsightAlert } = require('./notificationService');

// Runs once a week. Notifies every Premium user with a push token that
// their weekly insight is ready — the actual insight content is generated
// on-demand by insightController.js when they open the screen (Step 13).
const runWeeklyInsightJob = async () => {
  try {
    const premiumUsers = await User.find({
      isPremium: true,
      expoPushToken: { $exists: true, $ne: null },
    })
      .select('_id expoPushToken')
      .lean();

    if (premiumUsers.length === 0) {
      return;
    }

    // Only notify users who logged at least one check-in this past week —
    // avoids pinging someone with "your insight is ready" when there's
    // nothing meaningful to show them.
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = `${oneWeekAgo.getFullYear()}-${String(oneWeekAgo.getMonth() + 1).padStart(2, '0')}-${String(oneWeekAgo.getDate()).padStart(2, '0')}`;

    const premiumIds = premiumUsers.map((u) => u._id);

    const activeUserIds = await GymCheckIn.distinct('userId', {
      userId: { $in: premiumIds },
      date: { $gte: oneWeekAgoStr },
    });

    const activeSet = new Set(activeUserIds.map((id) => id.toString()));
    const usersToNotify = premiumUsers.filter((u) => activeSet.has(u._id.toString()));

    for (const user of usersToNotify) {
      await sendWeeklyInsightAlert(user.expoPushToken);
    }

    console.log(`[weeklyInsightJob] Sent ${usersToNotify.length} weekly insight alert(s)`);
  } catch (error) {
    console.error(`[weeklyInsightJob] Error: ${error.message}`);
  }
};

module.exports = { runWeeklyInsightJob };