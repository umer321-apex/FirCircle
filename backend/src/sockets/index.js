const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

function attachSocketIO(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  // Auth handshake: client passes JWT in socket auth
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a personal room (for direct messages)
    socket.join(`user:${socket.userId}`);

    socket.on('joinPod', (podId) => {
      socket.join(`pod:${podId}`);
    });

    socket.on('newMessage', (msg) => {
  if (msg.podId === podId) {
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
  }
});

    socket.on('leavePod', (podId) => {
      socket.leave(`pod:${podId}`);
    });

    socket.on('typing', ({ podId, recipientId }) => {
      if (podId) {
        socket.to(`pod:${podId}`).emit('typing', { userId: socket.userId, podId });
      } else if (recipientId) {
        socket.to(`user:${recipientId}`).emit('typing', { userId: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      // no-op, room membership cleans up automatically
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO not initialized yet');
  return ioInstance;
}

module.exports = { attachSocketIO, getIO };