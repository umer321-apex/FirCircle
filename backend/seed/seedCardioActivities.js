require('dotenv').config();
const mongoose = require('mongoose');
const CardioActivity = require('../src/models/CardioActivity');

// caloriesPerMinutePerKg values are rough MET-based estimates (MET * 3.5 / 200).
// imageUrl left blank as a placeholder — fill in with a real image URL later.
// videoUrl is auto-filled below via toVideoUrl().
const activities = [
  {
    name: 'Walk',
    caloriesPerMinutePerKg: 0.035,
    imageUrl: '',
    videoUrl: '',
    intensityLevels: {
      low: { minDurationMinutes: 20, maxDurationMinutes: 30, description: 'A brisk walk is an easy, joint-friendly way to burn calories and build a cardio base.' },
      moderate: { minDurationMinutes: 25, maxDurationMinutes: 35, description: 'Faster-paced walking or incline walking raises your heart rate further without added impact.' },
      high: { minDurationMinutes: 30, maxDurationMinutes: 40, description: 'Power walking or steep incline walking pushes this into a real conditioning workout.' },
    },
  },
  {
    name: 'Jog/Run',
    caloriesPerMinutePerKg: 0.09,
    imageUrl: '',
    videoUrl: '',
    intensityLevels: {
      low: { minDurationMinutes: 12, maxDurationMinutes: 18, description: 'An easy, conversational-pace jog builds aerobic endurance without overtaxing beginners.' },
      moderate: { minDurationMinutes: 18, maxDurationMinutes: 28, description: 'A steady running pace burns significant calories and improves cardiovascular fitness.' },
      high: { minDurationMinutes: 25, maxDurationMinutes: 40, description: 'Sustained faster running or tempo runs maximize calorie burn and conditioning.' },
    },
  },
  {
    name: 'Cycling',
    caloriesPerMinutePerKg: 0.07,
    imageUrl: '',
    videoUrl: '',
    intensityLevels: {
      low: { minDurationMinutes: 20, maxDurationMinutes: 30, description: 'Easy-paced cycling is low-impact cardio that\'s gentle on the joints.' },
      moderate: { minDurationMinutes: 25, maxDurationMinutes: 35, description: 'A steady cycling pace with moderate resistance builds leg endurance and burns solid calories.' },
      high: { minDurationMinutes: 30, maxDurationMinutes: 45, description: 'High-resistance or fast-cadence cycling is an intense calorie burner and builds real leg power.' },
    },
  },
  {
    name: 'HIIT',
    caloriesPerMinutePerKg: 0.15,
    imageUrl: '',
    videoUrl: '',
    intensityLevels: {
      low: { minDurationMinutes: 10, maxDurationMinutes: 15, description: 'Short, low-intensity intervals ease you into the HIIT format safely.' },
      moderate: { minDurationMinutes: 15, maxDurationMinutes: 20, description: 'Alternating work/rest intervals at a solid effort torch calories in a short window.' },
      high: { minDurationMinutes: 20, maxDurationMinutes: 25, description: 'All-out effort intervals are the most time-efficient way to burn calories and boost conditioning.' },
    },
  },
  {
    name: 'Jump Rope',
    caloriesPerMinutePerKg: 0.12,
    imageUrl: '',
    videoUrl: '',
    intensityLevels: {
      low: { minDurationMinutes: 8, maxDurationMinutes: 12, description: 'Basic, steady-pace jump roping builds coordination and an easy calorie burn.' },
      moderate: { minDurationMinutes: 12, maxDurationMinutes: 18, description: 'Continuous jump roping at a brisk pace is a very efficient full-body calorie burner.' },
      high: { minDurationMinutes: 15, maxDurationMinutes: 22, description: 'Fast double-unders or non-stop rounds make this a top-tier high-intensity cardio option.' },
    },
  },
];

// Same cheap-video approach as seedExercises.js — a YouTube search link per activity.
const toVideoUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} cardio workout tutorial men`)}`;

activities.forEach((activity) => {
  if (!activity.videoUrl) activity.videoUrl = toVideoUrl(activity.name);
});

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    await CardioActivity.deleteMany({});
    console.log('Cleared existing cardio activities');

    await CardioActivity.insertMany(activities);
    console.log(`Seeded ${activities.length} cardio activities`);

    process.exit(0);
  } catch (error) {
    console.error(`[seedCardioActivities] Error: ${error.message}`);
    process.exit(1);
  }
};

runSeed();
