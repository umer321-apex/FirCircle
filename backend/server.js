require('dotenv').config();
const http = require('http');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { attachSocketIO } = require('./src/sockets');
const { startScheduledJobs } = require('./src/services/scheduler');

connectDB();

const server = http.createServer(app);
attachSocketIO(server);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduledJobs();
});