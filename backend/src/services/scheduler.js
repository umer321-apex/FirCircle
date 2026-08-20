const cron = require('node-cron');
const { runCheckInReminderJob } = require('./checkInReminderJob');
const { runWeeklyInsightJob } = require('./weeklyInsightJob');
const { runGymScheduleReminderJob } = require('./gymScheduleReminderJob');

const startScheduledJobs = () => {
  // Every hour, on the hour — checks which users' preferredCheckInHour matches now
  // (fallback for users who haven't set an explicit gym schedule)
  cron.schedule('0 * * * *', () => {
    console.log('[scheduler] Running check-in reminder job');
    runCheckInReminderJob();
  });

  // Every 5 minutes — checks explicit gym schedule slots starting in ~5 minutes
  cron.schedule('*/5 * * * *', () => {
    runGymScheduleReminderJob();
  });

  // Every Sunday at 9:00 AM server time — weekly insight alert
  cron.schedule('0 9 * * 0', () => {
    console.log('[scheduler] Running weekly insight job');
    runWeeklyInsightJob();
  });

  console.log('[scheduler] Scheduled jobs registered (hourly check-in reminders, 5-min gym schedule reminders, weekly insight on Sundays 9am)');
};

module.exports = { startScheduledJobs };