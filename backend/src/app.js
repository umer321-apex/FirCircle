const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const cardioRoutes = require('./routes/cardioRoutes');
const progressRoutes = require('./routes/progressRoutes');
const squadRoutes = require('./routes/squadRoutes');
const dietRoutes = require('./routes/dietRoutes');
const feedRoutes = require('./routes/feedRoutes');
const chatRoutes = require('./routes/chatRoutes');
const insightRoutes = require('./routes/insightRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const coachRoutes = require('./routes/coachRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/cardio', cardioRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api', feedRoutes); // exposes /api/posts and /api/feed as specified in the FR
app.use('/api/chat', chatRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users/me/schedule', scheduleRoutes);

module.exports = app;