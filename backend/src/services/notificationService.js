const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Sends one or more push notifications via Expo's push service.
// messages: array of { to, title, body, data }
const sendPushNotifications = async (messages) => {
  if (!messages || messages.length === 0) return;

  try {
    // Expo caps batches at 100 messages per request
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      // Log any per-message errors Expo reports (e.g. invalid/expired token)
      const results = response.data?.data || [];
      results.forEach((result, index) => {
        if (result.status === 'error') {
          console.error(
            `[notificationService] Push failed for ${chunk[index].to}: ${result.message}`
          );
        }
      });
    }
  } catch (error) {
    console.error(`[notificationService.sendPushNotifications] Error: ${error.message}`);
  }
};

const sendCheckInReminder = async (expoPushToken) => {
  await sendPushNotifications([
    {
      to: expoPushToken,
      title: 'Time to check in 💪',
      body: "You're near your usual workout window — open FitCircle to check in.",
      data: { type: 'checkin_reminder' },
    },
  ]);
};

const sendGymTimeReminder = async (expoPushToken, slotLabel) => {
  await sendPushNotifications([
    {
      to: expoPushToken,
      title: "Hey, it's your gym time ⏰",
      body: slotLabel
        ? `Your "${slotLabel}" session starts in 5 minutes — time to head out!`
        : 'Your gym session starts in 5 minutes — time to head out!',
      data: { type: 'gym_schedule_reminder' },
    },
  ]);
};

const sendWeeklyInsightAlert = async (expoPushToken) => {
  await sendPushNotifications([
    {
      to: expoPushToken,
      title: 'Your weekly insight is ready 📊',
      body: 'See what helped (or held back) your progress this week.',
      data: { type: 'weekly_insight' },
    },
  ]);
};

module.exports = { sendPushNotifications, sendCheckInReminder, sendGymTimeReminder, sendWeeklyInsightAlert };