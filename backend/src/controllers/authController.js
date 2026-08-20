const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// Cost factor 10 is the standard balance of security vs speed —
// keeps signups fast even under concurrent load.
const SALT_ROUNDS = 10;

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Single indexed lookup — fast even with many users
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Handles the rare race condition where two identical signups hit
    // the unique index at the same moment
    if (error.code === 11000) {
      console.error(`[authController.register] Duplicate email race condition: ${error.message}`);
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    console.error(`[authController.register] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly re-include passwordHash since the schema excludes it by default
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    // Same generic message whether email or password is wrong —
    // avoids leaking which emails are registered
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(`[authController.login] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond the same way whether or not the email exists —
    // avoids leaking which emails are registered
    if (!user) {
      return res.status(200).json({
        message: 'If an account exists with that email, a reset code has been sent.',
      });
    }

    const resetCode = generateResetCode();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const emailSent = await sendPasswordResetEmail(user.email, resetCode);

    if (!emailSent) {
      console.error(`[authController.requestPasswordReset] Failed to send email to ${user.email}`);
      return res.status(500).json({ message: 'Could not send reset email. Please try again.' });
    }

    return res.status(200).json({
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  } catch (error) {
    console.error(`[authController.requestPasswordReset] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error requesting password reset' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'email, code, and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. Please log in.' });
  } catch (error) {
    console.error(`[authController.resetPassword] Error: ${error.message}`);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = { register, login, requestPasswordReset, resetPassword };

