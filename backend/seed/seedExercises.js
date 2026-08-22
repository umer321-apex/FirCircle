require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('../src/models/Exercise');

const exercises = [
  // Chest Day
  {
    name: 'Barbell Bench Press',
    splitCategory: 'Chest Day',
    primaryMuscle: 'Chest',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Higher reps and shorter rest keep your heart rate up, burning more calories while still building chest endurance.', caloriesPerSet: 8 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavier weight and lower reps with longer rest maximizes strength and muscle fiber recruitment for size.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Incline Dumbbell Press',
    splitCategory: 'Chest Day',
    primaryMuscle: 'Upper Chest',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Targets upper chest with a moderate load and short rest to keep calorie burn high.', caloriesPerSet: 7 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavy incline pressing builds upper chest thickness and overall pushing strength.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Cable Chest Fly',
    splitCategory: 'Chest Day',
    primaryMuscle: 'Chest',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High-rep isolation work keeps tension on the chest and burns extra calories with minimal rest.', caloriesPerSet: 6 },
      bulking: { sets: 3, reps: '8-10', restSeconds: 90, explanation: 'Controlled heavier flys stretch and load the chest for hypertrophy.', caloriesPerSet: 5 },
    },
  },
  {
    name: 'Push-Ups',
    splitCategory: 'Chest Day',
    primaryMuscle: 'Chest',
    variants: {
      cutting: { sets: 4, reps: '20-25', restSeconds: 30, explanation: 'Bodyweight push-ups at high volume torch calories and build muscular endurance.', caloriesPerSet: 9 },
      bulking: { sets: 3, reps: '10-12', restSeconds: 90, explanation: 'Slower, weighted or elevated push-ups with more rest emphasize muscle growth.', caloriesPerSet: 6 },
    },
  },
  // Back Day
  {
    name: 'Deadlift',
    splitCategory: 'Back Day',
    primaryMuscle: 'Back',
    variants: {
      cutting: { sets: 3, reps: '10-12', restSeconds: 60, explanation: 'Moderate reps on this full-body lift burn serious calories while keeping your back strong.', caloriesPerSet: 12 },
      bulking: { sets: 4, reps: '5-6', restSeconds: 150, explanation: 'Heavy deadlifts with long rest are one of the best builders of total back and posterior chain mass.', caloriesPerSet: 10 },
    },
  },
  {
    name: 'Pull-Ups',
    splitCategory: 'Back Day',
    primaryMuscle: 'Lats',
    variants: {
      cutting: { sets: 4, reps: '10-12', restSeconds: 45, explanation: 'High-volume pull-ups build lat width while keeping rest periods short for extra burn.', caloriesPerSet: 8 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Weighted, lower-rep pull-ups add serious width and thickness to your back.', caloriesPerSet: 7 },
    },
  },
  {
    name: 'Bent-Over Barbell Row',
    splitCategory: 'Back Day',
    primaryMuscle: 'Mid Back',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Lighter, higher-rep rows keep your back working while your heart rate stays elevated.', caloriesPerSet: 7 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavy rows build back thickness and are a staple of any serious mass-building program.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Lat Pulldown',
    splitCategory: 'Back Day',
    primaryMuscle: 'Lats',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High reps on the pulldown machine keep tension on your lats without needing max effort.', caloriesPerSet: 6 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 90, explanation: 'Controlled heavier pulldowns are a joint-friendly way to build lat width.', caloriesPerSet: 5 },
    },
  },
  // Leg Day
  {
    name: 'Barbell Back Squat',
    splitCategory: 'Leg Day',
    primaryMuscle: 'Quads',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 60, explanation: 'Higher-rep squats are one of the best calorie-torching exercises in any cutting program.', caloriesPerSet: 13 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 150, explanation: 'Heavy squats are the king of mass builders for your entire lower body.', caloriesPerSet: 11 },
    },
  },
  {
    name: 'Romanian Deadlift',
    splitCategory: 'Leg Day',
    primaryMuscle: 'Hamstrings',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Moderate weight and higher reps keep hamstrings and glutes working hard with less rest.', caloriesPerSet: 9 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavier RDLs build serious hamstring and glute mass over time.', caloriesPerSet: 8 },
    },
  },
  {
    name: 'Leg Press',
    splitCategory: 'Leg Day',
    primaryMuscle: 'Quads',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 45, explanation: 'High-rep leg press work builds endurance and burns calories with lower joint stress.', caloriesPerSet: 10 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 120, explanation: 'Heavier leg press loading adds quad size without the technical demand of free-weight squats.', caloriesPerSet: 8 },
    },
  },
  {
    name: 'Walking Lunges',
    splitCategory: 'Leg Day',
    primaryMuscle: 'Quads/Glutes',
    variants: {
      cutting: { sets: 3, reps: '20-24 (steps)', restSeconds: 30, explanation: 'Continuous lunging keeps your heart rate elevated for maximum calorie burn.', caloriesPerSet: 11 },
      bulking: { sets: 3, reps: '10-12 (per leg)', restSeconds: 90, explanation: 'Weighted lunges with more rest build unilateral leg strength and size.', caloriesPerSet: 8 },
    },
  },
  {
    name: 'Calf Raises',
    splitCategory: 'Leg Day',
    primaryMuscle: 'Calves',
    variants: {
      cutting: { sets: 4, reps: '20-25', restSeconds: 20, explanation: 'High-rep calf raises with minimal rest add a solid calorie-burning finisher.', caloriesPerSet: 5 },
      bulking: { sets: 4, reps: '10-12', restSeconds: 60, explanation: 'Heavier, controlled calf raises are needed to meaningfully grow this stubborn muscle.', caloriesPerSet: 4 },
    },
  },
  // Shoulder Day
  {
    name: 'Overhead Barbell Press',
    splitCategory: 'Shoulder Day',
    primaryMuscle: 'Shoulders',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Lighter overhead pressing at higher reps builds shoulder endurance and burns extra calories.', caloriesPerSet: 7 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavy overhead pressing is one of the best builders of overall shoulder mass and strength.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Lateral Raises',
    splitCategory: 'Shoulder Day',
    primaryMuscle: 'Side Delts',
    variants: {
      cutting: { sets: 4, reps: '15-20', restSeconds: 30, explanation: 'High-rep lateral raises keep the delts under tension with very little rest needed.', caloriesPerSet: 4 },
      bulking: { sets: 4, reps: '10-12', restSeconds: 60, explanation: 'Slightly heavier lateral raises build the width that makes shoulders look bigger.', caloriesPerSet: 4 },
    },
  },
  {
    name: 'Face Pulls',
    splitCategory: 'Shoulder Day',
    primaryMuscle: 'Rear Delts',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'Light, high-rep face pulls improve shoulder health while adding to your calorie burn.', caloriesPerSet: 4 },
      bulking: { sets: 3, reps: '12-15', restSeconds: 60, explanation: 'Face pulls build rear delt size and keep shoulders healthy under heavier pressing loads.', caloriesPerSet: 4 },
    },
  },
  {
    name: 'Arnold Press',
    splitCategory: 'Shoulder Day',
    primaryMuscle: 'Shoulders',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'The rotating motion works all three delt heads with a higher-rep, calorie-burning approach.', caloriesPerSet: 6 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 90, explanation: 'Heavier Arnold presses build well-rounded, three-dimensional shoulder size.', caloriesPerSet: 5 },
    },
  },
  // Arm Day
  {
    name: 'Barbell Bicep Curl',
    splitCategory: 'Arm Day',
    primaryMuscle: 'Biceps',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High-rep curls with short rest keep arms pumped and calories burning.', caloriesPerSet: 4 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 75, explanation: 'Heavier curls with more rest are what actually grows bicep size over time.', caloriesPerSet: 4 },
    },
  },
  {
    name: 'Tricep Rope Pushdown',
    splitCategory: 'Arm Day',
    primaryMuscle: 'Triceps',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High-rep pushdowns burn calories while keeping constant tension on the triceps.', caloriesPerSet: 4 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 75, explanation: 'Heavier pushdowns with more rest help build tricep mass, which makes up most of your arm size.', caloriesPerSet: 4 },
    },
  },
  {
    name: 'Hammer Curls',
    splitCategory: 'Arm Day',
    primaryMuscle: 'Biceps/Forearms',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'Higher reps here build forearm and bicep endurance while keeping the workout intense.', caloriesPerSet: 4 },
      bulking: { sets: 3, reps: '8-10', restSeconds: 75, explanation: 'Heavier hammer curls add thickness to both the biceps and forearms.', caloriesPerSet: 4 },
    },
  },
  {
    name: 'Skull Crushers',
    splitCategory: 'Arm Day',
    primaryMuscle: 'Triceps',
    variants: {
      cutting: { sets: 3, reps: '15-18', restSeconds: 30, explanation: 'Lighter, high-rep skull crushers keep the triceps burning with minimal rest.', caloriesPerSet: 4 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 75, explanation: 'Heavier skull crushers directly target tricep mass for bigger arms.', caloriesPerSet: 4 },
    },
  },
  // Push Day (chest/shoulders/triceps)
  {
    name: 'Flat Barbell Bench Press',
    splitCategory: 'Push Day',
    primaryMuscle: 'Chest',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Higher reps and shorter rest keep your heart rate up, burning more calories while still building pushing endurance.', caloriesPerSet: 8 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavier weight and lower reps with longer rest maximizes strength and muscle fiber recruitment for size.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Seated Dumbbell Shoulder Press',
    splitCategory: 'Push Day',
    primaryMuscle: 'Shoulders',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Lighter pressing at higher reps builds shoulder endurance and burns extra calories.', caloriesPerSet: 7 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavy overhead pressing builds overall shoulder mass and pushing strength.', caloriesPerSet: 6 },
    },
  },
  {
    name: 'Overhead Tricep Extension',
    splitCategory: 'Push Day',
    primaryMuscle: 'Triceps',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High-rep extensions burn calories while keeping constant tension on the triceps.', caloriesPerSet: 4 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 75, explanation: 'Heavier extensions with more rest build tricep mass, which makes up most of arm size.', caloriesPerSet: 4 },
    },
  },
  // Pull Day (back/biceps)
  {
    name: 'Conventional Deadlift',
    splitCategory: 'Pull Day',
    primaryMuscle: 'Back',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '10-12', restSeconds: 60, explanation: 'Moderate reps on this full-body pull burn serious calories while keeping your back strong.', caloriesPerSet: 12 },
      bulking: { sets: 4, reps: '5-6', restSeconds: 150, explanation: 'Heavy deadlifts with long rest are one of the best builders of total back and posterior chain mass.', caloriesPerSet: 10 },
    },
  },
  {
    name: 'Wide-Grip Lat Pulldown',
    splitCategory: 'Pull Day',
    primaryMuscle: 'Lats',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'High reps on the pulldown keep tension on your lats without needing max effort.', caloriesPerSet: 6 },
      bulking: { sets: 4, reps: '8-10', restSeconds: 90, explanation: 'Controlled heavier pulldowns are a joint-friendly way to build lat width.', caloriesPerSet: 5 },
    },
  },
  {
    name: 'Seated Cable Row',
    splitCategory: 'Pull Day',
    primaryMuscle: 'Biceps/Back',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '15-20', restSeconds: 30, explanation: 'Higher reps here build back and bicep endurance while keeping the workout intense.', caloriesPerSet: 6 },
      bulking: { sets: 3, reps: '8-10', restSeconds: 75, explanation: 'Heavier rows add thickness to both the back and biceps.', caloriesPerSet: 5 },
    },
  },
  // Legs Day (quads/hamstrings/glutes/calves)
  {
    name: 'Front Squat',
    splitCategory: 'Legs Day',
    primaryMuscle: 'Quads',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 60, explanation: 'Higher-rep squats are one of the best calorie-torching exercises in any cutting program.', caloriesPerSet: 13 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 150, explanation: 'Heavy squats are the king of mass builders for your entire lower body.', caloriesPerSet: 11 },
    },
  },
  {
    name: 'Hip Thrust',
    splitCategory: 'Legs Day',
    primaryMuscle: 'Glutes',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 3, reps: '12-15', restSeconds: 45, explanation: 'Moderate weight and higher reps keep glutes working hard with less rest.', caloriesPerSet: 9 },
      bulking: { sets: 4, reps: '6-8', restSeconds: 120, explanation: 'Heavier hip thrusts build serious glute mass over time.', caloriesPerSet: 8 },
    },
  },
  {
    name: 'Seated Calf Raise',
    splitCategory: 'Legs Day',
    primaryMuscle: 'Calves',
    imageUrl: '',
    videoUrl: '',
    variants: {
      cutting: { sets: 4, reps: '20-25', restSeconds: 20, explanation: 'High-rep calf raises with minimal rest add a solid calorie-burning finisher.', caloriesPerSet: 5 },
      bulking: { sets: 4, reps: '10-12', restSeconds: 60, explanation: 'Heavier, controlled calf raises are needed to meaningfully grow this stubborn muscle.', caloriesPerSet: 4 },
    },
  },
];

// Cheapest option for exercise videos: a YouTube search-results link per exercise
// rather than a single hardcoded video ID (which could go dead or be wrong).
// Query is biased toward men's-form tutorials per product requirement — this can't
// guarantee every result is men-only since we don't inspect footage, so swap in
// specific verified links later for exercises where that matters most.
const toVideoUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise tutorial form men`)}`;

// Populated by `node seed/fetchExerciseImages.js`, which looks up a real photo
// per exercise from wger.de's open exercise database. Optional — if that
// script hasn't been run yet, this file just doesn't exist yet and every
// exercise keeps imageUrl: '' (the frontend falls back to a placeholder photo
// per exercise in that case — see frontend/src/utils/exerciseImage.js).
let exerciseImages = {};
try {
  exerciseImages = require('./exerciseImages.json');
} catch {
  // not fetched yet — fine, falls through to placeholders
}

exercises.forEach((ex) => {
  if (!ex.videoUrl) ex.videoUrl = toVideoUrl(ex.name);
  if (!ex.imageUrl && exerciseImages[ex.name]) ex.imageUrl = exerciseImages[ex.name];
});

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    await Exercise.deleteMany({});
    console.log('Cleared existing exercises');

    await Exercise.insertMany(exercises);
    console.log(`Seeded ${exercises.length} exercises`);

    process.exit(0);
  } catch (error) {
    console.error(`[seedExercises] Error: ${error.message}`);
    process.exit(1);
  }
};

runSeed();