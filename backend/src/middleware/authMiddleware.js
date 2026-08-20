const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error(`[authMiddleware] Token verification failed: ${err.message}`);
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }

    // .lean() keeps this fast — we don't need a full Mongoose document here
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[authMiddleware] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = protect;